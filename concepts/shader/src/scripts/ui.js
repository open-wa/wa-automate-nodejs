// Page interactions: copy, tabs, reveals, digit rolls. No libraries.

export function initCopy(onCopy) {
  for (const btn of document.querySelectorAll('[data-copy]')) {
    const label = btn.querySelector('[data-copy-label]');
    const idle = label ? label.textContent : '';
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
        ta.remove();
      }
      btn.dataset.state = ok ? 'copied' : 'failed';
      if (label) label.textContent = ok ? 'Copied' : 'Select + copy';
      const live = document.getElementById('live');
      if (live) live.textContent = ok ? 'Copied to clipboard' : 'Copy failed';
      if (ok && onCopy) onCopy();
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { btn.dataset.state = ''; if (label) label.textContent = idle; }, 1800);
    });
  }
}

export function initTabs() {
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; if (on) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); } }
      }
      const i = tabs.indexOf(tab);
      list.style.setProperty('--i', i);
      if (focus) tab.focus();
    };
    tabs.forEach((t) => t.addEventListener('click', () => select(t, false)));
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n >= 0) { e.preventDefault(); select(tabs[n], true); }
    });
  }
}

export function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach((el) => io.observe(el));
}
