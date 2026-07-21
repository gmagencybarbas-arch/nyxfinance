/**
 * Script que roda antes do React para aplicar tema do localStorage e evitar flicker no first paint.
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  try {
    var t = localStorage.getItem('nyx_theme');
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`,
      }}
    />
  );
}
