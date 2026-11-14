# Guía de edición de la web de Zihkon

Web estática: HTML + CSS + JavaScript, sin framework ni paso de compilación.
Lo que hay en el repositorio es exactamente lo que se publica.

## Mapa de archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Todos los textos de la página principal, enlaces, teléfono/WhatsApp, imágenes, datos SEO |
| `css/styles.css` | **Variables** (colores, tipografías, botones) y componentes comunes: botones, cabecera, pie, WhatsApp flotante, aviso de cookies |
| `css/portada.css` | Diseño de la página principal (`index.html`): fondos de noche, telones entre secciones, tarjetas de precios, chat de la auditoría y las animaciones. Usa solo las variables de `styles.css`, así los temas siguen funcionando |
| `css/secciones.css` | Estilos de las páginas interiores (servicios, sectores, etc.) |
| `css/tema.css` | **Tema activo**: tema de temporada, colores personalizados y franja de anuncio. Mandan sobre `styles.css` |
| `css/temas/` | Temas predefinidos (lista en el comentario de `css/tema.css`): estaciones, fiestas y días comerciales |
| `js/portada.js` | Movimiento de la página principal: scroll suave, títulos y bloques que aparecen, chat que se escribe solo y el recorrido de `#servicios`. Respeta "reducir movimiento" del sistema; el botón "Activar/Desactivar animaciones" del pie lo cambia en ese navegador |
| `js/experiencia3d.js` | Escena 3D de la página principal (móvil con feed, ciudad con tu pin y tu ficha, reseñas respondidas y chat de WhatsApp). Todo es ilustrativo: sin cifras, clientes ni reseñas inventadas. No hace falta tocarla para cambiar textos |
| `js/estrella3d.js` | Estrella dorada 3D que recorre con el scroll las secciones claras, detrás de su contenido y oculta tras las oscuras: grande en `#problema`; en `#calendario` baja girando y se hace pequeña hasta el hueco central de las 4 estrellas del final de `#automatizaciones` (`.cal-estrellas`); en las secciones claras siguientes sale de la fila, crece y sigue hasta el cierre. Cada sección clara recibe un lienzo `.cielo-estrella` (lo crea `js/portada.js`). Funciona también con "reducir movimiento"; sin WebGL se ven 5 estrellas SVG quietas |
| `js/main.js` | Comportamiento: menú móvil, enlace activo del menú, preguntas frecuentes y aviso de cookies (Aceptar/Rechazar → consentimiento de Google). Google Tag Manager (GTM-P68VJQNK) y el contador de Metricool van escritos en el `<head>` de cada página (y en `generador/generar.py`) |
| `privacidad.html`, `cookies.html`, `seguridad.html`, `aviso-legal.html` | Textos legales |
| `css/legal.css` | Estilos de las páginas legales |
| `img/` | Imágenes |

## Secciones de `index.html`

Cada sección empieza con `<!-- SECCIÓN: Nombre -->` y termina con `<!-- FIN SECCIÓN: Nombre -->`.

| id | Sección | Contenido principal |
|---|---|---|
| `#cabecera` | Cabecera | Logo, menú (Servicios, Contenido, Quién soy, Preguntas; "Trabajos" está comentado hasta que se muestre `#trabajos`) y botón "Auditoría gratis" (WhatsApp) |
| `#inicio` | Hero | Título (`<h1>`), subtítulo, botones (auditoría por WhatsApp y "Ver precios"), 3 datos cortos (`.hero-datos`) y mosaico de 3 publicaciones (`.hero-mosaico`: se ve cuando no hay 3D; huecos de diseño hasta tener imágenes reales) |
| `#problema` | ¿Te suena? | 6 situaciones con forma de notificación (`.aviso`) |
| `#servicios` | Qué hacemos por ti | Recorrido con scroll en 4 capítulos (`.capitulo`): los 3 servicios principales, cada uno con enlace a su página, y Cómo trabajamos |
| `#como-trabajamos` | Cómo trabajamos | 4.º capítulo de `#servicios`: 3 pasos y "Nada se publica sin tu permiso" |
| `#trabajos` | Trabajos | 6 publicaciones reales con el nombre del negocio. **Oculta** (`hidden`) hasta tenerlas |
| `#calendario` | Calendario de contenido | Semana de ejemplo de un restaurante (`.cal-semana`). El reel y el carrusel "Datos Zihkon Nº 7" se abren en la vista de al lado: vídeo en `video/zihkon-datos-7-estrellas-web.mp4` (+ `-poster.jpg`) y diapositivas en `img/datos-7-estrellas/01-07.webp`. Tres pasos y botón "Quiero mi plan de contenido" (WhatsApp) |
| `#automatizaciones` | Complementos | Tabla de automatizaciones (alta y cuota) y enlace a `/automatizaciones/` |
| `#contacto` / `#auditoria` | Auditoría gratis | Qué se revisa y botón de WhatsApp con el mensaje (nombre y dirección del negocio) |
| `#quien` | Quién está detrás | Foto, nombre, texto y botón de WhatsApp |
| `#opiniones` | Opinión de cliente | La reseña real de Google (no inventar otras) |
| `#preguntas` | Preguntas frecuentes | 14 preguntas (también repetidas en el `<head>`, ver abajo) |
| `#llamada-final` | Llamada a la acción final | Título + botón de WhatsApp |
| `#pie` | Pie de página | Enlaces, legales, redes sociales, copyright |

