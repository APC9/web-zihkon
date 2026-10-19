// «Gestionar mi suscripción»: lleva al portal de cliente de Stripe (cancelar, cambiar de plan, tarjeta y facturas).
// El cliente entra con su email y un código que le envía Stripe. Variable en Netlify: STRIPE_PORTAL_LOGIN_URL.

export default async function gestionarSuscripcion() {
  const destino = process.env.STRIPE_PORTAL_LOGIN_URL;
  if (!destino || !destino.startsWith("https://billing.stripe.com/")) {
    return new Response("El acceso a la gestión de la suscripción no está disponible ahora mismo. Escríbenos por WhatsApp al +34 604 18 36 76.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(null, { status: 302, headers: { location: destino, "cache-control": "no-store" } });
}

export const config = { path: "/gestionar-suscripcion" };
