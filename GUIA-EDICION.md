# Guía de edición de la web de Zihkon

Web estática: HTML + CSS + JavaScript, sin framework ni paso de compilación.
Lo que hay en el repositorio es exactamente lo que se publica.

## Mapa de archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Todos los textos de la página principal, enlaces, teléfono/WhatsApp, imágenes, datos SEO |
| `css/styles.css` | **Variables** (colores, tipografías, botones) y componentes comunes: botones, cabecera, pie, WhatsApp flotante, aviso de cookies |
| `css/secciones.css` | Estilos propios de cada sección de `index.html` (marcados con `SECCIÓN: ...`) |
| `css/tema.css` | **Tema activo**: tema de temporada, colores personalizados y franja de anuncio. Mandan sobre `styles.css` |
| `css/temas/` | Temas predefinidos: `original`, `halloween`, `navidad`, `san-valentin`, `verano` |
| `js/main.js` | Comportamiento: menú móvil, preguntas frecuentes, cookies, envío del formulario y sus mensajes |
| `privacidad.html`, `cookies.html`, `seguridad.html`, `aviso-legal.html` | Textos legales |
| `css/legal.css` | Estilos de las páginas legales |
| `img/` | Imágenes |

## Secciones de `index.html`

Cada sección empieza con `<!-- SECCIÓN: Nombre -->` y termina con `<!-- FIN SECCIÓN: Nombre -->`.

| id | Sección | Contenido principal |
|---|---|---|
| `#cabecera` | Cabecera | Logo, menú, botón "Solicitar auditoría" |
| `#inicio` | Hero | Título principal (`<h1>`), subtítulo, botones |
| `#puntos-fuertes` | Franja bajo el hero | 3 puntos fuertes |
| `#problema` | El problema | 6 tarjetas de problemas |
| `#coste` | El coste de no aparecer | Texto y gráfico ilustrativo |
| `#solucion` | Qué hacemos | Bloque destacado + 4 servicios resumidos |
| `#servicios` | (dentro de `#solucion`) | 9 servicios detallados |
| `#auditoria` | Auditoría gratuita | Lista de lo que se revisa + informe de muestra |
| `#ejemplos` | Ejemplos | Restaurante, clínica, comercio |
| `#por-que` | Por qué elegirnos | 6 valores |
| `#preguntas` | Preguntas frecuentes | 6 preguntas (también repetidas en el `<head>`, ver abajo) |
| `#llamada-final` | Llamada a la acción final | Título + botón |
| `#contacto` | Contacto | Texto y formulario |
| `#pie` | Pie de página | Enlaces, legales, redes sociales, copyright |

Para **ocultar una sección**, añade el atributo `hidden` a su etiqueta de apertura, por ejemplo
`<section class="examples" id="ejemplos" hidden>`. Si el menú enlaza a ella, quita también ese enlace.

## Temas y colores de la web

Los cambios de tema y de colores generales se hacen **solo en `css/tema.css`** (no en `styles.css`):

- **Poner un tema de temporada**: cambia el archivo de la línea `@import url("temas/original.css");` por `halloween.css`, `navidad.css`, `san-valentin.css` o `verano.css`. Cambia colores, botones, fondos, añade una franja de anuncio bajo el menú y decoración (emojis) en el inicio y en la llamada final.
- **Volver a la web normal**: `@import url("temas/original.css");`.
- **Colores personalizados** ("pon la web en azul", "botones verdes"): añade las variables dentro del bloque `:root` de `css/tema.css` (por ejemplo `--color-boton`, `--color-boton-hover`, `--color-boton-activo`, `--color-primario`, `--color-primario-oscuro`, `--color-acento`, `--color-fondo`). Mandan sobre el tema.
- **Franja de anuncio**: `--tema-anuncio: "texto";` en el `:root` de `css/tema.css`. Para quitarla: `--tema-anuncio: none;`.
- **Decoración**: `--tema-decoracion` (inicio) y `--tema-decoracion-cta` (llamada final), texto con emojis o `none`.

## Dónde está cada dato

