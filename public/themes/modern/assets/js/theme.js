// Modern Theme: light/dark mode toggle
(function () {
  const STORAGE_KEY = 'theme'; // 'light' | 'dark' | undefined
  const body = document.body;
  const btn = document.getElementById('theme-toggle');
  const iconSpan = btn ? btn.querySelector('.theme-toggle__icon') : null;

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  }

  function saveTheme(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-theme', isDark);
    body.classList.toggle('light-theme', !isDark);
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
    }
    if (iconSpan) {
      iconSpan.textContent = isDark ? '☀️' : '🌙';
    }
  }

  function initTheme() {
    const saved = getSavedTheme();
    let theme = saved;
    if (!theme) {
      theme = 'light'; // default to light regardless of system preference
    }
    applyTheme(theme);
  }

  function toggleTheme() {
    const isDark = body.classList.contains('dark-theme');
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
    // React to system preference changes if user hasn't made an explicit choice
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq && mq.addEventListener) {
        mq.addEventListener('change', () => {
          if (!getSavedTheme()) {
            applyTheme(systemPrefersDark() ? 'dark' : 'light');
          }
        });
      }
    } catch {}
  });
})();
