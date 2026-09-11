/* =========================================================
   Hidalgo & Ferrer Abogados — JS vanilla
   1. Header con estado al hacer scroll
   2. Menú móvil
   3. Animaciones de aparición al hacer scroll (IntersectionObserver)
   4. Contadores animados
   5. Nav activo según la sección visible (scrollspy)
   6. Botón "volver arriba"
   7. Validación del formulario (maqueta, sin backend)
   8. Año dinámico en el footer
   ========================================================= */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Header: fondo sólido a partir de cierto scroll
     --------------------------------------------------------- */
  var header = document.getElementById('header');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    header.classList.toggle('is-stuck', y > 40);

    if (toTop) {
      var visible = y > window.innerHeight * 0.8;
      if (visible) toTop.hidden = false;
      toTop.classList.toggle('is-visible', visible);
    }
  }

  // rAF throttle: evitamos trabajo en cada evento de scroll
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });

  onScroll();

  /* ---------------------------------------------------------
     2. Menú móvil
     --------------------------------------------------------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var overlay = document.getElementById('navOverlay');

  function openMenu() {
    nav.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Cerrar menú');
    document.body.classList.add('is-locked');
    overlay.hidden = false;
    // forzamos reflow para que la transición de opacidad se aplique
    void overlay.offsetWidth;
    overlay.classList.add('is-visible');
  }

  function closeMenu() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('is-locked');
    overlay.classList.remove('is-visible');
    window.setTimeout(function () {
      if (!nav.classList.contains('is-open')) overlay.hidden = true;
    }, reduceMotion ? 0 : 350);
  }

  burger.addEventListener('click', function () {
    if (nav.classList.contains('is-open')) closeMenu();
    else openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  // Cerrar al pulsar cualquier enlace interno del panel
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  // Si se ensancha la ventana con el menú abierto, lo cerramos
  window.addEventListener('resize', function () {
    if (window.innerWidth > 940) closeMenu();
  });

  /* ---------------------------------------------------------
     3. Animaciones de aparición al hacer scroll
     --------------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');

  // Escalonado: data-delay -> variable CSS --reveal-delay
  Array.prototype.forEach.call(revealables, function (el) {
    var delay = el.getAttribute('data-delay');
    if (delay) el.style.setProperty('--reveal-delay', delay);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // se anima una sola vez
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    Array.prototype.forEach.call(revealables, function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     4. Contadores animados
     --------------------------------------------------------- */
  var counters = document.querySelectorAll('.counter');

  function formatNumber(n) {
    // separador de millares al estilo español: 1.200
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.round(target * eased)) + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(counters, function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      el.textContent = formatNumber(target) + (el.getAttribute('data-suffix') || '');
    });
  } else {
    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(counters, function (el) {
      counterObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     5. Scrollspy: marca el enlace de la sección visible
     --------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      // De las secciones visibles, nos quedamos con la más cercana al inicio
      var visibles = entries.filter(function (e) { return e.isIntersecting; });
      if (!visibles.length) return;
      visibles.sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      setActive(visibles[0].target.id);
    }, {
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------------------------------------------------------
     6. Volver arriba
     --------------------------------------------------------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });
  }

  /* ---------------------------------------------------------
     7. Formulario de contacto (maqueta: no envía nada)
     --------------------------------------------------------- */
  var form = document.getElementById('contactForm');

  if (form) {
    var success = document.getElementById('formSuccess');
    var submitBtn = document.getElementById('submitBtn');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    function fieldWrap(input) {
      return input.closest('.field');
    }

    function showError(input, message) {
      var wrap = fieldWrap(input);
      var msg = document.getElementById('error-' + input.id);
      if (wrap) wrap.classList.add('has-error');
      if (msg) msg.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError(input) {
      var wrap = fieldWrap(input);
      var msg = document.getElementById('error-' + input.id);
      if (wrap) wrap.classList.remove('has-error');
      if (msg) msg.textContent = '';
      input.removeAttribute('aria-invalid');
    }

    function validateField(input) {
      var value = (input.value || '').trim();

      if (input.type === 'checkbox') {
        if (!input.checked) {
          showError(input, 'Debe aceptar la política de privacidad.');
          return false;
        }
        clearError(input);
        return true;
      }

      if (!value) {
        showError(input, 'Este campo es obligatorio.');
        return false;
      }

      if (input.id === 'nombre' && value.length < 3) {
        showError(input, 'Indique su nombre completo.');
        return false;
      }

      if (input.type === 'email' && !EMAIL_RE.test(value)) {
        showError(input, 'Introduzca un email válido.');
        return false;
      }

      if (input.id === 'mensaje' && value.length < 15) {
        showError(input, 'Describa su caso con algo más de detalle (mín. 15 caracteres).');
        return false;
      }

      clearError(input);
      return true;
    }

    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));

    // Validamos al salir del campo y limpiamos el error mientras se corrige
    required.forEach(function (input) {
      var evt = input.type === 'checkbox' ? 'change' : 'blur';
      input.addEventListener(evt, function () { validateField(input); });
      input.addEventListener('input', function () {
        if (fieldWrap(input) && fieldWrap(input).classList.contains('has-error')) {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      required.forEach(function (input) {
        var ok = validateField(input);
        if (!ok && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'center'
        });
        return;
      }

      // Simulación de envío — no hay backend en esta maqueta
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';
      success.hidden = true;

      window.setTimeout(function () {
        form.reset();
        required.forEach(clearError);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar solicitud';
        success.hidden = false;
      }, 900);
    });
  }

  /* ---------------------------------------------------------
     8. Año en el footer
     --------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();
