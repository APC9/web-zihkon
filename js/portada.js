/* =========================================================
   ZIHKON · MOVIMIENTO DE LA PORTADA (index.html)
   - Respeta "reducir movimiento" del sistema; se puede activar a mano
     con el botón "Ver con animaciones" (se guarda en este navegador).
   - Scroll suave (Lenis), títulos que suben palabra a palabra, bloques
     que aparecen, botones magnéticos, chat que se escribe solo.
   - Escena 3D (js/experiencia3d.js) unida al scroll del inicio y del
     recorrido de servicios (#servicios).
   Si algo falla, la página sigue completa y quieta.
   ========================================================= */
const raiz = document.documentElement;
const cuerpo = document.body;
const CLAVE = 'zihkon-movimiento';
const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, v); } catch {} };

const sistemaReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const preferencia = /[?&](movimiento|forzar-3d)\b/.test(location.search) ? 'si' : leer();
const conMovimiento = 'IntersectionObserver' in window && (preferencia === 'si' || (!sistemaReduce && preferencia !== 'no'));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let lenis = null; // scroll suave (se crea en scrollSuave)

// ---------- Interruptor de animaciones ----------
function interruptores() {
  const cambiar = () => { guardar(conMovimiento ? 'no' : 'si'); location.reload(); };
  const pie = document.querySelector('.footer-copy');
  if (pie) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pie-movimiento';
    b.textContent = conMovimiento ? 'Desactivar animaciones' : 'Activar animaciones';
    b.addEventListener('click', cambiar);
    pie.after(b);
  }
  // Quien tiene "reducir movimiento" en su sistema ve también un aviso en el inicio
  if (sistemaReduce && !conMovimiento) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ver-movimiento';
    b.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Ver con animaciones';
    b.addEventListener('click', cambiar);
    document.querySelector('.hero')?.append(b);
    document.querySelector('.hero-scroll')?.setAttribute('hidden', '');
  }
}
interruptores();

// Si el sistema pide reducir movimiento pero la persona lo ha activado, se quitan esas reglas CSS
function quitarReglasReducir(hojas) {
  for (const hoja of hojas) {
    let reglas; try { reglas = hoja.cssRules; } catch { continue; }
    for (let i = reglas.length - 1; i >= 0; i--) {
      const r = reglas[i];
      if (r instanceof CSSImportRule && r.styleSheet) quitarReglasReducir([r.styleSheet]);
      else if (r instanceof CSSMediaRule && r.conditionText.includes('prefers-reduced-motion')) hoja.deleteRule(i);
    }
  }
}

