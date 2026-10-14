"""
ZIHKON · GENERADOR DE PÁGINAS INTERIORES

Convierte cada archivo de generador/paginas/*.html (contenido propio de la página
+ cabecera de datos) en una página completa con cabecera, pie, datos para Google
y enlaces internos. También rehace sitemap.xml.

Uso (desde la carpeta de la web):   python generador/generar.py

Las páginas generadas son HTML normal: se suben tal cual a Netlify, sin compilar.
No edites las páginas generadas a mano: edita su archivo en generador/paginas/
y vuelve a ejecutar el script. index.html y las páginas legales no se tocan.
"""
import datetime, html, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA_PAGINAS = os.path.join(RAIZ, 'generador', 'paginas')
DOMINIO = 'https://zihkon.com'
WHATSAPP = 'https://wa.me/34604183676?text=Hola%2C%20quiero%20mi%20auditor%C3%ADa%20gratuita.%20Mi%20negocio%20es%3A%20'
PERFIL_GOOGLE = 'https://share.google/FHlGM56gGLZ9m7Grn'

# Los mismos planes que la sección #precios de index.html. Si cambian allí, cámbialos aquí.
PLANES = {
    'presencia': {'nombre': 'Presencia Local', 'precio': 79, 'alta': 190,
                  'incluye': ['Auditoría gratis', 'Respuesta automática de reseñas', 'Publicación semanal en Google']},
    'web': {'nombre': 'Web + Reseñas en piloto automático', 'precio': 120, 'alta': 590,
            'incluye': ['Auditoría gratis', 'Web inteligente gestionada por WhatsApp', 'Respuesta automática de reseñas']},
    '360': {'nombre': '360°', 'precio': 249, 'alta': 790,
            'incluye': ['Todo lo del plan Web + Reseñas', 'Publicación en Instagram, Facebook, TikTok y Google']},
}

# Los mismos vídeos que la sección #productos de index.html.
VIDEOS = {
    'web': {'archivo': 'zihkon-editor-web-whatsapp', 'ancho': 720, 'alto': 1280, 'fecha': '2026-10-12T22:49:00+02:00', 'duracion': 'PT1M3S',
            'nombre': 'Cómo cambiar tu web escribiendo un WhatsApp',
            'descripcion': 'Demostración del editor de Zihkon: el dueño del negocio escribe WEB y el cambio que pide, confirma con SÍ y la web se actualiza en minutos.'},
    'redes': {'archivo': 'zihkon-publicaciones-whatsapp', 'ancho': 1080, 'alto': 1920, 'fecha': '2026-10-14T10:18:00+02:00', 'duracion': 'PT59S',
              'nombre': 'Cómo publicar en Instagram, Facebook, TikTok y Google desde WhatsApp',
              'descripcion': 'Demostración: se envían las fotos por WhatsApp con el comando PUBLICAR, se cuenta qué comunicar y al confirmar con SÍ se publica en todas las redes.'},
    'resenas': {'archivo': 'zihkon-resenas-google', 'ancho': 1080, 'alto': 1920, 'fecha': '2026-10-14T15:47:00+02:00', 'duracion': 'PT43S',
                'nombre': 'Respuesta automática de reseñas de Google con IA',
                'descripcion': 'Demostración: la IA responde a las reseñas de Google con el tono del negocio y avisa por WhatsApp cuando una reseña necesita la opinión del dueño.'},
}

ICONO_WA = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.1Z"/><path d="M8.5 8.2c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.7 1.7c.1.3 0 .5-.1.7l-.5.6c-.2.2-.2.4 0 .7.6 1 1.4 1.8 2.5 2.3.3.1.5.1.7-.1l.7-.8c.2-.2.4-.3.7-.2l1.6.8c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.6-.5.4-1.2.6-2 .4-1-.2-2.3-.8-3.6-2-1.2-1.1-2-2.5-2.2-3.4-.3-.9 0-1.8.4-2.3Z"/></svg>'
ICONO_MAS = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'
NUEVA_PESTANA = '<span class="sr-only"> (se abre en una pestaña nueva)</span>'
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

