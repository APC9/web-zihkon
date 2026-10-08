/* =========================================================
   ZIHKON · COMPORTAMIENTO DE LA PÁGINA PRINCIPAL
   Solo lógica (año, cookies, menú móvil, FAQ, formulario).
   Los textos visibles de la web están en index.html.
   ========================================================= */

// ---------- Año actual en el pie ----------
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Aviso de cookies ----------
const cookieBanner = document.getElementById('cookie-banner');
const cookieAcceptanceKey = 'zihkon-cookie-consent';
try {
  cookieBanner.hidden = localStorage.getItem(cookieAcceptanceKey) === 'accepted';
} catch {
  cookieBanner.hidden = false;
}
document.getElementById('accept-cookies').addEventListener('click', () => {
  try {
    localStorage.setItem(cookieAcceptanceKey, 'accepted');
  } catch {}
  cookieBanner.hidden = true;
});

// ---------- Menú móvil ----------
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  navLinks.classList.toggle('is-open', !isOpen);
});
const closeMenu = () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  navLinks.classList.remove('is-open');
};
navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
// Escape cierra el menú y devuelve el foco al botón
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});

// ---------- Enlace activo del menú según la sección visible ----------
const navItems = [...navLinks.querySelectorAll('a[href^="#"]')];
const navSections = navItems.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && navSections.length) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navItems.forEach((link) => {
        if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  // #inicio no tiene enlace: al volver arriba se desmarca todo
  [document.getElementById('inicio'), ...navSections].filter(Boolean).forEach((section) => navObserver.observe(section));
}

// ---------- Preguntas frecuentes (acordeón) ----------
document.querySelectorAll('.faq-question').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const willOpen = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.faq-item').forEach((otherItem) => {
      otherItem.classList.remove('is-open');
      otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('is-open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
  });
});

// ---------- Formulario de contacto → n8n ----------
// Pruebas: usa /webhook-test/ (con "Listen for test event" activo). Producción: /webhook/ con el workflow activado.
const N8N_WEBHOOK_URL = 'https://n8n.zihkon.cloud/webhook/zihkon-auditoria';

// Mensajes que ve el usuario al enviar el formulario
const FORM_MESSAGES = {
  sending: 'Enviando tu solicitud…',
  success: '¡Solicitud recibida! Revisaremos tu negocio y te contactaremos pronto.',
  error: 'No hemos podido enviar la solicitud. Inténtalo de nuevo o escríbenos a hola@zihkon.com.'
};

document.getElementById('lead-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const details = new FormData(form);
  if (details.get('web_check')) return; // honeypot: era un bot

  const val = (key) => String(details.get(key) || '').trim();
  const payload = {
    // Campos que espera el flujo de auditoría
    nombre_cliente: val('name'),
    nombre_negocio: val('business'),
    email: val('email'),
    telefono: val('phone'),
    tipo_negocio: val('sector'),
    direccion: [val('address'), val('city')].filter(Boolean).join(', '),
    objetivo: val('message'),
    // Extras para fases futuras (el flujo actual los ignora)
    web: val('website'),
    url_google_maps: val('maps'),
    consentimiento: details.get('consent') === 'on',
    origen: 'web-zihkon'
  };

  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.dataset.state = 'sending'; // solo cambia el estilo del mensaje (css/secciones.css)
  status.textContent = FORM_MESSAGES.sending;
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    form.reset();
    status.dataset.state = 'success';
    status.textContent = FORM_MESSAGES.success;
  } catch (error) {
    console.error('Error enviando a n8n:', error);
    status.dataset.state = 'error';
    status.textContent = FORM_MESSAGES.error;
  } finally {
    button.disabled = false;
  }
});
