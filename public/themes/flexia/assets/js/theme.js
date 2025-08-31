// Flexia theme JS: nav toggle, theme toggle, and basic a11y helpers
(() => {
  // Mobile nav toggle + UX improvements
  const nav = document.querySelector('.site-nav');
  const btn = document.querySelector('[data-nav-toggle]');
  const menu = document.getElementById('primary-menu');
  if (nav && btn && menu) {
    const setExpanded = (expanded) => {
      btn.setAttribute('aria-expanded', String(expanded));
      nav.setAttribute('aria-expanded', String(expanded));
      document.body.classList.toggle('nav-open', expanded);
    };

    btn.addEventListener('click', () => {
      const next = btn.getAttribute('aria-expanded') !== 'true';
      setExpanded(next);
      if (next) {
        // move focus to first link for accessibility
        const firstLink = menu.querySelector('a, button, [tabindex="0"]');
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        btn.focus({ preventScroll: true });
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setExpanded(false);
    });

    // Close when clicking outside the nav/menu
    document.addEventListener('click', (e) => {
      if (btn.getAttribute('aria-expanded') === 'true') {
        if (!nav.contains(e.target)) setExpanded(false);
      }
    });

    // Close after selecting a menu link
    menu.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.closest('a')) setExpanded(false);
    });
  }

  // Theme toggle
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const icon = document.querySelector('[data-theme-icon]');

  const getSystemPref = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (icon) icon.textContent = theme === 'dark' ? '🌞' : '🌙';
  };

  try {
    const stored = localStorage.getItem('theme');
    applyTheme(stored || getSystemPref());
  } catch (_) {
    applyTheme(getSystemPref());
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || getSystemPref();
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (_) {}
    });
  }
})();
