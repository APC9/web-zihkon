// Pruebas de las funciones de pago. Ejecutar: node --test netlify/pruebas/
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import gestionarSuscripcion from "../functions/gestionar-suscripcion.mjs";
import pago from "../functions/pago.mjs";

const realFetch = globalThis.fetch;
let llamadas;
let respuesta;

beforeEach(() => {
  process.env.ZIHKON_PANEL_URL = "https://panel.test";
  process.env.ZIHKON_WEB_CHECKOUT_SECRET = "secreto-de-prueba-0123456789abcdef0123";
  llamadas = [];
  respuesta = { status: 200, body: { url: "https://checkout.stripe.com/c/pay/cs_test_1" } };
  globalThis.fetch = async (url, init) => {
    llamadas.push({ url: String(url), init });
    return new Response(JSON.stringify(respuesta.body), { status: respuesta.status });
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const post = (ruta, cuerpo) => new Request(`https://zihkon.com${ruta}`, { method: "POST", body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo) });
const ctx = { ip: "203.0.113.7" };

describe("función /api/pago", () => {
  it("pide el pago al panel con el secreto y la IP del visitante, y devuelve la URL de Stripe", async () => {
    const res = await pago(post("/api/pago", { planKey: "plan_360", interval: "year" }), ctx);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    assert.equal(llamadas[0].url, "https://panel.test/api/public/checkout");
    assert.equal(llamadas[0].init.headers["x-zihkon-web-secret"], process.env.ZIHKON_WEB_CHECKOUT_SECRET);
    assert.equal(llamadas[0].init.headers["x-zihkon-visitor-ip"], "203.0.113.7");
    assert.deepEqual(JSON.parse(llamadas[0].init.body), { planKey: "plan_360", interval: "year" });
  });

  it("el resumen va a /quote", async () => {
    respuesta.body = { plan: { key: "resenas", name: "Respuesta de reseñas" } };
    const res = await pago(post("/api/pago/resumen", { planKey: "resenas" }), ctx);
    assert.equal(res.status, 200);
    assert.equal(llamadas[0].url, "https://panel.test/api/public/checkout/quote");
  });

  it("solo reenvía los campos conocidos (no se pueden colar precios ni otros datos)", async () => {
    await pago(post("/api/pago", { planKey: "web", precio: 1, discount: "lanzamiento", referralCode: 42, linkToken: " abc " }), ctx);
    assert.deepEqual(JSON.parse(llamadas[0].init.body), { planKey: "web", linkToken: "abc" });
  });

  it("reenvía el WhatsApp y el código de reserva del enlace", async () => {
    await pago(post("/api/pago", { linkToken: "t".repeat(32), whatsapp: " 612 345 678 ", reservation: "reserva-123456789012" }), ctx);
    assert.deepEqual(JSON.parse(llamadas[0].init.body), { linkToken: "t".repeat(32), whatsapp: "612 345 678", reservation: "reserva-123456789012" });
  });

  it("un 409 del panel pasa su código (ya es cliente → portal) sin más detalles", async () => {
    respuesta = { status: 409, body: { error: "Ya tienes un plan de Zihkon con este WhatsApp.", code: "ALREADY_SUBSCRIBED", detalle: "interno" } };
    const res = await pago(post("/api/pago", { planKey: "web", whatsapp: "611222333" }), ctx);
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "Ya tienes un plan de Zihkon con este WhatsApp.", code: "ALREADY_SUBSCRIBED" });
  });

  it("rechaza métodos que no son POST, JSON roto y cuerpos enormes sin llamar al panel", async () => {
    assert.equal((await pago(new Request("https://zihkon.com/api/pago"), ctx)).status, 405);
    assert.equal((await pago(post("/api/pago", "{roto"), ctx)).status, 400);
    assert.equal((await pago(post("/api/pago", { planKey: "x".repeat(3000) }), ctx)).status, 413);
    assert.equal(llamadas.length, 0);
  });

  it("sin configuración responde 503 y no llama a nadie", async () => {
    delete process.env.ZIHKON_WEB_CHECKOUT_SECRET;
    const res = await pago(post("/api/pago", { planKey: "web" }), ctx);
    assert.equal(res.status, 503);
    assert.equal(llamadas.length, 0);
  });

  it("errores de datos (400) pasan al visitante con sus campos; los internos se ocultan", async () => {
    respuesta = { status: 400, body: { error: "Datos no válidos", issues: { referralCode: ["Ese código de referido no existe"] } } };
    let res = await pago(post("/api/pago/resumen", { planKey: "web", referralCode: "ZK99999" }), ctx);
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).issues, { referralCode: ["Ese código de referido no existe"] });

    respuesta = { status: 500, body: { error: "Error interno: prisma explotó", code: "INTERNAL_ERROR" } };
    res = await pago(post("/api/pago", { planKey: "web" }), ctx);
    assert.equal(res.status, 500);
    assert.doesNotMatch((await res.json()).error, /prisma/);

    respuesta = { status: 401, body: { error: "No autenticado" } };
    res = await pago(post("/api/pago", { planKey: "web" }), ctx);
    assert.equal(res.status, 502);
  });

  it("solo acepta URLs de checkout.stripe.com y aguanta la caída del panel", async () => {
    respuesta.body = { url: "https://malicioso.test/pagar" };
    assert.equal((await pago(post("/api/pago", { planKey: "web" }), ctx)).status, 502);
    globalThis.fetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    assert.equal((await pago(post("/api/pago", { planKey: "web" }), ctx)).status, 502);
  });
});

describe("función /gestionar-suscripcion", () => {
  it("redirige al portal de Stripe configurado", async () => {
    process.env.STRIPE_PORTAL_LOGIN_URL = "https://billing.stripe.com/p/login/test_abc";
    const res = await gestionarSuscripcion();
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://billing.stripe.com/p/login/test_abc");
  });
  it("sin portal configurado (o con otra URL) no redirige", async () => {
    process.env.STRIPE_PORTAL_LOGIN_URL = "https://otra.web/login";
    assert.equal((await gestionarSuscripcion()).status, 503);
    delete process.env.STRIPE_PORTAL_LOGIN_URL;
    assert.equal((await gestionarSuscripcion()).status, 503);
  });
});