- **Colores**: variables al principio de `css/styles.css` (`:root`).
  - Botones: `--color-boton`, `--color-boton-hover`, `--color-boton-texto`.
  - Botón lima de la llamada final: `--color-boton-destacado`.
  - Color de marca (enlaces, iconos, acentos): `--color-primario`. Las páginas legales usan `--legal-color-primario` en `css/legal.css`.
  - Botón de WhatsApp: `--color-whatsapp`.
  - Fondos: `--color-fondo` (página), `--color-fondo-alterno` (bandas de #auditoria y #por-que), `--color-superficie` (tarjetas, formulario, pie).
  - Texto: `--color-texto`, `--color-texto-suave`; sobre fondos verdes `--color-texto-invertido`.
  - Bordes: `--color-borde`, `--color-borde-fuerte`, `--color-borde-campo` (campos del formulario).
  - Mensajes del formulario: `--color-exito`, `--color-error` (y sus `-fondo`).
  - Anillo de foco al navegar con teclado: `--color-foco`.
- **Tipografías**: `--fuente-titulos` y `--fuente-principal` en `css/styles.css`. Se cargan desde Google Fonts en el `<link>` del `<head>` de `index.html` y de las páginas legales; si se cambia de fuente hay que cambiar ambos.
- **Tamaños de letra**: `--texto-xs` … `--texto-xl`, `--titulo-seccion` (títulos de sección) y `--titulo-hero` (título principal) en `css/styles.css`.
- **Espaciado**: `--espacio-1` … `--espacio-9` (4px → 96px) y `--espacio-seccion` (separación vertical entre secciones).
- **Esquinas y sombras**: `--radio-boton`, `--radio-campo`, `--radio-tarjeta`, `--radio-etiqueta`; `--sombra-sm`, `--sombra-md`, `--sombra-lg`.
- **Textos, títulos, botones**: directamente en `index.html`, dentro de su sección.
- **WhatsApp / teléfono**: botón flotante al final de `index.html` (`href="https://wa.me/34604183676"` y su `aria-label`). El teléfono también aparece en `privacidad.html` y `aviso-legal.html`.
- **Email**: `zihkon@gmail.com` en las páginas legales; `hola@zihkon.com` en el mensaje de error del formulario (`FORM_MESSAGES` en `js/main.js`).
- **Mensajes del formulario** (enviando, éxito, error): `FORM_MESSAGES` en `js/main.js`.
- **Zona / ciudades**: textos de `index.html` (hero, sección `#por-que`, pie) y datos SEO del `<head>`.
- **Redes sociales**: pie de `index.html`. Ahora son botones desactivados (sin enlace).
- **Precios**: la web no muestra precios (ver primera pregunta frecuente).
- **Año del copyright**: se actualiza solo (`js/main.js`).
- **Datos SEO**: `<head>` de `index.html` → `<title>`, `meta description`, Open Graph/Twitter y tres bloques `application/ld+json` (negocio `ProfessionalService`, `WebSite` y `FAQPage`).
  - Si cambias una pregunta frecuente, cámbiala en la sección `#preguntas` **y** en el bloque `FAQPage`, con el mismo texto exacto.
  - Si cambias teléfono, email o servicios, actualiza también el bloque `ProfessionalService`.
  - Si cambias el título principal o la zona, revisa `<title>`, `meta description`, `og:title` y `twitter:title`.
- **Archivos SEO**: `robots.txt` y `sitemap.xml` en la raíz. Tras un cambio de contenido importante, actualiza `<lastmod>` en `sitemap.xml`.

## Imágenes (`img/`)

| Archivo | Dónde se usa |
|---|---|
| `zihkon-logo.webp` / `zihkon-logo.png` | Logo de la cabecera y del pie (versión ligera, 194×100) |
| `zihkon-marca-registrada.png` | Logo original en alta resolución; lo usan los datos para Google (`"logo"` en el `<head>`) |
| `favicon-32.png`, `apple-touch-icon.png` | Icono de la pestaña y del acceso directo en móviles (todas las páginas) |
| `zihkon-og.jpg` | Imagen que aparece al compartir la web en redes y WhatsApp (`og:image`, 1200×630) |
| `channels4_profile.jpg` | Icono redondo junto a "Un plan claro para tu negocio" (hero) |
| `FB_IMG_17903657563662-removebg-preview.png` | Logo pequeño del informe de muestra (`#auditoria`) |
| `ISo-zihkon-marca-registrada.png`, `favicon-circular.png` | Originales en alta resolución; no se cargan en la web |

Para cambiar una imagen, sustituye la ruta en el `src` correspondiente de `index.html` por otra imagen que ya exista en `img/`.

## Recetas de cambios habituales

| Petición | Archivo(s) |
|---|---|
| "Pon la web de Halloween / Navidad / San Valentín / verano" | `css/tema.css` → línea `@import` |
| "Quita el tema" / "deja la web como siempre" | `css/tema.css` → `@import url("temas/original.css");` y vaciar `:root` |
| "Cambia los colores de la web" | `css/tema.css` → variables en `:root` |
| "Cambia el color de los botones" | `css/tema.css` → `--color-boton`, `--color-boton-hover`, `--color-boton-activo` |
| "Cambia el color principal de la marca" | `css/styles.css` → `--color-primario`; opcional `css/legal.css` |
| "Cambia el título principal" | `index.html` → `<h1>` de `#inicio` (opcional: `<title>` y `og:title`) |
| "Cambia el WhatsApp" | `index.html` → botón flotante (`href` y `aria-label`) |
| "Cambia el texto de servicios" | `index.html` → `#solucion` / `#servicios` |
| "Oculta la sección X" | `index.html` → atributo `hidden` en la sección |
| "Cambia una pregunta frecuente" | `index.html` → `#preguntas` y bloque `FAQPage` del `<head>` |

## No modificar

`package.json`, `netlify.toml`, `_redirects`, `_headers`, `CNAME`, `*.config.js`, `tsconfig.json`, `.env*`, `.github/`, `netlify/functions/`.
No añadas claves, tokens ni contraseñas. La URL del webhook de `js/main.js` es pública por diseño.
`docx_document.xml` es un documento de origen de los textos legales; no forma parte de la web.
