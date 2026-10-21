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
  // Precios sin IVA (los mismos que la sección «Precios» y el catálogo de Stripe del panel). Sirven para enseñar
  // el resumen al momento; el importe final (descuentos, cuotas) lo calcula el panel.
  const PRECIOS = {
    presencia_local: { nombre: "Presencia Local", alta: 19000, cuota: 7900 },
    web_resenas: { nombre: "Web + Reseñas en piloto automático", alta: 59000, cuota: 12000 },
    plan_360: { nombre: "360°", alta: 79000, cuota: 24900 },
    resenas: { nombre: "Respuesta de reseñas", alta: 19000, cuota: 6900 },
    web: { nombre: "Web por WhatsApp", alta: 49000, cuota: 6900 },
    multicanal: { nombre: "Publicación multicanal", alta: 25000, cuota: 16900 },
  };
  /** Resumen sin descuentos con los precios de la web (mientras responde el panel o si no responde). */
  function resumenBase(d) {
    const p = PRECIOS[d.planKey];
    if (!p) return null;
    const anual = d.interval === "year";
    const alta = anual ? Math.round(p.alta * 0.85) : p.alta;
    return { plan: { key: d.planKey, name: p.nombre }, interval: anual ? "year" : "month", installments: 1, discount: null, setupAmountCents: alta, setupDiscountCents: 0, setupNetCents: alta, installmentCents: 0, recurringCents: anual ? Math.round(p.cuota * 12 * 0.85) : p.cuota, base: true };
  }
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

  /** WhatsApp escrito por el cliente: 9 cifras (España) o con prefijo internacional. */
  const whatsapp = () => $("whatsapp").value.trim();
  const whatsappValido = () => {
    const d = whatsapp().replace(/\D/g, "");
    return d.length === 9 || (d.length >= 10 && d.length <= 15 && /^\+|^00/.test(whatsapp()));
  };
  // Enlace personal: la pestaña que abrió el pago guarda el código de su reserva para poder reintentar al volver de Stripe.
  const claveReserva = enlace ? `zk-reserva-${enlace.slice(0, 12)}` : null;
  const leerReserva = () => {
    try {
      return claveReserva ? sessionStorage.getItem(claveReserva) : null;
    } catch {
      return null;
    }
  };
  const guardarReserva = (r) => {
    try {
      if (claveReserva && r) sessionStorage.setItem(claveReserva, r);
    } catch {
      /* sin almacenamiento: al volver de Stripe habrá que esperar a que caduque el pago */
    }
  };

  const mostrarError = (el, texto) => {
    el.textContent = texto ?? "";
    el.hidden = !texto;
  };

  async function pedir(ruta, cuerpo) {
    const res = await fetch(ruta, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(json.error || "No se ha podido completar"), { issues: json.issues, code: json.code });
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
    lineas.push([anual ? "Primera cuota anual" : "Primera mensualidad", euros(r.recurringCents)]);
    const hoy = r.recurringCents + (r.installments > 1 ? r.installmentCents : r.setupNetCents);
    lineas.push(["Primer pago (hoy)", `<strong>${euros(conIva(hoy))}</strong> <small>(${euros(hoy)} + IVA: ${r.installments > 1 ? "1.ª cuota del alta" : "alta"} + ${anual ? "cuota anual" : "1.ª mensualidad"})</small>`]);
    lineas.push([anual ? "Cada año después" : "Desde el 2.º mes", `${euros(conIva(r.recurringCents))} <small>(${euros(r.recurringCents)} + IVA)</small>`]);
    $("resumen-lineas").innerHTML = lineas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("resumen-nota").textContent =
      r.installments > 1
        ? `Las otras ${r.installments - 1} cuotas del alta se cobran con las ${r.installments - 1} mensualidades siguientes. Si te das de baja antes de terminarlas, se cobra lo que falte del alta.`
        : `${r.base ? "Si quedan plazas de lanzamiento o tienes código de referido, el descuento del alta se aplica al pagar. " : ""}Sin permanencia: cancelas cuando quieras.`;
  }

  // Último resumen pedido al panel: si los datos no cambian, no se vuelve a pedir ni se repinta
  // (al pulsar «Pagar» justo después de escribir el código, repintar movía el botón y el clic se perdía).
  let ultimaClave = null;
  let confirmado = false;

  async function actualizar() {
    const clave = JSON.stringify(datos());
    if (clave === ultimaClave) return;
    ultimaClave = clave;
    const n = ++ultimo;
    mostrarError($("pago-error"));
    mostrarError($("referido-error"));
    // Mientras responde el panel se ve ya el resumen con los precios de la web (solo si aún no hay uno confirmado).
    const base = !enlace && resumenBase(datos());
    if (base && !confirmado) pintar(base);
    form.classList.add("cargando");
    try {
      const r = await pedir("/api/pago/resumen", datos());
      if (n !== ultimo) return;
      pintar(r);
      confirmado = true;
      $("pagar").disabled = false;
    } catch (e) {
      if (n !== ultimo) return;
      // Sin precio confirmado (o con un código erróneo) no se puede pagar; se podrá reintentar con los mismos datos.
      $("pagar").disabled = true;
      ultimaClave = null;
      confirmado = false;
      if (base) pintar(base);
      if (e.issues?.referralCode) mostrarError($("referido-error"), e.issues.referralCode[0]);
      else mostrarError($("pago-error"), "No hemos podido confirmar el precio final ahora mismo. Inténtalo en unos segundos o escríbenos por WhatsApp.");
      if (!base) {
        $("resumen-lineas").innerHTML = "";
        $("resumen-nota").textContent = "";
      }
    } finally {
      if (n === ultimo) form.classList.remove("cargando");
    }
  }

  /** Código de referido a medio escribir o con otro formato: se avisa y no se deja pagar (si no, se pagaría sin el descuento). */
  const codigoIncompleto = () => {
    const v = $("referido").value.trim().toUpperCase();
    return v !== "" && !/^ZK[A-Z0-9]{5}$/.test(v);
  };
  const avisarCodigo = () => {
    mostrarError($("referido-error"), "El código de referido tiene 7 caracteres: ZK y 5 más (por ejemplo, ZK4UPR7). Bórralo si no tienes.");
    $("pagar").disabled = true;
  };

  let espera;
  form.addEventListener("change", (e) => {
    if (e.target === $("referido") && codigoIncompleto()) return avisarCodigo();
    actualizar();
  });
  $("referido").addEventListener("input", () => {
    clearTimeout(espera);
    const v = $("referido").value.trim();
    if (v === "" || v.length === 7) espera = setTimeout(() => (codigoIncompleto() ? avisarCodigo() : actualizar()), 300);
    else $("pagar").disabled = true;
  });

  $("whatsapp").addEventListener("input", () => mostrarError($("whatsapp-error")));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (codigoIncompleto()) return avisarCodigo();
    mostrarError($("pago-error"));
    $("pago-portal").hidden = true;
    if (!whatsappValido()) {
      mostrarError($("whatsapp-error"), "Escribe tu número de WhatsApp (por ejemplo, 612 345 678).");
      $("whatsapp").focus();
      return;
    }
    $("pagar").disabled = true;
    $("pagar").textContent = "Preparando el pago…";
    try {
      const cuerpo = { ...datos(), whatsapp: whatsapp() };
      const reserva = leerReserva();
      if (reserva) cuerpo.reservation = reserva;
      const { url, reservation } = await pedir("/api/pago", cuerpo);
      guardarReserva(reservation);
      location.assign(url);
    } catch (err) {
      if (err.code === "ALREADY_SUBSCRIBED") {
        // Ya es cliente: cambia de plan en el portal de Stripe, no contratando otra vez.
        $("pago-portal-texto").textContent = err.message.replace(/\s*Para cambiar.*$/, "") + " Para cambiar de plan o de forma de pago:";
        $("pago-portal").hidden = false;
      } else if (err.issues?.whatsapp) mostrarError($("whatsapp-error"), err.issues.whatsapp[0]);
      else mostrarError($("pago-error"), err.message);
      $("pagar").disabled = false;
      $("pagar").textContent = "Pagar de forma segura";
    }
  });

  actualizar();
})();
