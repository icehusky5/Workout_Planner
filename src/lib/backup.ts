import { KEYS, save, initIfEmpty } from "./storage";

/**
 * Backup the file schema.
 */
export type BackupPayload = {
  app: "workout-planner";
  version: number;
  exportedAt: string; // ISO timestamp
  data: {
    exercises: unknown;
    templates: unknown;
    weekPlan: unknown;
    sessions: unknown;
  };
};

/**
 * Trigger a file download in the browser.
 */
function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const element = document.createElement("a");
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  element.remove();

  // Clean up the temporary blob URL.
  URL.revokeObjectURL(url);
}

/**
 * Export the current app data from localStorage into a JSON file.
 * Fallbacks are used so the export works even, if some keys are missing.
 */
export function exportBackup() {
  const payload: BackupPayload = {
    app: "workout-planner",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      exercises: JSON.parse(localStorage.getItem(KEYS.exercises) ?? "[]"),
      templates: JSON.parse(localStorage.getItem(KEYS.templates) ?? "[]"),
      weekPlan: JSON.parse(localStorage.getItem(KEYS.weekPlan) ?? `{"days":{}}`),
      sessions: JSON.parse(localStorage.getItem(KEYS.sessions) ?? "[]"),
    },
  };

  const json = JSON.stringify(payload, null, 2);
  downloadText("workout-planner-export.json", json);
}

/**
 * Import a backup JSON file and overwrite the stored app data.
 * Throw an error, if the file isn't a valid JSON or doesn't match the app.
 */
export async function importBackupFile(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<BackupPayload>;

  // Reject incorrect files.
  if (parsed.app !== "workout-planner" || !parsed.data) {
    throw new Error("Not a valid workout-planner backup file.");
  }
  if (parsed.version !== 1) throw new Error("Unsupported backup version.");

  // Overwrite existing user data.
  save(KEYS.exercises, parsed.data.exercises ?? []);
  save(KEYS.templates, parsed.data.templates ?? []);
  save(KEYS.weekPlan, parsed.data.weekPlan ?? { days: {} });
  save(KEYS.sessions, parsed.data.sessions ?? []);

  // Ensure schema version exists.
  save(KEYS.version, 1);
}

/**
 * Reset all stored data back to seeded defaults.
 * Delete existing keys and reseed.
 */
export function resetToSeed() {
  localStorage.removeItem(KEYS.exercises);
  localStorage.removeItem(KEYS.templates);
  localStorage.removeItem(KEYS.weekPlan);
  localStorage.removeItem(KEYS.sessions);
  localStorage.removeItem(KEYS.version);

  initIfEmpty();
}