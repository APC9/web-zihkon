---
name: adaptar-web-whatsapp
description: Adapta la web de un cliente de Zihkon para que sea editable por WhatsApp con la automatización de n8n (comando WEB, kit de temas, kit de restaurante con carta y sugerencia del día en foto o PDF). Úsala siempre que haya que preparar, revisar o dar de alta una web de cliente para el editor por WhatsApp, añadir temas de temporada, montar el carrusel de la carta o la sección de sugerencia del día, o comprobar si una web cumple los requisitos, aunque el usuario no nombre la skill.
---

# Adaptar una web a la automatización por WhatsApp de Zihkon

La referencia completa está en `references/REQUISITOS_WEBS.md` (copia de `auto-webs-n8n/docs/REQUISITOS_WEBS.md`). **Léela entera antes de cambiar nada**: contiene las reglas exactas (nombres de variables CSS, nombres de temas, `id` fijos, archivos protegidos) de las que depende la automatización.

## Cuándo se usa

- Dar de alta una web nueva para el editor por WhatsApp.
- Revisar por qué una petición por WhatsApp falla o acaba en revisión.
- Añadir el kit de temas (`css/tema.css` + `css/temas/`).
- Restaurantes: añadir el carrusel de la carta y la sección de sugerencia del día.

## Procedimiento

1. **Diagnóstico (sin cambiar nada).** Recorre la web y comprueba cada punto de "Obligatorios" y "Recomendados" de la referencia:
   - repo de GitHub + Netlify y rama;
   - código fuente editable, sin `dist/` ni archivos minificados;
   - tamaño de los archivos (aprox. 60.000 caracteres por archivo);
   - CSS aparte y colores en variables `var(--…)`;
   - secciones marcadas con `<!-- SECCIÓN: … -->` e `id` descriptivos;
   - `GUIA-EDICION.md` en la raíz;
   - imágenes en `img/` con nombres sin espacios ni tildes;
   - ningún secreto en el repositorio.

   Entrega una tabla **cumple / no cumple / qué hacer** y pregunta antes de tocar archivos.
2. **Base editable.**
   - Si falta, separa el CSS a `css/styles.css`.
   - Convierte los colores escritos a mano en variables con los **nombres estándar del kit**.
   - Marca las secciones con comentarios.
   - Crea `GUIA-EDICION.md` con el mapa de archivos, las secciones y "dónde está cada dato". Toma como modelo la de la web de Zihkon (`APC9/web-zihkon`).
3. **Kit de temas** (si se pide o la web no lo tiene). Sigue la sección "Kit de temas" de la referencia:
   - `css/tema.css` lleva el `@import` en la primera línea, después el `:root` de colores personalizados y después el bloque de decoración;
   - `css/temas/*.css` lleva solo variables, con los 16 nombres fijos;
   - cambia los selectores de decoración por las clases de esta web;
   - respeta `prefers-reduced-motion` y un contraste mínimo de 4.5:1.
4. **Kit de restaurante** (solo restaurantes). Sigue la sección "Kit de restaurante" de la referencia y usa las plantillas de `assets/`:
   - `assets/secciones-restaurante.html`: secciones `#sugerencia` (con `hidden`) y `#menu`. Van en `index.html`, la sugerencia antes de la carta, más el enlace `data-sugerencia-enlace hidden` en el menú de navegación;
   - `assets/datos-web.js` → `js/datos-web.js`, enlazado al final del `<body>` con `defer`;
   - `assets/carta.json` → `data/carta.json`. Si la web ya tiene la carta en imágenes, muévelas a `img/carta/AAAA-MM-DD/pagina-NN.jpg` y lístalas en `paginas`;
   - `assets/sugerencia.json` → `data/sugerencia.json` con `"visible": false`;
   - si la web tiene su propio carrusel o visor ampliado, adáptalo para que use las imágenes que inserta `datos-web.js` en lugar de imágenes escritas a mano;
   - añade a `GUIA-EDICION.md` la sección "Carta y sugerencia del día".
5. **Comprobación.** Abre la web en local y repasa las listas "Comprobación antes de dar de alta la web" de cada kit que hayas aplicado. Comprueba en móvil y en escritorio, y con la sugerencia visible y oculta.
6. **Alta en la base de datos.** Indica al usuario la fila que debe tener `client_websites`: `github_owner`, `github_repository`, `default_branch`, `netlify_site_id`, `website_url` y `active`. Recuérdale que el cliente debe estar activo en `clients`. No ejecutes SQL en producción sin su permiso explícito.

## Reglas que no se rompen

- **Nunca modificar** `package.json`, `netlify.toml`, `_redirects`, `_headers`, `CNAME`, `*.config.js`, `tsconfig.json`, `.env*`, `.github/` ni `netlify/functions/`.
- **No cambiar el diseño** al adaptar: con el tema `original` y la sugerencia oculta, la web debe verse exactamente igual que antes.
- **Nombres fijos en todas las webs**:
  - temas: `original`, `primavera`, `verano`, `otono`, `invierno`, `reyes`, `rebajas`, `san-valentin`, `dia-del-padre`, `pascua`, `dia-de-la-madre`, `vuelta-al-cole`, `halloween`, `black-friday`, `navidad`, `nochevieja`;
  - `id` de las secciones: `#sugerencia` y `#menu`.
- **La sugerencia del día**:
  - está siempre en el código y solo se muestra u oculta con `"visible"`;
  - no caduca;
  - forma parte del servicio web.
- **Comandos `CARTA` y `SUGERENCIA`**: implementados en "Zihkon - Web Editor via WhatsApp v3 (carta y sugerencia)", que aún está inactivo. Deja la web preparada y díselo al usuario; no prometas que ya funcionan hasta que se active.
- **Cambios en el repositorio**: trabaja en una rama y pregunta antes de hacer commit o push a la rama que publica Netlify.
