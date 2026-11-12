const STORAGE_KEY = "de-crash-course-theme";

export type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getPreferredTheme(): Theme {
  const stored = getStoredTheme();
  return stored ?? "dark";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme(): Theme {
  const theme = getPreferredTheme();
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
