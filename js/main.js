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
    window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  // Mobile menu sections (accordion)
  document.querySelectorAll('.m-head').forEach((head) => {
    head.addEventListener('click', () => {
      const open = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', String(open));
      document.getElementById(head.getAttribute('aria-controls')).hidden = !open;
    });
  });

  // Desktop dropdowns: hover on mouse, click/tap on touch, full keyboard support
  const menus = [...document.querySelectorAll('[data-menu]')];
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const setMenu = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.sub-toggle').setAttribute('aria-expanded', String(open));
  };
  const closeAll = (except) => menus.forEach((m) => { if (m !== except) setMenu(m, false); });
  menus.forEach((item) => {
    const link = item.querySelector('.nav-link');
    const btn = item.querySelector('.sub-toggle');
    const items = () => [...item.querySelectorAll('.dropdown a')];
    let timer;
    item.addEventListener('mouseenter', () => { if (!canHover.matches) return; clearTimeout(timer); closeAll(item); setMenu(item, true); });
    item.addEventListener('mouseleave', () => { if (!canHover.matches) return; timer = setTimeout(() => setMenu(item, false), 150); });
    btn.addEventListener('click', () => { const open = !item.classList.contains('is-open'); closeAll(item); setMenu(item, open); if (open && !canHover.matches) items()[0]?.focus(); });
    // On touch screens the first tap on a top-level label opens its menu; a second tap follows the link
    link.addEventListener('click', (e) => {
      if (canHover.matches || item.classList.contains('is-open')) return;
      e.preventDefault(); closeAll(item); setMenu(item, true);
    });
    item.addEventListener('keydown', (e) => {
      const list = items();
      const idx = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); setMenu(item, true); (list[idx + 1] || list[0]).focus(); }
      else if (e.key === 'ArrowUp' && idx > -1) { e.preventDefault(); (list[idx - 1] || list[list.length - 1]).focus(); }
      else if (e.key === 'Escape' && item.classList.contains('is-open')) { e.preventDefault(); setMenu(item, false); btn.focus(); }
      else if (e.key === 'Home' && idx > -1) { e.preventDefault(); list[0].focus(); }
      else if (e.key === 'End' && idx > -1) { e.preventDefault(); list[list.length - 1].focus(); }
    });
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) setMenu(item, false); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-menu]')) closeAll(); });

  // Site search (header utility bar)
  const searchDialog = document.getElementById('site-search');
  if (searchDialog && typeof searchDialog.showModal === 'function') {
    const input = searchDialog.querySelector('#search-input');
    const results = searchDialog.querySelector('#search-results');
    let index = null;
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // Index URLs are root-relative; resolve them against wherever main.js was loaded from
    const base = document.querySelector('script[src$="js/main.js"]').getAttribute('src').replace(/js\/main\.js$/, '');
    const href = (u) => (base === '/' ? u : base + u.slice(1));
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (!q || !index) { results.innerHTML = ''; return; }
      const terms = q.split(/\s+/);
      const hits = index
        .map((r) => ({ r, score: terms.reduce((s, t) => s + (r.t.toLowerCase().includes(t) ? 3 : 0) + (r.d.toLowerCase().includes(t) ? 1 : 0), 0) }))
        .filter((h) => terms.every((t) => (h.r.t + ' ' + h.r.d).toLowerCase().includes(t)))
        .sort((a, b) => b.score - a.score).slice(0, 8);
      results.innerHTML = hits.length
        ? hits.map(({ r }) => `<li><a href="${esc(href(r.u))}"><strong>${esc(r.t)}</strong><span>${esc(r.d)}</span></a></li>`).join('')
        : `<li class="search-empty">No results for “${esc(input.value.trim())}”.</li>`;
    };
    document.querySelectorAll('[data-search-open]').forEach((b) => b.addEventListener('click', async () => {
      searchDialog.showModal(); input.focus();
      if (!index) {
        try { index = await (await fetch(href('/js/search-index.json'))).json(); } catch (err) { index = []; }
        render();
      }
    }));
    searchDialog.querySelector('[data-search-close]').addEventListener('click', () => searchDialog.close());
    searchDialog.addEventListener('click', (e) => { if (e.target === searchDialog) searchDialog.close(); });
    searchDialog.querySelector('[data-search-form]').addEventListener('submit', (e) => { e.preventDefault(); results.querySelector('a')?.click(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); results.querySelector('a')?.focus(); } });
    results.addEventListener('keydown', (e) => {
      const links = [...results.querySelectorAll('a')]; const i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[i + 1]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (links[i - 1] || input).focus(); }
    });
  }

  // Hero carousel
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const dots = [...carousel.querySelectorAll('[data-dot]')];
    const live = carousel.querySelector('[data-slides]');
    let current = 0; let auto;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const show = (n, user) => {
      current = (n + slides.length) % slides.length;
      slides.forEach((sl, i) => { const on = i === current; sl.classList.toggle('is-active', on); sl.inert = !on; });
      dots.forEach((d, i) => (i === current ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
      if (user) { live.setAttribute('aria-live', 'polite'); stop(); }
    };
    const stop = () => clearInterval(auto);
    carousel.querySelector('[data-prev]').addEventListener('click', () => show(current - 1, true));
    carousel.querySelector('[data-next]').addEventListener('click', () => show(current + 1, true));
    dots.forEach((d) => d.addEventListener('click', () => show(Number(d.dataset.dot), true)));
    carousel.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowLeft') show(current - 1, true);
      if (e.key === 'ArrowRight') show(current + 1, true);
    });
    // Gentle auto-advance; pauses on hover/focus and stops after any interaction
    if (!reduce && slides.length > 1) {
      auto = setInterval(() => show(current + 1), 8000);
      carousel.addEventListener('mouseenter', stop);
      carousel.addEventListener('focusin', stop);
    }
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
    const fromHash = () => {
      const btn = filters.querySelector(`[data-filter="${CSS.escape(location.hash.slice(1))}"]`);
      if (btn) btn.click();
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
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
