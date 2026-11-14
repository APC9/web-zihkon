# Requisitos para que una web sea editable por WhatsApp

## Obligatorios (si falta alguno, el flujo falla o rechaza)

1. **Repositorio en GitHub conectado a Netlify** con deploy automático en la rama que figura en `clients.default_branch`. En `APC9/web-zihkon` esa rama es `master`, y debe coincidir con la de Netlify.
2. **Cliente activo en `clients`** (`active = true`, con su `whatsapp_e164`) y **fila completa en `client_websites`**: `github_owner`, `github_repository`, `default_branch`, `netlify_site_id`, `website_url` y `active = true`.
3. **El token de GitHub de n8n tiene acceso al repositorio**: token *fine-grained* con *Contents: Read and write* en ese repo.
4. **El código fuente es texto editable** en el repositorio: `.html`, `.css`, `.scss`, `.js`, `.ts`, `.jsx`, `.tsx`, `.astro`, `.vue`, `.svelte`, `.md`, `.mdx`, `.json`, `.yml`, `.txt` o `.svg`. Si en el repo solo hay archivos compilados o minificados (`dist/`, `*.min.css`), la IA no puede editar con seguridad.
5. **Archivos de tamaño razonable**: la IA lee como máximo unos 60.000 caracteres por archivo. Un `index.html` más grande que eso, con todo el CSS y JS dentro, se lee cortado y el cambio se rechaza.
6. **El contenido no está en archivos protegidos.** La automatización nunca toca `package.json`, `netlify.toml`, `_redirects`, `_headers`, `CNAME`, `*.config.js`, `tsconfig.json`, `.env*`, `.github/` ni `netlify/functions/`.
7. **Sin secretos en el repositorio**: el validador bloquea cualquier cambio que introduzca algo con aspecto de clave.

## Recomendados (marcan la diferencia en lo que se puede automatizar)

- **CSS en un archivo aparte** (`css/styles.css`) en lugar de `<style>` dentro de cada HTML.
- **Colores y tipografías como variables CSS** en un único sitio:
  ```css
  :root {
    --color-primario: #1a73e8;
    --color-boton: #1a73e8;
    --color-boton-texto: #ffffff;
    --fuente-principal: "Poppins", sans-serif;
  }
  .btn { background: var(--color-boton); color: var(--color-boton-texto); }
  ```
  Así, "cambia el color de los botones a rojo" es una sola línea en un solo archivo.
- **Clases consistentes**: todos los botones con `.btn` y no con un estilo distinto en cada uno.
- **Secciones marcadas con comentarios** (`<!-- SECCIÓN: Menú -->`, `<!-- SECCIÓN: Horario -->`) e `id` descriptivos (`id="horario"`), para que la IA encuentre rápido qué tocar.
- **Textos editables, como precios, horarios o teléfonos**, en el HTML o en un JSON/Markdown de contenido, no dentro de JavaScript generado.
- **Imágenes ya subidas al repo** (`img/`), con nombres sin espacios ni tildes (`carta-01.jpg`, no `menu 1.jpeg`). Con el comando `WEB` la IA solo puede usar imágenes existentes; la carta y la sugerencia del día de los restaurantes se mandarán en foto o PDF (ver "Kit de restaurante" más abajo).
- **Un cambio no debería necesitar más de 3 archivos**, que es el límite actual por petición (configurable en el nodo Config).

## Qué se puede pedir y qué no

| Funciona | Requiere revisión del equipo |
|---|---|
| Textos, precios, horarios, teléfonos, enlaces | Rediseño completo de la web (estructura o maquetación nueva) |
| Colores, tipografías y estilos de botones o secciones | Páginas nuevas con funcionalidad (reservas, pagos, formularios con backend) |
| Temas de temporada y paletas de colores (si la web tiene el kit de temas, ver abajo) | Temas en webs sin el kit de temas: el resultado depende de cómo esté hecho su CSS |
| Añadir, ocultar o eliminar una sección o una promoción | Integraciones externas, scripts o iframes de terceros |
| Cambiar una imagen por otra ya existente en el repo | Dominio, DNS, build, dependencias, configuración de Netlify |
| Carta y sugerencia del día en foto o PDF (si la web tiene el kit de restaurante, ver abajo) | Carta escrita a mano dentro del HTML o en imágenes sin `data/carta.json` |

## Kit de temas: cambiar de tema por WhatsApp en cualquier web

Con el kit, "pon la web de Halloween" cambia **una sola línea de un solo archivo**, así que la automatización lo hace de forma fiable. Sin el kit, la IA intenta cambiar los colores donde los encuentre: funciona solo si la web ya usa variables CSS, y sin franja de anuncio ni decoración. La referencia es la web de Zihkon (`APC9/web-zihkon`, rama `temas-web`): copia sus archivos y adáptalos.

