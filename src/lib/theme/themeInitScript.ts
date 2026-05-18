// Runs in <head> via dangerouslySetInnerHTML before first paint so the
// document picks up the persisted theme / color scheme without flashing
// the default. Must stay inline (no external fetch) to preserve no-FOUC.
export const THEME_INIT_SCRIPT = `(function () {
  try {
    var theme = localStorage.getItem('narraitor-theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
    var scheme = localStorage.getItem('narraitor-color-scheme');
    var systemPrefersDark =
      scheme === 'system' &&
      matchMedia('(prefers-color-scheme: dark)').matches;
    if (scheme === 'dark' || systemPrefersDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    // localStorage unavailable (SSR, private mode, or storage disabled).
    // Fall through with the document's default theme.
  }
})();`;
