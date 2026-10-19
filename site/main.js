// Joshua Sajor · portfolio interactions. No dependencies.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---- nav background + mobile menu ----
  const nav = $('[data-nav]');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('menu-open', open);
    nav.classList.toggle('scrolled', open || scrollY > 24);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  // ---- Philippine local time ----
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
  const tick = () => {
    const t = fmt.format(new Date());
    $$('[data-clock]').forEach((el) => { el.textContent = t; });
    $$('[data-clock-long]').forEach((el) => { el.textContent = `Philippines · ${t}`; });
  };
  tick();
  setInterval(tick, 20000);

  // ---- ID badge: pointer tilt + holo glare ----
  const rig = $('[data-badge-rig]');
  const badge = $('[data-badge]');
  if (rig && badge) {
    setTimeout(() => rig.classList.add('idle'), 2400);
    if (fine && !reduce) {
      let raf = 0;
      const area = $('.hero');
      area.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = badge.getBoundingClientRect();
          const x = Math.min(1.4, Math.max(-1.4, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.6)));
          const y = Math.min(1.4, Math.max(-1.4, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.6)));
          badge.classList.add('live');
          badge.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
          badge.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
          badge.style.setProperty('--mx', `${(50 + x * 40).toFixed(1)}%`);
          badge.style.setProperty('--my', `${(40 + y * 40).toFixed(1)}%`);
        });
      });
      area.addEventListener('pointerleave', () => {
        badge.classList.remove('live');
        ['--rx', '--ry'].forEach((p) => badge.style.setProperty(p, '0deg'));
        badge.style.setProperty('--mx', '50%');
        badge.style.setProperty('--my', '30%');
      });
    }
  }

  // ---- reveal on scroll ----
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));

  // ---- statement: words light up as you read ----
  const lit = $('[data-lit]');
  if (lit && !reduce) {
    const words = lit.textContent.trim().split(/\s+/);
    lit.setAttribute('aria-label', lit.textContent.trim());
    lit.innerHTML = words.map((w) => `<span class="word" aria-hidden="true">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ');
    const spans = $$('.word', lit);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = lit.getBoundingClientRect();
      const start = innerHeight * 0.85, end = innerHeight * 0.35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---- CRM screen tabs ----
  for (const root of $$('[data-tabs]')) {
    const tabs = $$('[role="tab"]', root);
    const select = (tab, focus) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) {
          const img = $('img[data-src]', panel);
          if (img) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; img.removeAttribute('data-src'); }
        }
      }
      if (focus) { tab.focus(); tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t, false));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        let j = null;
        if (k === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    // warm the other screens once the section is near
    const warm = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      warm.disconnect();
      setTimeout(() => $$('img[data-src]', root).forEach((img) => { const pre = new Image(); pre.srcset = img.dataset.srcset; pre.sizes = img.sizes; pre.src = img.dataset.src; }), 1200);
    }, { rootMargin: '400px' });
    warm.observe(root);
  }

  // ---- demo cards: hover scrolls the whole page ----
  if (fine && !reduce) {
    for (const shot of $$('.shot[data-full]')) {
      let full = null;
      const start = () => {
        if (!full) {
          full = new Image();
          full.className = 'shot-full';
          full.alt = '';
          full.decoding = 'async';
          full.src = shot.dataset.full;
          shot.appendChild(full);
        }
        const go = () => {
          const dist = full.getBoundingClientRect().height - shot.getBoundingClientRect().height;
          if (dist < 40) return;
          shot.style.setProperty('--dist', `${dist}px`);
          shot.style.setProperty('--dur', `${Math.min(14, Math.max(3, dist / 260))}s`);
          shot.classList.remove('leaving');
          requestAnimationFrame(() => shot.classList.add('scrolling'));
        };
        if (full.complete && full.naturalHeight) go(); else full.addEventListener('load', go, { once: true });
      };
      const stop = () => {
        if (!shot.classList.contains('scrolling')) return;
        shot.classList.remove('scrolling');
        shot.classList.add('leaving');
      };
      shot.addEventListener('pointerenter', start);
      shot.addEventListener('pointerleave', stop);
      shot.addEventListener('focus', start);
      shot.addEventListener('blur', stop);
    }
  }

  // ---- copy email ----
  const live = $('[data-live]');
  for (const btn of $$('[data-copy]')) {
    btn.addEventListener('click', async () => {
      const label = btn.querySelector('span');
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        label.textContent = 'Copied';
        live.textContent = 'Email address copied';
      } catch {
        label.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { label.textContent = 'Copy'; }, 2200);
    });
  }
})();
