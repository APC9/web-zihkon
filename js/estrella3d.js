/* =========================================================
   ZIHKON · Estrella dorada 3D del calendario (#calendario)
   Una estrella dorada con un leve resplandor recorre con el scroll las
   secciones claras, detrás de su contenido (y oculta tras las oscuras):
   1. ¿Te suena?: grande, cae despacio detrás del título.
   2. Calendario: baja girando de derecha a izquierda y se hace pequeña
      hasta el hueco central de las 4 estrellas de #automatizaciones.
   3. Secciones claras siguientes: sale de la fila, crece y sigue su
      recorrido hasta perderse tras el cierre oscuro.
   Lo arranca js/portada.js (estrellaCalendario) siempre que haya WebGL,
   también con "reducir movimiento"; sin WebGL se ven las 5 estrellas SVG quietas.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mezcla = (a, b, t) => a + (b - a) * t;
const suave = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function geometriaEstrella() {
  const forma = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? .46 : 1;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i) forma.lineTo(x, y); else forma.moveTo(x, y);
  }
  forma.closePath();
  const g = new THREE.ExtrudeGeometry(forma, { depth: .22, bevelEnabled: true, bevelThickness: .14, bevelSize: .09, bevelSegments: 5, curveSegments: 1 });
  g.center();
  g.computeVertexNormals();
  return g;
}

function texturaResplandor() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 214, 110, .9)');
  g.addColorStop(.35, 'rgba(255, 196, 64, .35)');
  g.addColorStop(1, 'rgba(255, 196, 64, 0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function iniciar({ calendario, problema, cierre, claras, huecos, destino }) {
  // Un solo WebGL fuera de la página dibuja la pantalla entera; cada sección clara copia esa imagen
  // en su propio lienzo 2D, detrás de su contenido. Las secciones oscuras no la copian: ahí la estrella queda "detrás".
  const gl = document.createElement('canvas');
  const render = new THREE.WebGLRenderer({ canvas: gl, alpha: true, antialias: true, powerPreference: 'low-power' });
  const dpr = Math.min(devicePixelRatio, 2);
  render.setPixelRatio(dpr);
  render.outputColorSpace = THREE.SRGBColorSpace;
  render.toneMapping = THREE.ACESFilmicToneMapping;
  render.toneMappingExposure = 1.15;

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(render);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();
  const luz = new THREE.DirectionalLight(0xfff1c9, 2.2); luz.position.set(-300, 500, 800); escena.add(luz);
  escena.add(new THREE.AmbientLight(0xffffff, .35));

  // Cámara ortográfica en píxeles: (0,0) en el centro de la pantalla
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, -3000, 3000);
  camara.position.z = 1000;

  const geo = geometriaEstrella();
  const oro = new THREE.MeshStandardMaterial({ color: 0xf2b42a, metalness: 1, roughness: .26, emissive: 0x3a2400, emissiveIntensity: .35 });
  const brillo = new THREE.SpriteMaterial({ map: texturaResplandor(), transparent: true, depthWrite: false, opacity: .75 });

  const crear = () => { const m = new THREE.Mesh(geo, oro); escena.add(m); return m; };
  const viajera = crear();
  const halo = new THREE.Sprite(brillo); halo.position.z = -400; escena.add(halo);
  const quietas = huecos.filter((h) => h !== destino).map(() => crear());

  // Lienzo 2D de cada sección clara (sticky, del alto de la pantalla)
  const lienzos = claras.map((sec) => {
    const c = sec.querySelector('.cielo-estrella canvas');
    return { sec, c, ctx: c.getContext('2d'), visible: false };
  });

  let ancho = 0, alto = 0;
  function medidas() {
    ancho = document.documentElement.clientWidth; alto = innerHeight;
    render.setSize(ancho, alto, false);
    Object.assign(camara, { left: -ancho / 2, right: ancho / 2, top: alto / 2, bottom: -alto / 2 });
    camara.updateProjectionMatrix();
  }
  medidas();
  addEventListener('resize', medidas);

  const aEscena = (sx, sy) => [sx - ancho / 2, -(sy - alto / 2)];
  // Cada avance persigue al del scroll con suavidad: aunque la rueda vaya a saltos, la estrella fluye
  const seguir = (actual, meta, dt) => {
    if (actual < 0) return meta;
    const v = actual + (meta - actual) * (1 - Math.exp(-dt * 4.5));
    return Math.abs(meta - v) < .0005 ? meta : v;
  };

  // Columna por la que pasa la estrella: la del título de la sección clara que tiene detrás (ahí hay texto, no fotos ni tarjetas).
  // Si la sección no tiene título visible (opiniones), va por el borde de su contenido.
  const anclaX = (sy, previa) => {
    const sec = claras.find((s) => { const r = s.getBoundingClientRect(); return r.top <= sy && r.bottom >= sy; });
    if (!sec) return previa >= 0 ? previa : columna(problema);
    return columna(sec);
  };
  const columna = (sec) => {
    const h = sec.querySelector('.section-title:not(.sr-only)');
    if (h) { const r = h.getBoundingClientRect(); return r.left + r.width / 2; }
    const r = (sec.querySelector('.wrap') || sec).getBoundingClientRect();
    return r.width < 700 ? r.left + r.width / 2 : r.right;
  };

  let bucle = 0, antes = 0, pA = -1, pS = -1, pC = -1, xS = -1;
  function dibujar(t) {
    bucle = lienzos.some((l) => l.visible) ? requestAnimationFrame(dibujar) : 0;
    const dt = Math.min(.05, (t - (antes || t)) / 1000); antes = t;
    const vh = alto;
    const rs = calendario.getBoundingClientRect();
    const rd = destino.getBoundingClientRect();
    const tam = rd.width;
    const grande = tam * (rs.width < 700 ? 3.2 : 4.2);
    const cx = rs.left + rs.width / 2;
    const dx = rd.left + rd.width / 2, dy = rd.top + rd.height / 2;

    // Tramo 1 (¿Te suena?): grande, cae despacio mientras la sección está en pantalla
    const rp = problema.getBoundingClientRect();
    pA = seguir(pA, clamp((vh - rp.top) / (vh + rp.height)), dt);
    // Tramo 2 (calendario → fila de estrellas): la animación de siempre
    const inicio = vh * .8;
    const fin = vh * .6 - (dy - rs.top);
    pS = seguir(pS, clamp((inicio - rs.top) / (inicio - fin)), dt);
    // Tramo 3 (secciones claras siguientes): sale de la fila, crece y sigue hasta perderse tras el cierre oscuro
    const a3 = vh * .35 - dy, b3 = cierre.getBoundingClientRect().top;
    pC = seguir(pC, a3 > 0 ? clamp(a3 / (a3 + Math.max(1, b3))) : 0, dt);

    let sx, sy, tamano, rx, ry, rz = 0, pulso = 1;
    if (pC > 0) {
      // Sale de la fila, crece y cae despacio por la columna del texto de cada sección
      const w = suave(clamp(pC / .15));
      const py = mezcla(vh * .3, vh * .62, suave(pC));
      xS = seguir(xS, anclaX(py, xS), dt * .5);
      sx = mezcla(dx, xS, w); sy = mezcla(dy, py, w);
      tamano = mezcla(tam, grande, w) * (1 - pC * .2);
      rx = Math.sin(pC * Math.PI) * .2; ry = -pC * Math.PI * 6;
    } else if (pS <= 0) {
      // ¿Te suena?: caída suave detrás del título, haciéndose algo más pequeña
      sy = mezcla(vh * .18, vh * .72, suave(pA));
      xS = seguir(xS, anclaX(sy, xS), dt * .5);
      sx = xS;
      tamano = mezcla(grande, grande * .8, pA);
      rx = Math.sin(pA * Math.PI) * .2; ry = -pA * Math.PI * 2;
    } else {
      const p = pS, e = suave(p);
      const sx0 = cx, sy0 = vh * .22; // sale del centro
      sx = mezcla(sx0, dx, e) + Math.sin(p * Math.PI) * rs.width * .1;
      // Baja dentro de la pantalla (hasta ~60 %) y al final se engancha al hueco, que ya está ahí
      sy = mezcla(sy0, Math.min(dy, vh * .6), e);
      tamano = mezcla(grande, tam, e);
      // Gira sobre su eje de derecha a izquierda (dos vueltas) y llega de frente
      rx = Math.sin(p * Math.PI) * .25; ry = -e * Math.PI * 4; rz = Math.sin(p * Math.PI * 2) * .08;
      if (p >= 1) pulso = 1 + Math.sin(t / 600) * .06;
    }
    const [x, y] = aEscena(sx, sy);
    viajera.position.set(x, y, 0);
    viajera.scale.setScalar(tamano / 2);
    viajera.rotation.set(rx, ry, rz);
    halo.position.set(x, y, -400);
    halo.scale.setScalar(tamano * 2.4 * pulso);

    // Las 4 que esperan: en su sitio, con un vaivén mínimo
    let k = 0;
    huecos.forEach((h, i) => {
      if (h === destino) return;
      const r = h.getBoundingClientRect();
      const [qx, qy] = aEscena(r.left + r.width / 2, r.top + r.height / 2);
      const q = quietas[k++];
      q.position.set(qx, qy, 0);
      q.scale.setScalar(r.width / 2);
      q.rotation.set(0, Math.sin(t / 1400 + i) * .25, 0);
    });
    render.render(escena, camara);

    // Copia la pantalla en el lienzo de cada sección clara visible
    lienzos.forEach((l) => {
      if (!l.visible) return;
      const r = l.c.getBoundingClientRect();
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (l.c.width !== w || l.c.height !== h) { l.c.width = w; l.c.height = h; }
      l.ctx.clearRect(0, 0, w, h);
      l.ctx.drawImage(gl, -r.left * dpr, -r.top * dpr, ancho * dpr, alto * dpr);
    });
  }

  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      const l = lienzos.find((x) => x.sec === e.target);
      if (!l) return;
      l.visible = e.isIntersecting;
      if (!l.visible) l.ctx.clearRect(0, 0, l.c.width, l.c.height);
    });
    if (lienzos.some((l) => l.visible) && !bucle) { antes = 0; bucle = requestAnimationFrame(dibujar); }
  }, { rootMargin: '100px 0px' });
  lienzos.forEach((l) => io.observe(l.sec));
}
