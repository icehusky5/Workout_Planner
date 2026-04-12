/**
 * Convert a Date object into a local date key in format YYYY-MM-DD.
 */
export function toKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Convert a YYYY-MM-DD key into a Date object.
 */
export function fromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number); // key: YYYY-MM-DD
  return new Date(year, month - 1, day);
}

/**
 * Get today's date key.
 */
export function todayKey(): string {
  return toKey(new Date());
}

/**
 * Add or subtract days from a given date key.
 */
export function addDays(key: string, days: number): string {
  const date = fromKey(key);
  date.setDate(date.getDate() + days);
  return toKey(date);
}

/**
 * Get the Monday–Sunday date keys for the week that contains anchorKey.
 */
export function weekKeys(anchorKey: string = todayKey()): string[] {
  const date = fromKey(anchorKey);

  // JS Default: Sunday = 0, ..., Saturday = 6
  const day = date.getDay();

  // Convert to Monday = 0, ..., Sunday = 6
  const diffToMonday = (day + 6) % 7;

  // Move to Monday
  date.setDate(date.getDate() - diffToMonday);

  const keys: string[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDate  = new Date(date);
    currentDate.setDate(date.getDate() + i);
    keys.push(toKey(currentDate));
  }

  return keys;
}