# Reseña real del Perfil de Empresa en Google (la misma que en index.html). Sin datos estructurados:
# Google no muestra reseñas de un negocio publicadas en su propia web.
TESTIMONIO = ('<section class="testimonio" aria-label="Opinión de un cliente"><div class="wrap"><figure class="testimonio-card">'
              '<p class="testimonio-estrellas" aria-label="5 de 5 estrellas">★★★★★</p><blockquote><p>«Excelente trabajo y trato superprofesional. '
              'Gracias a sus estrategias he mejorado muchísimo la visibilidad de mi negocio en Google, posicionándome mucho mejor en las búsquedas locales. '
              'Ahora me encuentran más clientes potenciales todos los días. ¡Totalmente recomendados si quieres hacer crecer tu presencia online»</p></blockquote>'
              f'<figcaption><strong>Mercy Soteldo</strong> · <a href="{PERFIL_GOOGLE}" target="_blank" rel="noopener">Reseña en Google{NUEVA_PESTANA}</a></figcaption>'
              '</figure></div></section>')
NEGOCIO = {'@type': 'ProfessionalService', '@id': DOMINIO + '/#negocio', 'name': 'Zihkon'}


def e(texto):
    return html.escape(str(texto), quote=True)


def leer_paginas():
    paginas = []
    for nombre in sorted(os.listdir(CARPETA_PAGINAS)):
        if not nombre.endswith('.html'):
            continue
        ruta = os.path.join(CARPETA_PAGINAS, nombre)
        texto = open(ruta, encoding='utf-8').read()
        m = re.match(r'\s*<!--\s*(\{.*?\})\s*-->\s*', texto, re.S)
        if not m:
            sys.exit(f'{nombre}: falta la cabecera de datos <!-- {{...}} --> al principio')
        meta = json.loads(m.group(1))
        meta['cuerpo'] = texto[m.end():]
        meta['archivo'] = nombre
        meta['fecha_mod'] = datetime.date.fromtimestamp(os.path.getmtime(ruta)).isoformat()
        paginas.append(meta)
    return paginas


def tarjetas(urls, por_url):
    items = []
    for url in urls:
        p = por_url[url]
        items.append(f'<li><a class="tarjeta" href="{url}"><strong>{e(p["nombre"])}</strong><span>{e(p["resumen"])}</span></a></li>')
    return '<ul class="tarjetas">' + ''.join(items) + '</ul>'


def bloque_precios(plan_recomendado):
    tarjetas_plan = []
    for clave, plan in PLANES.items():
        destacado = clave == plan_recomendado
        insignia = '<p class="plan-insignia">Recomendado</p>' if destacado else ''
        incluye = ''.join(f'<li>{e(x)}</li>' for x in plan['incluye'])
        tarjetas_plan.append(
            f'<li class="plan{" plan--destacado" if destacado else ""}">{insignia}<h3>{e(plan["nombre"])}</h3>'
            f'<p class="plan-precio"><strong>{plan["precio"]} €</strong>/mes</p><p class="plan-alta">Alta: {plan["alta"]} €</p>'
            f'<ul>{incluye}</ul></li>')
    return ('<section class="bloque bloque--alterno" aria-labelledby="precios-titulo"><div class="wrap">'
            '<h2 class="section-title" id="precios-titulo">Precios</h2>'
            '<p class="section-lede">Sin permanencia y sin IVA. La primera factura incluye el alta y el primer mes. '
            '<a href="/#precios">Ver todos los detalles y los servicios sueltos</a>.</p>'
            f'<ul class="planes">{"".join(tarjetas_plan)}</ul></div></section>')


def bloque_video(clave):
    v = VIDEOS[clave]
    return (f'<figure class="pagina-video"><div class="product-media"><video controls playsinline preload="none" '
            f'poster="/video/{v["archivo"]}-poster.jpg" width="{v["ancho"]}" height="{v["alto"]}" aria-label="{e(v["nombre"])}">'
            f'<source src="/video/{v["archivo"]}-web.mp4" type="video/mp4">Tu navegador no puede reproducir este vídeo.</video></div>'
            f'<figcaption>{e(v["descripcion"])}</figcaption></figure>')