Para **ocultar una sección**, añade el atributo `hidden` a su etiqueta de apertura, por ejemplo
`<section class="examples" id="ejemplos" hidden>`. Si el menú enlaza a ella, quita también ese enlace.

## Temas y colores de la web

Los cambios de tema y de colores generales se hacen **solo en `css/tema.css`** (no en `styles.css`):

- **Poner un tema de temporada o de un día especial**: cambia el archivo de la línea `@import url("temas/original.css");` por uno de `css/temas/`:
  - Estaciones: `primavera.css`, `verano.css`, `otono.css`, `invierno.css`.
  - Fiestas y días comerciales: `reyes.css`, `rebajas.css`, `san-valentin.css`, `dia-del-padre.css`, `pascua.css`, `dia-de-la-madre.css`, `vuelta-al-cole.css`, `halloween.css`, `black-friday.css`, `navidad.css`, `nochevieja.css`.
  Cambia colores, botones, fondos, añade una franja de anuncio bajo el menú y decoración (emojis) en el inicio y en la llamada final.
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
- **Tipografías**: `--fuente-titulos` (Young Serif, solo tiene un grosor: no usar negrita) y `--fuente-principal` (Atkinson Hyperlegible Next) en `css/styles.css`. Se alojan en `fonts/` y se declaran con `@font-face` al principio de `css/styles.css` y de `css/legal.css`; el `<head>` las precarga. Si se cambia de fuente hay que cambiar los archivos de `fonts/`, ambos CSS y los `<link rel="preload">` (también en `generador/generar.py`).
- **Tamaños de letra**: `--texto-xs` … `--texto-xl`, `--titulo-seccion` (títulos de sección) y `--titulo-hero` (título principal) en `css/styles.css`.
- **Espaciado**: `--espacio-1` … `--espacio-9` (4px → 96px) y `--espacio-seccion` (separación vertical entre secciones).
- **Esquinas y sombras**: `--radio-boton`, `--radio-campo`, `--radio-tarjeta`, `--radio-etiqueta`; `--sombra-sm`, `--sombra-md`, `--sombra-lg`.
- **Textos, títulos, botones**: directamente en `index.html`, dentro de su sección.
- **WhatsApp / teléfono**: enlaces `https://wa.me/34604183676?text=...` en la cabecera, el hero, `#calendario`, `#contacto`, `#quien`, `#llamada-final` y el botón flotante del final de `index.html` (y su `aria-label`). Todos los botones de acción abren WhatsApp; ninguno lleva a `#contacto`. El teléfono también aparece en `privacidad.html` y `aviso-legal.html`.
- **Email**: `zihkon@gmail.com` en las páginas legales y en el `<head>` de `index.html`.
- **Mensajes predefinidos de WhatsApp** (van tras `?text=`, codificados):
  - Auditoría: «Hola, quiero mi auditoría gratuita. Nombre del negocio: Dirección:». En casi todos los botones de `index.html` y en `WHATSAPP` de `generador/generar.py`.
  - Calendario: «Hola, quiero un plan de contenido para mis redes. Mi negocio es:», en el botón de `#calendario`.