// ---------- Cabecera: clara sobre lo oscuro, se esconde al bajar ----------
const oscuros = [...document.querySelectorAll('.oscuro, .footer')];
const altoCabecera = () => document.querySelector('.topbar')?.offsetHeight || 70;
let ultimaY = scrollY;
function cabecera() {
  const y = altoCabecera() / 2;
  cuerpo.classList.toggle('cabecera-oscura', oscuros.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
  const menuAbierto = document.querySelector('.nav-links')?.classList.contains('is-open');
  const baja = scrollY > ultimaY + 4, sube = scrollY < ultimaY - 4;
  if (conMovimiento && !menuAbierto && !cuerpo.contains(document.activeElement?.closest?.('.topbar'))) {
    if (baja && scrollY > innerHeight * .8) cuerpo.classList.add('cabecera-escondida');
    else if (sube || scrollY < 10) cuerpo.classList.remove('cabecera-escondida');
  } else cuerpo.classList.remove('cabecera-escondida');
  ultimaY = scrollY;
}
cabecera();
addEventListener('scroll', cabecera, { passive: true });
document.querySelector('.topbar')?.addEventListener('focusin', () => cuerpo.classList.remove('cabecera-escondida'));

if (conMovimiento) {
  if (sistemaReduce) quitarReglasReducir(document.styleSheets);
  raiz.classList.add('con-movimiento');
  prepararAnimaciones();
  scrollSuave();
  magneticos();
  escribirChat();
  iniciar3D();
}
// Estos efectos funcionan siempre, también con "reducir movimiento" activado en el sistema
focoAvisos();
luzViaje();
estrellaCalendario();

// ---------- Calendario de contenido: reel y carrusel reales ----------
function calendario() {
  const vista = document.getElementById('cal-vista');
  if (!vista) return;
  const botones = [...document.querySelectorAll('.cal-pieza[data-pieza]')];
  const paneles = [...vista.querySelectorAll('.cal-panel')];
  const video = vista.querySelector('.cal-video');
  const mostrar = (pieza) => {
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pieza === pieza)));
    paneles.forEach((p) => { p.hidden = p.dataset.panel !== pieza; });
    if (pieza !== 'reel') video?.pause();
  };
  botones.forEach((b) => b.addEventListener('click', () => {
    mostrar(b.dataset.pieza);
    // En pantallas estrechas la vista queda debajo: se lleva a la persona hasta ella
    if (matchMedia('(max-width: 1024px)').matches) vista.scrollIntoView({ behavior: conMovimiento ? 'smooth' : 'auto', block: 'start' });
  }));

  // Carrusel: flechas, contador y teclado
  const pista = vista.querySelector('.cal-carrusel');
  const contador = vista.querySelector('.cal-contador');
  const [atras, alante] = vista.querySelectorAll('.cal-flecha');
  const total = pista ? pista.children.length : 0;
  const actual = () => Math.round(pista.scrollLeft / (pista.clientWidth + 12));
  const pintar = () => { const i = actual(); contador.textContent = `${i + 1} / ${total}`; atras.disabled = i === 0; alante.disabled = i === total - 1; };
  const ir = (d) => pista.children[Math.min(total - 1, Math.max(0, actual() + d))]?.scrollIntoView({ behavior: conMovimiento ? 'smooth' : 'auto', block: 'nearest', inline: 'start' });
  if (pista) {
    vista.querySelectorAll('.cal-flecha').forEach((b) => b.addEventListener('click', () => ir(Number(b.dataset.dir))));
    pista.addEventListener('scroll', () => requestAnimationFrame(pintar), { passive: true });
    pista.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ir(e.key === 'ArrowRight' ? 1 : -1); } });
    pintar();
  }

  // El reel se reproduce sin sonido al verlo (solo con animaciones activadas) y se para al salir
  if (video && conMovimiento) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !video.closest('[hidden]')) video.play().catch(() => {});
      else video.pause();
    }, { threshold: .5 }).observe(video);
  }
}
calendario();

// ---------- ¿Te suena?: se enciende la notificación que pasa por el centro de la pantalla ----------
function focoAvisos() {
  const lista = document.querySelector('.avisos');
  const avisos = [...document.querySelectorAll('.aviso')];
  if (!lista || !avisos.length) return;
  lista.classList.add('con-foco');
  const valores = avisos.map(() => 0);
  let visible = false, bucle = 0, antes = 0;
  // Curva suave: 1 en el centro de la pantalla, 0 a ~22 % de distancia (más o menos una tarjeta)
  const campana = (d) => { const x = Math.min(1, d / Math.max(180, innerHeight * .22)); return Math.cos(x * Math.PI / 2) ** 2; };
  const paso = (t) => {
    bucle = visible ? requestAnimationFrame(paso) : 0;
    const dt = Math.min(.05, (t - (antes || t)) / 1000); antes = t;
    const k = 1 - Math.exp(-dt * 7); // seguimiento suave (independiente de los fps)
    const centro = innerHeight * .55;
    avisos.forEach((a, i) => {
      const r = a.getBoundingClientRect();
      const meta = campana(Math.abs(r.top + r.height / 2 - centro));
      const v = valores[i] += (meta - valores[i]) * k;
      a.style.setProperty('--foco', v.toFixed(3));
      a.classList.toggle('is-foco', v > .6);
    });
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !bucle) { antes = 0; bucle = requestAnimationFrame(paso); }
  }, { rootMargin: '100px 0px' }).observe(lista);
}