### Requisito previo: colores en variables CSS

Toda la web debe pintar sus colores con `var(--...)`, definidos en un único `:root`. Si un color está escrito a mano en una regla (`background: #176b53`), los temas no lo cambiarán. Variables que sobrescriben los temas (nombres estándar del kit):

| Variable | Dónde se ve |
|---|---|
| `--color-primario` | Enlaces, iconos, acentos y bandas de color grandes |
| `--color-primario-oscuro` | Fondos oscuros, franjas destacadas y franja de anuncio |
| `--color-acento` | Bloques destacados y botón secundario de color |
| `--color-detalle` | Puntos y pequeños detalles decorativos |
| `--color-fondo`, `--color-fondo-alterno` | Fondo de la página y bandas alternas |
| `--color-superficie`, `--color-fondo-icono`, `--color-borde` | Tarjetas, fondos de iconos y bordes |
| `--color-boton`, `--color-boton-hover`, `--color-boton-activo`, `--color-boton-texto` | Botones principales |
| `--color-boton-destacado-hover`, `--color-boton-destacado-activo` | Botón de color de acento |
| `--color-texto-invertido` | Texto sobre fondos oscuros (también el de la franja de anuncio) |

En una web nueva, usa directamente estos nombres. En una web existente con otros nombres hay dos opciones: renombrar sus variables a las del kit (recomendado), o escribir los archivos de `css/temas/` con los nombres de esa web y ponerlos en su `GUIA-EDICION.md`.

### Archivos que hay que añadir

```
css/
├── tema.css            ← el ÚNICO archivo que toca la automatización para temas y colores
└── temas/
    ├── original.css    ← vacío (solo un comentario): la web tal cual
    │   Estaciones
    ├── primavera.css · verano.css · otono.css · invierno.css
    │   Fiestas y días comerciales
    ├── reyes.css · rebajas.css · san-valentin.css · dia-del-padre.css
    ├── pascua.css · dia-de-la-madre.css · vuelta-al-cole.css
    └── halloween.css · black-friday.css · navidad.css · nochevieja.css
```

**`css/tema.css`** tiene siempre esta estructura y en este orden:

```css
/* Comentario con la lista de temas disponibles y cómo cambiarlos */
@import url("temas/original.css");   /* 1) tema activo: UNA línea, primera regla del archivo */

:root {
  /* 2) colores personalizados del cliente (opcional, mandan sobre el tema) */
}

/* 3) bloque de decoración: franja de anuncio y emojis, controlado por variables */
```

**Cada archivo de `css/temas/`** solo define variables dentro de `:root`, sin selectores, para que nunca haga falta editarlo. Además de los colores, define las variables de decoración:

| Variable | Qué hace | Ejemplo |
|---|---|---|
| `--tema-anuncio` | Texto de la franja bajo el menú (`none` = sin franja) | `"🎃 ¡Feliz Halloween! 🦇"` |
| `--tema-anuncio-fondo`, `--tema-anuncio-texto` | Colores de la franja | `#2e1043`, `#ffa62b` |
| `--tema-fondo-hero` | Fondo de la portada (degradado) | `radial-gradient(...)` |
| `--tema-decoracion` | Emojis animados en la portada | `"🦇 🎃 👻"` |
| `--tema-decoracion-cta` | Emojis en la llamada a la acción final | `"🎃 🕸️"` |

### Cómo enlazarlo

- `<link rel="stylesheet" href="css/tema.css">` va como **última hoja de estilos** del `<head>`, en cada página que deba llevar el tema (en Zihkon solo en `index.html`; las páginas legales se quedan sin tema).
- El bloque de decoración de `tema.css` usa los selectores de la web de Zihkon: `.topbar` (cabecera fija, franja con `::after`), `.hero` (portada, emojis con `::after`) y `.final-cta` (llamada final, emojis con `::before`). **En otra web hay que cambiarlos por sus clases.** Esos elementos necesitan `position: relative` (o `sticky`) y `overflow: hidden`, y no pueden estar usando ya ese pseudo-elemento.
- Respeta `prefers-reduced-motion`: la animación de los emojis debe pararse si el visitante lo pide.

### Reglas para que la automatización no se equivoque

