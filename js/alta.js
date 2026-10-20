// Alta guiada tras el pago: un paso cada vez, según lo contratado. El servidor valida y guarda cada paso;
// aquí solo se pinta el formulario, se reducen las fotos antes de subirlas y se enseñan los errores.
(() => {
  const $ = (id) => document.getElementById(id);
  // El token no se queda en la barra de direcciones (ni en el historial); se guarda en la pestaña para poder recargar.
  const guardado = (() => {
    try {
      return sessionStorage.getItem("zk-alta");
    } catch {
      return null;
    }
  })();
  const token = new URLSearchParams(location.search).get("t") || guardado;
  if (token) {
    try {
      sessionStorage.setItem("zk-alta", token);
    } catch {
      /* sin almacenamiento: solo se pierde al recargar */
    }
    history.replaceState(null, "", location.pathname);
  }
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let estado = null;
  let paso = null;

  async function pedir(accion, cuerpo) {
    const res = await fetch(`/api/alta/${accion}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, ...cuerpo }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(json.error || "No se ha podido guardar"), { issues: json.issues, status: res.status });
    return json;
  }

  const mostrar = (el, texto) => {
    el.textContent = texto ?? "";
    el.hidden = !texto;
  };

  // ------------------------------------------------------------------ campos
  const campo = (name, label, { tipo = "text", ayuda = "", requerido = true, valor = "", placeholder = "", max = 200 } = {}) => `
    <div class="alta-campo">
      <label class="campo-etiqueta" for="f-${name}">${esc(label)}${requerido ? "" : ' <span class="opcional">(opcional)</span>'}</label>
      ${
        tipo === "textarea"
          ? `<textarea class="campo campo--largo" id="f-${name}" name="${name}" rows="4" maxlength="${max}" placeholder="${esc(placeholder)}">${esc(valor)}</textarea>`
          : `<input class="campo campo--largo" id="f-${name}" name="${name}" type="${tipo}" maxlength="${max}" value="${esc(valor)}" placeholder="${esc(placeholder)}">`
      }
      ${ayuda ? `<p class="campo-ayuda">${ayuda}</p>` : ""}
      <p class="campo-error" data-error="${name}" hidden></p>
    </div>`;
  const casilla = (name, label, marcado) => `
    <label class="alta-casilla"><input type="checkbox" name="${name}" ${marcado ? "checked" : ""}> <span>${label}</span></label>
    <p class="campo-error" data-error="${name}" hidden></p>`;
  const sino = (name, label, valor, si = "Sí", no = "No") => `
    <fieldset class="pago-bloque alta-campo">
      <legend class="campo-etiqueta">${esc(label)}</legend>
      <div class="periodo">
        <label class="periodo-opcion"><input type="radio" name="${name}" value="si" ${valor === true ? "checked" : ""}><span>${si}</span></label>
        <label class="periodo-opcion"><input type="radio" name="${name}" value="no" ${valor === false ? "checked" : ""}><span>${no}</span></label>
      </div>
      <p class="campo-error" data-error="${name}" hidden></p>
    </fieldset>`;

  const archivos = (kind) => (estado.files || []).filter((f) => f.kind === kind);
  const listaArchivos = (kind) =>
    archivos(kind)
      .map((f) => `<li>${f.preview ? `<img src="${f.preview}" alt="">` : ""}<span>${esc(f.fileName)}</span><button type="button" class="alta-quitar" data-quitar="${f.fileId}" aria-label="Quitar ${esc(f.fileName)}">Quitar</button></li>`)
      .join("");
  const subida = (kind, label, ayuda, multiple, acepta) => `
    <div class="alta-campo">
      <span class="campo-etiqueta">${esc(label)}</span>
      <ul class="alta-archivos" data-lista="${kind}">${listaArchivos(kind)}</ul>
      <label class="button button--light alta-subir">
        <input type="file" data-subir="${kind}" accept="${acepta}" ${multiple ? "multiple" : ""}>
        ${multiple ? "Añadir archivos" : "Elegir archivo"}
      </label>
      <p class="campo-ayuda">${ayuda}</p>
      <p class="campo-error" data-error="${kind === "foto" ? "fotos" : kind}" hidden></p>
    </div>`;

  // ------------------------------------------------------------------ pasos
  const PASOS = {
    negocio(d) {
      const conGoogle = estado.steps.some((s) => s.key === "google");
      return [
        campo("nombre", "Nombre del negocio", { valor: d.nombre ?? estado.clientName ?? "", max: 120 }),
        campo("tipoNegocio", "¿A qué se dedica?", { valor: d.tipoNegocio, placeholder: "Restaurante, peluquería, clínica…", max: 80 }),
        campo("direccion", "Dirección", { valor: d.direccion, max: 200 }),
        campo("mapsUrl", "Enlace de tu negocio en Google Maps", {
          valor: d.mapsUrl,
          requerido: conGoogle,
          max: 500,
          ayuda: "Busca tu negocio en Google Maps, pulsa <strong>Compartir</strong> y <strong>Copiar enlace</strong>. Pégalo aquí.",
        }),
        campo("horario", "Horario de apertura", { tipo: "textarea", valor: d.horario, placeholder: "Lunes a viernes de 9:00 a 14:00 y de 17:00 a 20:00…", max: 500 }),
        campo("telefonoPublico", "Teléfono para tus clientes", { tipo: "tel", valor: d.telefonoPublico, requerido: false, max: 30 }),
        campo("webActual", "Web actual", { tipo: "url", valor: d.webActual, requerido: false, placeholder: "https://", max: 500 }),
      ].join("");
    },
    google(d) {
      const email = esc(estado.googleEmail);
      return `
        ${sino("tienePerfil", "¿Tu negocio ya tiene perfil en Google (sale en Google Maps)?", d.tienePerfil)}
        <div class="alta-instrucciones" data-si="tienePerfil">
          <p>Para responder tus reseñas y publicar en Google necesitamos acceso a tu perfil. No nos das tu contraseña: nos invitas como administradores y puedes quitarnos cuando quieras.</p>
          <ol>
            <li>Entra en <a href="https://business.google.com/" target="_blank" rel="noopener noreferrer">business.google.com</a> con la cuenta de Google de tu negocio.</li>
            <li>En tu perfil, abre el menú <strong>⋮</strong> y entra en <strong>Personas y acceso</strong> (en Configuración del perfil).</li>
            <li>Pulsa <strong>Añadir</strong>, escribe <strong>${email}</strong> <button type="button" class="alta-copiar" data-copiar="${email}">Copiar</button> y elige <strong>Administrador</strong>.</li>
            <li>Pulsa <strong>Invitar</strong>.</li>
          </ol>
          ${casilla("invitacionEnviada", `Ya he invitado a ${email} como administrador`, d.invitacionEnviada)}
          ${campo("cuentaGoogle", "Cuenta de Google del perfil", { tipo: "email", valor: d.cuentaGoogle, requerido: false, ayuda: "Nos ayuda a localizar tu invitación.", max: 200 })}
        </div>
        <div class="alta-instrucciones" data-no="tienePerfil"><p>Sin problema: lo creamos nosotros con los datos de tu negocio y te avisamos por WhatsApp.</p></div>`;
    },
    redes(d) {
      return `
        <p class="campo-ayuda alta-nota">Indica tus redes. Después te enviaremos por WhatsApp un enlace seguro para conectarlas a nuestra herramienta de publicación (no nos das tus contraseñas).</p>
        ${campo("instagram", "Instagram", { valor: d.instagram, requerido: false, placeholder: "@tunegocio" })}
        ${campo("facebook", "Facebook", { valor: d.facebook, requerido: false, placeholder: "Nombre o enlace de tu página" })}
        ${campo("tiktok", "TikTok", { valor: d.tiktok, requerido: false, placeholder: "@tunegocio" })}
        ${casilla("sinRedes", "No tengo redes sociales: creadlas vosotros", d.sinRedes)}`;
    },
    web(d) {
      return `
        ${sino("tieneDominio", "¿Tienes ya un dominio (p. ej. tunegocio.com)?", d.tieneDominio)}
        <div data-si="tieneDominio">${campo("dominio", "Tu dominio", { valor: d.dominio, placeholder: "tunegocio.com", max: 120 })}</div>
        ${campo("sobreNosotros", "Cuéntanos quiénes sois", { tipo: "textarea", valor: d.sobreNosotros, max: 2000, placeholder: "Desde cuándo estáis, qué os hace especiales…" })}
        ${campo("servicios", "Qué ofrecéis", { tipo: "textarea", valor: d.servicios, max: 2000, placeholder: "Servicios, productos o platos principales, con precios si quieres" })}
        ${campo("estilo", "Estilo o colores que te gustan", { valor: d.estilo, requerido: false, max: 500 })}
        ${subida("logo", "Logo", "PNG o JPG. Si no tienes, márcalo abajo.", false, "image/png,image/jpeg,image/webp")}
        ${casilla("sinLogo", "No tengo logo", d.sinLogo)}
        ${subida("foto", `Fotos de tu negocio (mínimo ${estado.minFotos})`, "Local, productos, equipo… Hasta 10. Las reducimos al subirlas.", true, "image/jpeg,image/png,image/webp")}
        ${subida("carta", "Carta o menú (opcional)", "PDF o fotos, si tienes restaurante o bar.", true, "application/pdf,image/jpeg,image/png")}`;
    },
    resumen() {
      const bloques = estado.steps
        .filter((s) => s.key !== "resumen")
        .map((s) => {
          const d = estado.data[s.key] || {};
          const filas = Object.entries(d)
            .filter(([, v]) => v !== "" && v !== false && v != null)
            .map(([k, v]) => `<div><dt>${esc(ETIQUETAS[k] ?? k)}</dt><dd>${esc(v === true ? "Sí" : v)}</dd></div>`)
            .join("");
          const n = s.key === "web" ? `<div><dt>Archivos</dt><dd>${(estado.files || []).length}</dd></div>` : "";
          return `<section class="alta-resumen"><h3>${esc(s.label)} <button type="button" class="alta-copiar" data-ir="${s.key}">Cambiar</button></h3><dl>${filas}${n}</dl></section>`;
        })
        .join("");
      return `${bloques}${casilla("confirmo", "Los datos son correctos", false)}`;
    },
  };
  const ETIQUETAS = {
    nombre: "Nombre", tipoNegocio: "A qué se dedica", direccion: "Dirección", mapsUrl: "Google Maps", horario: "Horario", telefonoPublico: "Teléfono", webActual: "Web actual",
    tienePerfil: "Tiene perfil de Google", invitacionEnviada: "Invitación enviada", cuentaGoogle: "Cuenta de Google", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
    sinRedes: "Sin redes", tieneDominio: "Tiene dominio", dominio: "Dominio", sobreNosotros: "Quiénes sois", servicios: "Qué ofrecéis", estilo: "Estilo", sinLogo: "Sin logo",
  };

  // Muestra u oculta los bloques que dependen de un sí/no.
  function dependencias() {
    for (const el of document.querySelectorAll("[data-si],[data-no]")) {
      const name = el.dataset.si ?? el.dataset.no;
      const v = document.querySelector(`input[name="${name}"]:checked`)?.value;
      el.hidden = el.dataset.si ? v !== "si" : v !== "no";
    }
  }

  function leer() {
    const form = $("alta-form");
    const d = {};
    for (const el of form.querySelectorAll("input[name],textarea[name]")) {
      if (el.closest("[hidden]")) continue;
      if (el.type === "checkbox") d[el.name] = el.checked;
      else if (el.type === "radio") {
        if (el.checked) d[el.name] = el.value === "si";
      } else d[el.name] = el.value.trim();
    }
    return d;
  }

  function pintarPasos() {
    const actual = estado.current;
    $("alta-pasos").innerHTML = estado.steps
      .map((s, i) => {
        const clase = s.key === paso ? "es-actual" : s.done ? "es-hecho" : "";
        const puede = s.done || s.key === actual;
        return `<li class="${clase}">${puede ? `<button type="button" data-ir="${s.key}"${s.key === paso ? ' aria-current="step"' : ""}>` : "<span>"}<span class="alta-num">${s.done && s.key !== paso ? "✓" : i + 1}</span> ${esc(s.label)}${puede ? "</button>" : "</span>"}</li>`;
      })
      .join("");
  }

  function pintar() {
    if (estado.status === "completed" && !paso) {
      $("alta-form").hidden = true;
      $("alta-pasos").hidden = true;
      $("alta-fin").hidden = false;
      return;
    }
    paso ??= estado.current ?? "resumen";
    const info = estado.steps.find((s) => s.key === paso);
    $("alta-fin").hidden = true;
    $("alta-form").hidden = false;
    $("paso-titulo").textContent = info.label;
    $("paso-campos").innerHTML = PASOS[paso](estado.data[paso] || {});
    $("guardar").textContent = paso === "resumen" ? "Terminar" : "Guardar y seguir";
    const i = estado.steps.findIndex((s) => s.key === paso);
    $("atras").hidden = i === 0;
    mostrar($("paso-error"));
    pintarPasos();
    dependencias();
  }

  function errores(issues) {
    let primero = null;
    for (const [k, msgs] of Object.entries(issues || {})) {
      const el = document.querySelector(`[data-error="${k}"]`);
      // El propio aviso está oculto: se mira solo si su bloque (p. ej. «sí tengo perfil») está a la vista.
      if (el && !el.parentElement.closest("[hidden]")) {
        mostrar(el, msgs[0]);
        primero ??= el;
      }
    }
    if (primero) primero.scrollIntoView({ block: "center", behavior: "smooth" });
    return !!primero;
  }

  // ------------------------------------------------------------------ archivos
  /** Reduce la imagen (máx. 2000 px; el logo, 1200 px y en PNG si lo era) antes de subirla. */
  async function reducir(file, kind) {
    if (file.type === "application/pdf") return file;
    const max = kind === "logo" ? 1200 : 2000;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;
    const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const tipo = kind === "logo" && file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((ok) => canvas.toBlob(ok, tipo, 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, tipo === "image/png" ? ".png" : ".jpg"), { type: tipo }) : file;
  }

  const aBase64 = (blob) =>
    new Promise((ok, mal) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result).split(",")[1]);
      r.onerror = mal;
      r.readAsDataURL(blob);
    });

  async function subir(input) {
    const kind = input.dataset.subir;
    const errorEl = document.querySelector(`[data-error="${kind === "foto" ? "fotos" : kind}"]`);
    mostrar(errorEl);
    const boton = input.closest("label");
    boton.classList.add("cargando");
    try {
      for (const original of input.files) {
        const file = await reducir(original, kind);
        if (file.size > 5 * 1024 * 1024) throw new Error(`«${original.name}» ocupa más de 5 MB`);
        const r = await pedir("file", { kind, fileName: file.name, mimeType: file.type, contentBase64: await aBase64(file) });
        if (kind === "logo") estado.files = estado.files.filter((f) => f.kind !== "logo");
        estado.files.push({ ...r, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
      }
    } catch (e) {
      mostrar(errorEl, e.issues?.archivo?.[0] ?? e.message);
    } finally {
      boton.classList.remove("cargando");
      input.value = "";
      document.querySelector(`[data-lista="${kind}"]`).innerHTML = listaArchivos(kind);
    }
  }

  // ------------------------------------------------------------------ eventos
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-subir]")) subir(e.target);
    else dependencias();
  });
  document.addEventListener("click", async (e) => {
    const ir = e.target.closest("[data-ir]");
    if (ir) {
      paso = ir.dataset.ir;
      pintar();
      $("paso-titulo").focus();
      return;
    }
    const copiar = e.target.closest("[data-copiar]");
    if (copiar) {
      await navigator.clipboard?.writeText(copiar.dataset.copiar).catch(() => {});
      copiar.textContent = "Copiado";
      return;
    }
    const quitar = e.target.closest("[data-quitar]");
    if (quitar) {
      const f = estado.files.find((x) => x.fileId === quitar.dataset.quitar);
      try {
        await pedir("file-delete", { fileId: f.fileId });
        estado.files = estado.files.filter((x) => x !== f);
        document.querySelector(`[data-lista="${f.kind}"]`).innerHTML = listaArchivos(f.kind);
      } catch (err) {
        mostrar($("paso-error"), err.message);
      }
    }
  });
  $("atras").addEventListener("click", () => {
    const i = estado.steps.findIndex((s) => s.key === paso);
    paso = estado.steps[Math.max(0, i - 1)].key;
    pintar();
  });

  $("alta-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    for (const el of document.querySelectorAll("[data-error]")) mostrar(el);
    mostrar($("paso-error"));
    const datos = leer();
    $("guardar").disabled = true;
    try {
      const r = await pedir("step", { step: paso, data: datos });
      estado.data[paso] = datos;
      const s = estado.steps.find((x) => x.key === paso);
      s.done = true;
      estado.current = r.next;
      estado.status = r.status;
      paso = r.status === "completed" ? null : (r.next ?? "resumen");
      pintar();
      window.scrollTo({ top: 0, behavior: "smooth" });
      $("paso-titulo").focus({ preventScroll: true });
    } catch (err) {
      if (!errores(err.issues)) mostrar($("paso-error"), err.message);
    } finally {
      $("guardar").disabled = false;
    }
  });

  // ------------------------------------------------------------------ inicio
  (async () => {
    if (!token) return mostrar($("alta-error"), "Abre esta página desde el enlace que te hemos enviado por WhatsApp.");
    try {
      estado = await pedir("state", {});
      estado.files ??= [];
      if (estado.clientName) $("alta-titulo").textContent = `Pon en marcha tu plan, ${estado.clientName}`;
      pintar();
    } catch (e) {
      mostrar($("alta-error"), e.message);
    }
  })();
})();