def bloque_faq(faq):
    items = []
    for i, (pregunta, respuesta) in enumerate(faq, 1):
        abierta = i == 1
        items.append(
            f'<article class="faq-item{" is-open" if abierta else ""}"><button class="faq-question" type="button" '
            f'aria-expanded="{"true" if abierta else "false"}" aria-controls="faq-respuesta-{i}">{e(pregunta)}{ICONO_MAS}</button>'
            f'<div class="faq-answer" id="faq-respuesta-{i}"><div><p>{respuesta}</p></div></div></article>')
    return ('<section class="faq" id="preguntas" aria-labelledby="faq-title"><div class="wrap faq-grid">'
            '<div><h2 class="section-title" id="faq-title">Preguntas frecuentes</h2>'
            '<p class="section-lede">Si tu pregunta no está aquí, escríbenos por WhatsApp.</p></div>'
            f'<div class="faq-list">{"".join(items)}</div></div></section>')


def datos_google(p, por_url):
    url = DOMINIO + p['url']
    grafo = []
    migas = [{'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': DOMINIO + '/'}]
    for i, miga in enumerate(p['migas'], 2):
        migas.append({'@type': 'ListItem', 'position': i, 'name': por_url[miga]['nombre'], 'item': DOMINIO + miga})
    grafo.append({'@type': 'BreadcrumbList', 'itemListElement': migas})

    tipo = p['tipo']
    if tipo in ('servicio', 'sector', 'local'):
        servicio = {'@type': 'Service', 'name': p['h1'], 'serviceType': p['servicio'], 'url': url,
                    'description': p['description'], 'provider': NEGOCIO,
                    'areaServed': {'@type': 'Country', 'name': 'España'}}
        if tipo == 'sector':
            servicio['audience'] = {'@type': 'BusinessAudience', 'audienceType': p['nombre']}
        if tipo == 'local':
            servicio['areaServed'] = [{'@type': 'City', 'name': 'Estepona'}, {'@type': 'City', 'name': 'Marbella'}]
        if p.get('plan'):
            plan = PLANES[p['plan']]
            servicio['offers'] = {'@type': 'Offer', 'name': plan['nombre'], 'price': str(plan['precio']), 'priceCurrency': 'EUR'}
        grafo.append(servicio)
    elif tipo == 'hub':
        grafo.append({'@type': 'CollectionPage', 'name': p['h1'], 'url': url, 'description': p['description'],
                      'isPartOf': {'@id': DOMINIO + '/#web'}})
    elif tipo == 'articulo':
        grafo.append({'@type': 'Article', 'headline': p['h1'], 'url': url, 'description': p['description'],
                      'inLanguage': 'es-ES', 'datePublished': p['publicado'], 'dateModified': p['fecha_mod'],
                      'author': {'@type': 'Person', '@id': DOMINIO + '/#alberto', 'name': 'Alberto Peña'},
                      'publisher': NEGOCIO, 'image': DOMINIO + '/img/zihkon-og.jpg'})
    if p.get('video'):
        v = VIDEOS[p['video']]
        grafo.append({'@type': 'VideoObject', 'name': v['nombre'], 'description': v['descripcion'],
                      'thumbnailUrl': f'{DOMINIO}/video/{v["archivo"]}-poster.jpg',
                      'contentUrl': f'{DOMINIO}/video/{v["archivo"]}-web.mp4',
                      'uploadDate': v['fecha'], 'duration': v['duracion'], 'inLanguage': 'es-ES'})
    if p.get('faq'):
        grafo.append({'@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}}
            for q, a in p['faq']]})
    return json.dumps({'@context': 'https://schema.org', '@graph': grafo}, ensure_ascii=False, indent=2)


