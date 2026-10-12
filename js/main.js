// Alfa Steam Engineers & Consultants — site behaviour (no dependencies)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  // Light / dark theme toggle (choice remembered per browser; otherwise follows the OS)
  const root = document.documentElement;
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const syncThemeBtn = () => {
    if (themeBtn) themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  syncThemeBtn();
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('asecon-theme', next); } catch (e) { /* storage unavailable */ }
      syncThemeBtn();
    });
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      let saved = null;
      try { saved = localStorage.getItem('asecon-theme'); } catch (err) { /* ignore */ }
      if (!saved) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); syncThemeBtn(); }
    });
  }

  // Sticky header shadow
  const header = document.querySelector('[data-header]');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile navigation
  const toggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileNav.hidden = !open;
    };
    toggle.addEventListener('click', () => setOpen(mobileNav.hidden));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileNav.hidden) { setOpen(false); toggle.focus(); } });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  // Hero video: never play for reduced-motion users; pause when off-screen
  const heroVideo = document.querySelector('[data-hero-video]');
  if (heroVideo) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) heroVideo.pause();
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause(); }).observe(heroVideo);
    }
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // Product category filters
  const filters = document.querySelector('[data-filters]');
  const grid = document.querySelector('[data-products]');
  if (filters && grid) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const cat = btn.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      grid.querySelectorAll('[data-cat]').forEach((card) => {
        card.hidden = cat !== 'all' && card.dataset.cat !== cat;
        card.classList.add('in');
      });
    });
  }

  // Enquiry form: prefill from query string, validate, submit via Netlify Forms
  const form = document.querySelector('[data-enquiry-form]');
  if (form) {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    const product = params.get('product');
    const select = form.querySelector('[name="service"]');
    if (service && select && select.querySelector(`option[value="${CSS.escape(service)}"]`)) select.value = service;
    if (product) {
      if (select) select.value = 'components';
      const msg = form.querySelector('[name="message"]');
      if (msg && !msg.value) msg.value = `Enquiry for: ${product}\n\nSize / rating / quantity: `;
    }

    const errorBox = form.querySelector('[data-form-error]');
    const success = document.querySelector('[data-form-success]');

    const validateField = (input) => {
      const field = input.closest('.field');
      let msg = '';
      if (input.required && !input.value.trim()) msg = 'This field is required.';
      else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = 'Please enter a valid email address.';
      else if (input.type === 'tel' && input.value && input.value.replace(/\D/g, '').length < 7) msg = 'Please enter a valid phone number.';
      field.classList.toggle('invalid', !!msg);
      input.setAttribute('aria-invalid', String(!!msg));
      let note = field.querySelector('.field-msg');
      if (msg) {
        if (!note) {
          note = document.createElement('span');
          note.className = 'field-msg';
          note.id = `${input.id}-msg`;
          field.appendChild(note);
          input.setAttribute('aria-describedby', note.id);
        }
        note.textContent = msg;
      } else if (note) {
        note.remove();
        input.removeAttribute('aria-describedby');
      }
      return !msg;
    };

    form.querySelectorAll('input[required], textarea[required], input[type="email"], input[type="tel"]').forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      // Clear errors while typing so the layout doesn't shift under a pending click
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('invalid')) validateField(input); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.hidden = true;
      const inputs = [...form.querySelectorAll('.field input, .field textarea')];
      const results = inputs.map(validateField);
      if (results.includes(false)) {
        const first = inputs[results.indexOf(false)];
        first.focus();
        return;
      }
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.hidden = true;
        success.hidden = false;
        success.focus();
      } catch (err) {
        errorBox.textContent = 'Sorry — your enquiry could not be sent right now. Please try again in a moment, or contact us directly using the details on this page.';
        errorBox.hidden = false;
      } finally {
        button.disabled = false;
      }
    });
  }
});
