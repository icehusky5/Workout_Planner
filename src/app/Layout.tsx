import { NavLink, Outlet } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { applyTheme, getSavedTheme, getSystemTheme, setSavedTheme, clearSavedTheme } from "../lib/theme";
import type { Theme } from "../lib/theme";
import "react-toastify/dist/ReactToastify.css";

import { exportBackup, importBackupFile, resetToSeed } from "../lib/backup";

export default function Layout() {
  /**
   * Hidden file input reference used for importing backup JSON files programmatically.
   */
  const fileRef = useRef<HTMLInputElement | null>(null);

  /**
   * Handle backup file selection.
   *
   * Flow:
   * 1. Read the selected file
   * 2. Import and validate its contents
   * 3. Reload the page so the whole app re-reads localStorage
   */
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importBackupFile(file);
      toast.success("Import complete. Reloading...");
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Import failed.");
    } finally {
      // Reset file selection
      e.target.value = "";
    }
  }

  /**
   * Reset the app data to the seeded defaults.
   */
  function handleReset() {
    if (!confirm("Reset all data to seed defaults? This cannot be undone.")) return;

    resetToSeed();
    toast.info("Reset complete. Reloading...");
    window.location.reload();
  }

  /**
   * Current theme for the UI.
   */
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() ?? getSystemTheme());

  /**
   * Apply theme whenever the local theme state changes.
   */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /**
   * Toggle between dark and light themes and save the user's choice to the localStorage.
   */
  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setSavedTheme(next);
  }

  /**
   * Switch to system-controlled theme.
   * Remove the saved preference and apply the OS theme.
   */
  function useSystemTheme() {
    clearSavedTheme();
    const sys = getSystemTheme();
    setTheme(sys);
  }

  return (
    <>
      {/* Main application navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          {/* Home link */}
          <NavLink className="navbar-brand fw-semibold fs-3" to="/">
            Workout Planner
          </NavLink>

          {/* Mobile navbar toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            {/* Main navigation links */}
            <div className="navbar-nav me-auto">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-semibold" : ""}`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/plan"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-semibold" : ""}`
                }
              >
                Plan
              </NavLink>

              <NavLink
                to="/templates"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-semibold" : ""}`
                }
              >
                Templates
              </NavLink>

              <NavLink
                to="/library"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-semibold" : ""}`
                }
              >
                Library
              </NavLink>
            </div>

            {/* Right-side controls:
                - stacked vertically on small screens
                - aligned horizontally on large screens
             */}
            <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 mt-2 mt-lg-0">
              {/* Theme control */}
              <div className="btn-group w-100 w-lg-auto mt-2 mt-lg-0" role="group" aria-label="Theme toggle">
                {/* Quick toggle button */}
                <button
                  type="button"
                  className="btn btn-outline-light w-100 w-lg-auto text-nowrap"
                  onClick={toggleTheme}
                  title="Toggle dark/light"
                >
                  {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
                </button>

                {/* Dropdown for theme selection */}
                <button
                  type="button"
                  className="btn btn-outline-light dropdown-toggle dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="visually-hidden">Theme menu</span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setTheme("light");
                        setSavedTheme("light");
                      }}
                    >
                      Light
                    </button>
                  </li>

                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setTheme("dark");
                        setSavedTheme("dark");
                      }}
                    >
                      Dark
                    </button>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li>
                    <button className="dropdown-item" onClick={useSystemTheme}>
                      Use system theme
                    </button>
                  </li>
                </ul>
              </div>

              {/* Backup and restore actions */}
              <div className="dropdown w-100 w-lg-auto mt-2 mt-lg-0">
                <button
                  className="btn btn-outline-light dropdown-toggle w-100 w-lg-auto"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Data
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => exportBackup()}
                    >
                      Export JSON
                    </button>
                  </li>

                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => fileRef.current?.click()}
                    >
                      Import JSON…
                    </button>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleReset}
                    >
                      Reset to seed
                    </button>
                  </li>
                </ul>

                {/* Hidden file input used for JSON import */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="d-none"
                  onChange={onPickFile}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Route contents */}
      <main>
        <Outlet />
      </main>

      {/* Global toast notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </>
  );
}