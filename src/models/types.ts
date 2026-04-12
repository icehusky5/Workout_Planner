/**
 * Fixed values for selectable muscle groups and equipment.
 */
export type MuscleGroup = "legs" | "push" | "pull" | "core" | "other";
export type Equipment = "barbell" | "dumbbell" | "machine" | "bodyweight" | "other";

/**
 * Branded type for date keys across the app.
 * Format: "YYYY-MM-DD"
 */
export type DateKey = string;

/**
 * A single exercise in the library.
 */
export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
};

/**
 * A planned set inside a workout template.
 */
export type SetPlan = {
  reps: number;
  unit: "reps";
  targetRpe?: number;
  notes?: string;
};

/**
 * A planned exercise inside a template.
 */
export type ExercisePlan = {
  exerciseId: string;
  sets: SetPlan[];
};

/**
 * A reusable workout template.
 */
export type WorkoutTemplate = {
  id: string;
  title: string;
  items: ExercisePlan[];
};

/**
 * Weekly plan.
 */
export type WeekPlan = {
  days: Record<DateKey, { templateId?: string }>;
};

/**
 * A logged set during a workout session.
 */
export type SetLog = {
  reps: number;
  unit: "reps";
  weight?: number;
  rpe?: number;
};

/**
 * A logged exercise within a session.
 */
export type ExerciseLog = {
  exerciseId: string;
  sets: SetLog[];
};

/**
 * A workout session for a specific date.
 */
export type Session = {
  id: string;
  date: DateKey;
  templateId?: string;
  exercises: ExerciseLog[];
  durationMinutes?: number; // duration in minutes
  notes?: string;
};