1. El `@import` es la **primera regla** de `tema.css` y ocupa **una sola línea**: `@import url("temas/<nombre>.css");`.
2. Los nombres de los temas van en minúsculas y con guiones, y son **los mismos en todas las webs** (sin tildes ni eñes): `original`, `primavera`, `verano`, `otono`, `invierno`, `reyes`, `rebajas`, `san-valentin`, `dia-del-padre`, `pascua`, `dia-de-la-madre`, `vuelta-al-cole`, `halloween`, `black-friday`, `navidad`, `nochevieja`. La lista completa también va en el comentario de `css/tema.css`, que es donde la IA la consulta. Así un mismo prompt sirve para todos los clientes.
3. Volver a la web normal es `temas/original.css` y dejar vacío el bloque `:root` de `tema.css`.
4. Los comentarios y el bloque de decoración de `tema.css` no se borran nunca, tampoco al volver al tema original. El validador del workflow rechaza cualquier cambio que elimine más de la mitad de un archivo, así que reescribir `tema.css` sin ellos acabaría en revisión.
5. Contraste mínimo de 4.5:1 entre `--color-boton` y `--color-boton-texto`, y entre el texto y los fondos claros. Comprueba cada tema antes de publicarlo.
6. Añade a la `GUIA-EDICION.md` de la web la sección "Temas y colores" (cópiala de la web de Zihkon). La IA la lee antes de hacer cualquier cambio.

### Añadir un tema nuevo (por ejemplo, "black-friday")

1. Crea `css/temas/black-friday.css` con las mismas variables que los demás.
2. Añádelo a la lista del comentario de `css/tema.css` y a la `GUIA-EDICION.md`.
3. En n8n, añádelo al menú del nodo **Decidir paso** (lo que ve el cliente) y a los ejemplos de la regla 12 del prompt de **IA - Generar cambios**. La IA también lo encuentra sola, porque lee la lista de `css/tema.css`.
4. Para que sirva en todas las webs, crea el mismo archivo en cada una.

### Comprobación antes de dar de alta la web

- [ ] Con `temas/original.css` la web se ve exactamente igual que antes del kit.
- [ ] Al cambiar la línea a `halloween.css` cambian los botones, los acentos, los fondos y aparece la franja de anuncio.
- [ ] Se ve bien en móvil: la franja no tapa el menú y los emojis no tapan textos ni botones.
- [ ] `GUIA-EDICION.md` incluye la sección de temas.
- [ ] Prueba real por WhatsApp: `WEB` → "pon el tema de Navidad" → `SÍ`. El commit solo debe modificar `css/tema.css`.

## Kit de restaurante: carta y sugerencia del día por WhatsApp

> **Estado:** implementado en el workflow de producción **"Zihkon - Web Editor via WhatsApp v3 (carta y sugerencia)"**, todavía **inactivo** (la v2 sigue siendo la que responde). Prepara las webs de restaurante con este kit y estarán listas cuando se active.

El cliente no escribe la carta: la manda **tal cual la tiene, en fotos o en PDF**, y la web la muestra en un carrusel. La sugerencia del día funciona igual, en una sección propia. Con el kit, la automatización solo sube imágenes y reescribe **un archivo de datos pequeño** (`data/carta.json` o `data/sugerencia.json`); nunca toca el HTML. La referencia será la web de Cholaos Maracaná.

### Cómo lo usa el cliente

| Comando | Qué hace |
|---|---|
| `CARTA` → fotos en orden o un PDF → `LISTO` → `SÍ` | Sustituye la carta. El bot confirma "He recibido N páginas, ¿las publico?" y envía el enlace al terminar. |
| `CARTA ANTERIOR` | Vuelve a la carta previa. La carta vigente pasa a ser la "anterior", así que repetir el comando la recupera. |
| `SUGERENCIA` → una foto o un PDF (texto opcional en el pie) → `SÍ` | Publica la sugerencia del día y deja la sección **visible**. |
| `QUITAR SUGERENCIA` | Deja la sección **oculta**; no se borra nada del código. |

- **La sugerencia no caduca:** se queda publicada hasta que el cliente mande otra o la quite.
- **Está incluida en el servicio de web** (no es una automatización aparte en `client_automations`).
- **Si la web no tiene la sección `#sugerencia` en su código, el bot responde que su web no la incluye y no cambia nada.**
- **Límites:** máximo 12 páginas o un PDF de 15 MB, y solo desde el WhatsApp autorizado del cliente.

### Archivos que hay que añadir

```
data/
├── carta.json          ← páginas de la carta (lo reescribe la automatización)
└── sugerencia.json     ← sugerencia del día y si está visible (lo reescribe la automatización)
img/
├── carta/AAAA-MM-DD/       ← una carpeta por versión de la carta
└── sugerencia/AAAA-MM-DD/  ← una carpeta por sugerencia
js/
└── datos-web.js        ← pinta la carta y la sugerencia a partir de los JSON
```

**`data/carta.json`** (`pdf` es `null` si la carta llegó en fotos; si llegó en PDF, `paginas` queda vacío y `js/datos-web.js` pinta cada página del PDF con PDF.js, además del botón de descarga). `anterior` guarda la carta previa para `CARTA ANTERIOR`:

