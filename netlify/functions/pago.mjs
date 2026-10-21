// Pago de planes de Zihkon (Netlify Function).
// El navegador solo habla con zihkon.com: esta función pide al panel de gestión (servidor a servidor,
// con un secreto compartido) el resumen del pago o el enlace de Stripe Checkout, y lo devuelve.
// Variables de entorno en Netlify: ZIHKON_PANEL_URL y ZIHKON_WEB_CHECKOUT_SECRET (nunca en el código).

const CAMPOS = ["planKey", "interval", "referralCode", "linkToken", "whatsapp", "reservation"];
const MAX_CUERPO = 2_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default async function pago(req, context) {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const panel = process.env.ZIHKON_PANEL_URL;
  const secreto = process.env.ZIHKON_WEB_CHECKOUT_SECRET;
  if (!panel || !secreto) return json({ error: "Los pagos no están disponibles ahora mismo. Escríbenos por WhatsApp." }, 503);

  const texto = await req.text();
  if (texto.length > MAX_CUERPO) return json({ error: "Petición demasiado grande" }, 413);
  let datos;
  try {
    datos = JSON.parse(texto || "{}");
  } catch {
    return json({ error: "Petición no válida" }, 400);
  }
  // Solo se reenvían los campos conocidos y como texto.
  const limpio = Object.fromEntries(CAMPOS.filter((c) => typeof datos?.[c] === "string" && datos[c].trim()).map((c) => [c, datos[c].trim().slice(0, 80)]));

  const resumen = new URL(req.url).pathname.endsWith("/resumen");
  const destino = new URL(resumen ? "/api/public/checkout/quote" : "/api/public/checkout", panel);
  try {
    const res = await fetch(destino, {
      method: "POST",
      headers: { "content-type": "application/json", "x-zihkon-web-secret": secreto, "x-zihkon-visitor-ip": context?.ip ?? "" },
      body: JSON.stringify(limpio),
      signal: AbortSignal.timeout(15_000),
    });
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Al visitante solo le llega el mensaje (y los errores de campo), nunca detalles internos.
      const error = res.status >= 500 || res.status === 401 ? "No hemos podido preparar el pago. Inténtalo de nuevo o escríbenos por WhatsApp." : (cuerpo.error ?? "Revisa los datos");
      // El código (p. ej. ALREADY_SUBSCRIBED) permite a la web enseñar el acceso a «Gestionar mi suscripción».
      const code = res.status === 409 ? cuerpo.code : undefined;
      return json({ error, code, issues: res.status === 400 ? cuerpo.issues : undefined }, res.status === 401 ? 502 : res.status);
    }
    if (!resumen && !String(cuerpo.url ?? "").startsWith("https://checkout.stripe.com/")) return json({ error: "Respuesta inesperada del servidor de pagos" }, 502);
    return json(cuerpo);
  } catch {
    return json({ error: "No hemos podido preparar el pago. Inténtalo de nuevo en unos minutos." }, 502);
  }
}

export const config = { path: ["/api/pago", "/api/pago/resumen"] };