- **Zona / ciudades**: textos de `index.html` (hero, sección `#por-que`, pie) y datos SEO del `<head>`.
- **Redes sociales**: pie de `index.html`, `sameAs` del `<head>`, `REDES` en `generador/generar.py` y `llms.txt`.
- **Precios**: la portada ya no tiene sección de precios (ni planes en sus datos para Google). Los planes salen en las páginas interiores (bloque `#precios-titulo`, desde `PLANES` de `generador/generar.py`) y los complementos en la tabla de `#automatizaciones`. Si cambian, revisa también las preguntas frecuentes y su copia en el `<head>`, el bloque `ProfessionalService` del `<head>`, `PLANES` y `COMPLEMENTOS` de `generador/generar.py`, la página `generador/paginas/automatizaciones.html` y `llms.txt`.
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
| "Pon la web de Halloween / Navidad / Día de la Madre / Black Friday / otoño..." | `css/tema.css` → línea `@import` |
| "Quita el tema" / "deja la web como siempre" | `css/tema.css` → `@import url("temas/original.css");` y vaciar `:root` |
| "Cambia los colores de la web" | `css/tema.css` → variables en `:root` |
| "Cambia el color de los botones" | `css/tema.css` → `--color-boton`, `--color-boton-hover`, `--color-boton-activo` |
| "Cambia el color principal de la marca" | `css/styles.css` → `--color-primario`; opcional `css/legal.css` |
| "Cambia el título principal" | `index.html` → `<h1>` de `#inicio` (opcional: `<title>` y `og:title`) |
| "Cambia el WhatsApp" | `index.html` → botón flotante (`href` y `aria-label`) |
| "Cambia el texto de servicios" | `index.html` → `#servicios` |
| "Pon las publicaciones reales" | `index.html` → `.hero-mosaico` y `#trabajos` (instrucciones en sus comentarios `CONFIRMAR`) |
| "Oculta la sección X" | `index.html` → atributo `hidden` en la sección |
| "Cambia una pregunta frecuente" | `index.html` → `#preguntas` y bloque `FAQPage` del `<head>` |

## No modificar

`package.json`, `netlify.toml`, `_redirects`, `_headers`, `CNAME`, `*.config.js`, `tsconfig.json`, `.env*`, `.github/`, `netlify/functions/`.
No añadas claves, tokens ni contraseñas. La URL del webhook de `js/main.js` es pública por diseño.
`docx_document.xml` es un documento de origen de los textos legales; no forma parte de la web.

## Páginas interiores (servicios, sectores, plantillas, Estepona y Marbella)

Se generan con un script a partir de `generador/paginas/*.html`. **No edites a mano** las carpetas
`servicios/`, `sectores/`, `plantillas/` ni `estepona-marbella/`, ni `sitemap.xml`: se sobrescriben.

1. Edita (o duplica) el archivo de `generador/paginas/`. Arriba lleva un bloque de datos: URL, título,
   descripción, H1, preguntas frecuentes, plan recomendado, páginas relacionadas…
2. Ejecuta `python generador/generar.py` desde la carpeta de la web.
3. Sube los cambios. El script rehace las páginas y `sitemap.xml`.

Regla de calidad: cada página nueva necesita contenido propio (ejemplos, problemas y reseñas de ese sector).
No crees páginas que solo cambien el nombre de una ciudad o un sector.
Si cambian los precios o los vídeos de `index.html`, cámbialos también en `PLANES`, `COMPLEMENTOS` y `VIDEOS` de `generador/generar.py`.

Marcadores que entiende el generador dentro del contenido de una página:
- `{{lista:/carpeta/}}`: tarjetas con todas las páginas que cuelgan de esa carpeta.
- `{{tarjetas:/url-1/,/url-2/}}`: tarjetas de las páginas indicadas, en ese orden.
- `{{video:web}}`, `{{video:redes}}`, `{{video:resenas}}`: vídeo de demostración.
- `{{precio:resenas}}`, `{{precio:publicar}}`, `{{precio:web}}`: precio de un complemento.

En la cabecera de datos, `"plan"` muestra los tres planes con uno destacado (`google`, `redes` o `total`) y `"complemento"` muestra el precio de una automatización (`resenas`, `publicar` o `web`).
