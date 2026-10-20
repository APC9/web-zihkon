// Pruebas de la función del alta guiada. Ejecutar: node --test netlify/pruebas/alta.test.mjs
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import alta from "../functions/alta.mjs";

const realFetch = globalThis.fetch;
let llamadas;
let respuesta;

beforeEach(() => {
  process.env.ZIHKON_PANEL_URL = "https://panel.test";
  process.env.ZIHKON_WEB_CHECKOUT_SECRET = "secreto-de-prueba-0123456789abcdef0123";
  llamadas = [];
  respuesta = { status: 200, body: { ok: true } };
  globalThis.fetch = async (url, init) => {
    llamadas.push({ url: String(url), init });
    return new Response(JSON.stringify(respuesta.body), { status: respuesta.status });
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const post = (accion, cuerpo) => new Request(`https://zihkon.com/api/alta/${accion}`, { method: "POST", body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo) });

describe("función /api/alta/*", () => {
  it("reenvía cada acción conocida al panel con el secreto", async () => {
    for (const accion of ["state", "step", "file", "file-delete", "from-checkout"]) {
      const res = await alta(post(accion, { token: "t".repeat(32) }));
      assert.equal(res.status, 200);
    }
    assert.deepEqual(
      llamadas.map((l) => l.url),
      ["state", "step", "file", "file-delete", "from-checkout"].map((a) => `https://panel.test/api/public/onboarding/${a}`),
    );
    assert.equal(llamadas[0].init.headers["x-zihkon-web-secret"], process.env.ZIHKON_WEB_CHECKOUT_SECRET);
    assert.equal(llamadas[0].init.body, JSON.stringify({ token: "t".repeat(32) }));
  });

  it("acciones desconocidas, GET, JSON roto o cuerpos de más de 5 MB no llegan al panel", async () => {
    assert.equal((await alta(post("borrar-todo", {}))).status, 404);
    assert.equal((await alta(post("..%2Fwebhooks%2Fstripe", {}))).status, 404);
    assert.equal((await alta(new Request("https://zihkon.com/api/alta/state"))).status, 405);
    assert.equal((await alta(post("state", "{roto"))).status, 400);
    assert.equal((await alta(post("file", { contentBase64: "A".repeat(7_300_000) }))).status, 413);
    assert.equal(llamadas.length, 0);
  });

  it("errores de datos pasan con sus campos y código; los internos se ocultan", async () => {
    respuesta = { status: 409, body: { error: "Completa antes los pasos anteriores", code: "ONBOARDING_STEP_ORDER" } };
    let res = await alta(post("step", {}));
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "Completa antes los pasos anteriores", code: "ONBOARDING_STEP_ORDER" });

    respuesta = { status: 400, body: { error: "Datos no válidos", issues: { mapsUrl: ["Pega el enlace"] } } };
    res = await alta(post("step", {}));
    assert.deepEqual((await res.json()).issues, { mapsUrl: ["Pega el enlace"] });

    respuesta = { status: 500, body: { error: "prisma explotó" } };
    res = await alta(post("state", {}));
    assert.doesNotMatch((await res.json()).error, /prisma/);

    globalThis.fetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    assert.equal((await alta(post("state", {}))).status, 502);
  });

  it("sin configuración responde 503", async () => {
    delete process.env.ZIHKON_PANEL_URL;
    assert.equal((await alta(post("state", {}))).status, 503);
    assert.equal(llamadas.length, 0);
  });
});