def montar(p, por_url):
    cuerpo = re.sub(r'\{\{lista:([^}]+)\}\}', lambda m: tarjetas(
        [u for u in por_url if u.startswith(m.group(1)) and u != m.group(1) and u.count('/') == m.group(1).count('/') + 1], por_url), p['cuerpo'])
    for clave in VIDEOS:
        cuerpo = cuerpo.replace('{{video:%s}}' % clave, bloque_video(clave))

    migas_html = '<li><a href="/">Inicio</a></li>' + ''.join(
        f'<li><a href="{u}">{e(por_url[u]["nombre"])}</a></li>' if u != p['url'] else f'<li><span aria-current="page">{e(p["nombre"])}</span></li>'
        for u in p['migas'])
    relacionadas = ''
    if p.get('relacionadas'):
        relacionadas = ('<section class="bloque" aria-labelledby="relacionadas-titulo"><div class="wrap">'
                        '<h2 class="section-title" id="relacionadas-titulo">También te puede interesar</h2>'
                        f'{tarjetas(p["relacionadas"], por_url)}</div></section>')
    precios = bloque_precios(p['plan']) if p.get('plan') else ''
    testimonio = TESTIMONIO if p['tipo'] in ('servicio', 'sector', 'local') else ''
    f = datetime.date.fromisoformat(p['fecha_mod'])
    fecha_visible = f'{f.day} de {MESES[f.month - 1]} de {f.year}'
    faq = bloque_faq(p['faq']) if p.get('faq') else ''

    return f'''<!doctype html>
<html lang="es">
<head>
  <!-- PÁGINA GENERADA por generador/generar.py a partir de generador/paginas/{p["archivo"]}. No la edites a mano. -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f7f9">
  <title>{e(p["title"])}</title>
  <meta name="description" content="{e(p["description"])}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{DOMINIO}{p["url"]}">
  <meta property="og:type" content="{"article" if p["tipo"] == "articulo" else "website"}">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Zihkon">
  <meta property="og:title" content="{e(p["title"])}">
  <meta property="og:description" content="{e(p["description"])}">
  <meta property="og:url" content="{DOMINIO}{p["url"]}">
  <meta property="og:image" content="{DOMINIO}/img/zihkon-og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Young+Serif&display=swap" rel="stylesheet">
  <link rel="icon" href="/img/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
  <script type="application/ld+json">
{datos_google(p, por_url)}
  </script>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/secciones.css">
  <link rel="stylesheet" href="/css/paginas.css">
  <link rel="stylesheet" href="/css/tema.css">
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="topbar" id="cabecera">
    <nav class="nav wrap" aria-label="Navegación principal">
      <a class="brand" href="/" aria-label="ZIHKON® (inicio)"><picture><source srcset="/img/zihkon-logo.webp" type="image/webp"><img src="/img/zihkon-logo.png" alt="ZIHKON®" width="97" height="50"></picture></a>
      <div class="nav-links" id="nav-links">
        <a href="/servicios/">Servicios</a>
        <a href="/sectores/">Sectores</a>
        <a href="/#precios">Precios</a>
        <a href="/#quien">Quién soy</a>
      </div>
      <a class="button" href="/#contacto">Pide tu auditoría</a>
      <button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-links"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </nav>
  </header>

  <main id="contenido">
    <section class="pagina-hero" aria-labelledby="pagina-titulo">
      <div class="wrap">
        <nav class="migas" aria-label="Estás en"><ol>{migas_html}</ol></nav>
        <p class="hero-place">{e(p["eyebrow"])}</p>
        <h1 id="pagina-titulo">{e(p["h1"])}</h1>
        <p class="pagina-lede">{p["lede"]}</p>
        <p class="pagina-firma">Por <a href="/#quien">Alberto Peña</a>, fundador de Zihkon · Actualizado el <time datetime="{p["fecha_mod"]}">{fecha_visible}</time></p>
        <div class="hero-actions">
          <a class="button" href="/#contacto">Pide tu auditoría gratis</a>
          <a class="button button--light button--wa" href="{WHATSAPP}" target="_blank" rel="noopener noreferrer">{ICONO_WA}Pregunta por WhatsApp{NUEVA_PESTANA}</a>
        </div>
      </div>
    </section>
{cuerpo}
{testimonio}
{precios}
{faq}
{relacionadas}
    <section class="final-cta" aria-labelledby="final-title">
      <div class="wrap final-inner">
        <h2 class="section-title" id="final-title">Empieza con una auditoría gratis.</h2>
        <p>Te decimos qué está frenando tu negocio en Google y cómo arreglarlo desde WhatsApp.</p>
        <div class="final-actions">
          <a class="button button--lime" href="/#contacto">Pide tu auditoría gratis</a>
          <a class="button button--ghost" href="{WHATSAPP}" target="_blank" rel="noopener noreferrer">{ICONO_WA}Pídela por WhatsApp{NUEVA_PESTANA}</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer" id="pie">
    <div class="wrap">
      <div class="footer-inner">
        <a class="brand" href="/"><picture><source srcset="/img/zihkon-logo.webp" type="image/webp"><img src="/img/zihkon-logo.png" alt="" width="54" height="28" loading="lazy"></picture><span>ZIHKON®</span></a>
        <nav class="footer-links" aria-label="Enlaces del pie"><a href="/servicios/">Servicios</a><a href="/sectores/">Sectores</a><a href="/plantillas/respuestas-resenas/">Respuestas a reseñas</a><a href="/estepona-marbella/">Estepona y Marbella</a><a href="/#contacto">Contacto</a></nav>
        <p>Tu web, tus redes y tus reseñas de Google, desde WhatsApp. Para negocios de toda España.</p>
        <p class="footer-nap">Zihkon · Estepona (Málaga) · <a href="tel:+34604183676">+34 604 18 36 76</a> · <a href="{PERFIL_GOOGLE}" target="_blank" rel="noopener">Perfil de Google{NUEVA_PESTANA}</a></p>
      </div>
      <div class="footer-bottom">
        <nav class="footer-legal" aria-label="Información legal"><a href="/privacidad.html">Política de privacidad</a><a href="/cookies.html">Política de cookies</a><a href="/seguridad.html">Política de seguridad</a><a href="/aviso-legal.html">Aviso legal</a></nav>
      </div>
      <p class="footer-copy">© <span id="current-year">{datetime.date.today().year}</span> ZIHKON®. Todos los derechos reservados.</p>
    </div>
  </footer>

  <a class="whatsapp-float" href="{WHATSAPP}" target="_blank" rel="noopener noreferrer" aria-label="Escribir a Zihkon por WhatsApp al +34 604 18 36 76">{ICONO_WA}<span>WhatsApp</span></a>

  <aside class="cookie-banner" id="cookie-banner" aria-label="Aviso de cookies" hidden>
    <div><strong>Tu privacidad importa</strong><p>Este sitio utiliza almacenamiento local para recordar tu aceptación. Consulta la <a href="/cookies.html">política de cookies</a>.</p></div>
    <button class="button" id="accept-cookies" type="button">Aceptar</button>
  </aside>

  <script src="/js/main.js"></script>
</body>
</html>
'''


