// Pinta la carta y la sugerencia del día a partir de data/carta.json y data/sugerencia.json.
// Si un JSON no existe, no hace nada y la web sigue funcionando.
async function cargar(ruta) {
  try {
    const r = await fetch(ruta, { cache: 'no-store' });
    return r.ok ? r.json() : null;
  } catch { return null; }
}
const img = (p) => Object.assign(document.createElement('img'), { src: p.src, alt: p.alt || '', loading: 'lazy' });

// Si la carta o la sugerencia llegan en PDF, cada página se pinta como imagen con PDF.js (solo se descarga si hace falta).
async function paginasPdf(url, alt) {
  if (!window.pdfjsLib) {
    await new Promise((ok, mal) => {
      const s = Object.assign(document.createElement('script'), { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', onload: ok, onerror: mal });
      document.head.append(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const pdf = await window.pdfjsLib.getDocument(url).promise;
  const paginas = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 12); i++) {
    const pagina = await pdf.getPage(i);
    const vista = pagina.getViewport({ scale: 1600 / pagina.getViewport({ scale: 1 }).width });
    const lienzo = Object.assign(document.createElement('canvas'), { width: vista.width, height: vista.height });
    await pagina.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise;
    paginas.push({ src: lienzo.toDataURL('image/jpeg', 0.85), alt: `${alt}, página ${i}` });
  }
  return paginas;
}

(async () => {
  const carta = await cargar('data/carta.json');
  const track = document.querySelector('[data-carta]');
  if (carta && track) {
    let paginas = carta.paginas || [];
    if (!paginas.length && carta.pdf) paginas = await paginasPdf(carta.pdf, 'Carta').catch(() => []);
    track.replaceChildren(...paginas.map(img));
    const contador = document.querySelector('[data-carta-contador]');
    if (contador) contador.textContent = `${paginas.length} ${paginas.length === 1 ? 'página' : 'páginas'}`;
    const pdf = document.querySelector('[data-carta-pdf]');
    if (pdf && carta.pdf) { pdf.href = carta.pdf; pdf.hidden = false; }
    document.dispatchEvent(new CustomEvent('carta:lista'));
  }

  const sug = await cargar('data/sugerencia.json');
  const seccion = document.querySelector('#sugerencia');
  if (!seccion) return;
  const visible = Boolean(sug && sug.visible && ((sug.imagenes || []).length || sug.pdf));
  seccion.hidden = !visible;
  document.querySelectorAll('[data-sugerencia-enlace]').forEach((a) => { a.hidden = !visible; });
  if (!visible) return;
  let imagenes = sug.imagenes || [];
  if (!imagenes.length && sug.pdf) imagenes = await paginasPdf(sug.pdf, 'Sugerencia del día').catch(() => []);
  seccion.querySelector('[data-sugerencia-imagenes]').replaceChildren(...imagenes.map(img));
  seccion.querySelector('[data-sugerencia-texto]').textContent = sug.texto || '';
  const pdf = seccion.querySelector('[data-sugerencia-pdf]');
  if (sug.pdf) { pdf.href = sug.pdf; pdf.hidden = false; }
})();
