import type { Exercise, WorkoutTemplate, WeekPlan, Session } from "../models/types";
import { weekKeys, addDays, todayKey } from "../lib/dates";
import { uid } from "../lib/ids";

/**
 * Seed exercise library.
 * Provide enough exercises with stable and readable IDs to debug and demonstrate easily.
 */
export const seedExercises: Exercise[] = [
  { id: "ex_squat", name: "Back Squat", muscleGroup: "legs", equipment: "barbell" },
  { id: "ex_rdl", name: "Romanian Deadlift", muscleGroup: "legs", equipment: "barbell" },
  { id: "ex_legpress", name: "Leg Press", muscleGroup: "legs", equipment: "machine" },
  { id: "ex_calf", name: "Calf Raise", muscleGroup: "legs", equipment: "machine" },

  { id: "ex_bench", name: "Bench Press", muscleGroup: "push", equipment: "barbell" },
  { id: "ex_incline_db", name: "Incline DB Press", muscleGroup: "push", equipment: "dumbbell" },
  { id: "ex_ohp", name: "Overhead Press", muscleGroup: "push", equipment: "barbell" },
  { id: "ex_latraise", name: "Lateral Raise", muscleGroup: "push", equipment: "dumbbell" },

  { id: "ex_row", name: "Barbell Row", muscleGroup: "pull", equipment: "barbell" },
  { id: "ex_latpulldown", name: "Lat Pulldown", muscleGroup: "pull", equipment: "machine" },
  { id: "ex_facepull", name: "Face Pull", muscleGroup: "pull", equipment: "machine" },
];

/**
 * Seed workout templates.
 * Templates define planned structure with exercises and planned sets without included weights.
 */
export const seedTemplates: WorkoutTemplate[] = [
  {
    id: "tpl_upper",
    title: "Upper",
    items: [
      {
        exerciseId: "ex_bench",
        sets: [
          { reps: 8, unit: "reps", targetRpe: 7 },
          { reps: 8, unit: "reps", targetRpe: 7 },
          { reps: 8, unit: "reps", targetRpe: 8 },
        ],
      },
      {
        exerciseId: "ex_row",
        sets: [
          { reps: 10, unit: "reps", targetRpe: 7 },
          { reps: 10, unit: "reps", targetRpe: 8 },
          { reps: 10, unit: "reps", targetRpe: 8 },
        ],
      },
      {
        exerciseId: "ex_ohp",
        sets: [
          { reps: 6, unit: "reps", targetRpe: 7 },
          { reps: 6, unit: "reps", targetRpe: 8 },
          { reps: 6, unit: "reps", targetRpe: 8 },
        ],
      },
      {
        exerciseId: "ex_latpulldown",
        sets: [
          { reps: 10, unit: "reps", targetRpe: 7 },
          { reps: 10, unit: "reps", targetRpe: 8 },
          { reps: 10, unit: "reps", targetRpe: 8 },
        ],
      },
      // RPE can be omitted.
      { exerciseId: "ex_facepull", sets: [{ reps: 15, unit: "reps" }, { reps: 15, unit: "reps" }, { reps: 15, unit: "reps" }] },
    ],
  },
  {
    id: "tpl_lower",
    title: "Lower",
    items: [
      {
        exerciseId: "ex_squat",
        sets: [
          { reps: 5, unit: "reps", targetRpe: 7 },
          { reps: 5, unit: "reps", targetRpe: 8 },
          { reps: 5, unit: "reps", targetRpe: 8 },
        ],
      },
      {
        exerciseId: "ex_rdl",
        sets: [
          { reps: 8, unit: "reps", targetRpe: 7 },
          { reps: 8, unit: "reps", targetRpe: 8 },
          { reps: 8, unit: "reps", targetRpe: 8 },
        ],
      },
      {
        exerciseId: "ex_legpress",
        sets: [
          { reps: 12, unit: "reps", targetRpe: 7 },
          { reps: 12, unit: "reps", targetRpe: 8 },
        ],
      },
      { exerciseId: "ex_calf", sets: [{ reps: 15, unit: "reps" }, { reps: 15, unit: "reps" }, { reps: 15, unit: "reps" }] },
    ],
  },
  {
    id: "tpl_full",
    title: "Full Body",
    items: [
      { exerciseId: "ex_squat", sets: [{ reps: 5, unit: "reps", targetRpe: 7 }, { reps: 5, unit: "reps", targetRpe: 8 }] },
      { exerciseId: "ex_incline_db", sets: [{ reps: 10, unit: "reps", targetRpe: 7 }, { reps: 10, unit: "reps", targetRpe: 8 }] },
      { exerciseId: "ex_latpulldown", sets: [{ reps: 10, unit: "reps", targetRpe: 7 }, { reps: 10, unit: "reps", targetRpe: 8 }] },
      { exerciseId: "ex_latraise", sets: [{ reps: 15, unit: "reps", }, { reps: 15, unit: "reps", }] },
    ],
  },
];

/**
 * Create a seed week plan for the week that contains anchorKey.
 */
export function makeSeedWeekPlan(anchorKey: string = todayKey()): WeekPlan {
  const keys = weekKeys(anchorKey);

  const days: WeekPlan["days"] = {};
  for (const key of keys) days[key] = {};

  // Assign templates for an example training week.
  days[keys[0]].templateId = "tpl_upper"; // Monday
  days[keys[2]].templateId = "tpl_lower"; // Wednesday
  days[keys[4]].templateId = "tpl_full";  // Friday

  return { days };
}

/**
 * Create seed sessions from the previous week.
 * Dates are calculated relative to today.
 */
export function makeSeedSessions(): Session[] {
  const today = todayKey();

  // Find last week's Monday
  const mondayThisWeek = weekKeys(today)[0];
  const mondayLastWeek = addDays(mondayThisWeek, -7);

  const s1Date = mondayLastWeek;
  const s2Date = addDays(mondayLastWeek, 2); // Wednesday of last week

  return [
    {
      id: uid("ses"),
      date: s1Date,
      templateId: "tpl_upper",
      exercises: [
        { exerciseId: "ex_bench", sets: [{ reps: 8, unit: "reps", weight: 60, rpe: 7 }, { reps: 8, unit: "reps", weight: 60, rpe: 8 }] },
        { exerciseId: "ex_row", sets: [{ reps: 10, unit: "reps", weight: 50, rpe: 7 }, { reps: 10, unit: "reps", weight: 50, rpe: 8 }] },
      ],
      durationMinutes: 55,
      notes: "Felt strong.",
    },
    {
      id: uid("ses"),
      date: s2Date,
      templateId: "tpl_lower",
      exercises: [
        { exerciseId: "ex_squat", sets: [{ reps: 5, unit: "reps", weight: 70, rpe: 7 }, { reps: 5, unit: "reps", weight: 72.5, rpe: 8 }] },
        { exerciseId: "ex_rdl", sets: [{ reps: 8, unit: "reps", weight: 60, rpe: 7 }] },
      ],
      durationMinutes: 50,
    },
  ];
}