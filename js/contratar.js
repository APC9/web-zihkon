// Página «Contrata tu plan»: pide el resumen al servidor (precios, descuentos e IVA los calcula el panel)
// y, al pagar, redirige a Stripe Checkout. Con ?enlace=… (enlace personal de Zihkon) el plan y las cuotas vienen fijados.
(() => {
  const form = document.getElementById("pago-form");
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const enlace = params.get("enlace");
  const euros = (c) => (c / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const conIva = (c) => Math.round(c * 1.21);
  let ultimo = 0;

  // Plan inicial desde ?plan= (botones de la página de precios).
  const planInicial = params.get("plan");
  const radio = planInicial && form.querySelector(`input[name="plan"][value="${CSS.escape(planInicial)}"]`);
  if (radio) {
    radio.checked = true;
    if (radio.closest("#plan-sueltos")) $("plan-sueltos").open = true;
  }
  const refInicial = params.get("ref");
  if (refInicial) $("referido").value = refInicial.toUpperCase().slice(0, 7);

  if (enlace) {
    // Enlace personal: el plan y la forma de pago los ha preparado Zihkon.
    $("bloque-plan").hidden = true;
    $("bloque-periodo").hidden = true;
    $("pago-entradilla").textContent = "Este enlace personal ya tiene tu plan preparado. Revisa el resumen y paga de forma segura en Stripe.";
  }

  const datos = () => {
    const d = {};
    if (enlace) d.linkToken = enlace;
    else {
      d.planKey = form.querySelector('input[name="plan"]:checked')?.value;
      d.interval = form.querySelector('input[name="interval"]:checked')?.value;
    }
    const ref = $("referido").value.trim().toUpperCase();
    if (/^ZK[A-Z0-9]{5}$/.test(ref)) d.referralCode = ref;
    return d;
  };

  const mostrarError = (el, texto) => {
    el.textContent = texto ?? "";
    el.hidden = !texto;
  };

  async function pedir(ruta, cuerpo) {
    const res = await fetch(ruta, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(json.error || "No se ha podido completar"), { issues: json.issues });
    return json;
  }

  function pintar(r) {
    const anual = r.interval === "year";
    $("resumen-plan").textContent = r.plan.name;
    const lineas = [];
    if (r.installments > 1) {
      lineas.push(["Alta", `${r.installments} cuotas de ${euros(r.installmentCents)}`]);
    } else {
      lineas.push(["Alta", r.setupDiscountCents ? `<del>${euros(r.setupAmountCents)}</del> ${euros(r.setupNetCents)}` : euros(r.setupNetCents)]);
    }
    if (r.setupDiscountCents) lineas.push(["Descuento", r.discount === "lanzamiento" ? "50 % de lanzamiento" : "50 € por código de referido"]);
    lineas.push([anual ? "Cuota anual" : "Cuota mensual", euros(r.recurringCents)]);
    const hoy = r.recurringCents + (r.installments > 1 ? r.installmentCents : r.setupNetCents);
    lineas.push(["Pagas hoy", `<strong>${euros(conIva(hoy))}</strong> <small>(${euros(hoy)} + IVA)</small>`]);
    $("resumen-lineas").innerHTML = lineas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("resumen-nota").textContent =
      r.installments > 1
        ? `Las otras ${r.installments - 1} cuotas del alta se cobran con las ${r.installments - 1} mensualidades siguientes. Si te das de baja antes de terminarlas, se cobra lo que falte del alta.`
        : anual
          ? `Después, ${euros(conIva(r.recurringCents))} al año (IVA incluido). Cancela cuando quieras.`
          : `Después, ${euros(conIva(r.recurringCents))} al mes (IVA incluido). Cancela cuando quieras.`;
  }

  async function actualizar() {
    const n = ++ultimo;
    $("pagar").disabled = true;
    mostrarError($("pago-error"));
    mostrarError($("referido-error"));
    form.classList.add("cargando");
    try {
      const r = await pedir("/api/pago/resumen", datos());
      if (n !== ultimo) return;
      pintar(r);
      $("pagar").disabled = false;
    } catch (e) {
      if (n !== ultimo) return;
      if (e.issues?.referralCode) mostrarError($("referido-error"), e.issues.referralCode[0]);
      else mostrarError($("pago-error"), e.message);
      $("resumen-lineas").innerHTML = "";
      $("resumen-nota").textContent = "";
    } finally {
      if (n === ultimo) form.classList.remove("cargando");
    }
  }

  let espera;
  form.addEventListener("change", actualizar);
  $("referido").addEventListener("input", () => {
    clearTimeout(espera);
    const v = $("referido").value.trim();
    if (v === "" || v.length === 7) espera = setTimeout(actualizar, 300);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("pagar").disabled = true;
    $("pagar").textContent = "Preparando el pago…";
    try {
      const { url } = await pedir("/api/pago", datos());
      location.assign(url);
    } catch (err) {
      mostrarError($("pago-error"), err.message);
      $("pagar").disabled = false;
      $("pagar").textContent = "Pagar de forma segura";
    }
  });

  actualizar();
})();
