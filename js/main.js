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

  // Header: large at the top of the page, compact once scrolled (with hysteresis to avoid flicker)
  const header = document.querySelector('[data-header]');
  let compact = false;
  const onScroll = () => {
    if (!header) return;
    const y = window.scrollY;
    if (!compact && y > 80) compact = true;
    else if (compact && y < 16) compact = false;
    header.classList.toggle('scrolled', compact);
  };
  // Reserve the header's full (uncompacted) height so content never jumps when it shrinks
  const reserveHeaderSpace = () => {
    if (!header || header.classList.contains('scrolled')) return;
    document.documentElement.style.setProperty('--header-space', `${header.offsetHeight}px`);
  };
  reserveHeaderSpace();
  window.addEventListener('resize', reserveHeaderSpace);
  if (header) header.addEventListener('transitionend', reserveHeaderSpace);
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
    // (a sub-folder preview). After a Vite build the script is renamed, so fall back to the site root.
    const base = document.querySelector('script[src$="js/main.js"]')?.getAttribute('src').replace(/js\/main\.js$/, '') || '/';
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

  // Industry tiles: illustration drifts slightly with the cursor (mouse only, not for reduced motion)
  if (canHover.matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((tile) => {
      tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect();
        tile.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        tile.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
      tile.addEventListener('pointerleave', () => { tile.style.removeProperty('--px'); tile.style.removeProperty('--py'); });
    });
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
  // Enquiry forms (modal + contact page) are handled by js/enquiry.js
});
