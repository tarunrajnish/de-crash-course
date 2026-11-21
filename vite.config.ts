import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const localCheatsheet = command === "serve" && mode !== "production";
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const site = new URL(env.VITE_SITE_URL || "https://tarunrajnish.github.io/de-crash-course/");
  if (!["http:", "https:"].includes(site.protocol) || site.search || site.hash || site.username || site.password) {
    throw new Error("VITE_SITE_URL must be an HTTP(S) URL without credentials, a query, or a fragment.");
  }
  if (!site.pathname.endsWith("/")) site.pathname += "/";

  return {
    base: site.pathname,
    define: {
      "import.meta.env.VITE_SITE_URL": JSON.stringify(site.href),
      "import.meta.env.LOCAL_CHEATSHEET": JSON.stringify(localCheatsheet),
    },
    plugins: [{
      name: "local-cheatsheet",
      transformIndexHtml(html) {
        return localCheatsheet ? html : html.replace(/\s*<a[^>]*id="local-cheatsheet"[^>]*>Cheatsheet<\/a>/, "");
      },
    }],
  };
});