def sitemap(paginas):
    fecha_home = datetime.date.fromtimestamp(os.path.getmtime(os.path.join(RAIZ, 'index.html'))).isoformat()
    urls = [('/', fecha_home)] + [(p['url'], p['fecha_mod']) for p in paginas]
    filas = ''.join(f'  <url>\n    <loc>{DOMINIO}{u}</loc>\n    <lastmod>{f}</lastmod>\n  </url>\n' for u, f in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<!-- GENERADO por generador/generar.py: no lo edites a mano. Las páginas legales llevan "noindex" y no aparecen aquí. -->\n'
            f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{filas}</urlset>\n')


def main():
    paginas = leer_paginas()
    por_url = {p['url']: p for p in paginas}
    for p in paginas:
        for u in p.get('relacionadas', []) + p['migas']:
            if u not in por_url:
                sys.exit(f'{p["archivo"]}: enlaza a {u}, que no existe en generador/paginas/')
        destino = os.path.join(RAIZ, p['url'].strip('/'), 'index.html')
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'w', encoding='utf-8', newline='\n') as f:
            f.write(montar(p, por_url))
        print('ok', p['url'])
    with open(os.path.join(RAIZ, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(sitemap(paginas))
    print('ok sitemap.xml')


if __name__ == '__main__':
    main()
