// Visual-only footer branding override
// Ensures the rotating bottom footer never shows 'Leigos' branding.
// Requested replacement: 'Leigos'/'Leigos Academy' -> 'V8APP'

(() => {
  const BRAND = 'V8APP';

  function getVersion() {
    try {
      const m = chrome?.runtime?.getManifest?.();
      if (m && m.version) return m.version;
    } catch (_) {}
    return '9.5.0';
  }

  function buildReplacement(current) {
    const vMatch = String(current || '').match(/\bv\s*(\d+(?:\.\d+){1,3})\b/i);
    const v = vMatch ? vMatch[1] : getVersion();
    return `${BRAND} v${v}`;
  }

  function fixFooterText() {
    const el = document.getElementById('footerText');
    if (!el) return;

    const t = (el.textContent || '').trim();
    if (!t) return;

    // Only touch when it shows Leigos branding (keep verses/other tips intact)
    if (/\bleigos\b/i.test(t) || /Leigos\s*Academy/i.test(t)) {
      const repl = buildReplacement(t);
      if (el.textContent !== repl) {
        el.textContent = repl;
      }
    }
  }

  function start() {
    fixFooterText();

    const el = document.getElementById('footerText');
    if (!el) {
      // If footer is injected later
      const moWait = new MutationObserver(() => {
        const e2 = document.getElementById('footerText');
        if (e2) {
          moWait.disconnect();
          start();
        }
      });
      moWait.observe(document.documentElement, { childList: true, subtree: true });
      return;
    }

    // Observe changes from footer.js rotation
    try {
      const mo = new MutationObserver(() => fixFooterText());
      mo.observe(el, { childList: true, subtree: true, characterData: true });
    } catch (_) {}

    // Safety interval (very light)
    setInterval(fixFooterText, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
