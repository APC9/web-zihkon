// Alta guiada tras el pago (Netlify Function). Igual que pago.mjs: el navegador solo habla con zihkon.com
// y esta función reenvía al panel (servidor a servidor, con el secreto compartido) solo las acciones conocidas.
// Variables de entorno en Netlify: ZIHKON_PANEL_URL y ZIHKON_WEB_CHECKOUT_SECRET.

const ACCIONES = new Set(["state", "step", "file", "file-delete", "from-checkout"]);
// Las fotos llegan ya reducidas en el navegador; el límite del panel es 5 MB por archivo (en base64 ≈ 6,7 MB).
const MAX_CUERPO = 7_200_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default async function alta(req) {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const accion = new URL(req.url).pathname.split("/").pop();
  if (!ACCIONES.has(accion)) return json({ error: "No encontrado" }, 404);
  const panel = process.env.ZIHKON_PANEL_URL;
  const secreto = process.env.ZIHKON_WEB_CHECKOUT_SECRET;
  if (!panel || !secreto) return json({ error: "El alta no está disponible ahora mismo. Escríbenos por WhatsApp." }, 503);

  const texto = await req.text();
  if (texto.length > MAX_CUERPO) return json({ error: "El archivo es demasiado grande (máximo 5 MB)" }, 413);
  try {
    JSON.parse(texto || "{}");
  } catch {
    return json({ error: "Petición no válida" }, 400);
  }

  try {
    const res = await fetch(new URL(`/api/public/onboarding/${accion}`, panel), {
      method: "POST",
      headers: { "content-type": "application/json", "x-zihkon-web-secret": secreto },
      body: texto,
      signal: AbortSignal.timeout(20_000),
    });
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = res.status >= 500 || res.status === 401 ? "No hemos podido guardar. Inténtalo de nuevo en unos minutos." : (cuerpo.error ?? "Revisa los datos");
      return json({ error, code: cuerpo.code, issues: res.status === 400 ? cuerpo.issues : undefined }, res.status === 401 ? 502 : res.status);
    }
    return json(cuerpo);
  } catch {
    return json({ error: "No hemos podido conectar. Inténtalo de nuevo en unos minutos." }, 502);
  }
}

export const config = { path: "/api/alta/*" };
