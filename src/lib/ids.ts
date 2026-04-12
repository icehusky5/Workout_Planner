/**
 * Generate a simple identifier that is unique enough for a local application.
 */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
