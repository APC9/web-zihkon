// Pago completado: en cuanto el panel ha dado de alta al cliente (webhook de Stripe), ofrece el enlace al alta guiada.
(() => {
  const sessionId = new URLSearchParams(location.search).get("pago");
  const texto = document.getElementById("pago-alta-texto");
  const boton = document.getElementById("pago-alta-boton");
  const porWhatsApp = "Te hemos enviado por WhatsApp el enlace para completar tu alta.";
  if (!sessionId || !/^cs_(test|live)_/.test(sessionId)) {
    texto.textContent = porWhatsApp;
    return;
  }
  let intentos = 0;
  async function comprobar() {
    intentos += 1;
    try {
      const res = await fetch("/api/alta/from-checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }) });
      const r = await res.json().catch(() => ({}));
      if (res.ok && r.ready && r.url) {
        texto.textContent = "Ya puedes completar tu alta. Se guarda cada paso.";
        boton.href = r.url;
        boton.hidden = false;
        return;
      }
      if (res.ok && r.completed) return void (texto.textContent = "Tu alta ya está completada. ¡Gracias!");
      if (!res.ok && res.status !== 404) return void (texto.textContent = porWhatsApp);
    } catch {
      /* se reintenta */
    }
    // El webhook suele tardar unos segundos (más con domiciliación SEPA).
    if (intentos < 15) setTimeout(comprobar, 2000);
    else texto.textContent = porWhatsApp;
  }
  comprobar();
})();
