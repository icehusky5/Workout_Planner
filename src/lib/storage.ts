import type { Exercise, WorkoutTemplate, WeekPlan, Session } from "../models/types";
import { seedExercises, seedTemplates, makeSeedWeekPlan, makeSeedSessions } from "../data/seed";

/**
 * Prefix for all the localStorage keys.
 */
const PREFIX = "wp_";

/**
 * Centralized list of the storage keys used by the app.
 */
export const KEYS = {
  version: `${PREFIX}version`,
  exercises: `${PREFIX}exercises`,
  templates: `${PREFIX}templates`,
  weekPlan: `${PREFIX}weekPlan`,
  sessions: `${PREFIX}sessions`,
} as const;

/**
 * Load the JSON value from localStorage.
 * Return fallback, if the key does not exist or the JSON parsing fails.
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Save the JSON value to localStorage and fire an event.
 */
export function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("wp-storage"));
}

/**
 * Check if a key exists in localStorage.
 */
function has(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

/**
 * Seed initial data.
 * Does not overwrite existing user data and only fills missing keys.
 * This allows the app to function without a backend.
 */
export function initIfEmpty(): void {

  // Version key for future reference.
  if (!has(KEYS.version)) save(KEYS.version, 1);

  // Core collections.
  if (!has(KEYS.exercises)) save<Exercise[]>(KEYS.exercises, seedExercises);
  if (!has(KEYS.templates)) save<WorkoutTemplate[]>(KEYS.templates, seedTemplates);

  // Generate a week plan as a seed.
  if (!has(KEYS.weekPlan)) {
    const wp = makeSeedWeekPlan();
    save<WeekPlan>(KEYS.weekPlan, wp);
  }

  // Generate sessions as a seed.
  if (!has(KEYS.sessions)) {
    const sessions = makeSeedSessions();
    save<Session[]>(KEYS.sessions, sessions);
  }
}