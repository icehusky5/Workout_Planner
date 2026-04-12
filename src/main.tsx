import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Local initialization helpers
import { initIfEmpty } from "./lib/storage";
import { initTheme } from "./lib/theme";

/**
 * Seed localStorage with initial data (exercises, templates, week plan, sessions), if the user doesn't have any data yet.
 * Write only the missing keys.
 */
initIfEmpty();

/**
 * Apply the initial Bootstrap theme.
 * Uses saved theme, if present, otherwise falls back to system preference.
 */
initTheme();

/**
 * Create the React root and render the application into the root element in index.html.
 * StrictMode in use for development purposes.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);