// ---------- Títulos y bloques que aparecen ----------
function prepararAnimaciones() {
  document.querySelectorAll('.titulo-animado').forEach((t) => {
    let i = 0;
    const partir = (nodo) => {
      [...nodo.childNodes].forEach((n) => {
        if (n.nodeType === 1) return partir(n);
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((trozo) => {
          if (!trozo) return;
          if (/^\s+$/.test(trozo)) return frag.append(trozo);
          const p = document.createElement('span'); p.className = 'palabra';
          const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = trozo;
          p.append(s); frag.append(p);
        });
        n.replaceWith(frag);
      });
    };
    partir(t);
  });
  const estrellas = document.querySelector('.testimonio-estrellas');
  if (estrellas) estrellas.innerHTML = [...estrellas.textContent.trim()].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');

  const grupos = ['.hero-place, .hero-lede, .hero-actions, .hero-datos', '.aviso', '.cal-dia', '.cal-lado > *', '.price-card', '.price-perks li', '.trial-band', '.launch-band',
    '.addons-grid > *', '.audit-list li', '.contact-card', '.about-copy > *', '.testimonio-card', '.faq-item', '.final-cta p:not(.final-cinta)', '.final-actions'];
  grupos.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => { el.setAttribute('data-aparece', ''); el.style.setProperty('--i', i % 6); }));

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visto'); observador.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  document.querySelectorAll('[data-aparece], .titulo-animado, .about-foto, .testimonio-estrellas').forEach((el) => {
    if (el.closest('.hero')) return;
    observador.observe(el);
  });
  // El inicio entra solo, al cargar
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('.hero [data-aparece], .hero .titulo-animado').forEach((el) => el.classList.add('is-visto')), 150));
}

// ---------- Scroll suave ----------
function scrollSuave() {
  if (!window.Lenis || matchMedia('(pointer: coarse)').matches) return;
  lenis = new window.Lenis({ lerp: .09, wheelMultiplier: 1 });
  const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const destino = document.querySelector(a.getAttribute('href'));
    if (!destino) return;
    e.preventDefault();
    lenis.scrollTo(destino, { offset: -altoCabecera() + 1, duration: 1.4 });
    history.replaceState(null, '', a.getAttribute('href'));
  });
}

