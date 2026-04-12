/**
 * Allowed theme values for the application.
 */
export type Theme = "light" | "dark";

/**
 * LocalStorage key used to save the user's theme preference.
 */
const KEY = "wp_theme";

/**
 * Detect the user's system theme preference.
 * Fall back to light color scheme, if matchMedia is unavailable.
 */
export function getSystemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Read saved theme from localStorage.
 * Return null, if the value is invalid or not saved.
 */
export function getSavedTheme(): Theme | null {
  const value = localStorage.getItem(KEY);
  return value === "dark" || value === "light" ? value : null;
}

/**
 * Save the theme selection to localStorage.
 */
export function setSavedTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
}

/**
 * Remove stored theme preference.
 * Used when switching back to system-controlled theme.
 */
export function clearSavedTheme() {
  localStorage.removeItem(KEY);
}

/**
 * Apply theme to the document.
 */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

/**
 * Initialize theme during application startup.
 * Use the saved theme, if available.
 * Otherwise fall back to the system preference.
 */
export function initTheme() {
  const saved = getSavedTheme();
  applyTheme(saved ?? getSystemTheme());
}