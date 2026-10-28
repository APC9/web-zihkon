/* =========================================================
   ZIHKON · COMPORTAMIENTO DE LA PÁGINA PRINCIPAL
   Solo lógica (año, cookies, menú móvil, FAQ, pestañas).
   Los textos visibles de la web están en index.html.
   ========================================================= */

// ---------- Año actual en el pie ----------
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Aviso de cookies (consentimiento para Google Tag Manager) ----------
// El <head> de cada página arranca Google con todo denegado salvo que aquí se haya guardado 'accepted'.
const cookieBanner = document.getElementById('cookie-banner');
const cookieConsentKey = 'zihkon-cookies';
try {
  cookieBanner.hidden = ['accepted', 'rejected'].includes(localStorage.getItem(cookieConsentKey));
} catch {
  cookieBanner.hidden = false;
}
const saveCookieChoice = (choice) => {
  try {
    localStorage.setItem(cookieConsentKey, choice);
  } catch {}
  const value = choice === 'accepted' ? 'granted' : 'denied';
  if (typeof gtag === 'function') {
    gtag('consent', 'update', { ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value });
  }
  cookieBanner.hidden = true;
};
document.getElementById('accept-cookies').addEventListener('click', () => saveCookieChoice('accepted'));
document.getElementById('reject-cookies').addEventListener('click', () => saveCookieChoice('rejected'));

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

// ---------- Demostración del hero: botón "Ver otra vez" ----------
// La animación es solo CSS (css/secciones.css). Aquí solo se reinicia.
const demo = document.getElementById('demo');
if (demo) {
  const stage = demo.querySelector('.demo-stage');
  const replay = demo.querySelector('.demo-replay');
  const showReplay = () => { replay.hidden = false; };
  setTimeout(showReplay, 5000);
  replay.addEventListener('click', () => {
    stage.classList.add('demo--reset');
    void stage.offsetWidth; // fuerza al navegador a empezar la animación de cero
    stage.classList.remove('demo--reset');
  });
}

// ---------- Productos en pestañas (Tu web / Tus redes / Tus reseñas) ----------
// Sin JavaScript se ven los tres productos seguidos.
const tabList = document.querySelector('.product-tabs');
if (tabList) {
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const selectTab = (index, moveFocus) => {
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[i].hidden = !isActive;
      if (!isActive) panels[i].querySelectorAll('video').forEach((video) => video.pause());
    });
    panels[index].classList.remove('is-entering');
    void panels[index].offsetWidth;
    panels[index].classList.add('is-entering');
    if (moveFocus) tabs[index].focus();
  };
  tabs.forEach((tab, i) => {
    panels[i].setAttribute('aria-labelledby', tab.id);
    panels[i].tabIndex = 0;
    tab.addEventListener('click', () => selectTab(i, false));
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      selectTab((keys[event.key] + tabs.length) % tabs.length, true);
    });
  });
  tabList.hidden = false;
  tabs.forEach((tab, i) => { panels[i].hidden = i !== 0; });
}