```json
{
  "actualizada": "2026-10-11",
  "paginas": [
    { "src": "img/carta/2026-10-11/pagina-01.jpg", "alt": "Carta, página 1" },
    { "src": "img/carta/2026-10-11/pagina-02.jpg", "alt": "Carta, página 2" }
  ],
  "pdf": null,
  "anterior": null
}
```

**`data/sugerencia.json`** (estado inicial de una web nueva: `"visible": false`):

```json
{
  "visible": true,
  "actualizada": "2026-10-11",
  "imagenes": [{ "src": "img/sugerencia/2026-10-11/sugerencia-01.jpg", "alt": "Sugerencia del día" }],
  "texto": "Lentejas con chorizo, 9,50 €",
  "pdf": null
}
```

### Secciones del HTML

La sugerencia es una **sección propia**, colocada antes de la carta y con enlace en el menú de navegación. Está **siempre en el código**, oculta con `hidden` hasta que haya una sugerencia visible.

```html
<!-- SECCIÓN: Sugerencia del día -->
<section id="sugerencia" class="sugerencia" hidden>
  <h2>Sugerencia del día</h2>
  <div data-sugerencia-imagenes></div>
  <p data-sugerencia-texto></p>
  <a data-sugerencia-pdf hidden download>Ver sugerencia (PDF)</a>
</section>
<!-- FIN SECCIÓN: Sugerencia del día -->

<!-- SECCIÓN: Carta -->
<section id="menu" class="carta">
  <h2>Nuestra carta</h2>
  <div class="carta-track" data-carta></div>
  <span data-carta-contador></span>
  <a data-carta-pdf hidden download>Descargar carta (PDF)</a>
</section>
<!-- FIN SECCIÓN: Carta -->
```

En el menú de navegación: `<a href="#sugerencia" data-sugerencia-enlace hidden>Sugerencia del día</a>`.

El carrusel **no lleva imágenes escritas a mano**: las pinta `js/datos-web.js` desde `data/carta.json`, así que se adapta a cualquier número de páginas y el contador siempre cuadra.

### `js/datos-web.js`

Se enlaza al final del `<body>` (`<script src="js/datos-web.js" defer></script>`). Si un JSON no existe, no hace nada y la web sigue funcionando. Si la web tiene su propio carrusel o visor ampliado, se engancha a las imágenes que inserta este script; cuando termina de pintar la carta lanza el evento `carta:lista` en `document`. PDF.js solo se descarga si la carta o la sugerencia están en PDF.

```js
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
```

### Reglas para que la automatización no se equivoque

1. Los `id` son fijos en todas las webs: `#sugerencia` para la sugerencia y `#menu` para la carta. El editor comprueba que `index.html` contiene `<section id="sugerencia"` antes de aceptar un `SUGERENCIA`.
2. La automatización solo escribe en `data/carta.json`, `data/sugerencia.json`, `img/carta/` e `img/sugerencia/`, en un único commit. Nunca toca el HTML para estos comandos.
3. Las fotos se suben tal cual llegan de WhatsApp (ya vienen comprimidas) y los PDF hasta 15 MB. Cada envío va a su propia carpeta `img/carta/AAAA-MM-DD-HHMM/` o `img/sugerencia/AAAA-MM-DD-HHMM/`; las carpetas antiguas se pueden borrar a mano.
4. La carta (y la sugerencia) solo se pueden cambiar si `index.html` tiene `data-carta` (o `<section id="sugerencia"`). Si no, el bot responde que la web no está preparada y no cambia nada.
5. Mientras el cliente tiene abierta una conversación `CARTA` o `SUGERENCIA`, el router (`Zihkon - Router WhatsApp`) manda sus fotos y PDF al editor web y no a Publicaciones.
6. Añade a la `GUIA-EDICION.md` de la web una sección "Carta y sugerencia del día" con estos archivos, para que la IA no intente editar la carta en el HTML con el comando `WEB`.

### Comprobación antes de dar de alta la web

- [ ] Con `data/sugerencia.json` en `"visible": false` la sección y su enlace no se ven y no dejan hueco.
- [ ] Al poner `"visible": true` con una imagen, aparecen la sección y el enlace del menú.
- [ ] El carrusel muestra exactamente las páginas de `data/carta.json` y el contador coincide.
- [ ] Con `"pdf"` relleno aparece el botón de descarga; con `null`, no.
- [ ] Se ve bien en móvil.
- [ ] `GUIA-EDICION.md` incluye la sección "Carta y sugerencia del día".
- [ ] Cuando esté activo en n8n: `CARTA` con 2 fotos, `SUGERENCIA` con 1 foto y `QUITAR SUGERENCIA`. Cada commit solo debe tocar `data/` e `img/carta/` o `img/sugerencia/`.