// ---------- Botones magnéticos y brillo del cierre ----------
function magneticos() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.hero-actions .button, .final-actions .button, .price-card .button, .trial-band .button').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${((e.clientX - r.left) / r.width - .5) * 10}px ${((e.clientY - r.top) / r.height - .5) * 8}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
  const cierre = document.querySelector('.final-cta');
  cierre?.addEventListener('pointermove', (e) => {
    const r = cierre.getBoundingClientRect();
    cierre.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
    cierre.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
}

// ---------- Qué hacemos por ti: una luz de fondo que sigue al cursor (con retardo suave) ----------
function luzViaje() {
  const viaje = document.querySelector('.viaje');
  const fijo = viaje?.querySelector('.viaje-fijo');
  if (!fijo || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0, y = 0, ox = 0, oy = 0, girando = false;
  const paso = () => {
    x += (ox - x) * .08; y += (oy - y) * .08;
    fijo.style.setProperty('--luz-x', `${x.toFixed(1)}px`);
    fijo.style.setProperty('--luz-y', `${y.toFixed(1)}px`);
    girando = Math.abs(ox - x) + Math.abs(oy - y) > .5;
    if (girando) requestAnimationFrame(paso);
  };
  viaje.addEventListener('pointermove', (e) => {
    const r = fijo.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    if (!fijo.classList.contains('luz-activa')) { x = ox; y = oy; fijo.classList.add('luz-activa'); }
    if (!girando) { girando = true; requestAnimationFrame(paso); }
  }, { passive: true });
  viaje.addEventListener('pointerleave', () => fijo.classList.remove('luz-activa'));
}

// ---------- Estrella dorada 3D que recorre las secciones claras (js/estrella3d.js) ----------
async function estrellaCalendario() {
  const calendario = document.getElementById('calendario');
  const problema = document.getElementById('problema');
  const cierre = document.getElementById('llamada-final');
  const huecos = [...document.querySelectorAll('.cal-estrella')];
  const destino = document.querySelector('.cal-estrella--hueco');
  if (!calendario || !problema || !cierre || !destino || !hayWebGL() || navigator.connection?.saveData) return;
  // Secciones claras visibles: cada una lleva detrás de su contenido un lienzo donde se ve la estrella
  const claras = [...document.querySelectorAll('main > section:not(.oscuro):not([hidden])')];
  const cielos = claras.map((sec) => {
    const cielo = document.createElement('div');
    cielo.className = 'cielo-estrella'; cielo.setAttribute('aria-hidden', 'true');
    cielo.append(document.createElement('canvas'));
    sec.prepend(cielo);
    return cielo;
  });
  try {
    const m = await import('./estrella3d.js');
    m.iniciar({ calendario, problema, cierre, claras, huecos, destino });
    raiz.classList.add('con-estrella');
  } catch (error) {
    console.warn('Zihkon: la estrella 3D no ha podido arrancar', error);
    cielos.forEach((c) => c.remove());
  }
}

// ---------- El mensaje de la auditoría se escribe solo ----------
function escribirChat() {
  const burbuja = document.querySelector('.contact-ejemplo');
  if (!burbuja) return;
  const copia = burbuja.cloneNode(true);
  copia.querySelectorAll('.sr-only').forEach((n) => n.remove());
  const textoCompleto = copia.textContent.trim();
  burbuja.style.minHeight = burbuja.offsetHeight + 'px';
  const etiqueta = burbuja.querySelector('.sr-only')?.outerHTML || '';
  burbuja.innerHTML = `${etiqueta}<span class="sr-only">${textoCompleto.replace(/</g, '&lt;')}</span><span class="contact-ejemplo-visible" aria-hidden="true"></span>`;
  const visible = burbuja.querySelector('.contact-ejemplo-visible');
  const tarjeta = burbuja.closest('.contact-card');
  new IntersectionObserver((e, obs) => {
    if (!e[0].isIntersecting) return;
    obs.disconnect();
    let n = 0; tarjeta.classList.add('escribiendo');
    const paso = () => {
      visible.textContent = textoCompleto.slice(0, ++n);
      if (n < textoCompleto.length) setTimeout(paso, textoCompleto[n - 1] === '\n' ? 260 : 32);
      else setTimeout(() => tarjeta.classList.remove('escribiendo'), 900);
    };
    setTimeout(paso, 500);
  }, { threshold: .5 }).observe(burbuja);
}

// ---------- Escena 3D y recorrido de servicios ----------
function hayWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
async function iniciar3D() {
  if (!hayWebGL() || navigator.connection?.saveData) return;
  const hero = document.getElementById('inicio');
  const viaje = document.getElementById('servicios');
  if (!hero || !viaje) return;
  const movil = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  const estado = { T: 0, visible: true, ratonX: 0, ratonY: 0 };
  const lienzo = document.createElement('canvas');
  lienzo.className = 'escena3d'; lienzo.setAttribute('aria-hidden', 'true');
  const fondo = document.createElement('div'); fondo.className = 'fondo-noche'; fondo.setAttribute('aria-hidden', 'true');
  let escena;
  try {
    const m = await import('./experiencia3d.js');
    await document.fonts?.ready;
    cuerpo.prepend(fondo, lienzo);
    escena = m.iniciar({ lienzo, estado, movil });
  } catch (error) {
    console.warn('Zihkon: la escena 3D no ha podido arrancar', error);
    lienzo.remove(); fondo.remove();
    return;
  }
  raiz.classList.add('con-3d');

  const capitulos = [...viaje.querySelectorAll('.capitulo')];
  const barra = viaje.querySelector('.viaje-barra span');
  const num = viaje.querySelector('.viaje-num');
  let activo = -1;
  function medir() {
    const vh = innerHeight;
    const rh = hero.getBoundingClientRect();
    const rv = viaje.getBoundingClientRect();
    const p = clamp(-rv.top / (rv.height - vh));
    estado.T = rv.top < 0 ? 1 + 4 * p : clamp(-rh.top / rh.height);
    estado.visible = rh.bottom > 0 || (rv.top < vh && rv.bottom > 0);
    lienzo.classList.toggle('is-visible', estado.visible);
    // Cada texto cambia a mitad del movimiento de cámara hacia su escena (ver CLAVES en js/experiencia3d.js)
    const idx = [2.2, 3.05, 4.3].filter((limite) => estado.T >= limite).length;
    if (idx !== activo) {
      activo = idx;
      capitulos.forEach((c, i) => { c.classList.toggle('is-activo', i === idx); c.classList.toggle('is-pasado', i < idx); });
      if (num) num.textContent = String(idx + 1).padStart(2, '0');
    }
    barra?.style.setProperty('--avance', p.toFixed(3));
    requestAnimationFrame(medir);
  }
  requestAnimationFrame(medir);

  // Con teclado: al llegar a un enlace de un capítulo, el scroll lleva a ese capítulo
  capitulos.forEach((c, i) => c.addEventListener('focusin', () => {
    if (i === activo) return;
    const y = scrollY + viaje.getBoundingClientRect().top + (viaje.offsetHeight - innerHeight) * (([1.6, 2.7, 3.6, 4.6][i] - 1) / 4);
    if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y);
  }));

  addEventListener('pointermove', (e) => { estado.ratonX = e.clientX / innerWidth - .5; estado.ratonY = e.clientY / innerHeight - .5; }, { passive: true });
  addEventListener('pagehide', () => escena?.detener());
}
