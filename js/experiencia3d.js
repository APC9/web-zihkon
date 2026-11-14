/* =========================================================
   ZIHKON · EXPERIENCIA 3D DE LA PORTADA
   La arranca js/portada.js (solo con movimiento y WebGL).
   Cuenta lo que hacemos con el scroll, en un solo lienzo:
     T 0–1  Inicio: un móvil con el feed de "tu negocio" en marcha.
     T 1–2  Redes: las publicaciones salen del móvil y lo rodean.
     T 2–3  Google: la cámara baja a la ciudad y se enciende tu pin con tu ficha.
     T 3–4  Reseñas: suben las reseñas y cada una recibe su respuesta.
     T 4–5  Cómo trabajamos: WhatsApp "¿La publico así?" → "SÍ" → sale a tus redes.
   Todo lo que se ve es ilustrativo: no hay cifras, nombres de clientes ni reseñas inventadas.
   Los colores salen de las variables de css/styles.css (respeta el tema activo).
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (t) => t * t * (3 - 2 * t);
const salida = (t) => 1 - Math.pow(1 - t, 3);
const rebote = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const tramo = (T, desde, dura) => clamp((T - desde) / dura);

export function iniciar({ lienzo, estado, movil }) {
  const css = getComputedStyle(document.documentElement);
  const v = (n, f) => (css.getPropertyValue(n).trim() || f);
  const C = {
    noche: v('--color-primario-oscuro', '#0f1c45'), azul: v('--color-primario', '#2346c0'), sol: v('--color-acento', '#ffc94a'),
    rosa: v('--color-detalle', '#c21a63'), verde: v('--color-whatsapp', '#138251'), chat: v('--color-chat-fondo', '#efeae2'),
    enviado: v('--color-chat-enviado', '#d9fdd3'), texto: v('--color-texto', '#141b33'), suave: v('--color-texto-suave', '#4e5873'),
  };
  const FUENTE = '"Atkinson Hyperlegible Next", "Segoe UI", system-ui, sans-serif';
  const TITULOS = '"Young Serif", Georgia, serif';
  const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

  // ---------- Render ----------
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !movil, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const escena = new THREE.Scene();
  escena.fog = new THREE.Fog(new THREE.Color(C.noche), 26, 70);
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 200);

  escena.add(new THREE.HemisphereLight(0xbfd0ff, new THREE.Color(C.noche), 1.4));
  const solLuz = new THREE.DirectionalLight(new THREE.Color(C.sol), 2.4);
  solLuz.position.set(6, 10, 8);
  escena.add(solLuz);
  const rosaLuz = new THREE.PointLight(new THREE.Color(C.rosa), 40, 30);
  rosaLuz.position.set(-5, -2, 4);
  escena.add(rosaLuz);

  // ---------- Utilidades de dibujo ----------
  const lienzo2d = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const rr = (x, ctx, l, t, w, h, r) => { x.beginPath(); x.roundRect(l, t, w, h, r); };
  function caja(ctx, l, t, w, h, r, relleno) { ctx.beginPath(); ctx.roundRect(l, t, w, h, r); ctx.fillStyle = relleno; ctx.fill(); }
  function texto(ctx, s, x, y, tam, color, peso = 400, familia = FUENTE, alinear = 'left') { ctx.font = `${peso} ${tam}px ${familia}`; ctx.fillStyle = color; ctx.textAlign = alinear; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
  function lineas(ctx, s, x, y, ancho, tam, color, peso = 400, alto = tam * 1.3) {
    ctx.font = `${peso} ${tam}px ${FUENTE}`; ctx.fillStyle = color; ctx.textAlign = 'left';
    const palabras = s.split(' '); let linea = ''; let n = 0;
    for (const p of palabras) { const prueba = linea ? linea + ' ' + p : p; if (ctx.measureText(prueba).width > ancho && linea) { ctx.fillText(linea, x, y + n * alto); n++; linea = p; } else linea = prueba; }
    if (linea) { ctx.fillText(linea, x, y + n * alto); n++; }
    return n * alto;
  }
  const textura = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  function corazon(ctx, x, y, s, color) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-14, -4, -8, -16, 0, -8); ctx.bezierCurveTo(8, -16, 14, -4, 0, 6); ctx.lineWidth = 2.4 / s * 1.6; ctx.strokeStyle = color; ctx.stroke(); ctx.restore(); }

  // ---------- Publicaciones (diseños de ejemplo) ----------
  const DISENOS = [
    { e: '🍤', t: 'Tapa de la semana', g: [C.sol, C.rosa], red: 'Instagram' },
    { e: '🥘', t: 'Menú del día', g: [C.rosa, C.azul], red: 'Facebook' },
    { e: '☕', t: 'Café y tostada', g: [C.azul, C.sol], red: 'TikTok' },
    { e: '🍷', t: 'Nuevo en la carta', g: [C.noche, C.rosa], red: 'Instagram' },
    { e: '🍰', t: 'Postre casero', g: [C.sol, C.azul], red: 'Instagram' },
    { e: '🥗', t: 'Terraza abierta', g: [C.verde, C.sol], red: 'Facebook' },
    { e: '🍹', t: 'Tarde de terraza', g: [C.rosa, C.sol], red: 'TikTok' },
    { e: '🥐', t: 'Desayunos', g: [C.sol, C.verde], red: 'Instagram' },
    { e: '🍕', t: 'Para compartir', g: [C.azul, C.rosa], red: 'Facebook' },
    { e: '🍣', t: 'Plato del chef', g: [C.noche, C.sol], red: 'Instagram' },
    { e: '🧁', t: 'Hecho hoy', g: [C.rosa, C.verde], red: 'TikTok' },
    { e: '🍳', t: 'Brunch del domingo', g: [C.sol, C.noche], red: 'Instagram' },
  ];
  const PW = 400, PH = 520;
  const lienzosPost = DISENOS.map((d) => {
    const [c, x] = lienzo2d(PW, PH);
    caja(x, 0, 0, PW, PH, 30, '#ffffff');
    const ga = x.createLinearGradient(22, 22, 58, 58); ga.addColorStop(0, C.sol); ga.addColorStop(1, C.rosa);
    x.beginPath(); x.arc(40, 42, 19, 0, Math.PI * 2); x.fillStyle = ga; x.fill();
    texto(x, 'tu_negocio', 70, 49, 21, C.texto, 700);
    texto(x, d.red, PW - 24, 49, 17, C.suave, 700, FUENTE, 'right');
    const g = x.createLinearGradient(16, 80, 384, 400); g.addColorStop(0, d.g[0]); g.addColorStop(1, d.g[1]);
    caja(x, 16, 78, PW - 32, 318, 20, g);
    x.globalAlpha = .18; x.beginPath(); x.arc(300, 150, 110, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.globalAlpha = 1;
    x.font = `150px ${EMOJI}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.e, PW / 2, 228);
    x.font = `700 21px ${FUENTE}`; const ancho = x.measureText(d.t).width + 34;
    caja(x, 34, 336, ancho, 42, 21, '#ffffffee'); texto(x, d.t, 51, 364, 21, C.noche, 700);
    corazon(x, 38, 432, 1.6, C.texto);
    x.beginPath(); x.arc(86, 428, 13, 0, Math.PI * 2); x.lineWidth = 3.5; x.strokeStyle = C.texto; x.stroke();
    x.beginPath(); x.moveTo(118, 418); x.lineTo(146, 428); x.lineTo(118, 440); x.closePath(); x.stroke();
    caja(x, 24, 466, 250, 12, 6, '#e6e9f0'); caja(x, 24, 490, 160, 12, 6, '#e6e9f0');
    return c;
  });

  // ---------- Móvil ----------
  const movilG = new THREE.Group();
  escena.add(movilG);
  const MW = 2.2, MH = 4.6, MD = 0.26;
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(MW, MH, MD, 6, 0.32),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(C.noche).multiplyScalar(.7), metalness: .75, roughness: .28 }));
  movilG.add(cuerpo);
  const marco = new THREE.Mesh(new RoundedBoxGeometry(MW + .05, MH + .05, MD - .06, 6, 0.33),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(C.sol).lerp(new THREE.Color('#ffffff'), .3), metalness: 1, roughness: .25 }));
  movilG.add(marco);
  const [pantallaC, px] = lienzo2d(520, 1100);
  const pantallaT = textura(pantallaC);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(MW - .16, MH - .16), new THREE.MeshBasicMaterial({ map: pantallaT, toneMapped: false }));
  pantalla.position.z = MD / 2 + .002;
  movilG.add(pantalla);
  // Brillo de la pantalla sobre lo que tiene delante
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(MW * 2.6, MH * 1.6), new THREE.MeshBasicMaterial({ map: texturaHalo(C.azul), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55 }));
  halo.position.z = -.3; movilG.add(halo);

  function texturaHalo(color) {
    const [c, x] = lienzo2d(256, 256);
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(1, 'transparent');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); return textura(c);
  }

  function barraEstado(x, color) { texto(x, '9:41', 44, 50, 24, color, 700); caja(x, 200, 22, 120, 36, 18, '#000'); caja(x, 432, 34, 40, 18, 5, color); }

  function dibujarFeed(t) {
    const x = px; const W = 520;
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, 1100);
    // Feed que se desplaza solo
    const alto = 670; const total = alto * DISENOS.length; const despl = (t * 60) % total;
    x.save(); x.beginPath(); x.rect(0, 290, W, 740); x.clip();
    for (let k = 0; k < DISENOS.length + 2; k++) {
      const y = 296 + k * alto - despl;
      if (y > 1040 || y < -alto + 290) continue;
      x.drawImage(lienzosPost[k % DISENOS.length], 10, y, 500, 650);
    }
    x.restore();
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, 290);
    barraEstado(x, C.texto);
    texto(x, 'tu_negocio', 36, 130, 34, C.texto, 700);
    corazon(x, 440, 118, 1.7, C.texto);
    for (let k = 0; k < 5; k++) {
      const cx = 74 + k * 94, cy = 210;
      const g = x.createLinearGradient(cx - 40, cy - 40, cx + 40, cy + 40); g.addColorStop(0, C.sol); g.addColorStop(1, C.rosa);
      x.beginPath(); x.arc(cx, cy, 40, 0, Math.PI * 2); x.fillStyle = g; x.fill();
      x.beginPath(); x.arc(cx, cy, 35, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
      x.beginPath(); x.arc(cx, cy, 31, 0, Math.PI * 2); x.fillStyle = DISENOS[k].g[0]; x.fill();
      x.font = `30px ${EMOJI}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(DISENOS[k].e, cx, cy + 2);
    }
    x.fillStyle = '#ffffff'; x.fillRect(0, 1030, W, 70);
    x.fillStyle = '#e6e9f0'; x.fillRect(0, 1030, W, 2);
    for (let k = 0; k < 5; k++) caja(x, 52 + k * 96, 1052, 26, 26, 8, k === 0 ? C.texto : '#c3cadb');
  }

  const MENSAJES = [
    { de: 'z', img: 0, s: 'Te preparo la publicación de esta semana:', en: 0.06 },
    { de: 'z', s: '¿La publico así?', en: 0.24 },
    { de: 'tu', s: 'SÍ', grande: true, en: 0.42 },
    { de: 'z', s: '¡Publicada en Instagram, Facebook y TikTok!', en: 0.6 },
  ];
  function dibujarChat(p) {
    const x = px; const W = 520;
    x.fillStyle = C.chat; x.fillRect(0, 0, W, 1100);
    x.globalAlpha = .06; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc((i * 137) % W, 160 + ((i * 263) % 880), 6 + (i % 3) * 3, 0, Math.PI * 2); x.fillStyle = C.texto; x.fill(); } x.globalAlpha = 1;
    x.fillStyle = C.verde; x.fillRect(0, 0, W, 160);
    barraEstado(x, '#ffffff');
    x.beginPath(); x.arc(70, 116, 30, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
    texto(x, 'Z', 70, 128, 32, C.verde, 400, TITULOS, 'center');
    texto(x, 'Zihkon', 116, 112, 28, '#fff', 700);
    texto(x, 'en línea', 116, 140, 19, '#ffffffcc');
    let y = 190;
    for (const m of MENSAJES) {
      const a = clamp((p - m.en) / 0.1); if (a <= 0) break;
      const e = rebote(a);
      const ancho = m.img !== undefined ? 330 : m.grande ? 120 : 340;
      x.font = `${m.grande ? 700 : 400} ${m.grande ? 34 : 23}px ${FUENTE}`;
      const izq = m.de === 'z' ? 24 : W - 24 - ancho;
      x.save(); x.globalAlpha = a; x.translate(izq + (m.de === 'z' ? 0 : ancho), y); x.scale(.85 + .15 * e, .85 + .15 * e); x.translate(-(izq + (m.de === 'z' ? 0 : ancho)), -y);
      // Medir alto
      const medida = x;
      let h = 0; const lin = []; { let l = ''; for (const w of m.s.split(' ')) { const pr = l ? l + ' ' + w : w; if (medida.measureText(pr).width > ancho - 36 && l) { lin.push(l); l = w; } else l = pr; } lin.push(l); }
      const alto = (m.img !== undefined ? 400 : 0) + lin.length * (m.grande ? 42 : 30) + 34;
      caja(x, izq, y, ancho, alto, 20, m.de === 'z' ? '#ffffff' : C.enviado);
      let yy = y + 18;
      if (m.img !== undefined) { x.save(); rr(x, 0, izq + 12, yy - 6, ancho - 24, 384, 14); x.clip(); x.drawImage(lienzosPost[m.img], izq + 12, yy - 6, ancho - 24, (ancho - 24) * PH / PW); x.restore(); yy += 394; }
      lin.forEach((l, i) => texto(x, l, izq + 18, yy + 22 + i * (m.grande ? 42 : 30), m.grande ? 34 : 23, m.de === 'z' ? C.texto : '#0b3a1e', m.grande ? 700 : 400));
      if (m.de === 'tu') texto(x, '✓✓', izq + ancho - 18, y + alto - 12, 18, '#34b7f1', 700, FUENTE, 'right');
      x.restore();
      y += alto * e + 16;
    }
    caja(x, 18, 1012, 410, 66, 33, '#ffffff');
    texto(x, 'Mensaje', 50, 1054, 22, '#8a93a8');
    x.beginPath(); x.arc(472, 1045, 33, 0, Math.PI * 2); x.fillStyle = C.verde; x.fill();
  }

  // ---------- Publicaciones flotando ----------
  const posts = lienzosPost.map((c, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.95), new THREE.MeshBasicMaterial({ map: textura(c), transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    m.userData.a = (i / lienzosPost.length) * Math.PI * 2;
    m.userData.y = Math.sin(i * 2.3) * 1.6;
    escena.add(m);
    return m;
  });
  const HERO_POS = [new THREE.Vector3(-1.75, 1.75, -1.6), new THREE.Vector3(2.35, .3, -1.4), new THREE.Vector3(-1.55, -1.15, .5)];

  // ---------- Ciudad (Perfil de Empresa en Google) ----------
  const CY = -40;
  const ciudad = new THREE.Group(); ciudad.position.y = CY; escena.add(ciudad);
  {
    const [c, x] = lienzo2d(1024, 1024);
    x.fillStyle = new THREE.Color(C.noche).multiplyScalar(.75).getStyle(); x.fillRect(0, 0, 1024, 1024);
    x.strokeStyle = new THREE.Color(C.azul).multiplyScalar(.35).getStyle(); x.lineWidth = 8;
    for (let k = 0; k <= 16; k++) { const p = k * 64; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 1024); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(1024, p); x.stroke(); }
    x.strokeStyle = new THREE.Color(C.sol).multiplyScalar(.3).getStyle(); x.lineWidth = 12;
    x.beginPath(); x.moveTo(0, 520); x.bezierCurveTo(300, 420, 700, 640, 1024, 470); x.stroke();
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshStandardMaterial({ map: textura(c), roughness: .9 }));
    suelo.rotation.x = -Math.PI / 2; ciudad.add(suelo);
  }
  const PIN_TU = new THREE.Vector3(1.5, 0, 0);
  const PINES = [[-6, -3], [-3.5, 4], [5.5, 5], [7, -4.5], [-8, 2.5], [3, -7], [-2, -8], [9.5, 1], [-5, 8]].map(([a, b]) => new THREE.Vector3(a, 0, b));
  {
    const n = movil ? 160 : 300;
    const edif = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), new THREE.MeshStandardMaterial({ roughness: .55, metalness: .15, emissive: new THREE.Color(C.azul), emissiveIntensity: .08 }), n);
    const m = new THREE.Matrix4(); const col = new THREE.Color(); let k = 0; let semilla = 7;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    const libres = [PIN_TU, ...PINES];
    for (let i = 0; i < 4000 && k < n; i++) {
      const gx = Math.round((azar() - .5) * 30) * 2, gz = Math.round((azar() - .5) * 30) * 2;
      const x = gx * 1 + (azar() - .5) * .4, z = gz * 1 + (azar() - .5) * .4;
      if (libres.some((p) => Math.hypot(p.x - x, p.z - z) < 1.6)) continue;
      const h = .4 + Math.pow(azar(), 2) * 3.6 * (1 - Math.min(1, Math.hypot(x, z) / 34));
      m.makeScale(.9 + azar() * .4, h, .9 + azar() * .4); m.setPosition(x, 0, z);
      edif.setMatrixAt(k, m);
      edif.setColorAt(k, col.set(C.noche).lerp(new THREE.Color(C.azul), .25 + azar() * .5));
      k++;
    }
    edif.count = k; ciudad.add(edif);
  }
  function crearPin(color, escala) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), emissive: new THREE.Color(color), emissiveIntensity: .35, roughness: .35 });
    const bola = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16), mat); bola.position.y = 1.35;
    const punta = new THREE.Mesh(new THREE.ConeGeometry(.36, .95, 24), mat); punta.rotation.x = Math.PI; punta.position.y = .72;
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); ojo.position.set(0, 1.38, .32);
    g.add(bola, punta, ojo); g.scale.setScalar(escala); ciudad.add(g); return g;
  }
  const pines = PINES.map((p) => { const g = crearPin(C.azul, 1); g.position.copy(p); return g; });
  const pinTu = crearPin(C.rosa, 2); pinTu.position.copy(PIN_TU);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.sol), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  anillo.rotation.x = -Math.PI / 2; anillo.position.copy(PIN_TU).setY(.05); ciudad.add(anillo);
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.4, 16, 32, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.sol), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  haz.position.copy(PIN_TU).setY(8); ciudad.add(haz);

  function sprite(c, ancho) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura(c), transparent: true, toneMapped: false, depthWrite: false, depthTest: false, fog: false })); s.renderOrder = 10; s.userData.ancho = ancho; s.userData.alto = ancho * c.height / c.width; s.scale.set(0, 0, 1); escena.add(s); return s; }
  const ficha = (() => {
    const [c, x] = lienzo2d(620, 400);
    caja(x, 0, 0, 620, 400, 30, '#ffffff');
    const g = x.createLinearGradient(0, 0, 620, 120); g.addColorStop(0, C.sol); g.addColorStop(1, C.rosa);
    x.save(); rr(x, 0, 0, 0, 620, 130, [30, 30, 0, 0]); x.clip(); x.fillStyle = g; x.fillRect(0, 0, 620, 130); x.restore();
    x.font = `70px ${EMOJI}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🍽️', 310, 66);
    texto(x, 'Tu negocio', 36, 196, 42, C.texto, 400, TITULOS);
    texto(x, '★★★★★', 36, 240, 30, C.sol, 700);
    texto(x, 'Restaurante · ', 36, 284, 23, C.suave);
    x.font = `400 23px ${FUENTE}`; const w = x.measureText('Restaurante · ').width;
    texto(x, 'Abierto ahora', 36 + w, 284, 23, C.verde, 700);
    ['Llamar', 'Cómo llegar', 'Web'].forEach((b, i, arr) => { const wb = 170; const l = 36 + i * (wb + 14); x.beginPath(); x.roundRect(l, 318, wb, 52, 26); x.lineWidth = 2.5; x.strokeStyle = C.azul; x.stroke(); texto(x, b, l + wb / 2, 352, 21, C.azul, 700, FUENTE, 'center'); });
    return sprite(c, 4.4);
  })();
  const resenas = [0, 1, 2, 3].map((i) => {
    const [c, x] = lienzo2d(460, 170);
    caja(x, 0, 0, 460, 170, 26, '#ffffff');
    x.beginPath(); x.arc(52, 56, 28, 0, Math.PI * 2); x.fillStyle = ['#e3e9fa', '#fde7f0', '#fff3d6', '#e3f4e9'][i]; x.fill();
    texto(x, '★★★★★', 96, 66, 30, C.sol, 700);
    caja(x, 30, 104, 400, 14, 7, '#e6e9f0'); caja(x, 30, 132, 260 - i * 30, 14, 7, '#e6e9f0');
    return sprite(c, 3.1);
  });
  const RESPUESTAS = ['¡Gracias por venir! Te esperamos pronto.', 'Nos alegra que te gustara. ¡Hasta la próxima!', 'Gracias por tu reseña, se lo diremos al equipo.', '¡Mil gracias! Vuelve cuando quieras.'];
  const respuestas = RESPUESTAS.map((r) => {
    const [c, x] = lienzo2d(440, 140);
    caja(x, 0, 0, 440, 140, 24, C.enviado);
    texto(x, 'Respuesta del propietario', 24, 40, 19, C.verde, 700);
    lineas(x, r, 24, 76, 392, 22, '#0b3a1e');
    return sprite(c, 2.6);
  });
  const RES_POS = [[-1.9, 5.6, 1.2], [1.2, 6.9, .6], [-1.7, 8.6, -.2], [1.4, 9.9, 0]].map((p) => new THREE.Vector3(...p).add(PIN_TU).setY(CY + p[1]));

  // Envío final: la publicación sale a cada red
  const REDES = ['Instagram', 'Facebook', 'TikTok'];
  const envios = REDES.map((r, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.62), new THREE.MeshBasicMaterial({ map: posts[0].material.map, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    escena.add(m);
    const [c, x] = lienzo2d(300, 84);
    caja(x, 0, 0, 300, 84, 42, C.noche);
    x.beginPath(); x.arc(42, 42, 12, 0, Math.PI * 2); x.fillStyle = C.sol; x.fill();
    texto(x, r, 168, 54, 30, '#ffffff', 700, FUENTE, 'center');
    return { m, etiqueta: sprite(c, 1.15) };
  });
  const ENVIO_POS = [new THREE.Vector3(-2.35, 1.4, -1.4), new THREE.Vector3(.2, 3.5, -1.8), new THREE.Vector3(2.6, 1.2, -1.2)];

  // ---------- Luces flotantes (bokeh) ----------
  const nLuces = movil ? 220 : 420;
  const posL = new Float32Array(nLuces * 3); const colL = new Float32Array(nLuces * 3);
  const paleta = [C.sol, C.rosa, C.azul, '#ffffff'].map((c) => new THREE.Color(c));
  for (let i = 0; i < nLuces; i++) {
    posL.set([(Math.random() - .5) * 44, -50 + Math.random() * 60, -18 + Math.random() * 22], i * 3);
    const c = paleta[i % 4]; colL.set([c.r, c.g, c.b], i * 3);
  }
  const geoL = new THREE.BufferGeometry();
  geoL.setAttribute('position', new THREE.BufferAttribute(posL, 3)); geoL.setAttribute('color', new THREE.BufferAttribute(colL, 3));
  const puntoT = (() => { const [c, x] = lienzo2d(64, 64); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(.35, '#ffffff88'); g.addColorStop(1, 'transparent'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return textura(c); })();
  const luces = new THREE.Points(geoL, new THREE.PointsMaterial({ size: .35, map: puntoT, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
  escena.add(luces);

  // ---------- Recorrido de la cámara (una curva suave entre puntos clave) ----------
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  const CLAVES = [
    [0.0, V(0, .2, 9.6), V(0, 0, 0)],
    [1.0, V(.4, .5, 8.8), V(0, 0, 0)],
    [1.35, V(2.2, 1.2, 11), V(0, .2, 0)],
    [1.85, V(-1.8, .6, 10.4), V(0, .3, 0)],
    [2.2, V(0, -14, 15), V(0, -34, 0)],
    [2.5, V(12, -27, 19), V(.5, -40, 0)],
    [2.95, V(8, -31, 14), V(1.5, -38.5, 0)],
    [3.3, V(6, -30, 13), V(1.8, -32.5, 0)],
    [3.9, V(-2.5, -28, 13), V(1.8, -31.2, 0)],
    [4.25, V(4, -10, 13), V(0, -6, 0)],
    [4.55, V(0, .3, 9.4), V(0, 0, 0)],
    [5.0, V(0, 1, 11.4), V(0, .8, 0)],
  ];
  const curvaPos = new THREE.CatmullRomCurve3(CLAVES.map((k) => k[1]), false, 'centripetal');
  const curvaMira = new THREE.CatmullRomCurve3(CLAVES.map((k) => k[2]), false, 'centripetal');
  const camPos = new THREE.Vector3(); const camMira = new THREE.Vector3();
  function puntoCamara(T) {
    let i = 0; while (i < CLAVES.length - 2 && T > CLAVES[i + 1][0]) i++;
    const f = suave(clamp((T - CLAVES[i][0]) / (CLAVES[i + 1][0] - CLAVES[i][0])));
    const u = (i + f) / (CLAVES.length - 1);
    curvaPos.getPoint(u, camPos); curvaMira.getPoint(u, camMira);
  }

  // ---------- Tamaño ----------
  let ancho = 1, alto = 1, alejar = 1, desvio = { x: 0, y: 0 };
  function medir() {
    ancho = window.innerWidth; alto = window.innerHeight;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    const aspecto = ancho / alto;
    alejar = aspecto < .8 ? 1.95 : aspecto < 1.25 ? 1.3 : 1;
    // El texto va a la izquierda (ordenador) o abajo (móvil): la escena se desplaza al otro lado
    desvio = ancho > 1024 && aspecto > 1.2 ? { x: -ancho * .23, y: 0 } : { x: 0, y: alto * .19 };
    camara.setViewOffset(ancho, alto, desvio.x, desvio.y, ancho, alto);
    camara.updateProjectionMatrix();
  }
  medir();
  window.addEventListener('resize', medir);

  // ---------- Bucle ----------
  const reloj = new THREE.Clock();
  const tmp = new THREE.Vector3(); const raton = new THREE.Vector2();
  let Tsuave = 0, modoPrevio = '', inicio = performance.now();
  renderer.setAnimationLoop(() => {
    const t = reloj.getElapsedTime();
    if (!estado.visible) return;
    Tsuave += (estado.T - Tsuave) * (movil ? .14 : .085);
    const T = Tsuave;
    const intro = salida(clamp((performance.now() - inicio) / 1800));
    raton.x += (estado.ratonX - raton.x) * .05; raton.y += (estado.ratonY - raton.y) * .05;

    // Cámara
    puntoCamara(T);
    tmp.copy(camPos).sub(camMira).multiplyScalar(alejar * (1 + (1 - intro) * .35));
    camara.position.copy(camMira).add(tmp);
    camara.position.x += raton.x * .6; camara.position.y += -raton.y * .4;
    camara.lookAt(camMira);

    // Móvil: entra al cargar, flota y gira con el recorrido
    const giroRedes = tramo(T, 1, .6), giroChat = tramo(T, 4.2, .4);
    movilG.position.set(0, Math.sin(t * 1.2) * .08, (1 - intro) * -6);
    movilG.rotation.set(Math.sin(t * .8) * .03 + raton.y * .08, (-.42 + (1 - intro) * -1.6) * (1 - giroRedes) + Math.sin(t * .5) * .12 * giroRedes * (1 - giroChat) + raton.x * .15, .04 * (1 - giroRedes));
    movilG.visible = T < 2.35 || T > 3.95;

    // Pantalla del móvil: feed en las primeras escenas, WhatsApp en la última
    if (movilG.visible) {
      const modo = T > 4 ? 'chat' : 'feed';
      if (modo === 'chat') dibujarChat(clamp((T - 4.25) / .65)); else dibujarFeed(t);
      pantallaT.needsUpdate = true; modoPrevio = modo;
    }

    // Publicaciones
    const nP = posts.length;
    posts.forEach((m, i) => {
      const sale = salida(tramo(T, 1 + i * .025, .42));
      const fuera = tramo(T, 1.82 + i * .012, .32);
      const a = m.userData.a + t * .12;
      const R = 2.9 + (i % 3) * .45;
      const anillo = tmp.set(.5 + Math.cos(a) * R * .85, m.userData.y, Math.sin(a) * R * 1.1 - .6);
      let escala;
      if (i < 3) {
        const desde = HERO_POS[i].clone(); desde.y += Math.sin(t * .9 + i * 2) * .12;
        m.position.lerpVectors(desde, anillo, sale);
        escala = (.95 * intro) * (1 - sale) + sale;
      } else {
        m.position.lerpVectors(V(0, 0, .3), anillo, sale);
        escala = sale;
      }
      m.position.y += fuera * fuera * 12;
      escala *= 1 - fuera;
      m.scale.setScalar(Math.max(.0001, escala));
      m.visible = escala > .002;
      m.quaternion.copy(camara.quaternion);
      m.rotateZ(Math.sin(t * .7 + i) * .05);
    });

    // Ciudad: los pines caen, se enciende el tuyo y aparece tu ficha
    const enCiudad = T > 1.9 && T < 4.4;
    ciudad.visible = enCiudad;
    if (enCiudad) {
      pines.forEach((p, k) => { const e = tramo(T, 2.3 + k * .03, .22); p.position.y = (1 - rebote(e)) * 6; p.scale.setScalar(Math.max(.0001, e)); });
      const eTu = tramo(T, 2.62, .25);
      pinTu.position.y = (1 - rebote(eTu)) * 8 + Math.sin(t * 2) * .08 * eTu; pinTu.scale.setScalar(Math.max(.0001, eTu * 2));
      const pulso = (t * .6) % 1;
      anillo.scale.setScalar(.6 + pulso * 3.2 * eTu); anillo.material.opacity = (1 - pulso) * .8 * eTu;
      haz.material.opacity = eTu * .07 * (1 - tramo(T, 3.1, .3) * .6);
      pines.forEach((p) => { p.children[0].material.emissiveIntensity = .35 * (1 - eTu * .7); });
    }
    const eFicha = tramo(T, 2.75, .2) * (1 - tramo(T, 3.08, .18));
    ficha.position.copy(PIN_TU).setY(CY + 6.2 + (1 - eFicha) * -1); ficha.position.x += .3; ficha.position.z += 1.5;
    ficha.scale.set(ficha.userData.ancho * salida(eFicha), ficha.userData.alto * salida(eFicha), 1);
    ficha.material.opacity = eFicha;

    // Reseñas que suben y respuestas que llegan
    resenas.forEach((s, k) => {
      const e = tramo(T, 3.05 + k * .13, .3) * (1 - tramo(T, 4.05, .2));
      const r = tramo(T, 3.22 + k * .13, .2) * (1 - tramo(T, 4.05, .2));
      const destino = RES_POS[k];
      s.position.set(PIN_TU.x + (destino.x - PIN_TU.x) * salida(e), CY + 2.4 + (destino.y - CY - 2.4) * salida(e), destino.z);
      s.position.y += Math.sin(t + k) * .06;
      s.scale.set(s.userData.ancho * e, s.userData.alto * e, 1); s.material.opacity = e;
      const rs = respuestas[k];
      rs.position.copy(s.position).add(tmp.set(k % 2 ? -.5 : .6, -.95, .3)); rs.renderOrder = 11;
      const er = rebote(r);
      rs.scale.set(rs.userData.ancho * er, rs.userData.alto * er, 1); rs.material.opacity = r;
    });

    // Envío a las redes
    envios.forEach(({ m, etiqueta }, k) => {
      const e = salida(tramo(T, 4.72 + k * .05, .2));
      m.position.lerpVectors(V(0, 0, .3), ENVIO_POS[k], e);
      m.position.y += Math.sin(t * 1.1 + k) * .06 * e;
      m.scale.setScalar(Math.max(.0001, e)); m.visible = e > .002;
      m.quaternion.copy(camara.quaternion);
      etiqueta.position.copy(m.position).add(tmp.set(0, -1.15, .1));
      etiqueta.scale.set(etiqueta.userData.ancho * e, etiqueta.userData.alto * e, 1);
    });

    // Luces: suben despacio
    luces.rotation.y = t * .01;
    luces.position.y = Math.sin(t * .2) * .4;
    halo.material.opacity = .45 + Math.sin(t * 1.5) * .1;

    renderer.render(escena, camara);
  });

  return {
    detener() { renderer.setAnimationLoop(null); renderer.dispose(); window.removeEventListener('resize', medir); },
  };
}
