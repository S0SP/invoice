export function ThemeScript() {
  const code = `
    (function () {
      try {
        var stored = document.cookie.match(/(?:^|; )theme=([^;]*)/);
        var theme = stored ? decodeURIComponent(stored[1]) : null;
        if (!theme) {
          theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", theme);
      } catch (e) {}
    })();
  `;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
