import { defineConfig, loadEnv } from "vite";
import { DONATIONS_ENABLED } from "./src/features.ts";

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
        const page = html.replace(/<!-- donations:start -->\s*([\s\S]*?)\s*<!-- donations:end -->/g,
          DONATIONS_ENABLED ? "$1" : "");
        return localCheatsheet ? page : page.replace(/\s*<a[^>]*id="local-cheatsheet"[^>]*>Cheatsheet<\/a>/, "");
      },
    }],
  };
});
