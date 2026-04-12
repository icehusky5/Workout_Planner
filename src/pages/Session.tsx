import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { load, save, KEYS } from "../lib/storage";
import { uid } from "../lib/ids";
import type { Exercise, Session, WeekPlan, WorkoutTemplate, ExerciseLog, SetLog } from "../models/types";
import { FaArrowLeft, FaPlus, FaSave, FaCheck, FaExclamationTriangle } from "react-icons/fa";

/**
 * Clamp a number to avoid storing invalid values.
 */
function clampNumber(number: number, min: number, max: number) {
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

/**
 * Find a template by id.
 */
function findTemplate(templates: WorkoutTemplate[], id?: string) {
  if (!id) return undefined;
  return templates.find((template) => template.id === id);
}

/**
 * Find an exercise by id.
 */
function findExercise(exercises: Exercise[], id: string) {
  return exercises.find((exercise) => exercise.id === id);
}

/**
 * Ensure a session exists for a given date.
 */
function ensureSessionExists(
  date: string,
  templateId: string | undefined,
  templates: WorkoutTemplate[],
  sessions: Session[]
): { session: Session | null; created: boolean; nextSessions: Session[] } {
  // Sessions are identified by date
  const existing = sessions.find((session) => session.date === date);
  if (existing) return { session: existing, created: false, nextSessions: sessions };

  // Can't create a session without a planned template
  if (!templateId) return { session: null, created: false, nextSessions: sessions };

  // Can't create, if template id doesn't exist
  const template = findTemplate(templates, templateId);
  if (!template) return { session: null, created: false, nextSessions: sessions };

  // Create a new session by copying the template
  const newSession: Session = {
    id: uid("ses"),
    date,
    templateId: template.id,
    exercises: template.items.map<ExerciseLog>((item) => ({
      exerciseId: item.exerciseId,
      sets: item.sets.map<SetLog>((setPlan) => ({
        reps: setPlan.reps,
        unit: setPlan.unit,
        // weight is undefined
        weight: undefined,
        // RPE target as a suggestion
        rpe: setPlan.targetRpe,
      })),
    })),
  };

  const next = [...sessions, newSession];
  return { session: newSession, created: true, nextSessions: next };
}

export default function SessionPage() {
  /**
   * The route is /session/date (YYYY-MM-DD).
   */
  const { date } = useParams<{ date: string }>();

  /**
   * Load all saved data from localStorage.
   */
  const exercises = load<Exercise[]>(KEYS.exercises, []);
  const templates = load<WorkoutTemplate[]>(KEYS.templates, []);
  const weekPlan = load<WeekPlan>(KEYS.weekPlan, { days: {} });
  const allSessions = load<Session[]>(KEYS.sessions, []);

  /**
   * Find the planned template for this date.
   */
  const templateId = date ? weekPlan.days[date]?.templateId : undefined;

  /**
   * Resolve a user-friendly title for the template.
   * useMemo avoids recomputing on every render.
   */
  const templateTitle = useMemo(() => {
    const template = findTemplate(templates, templateId);
    return template?.title ?? (templateId ? "Unknown template" : null);
  }, [templates, templateId]);

  /**
   * Sessions: full session list.
   * Session: the active session.
   * DurationMinutes: workout duration in minutes.
   * Notes: additional notes.
   */
  const [sessions, setSessions] = useState<Session[]>(allSessions);
  const [session, setSession] = useState<Session | null>(null);

  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  /**
   * Ensure a session exists or create one from a template.
   */
  useEffect(() => {
    if (!date) return;

    const { session: ensured, created, nextSessions } = ensureSessionExists(
      date,
      templateId,
      templates,
      allSessions
    );

    if (created) {
      save(KEYS.sessions, nextSessions);
      toast.success("Session created from template.");
      setSessions(nextSessions);
      setSession(ensured);
      return;
    }

    setSessions(allSessions);
    setSession(ensured);
  }, [date]);

  /**
   * When session changes, sync the sidebar UI.
   */
  useEffect(() => {
    if (!session) return;
    setDurationMinutes(typeof session.durationMinutes === "number" ? String(session.durationMinutes) : "");
    setNotes(session.notes ?? "");
  }, [session]);

  /**
   * Save an updated session to React state and localStorage.
   */
  function persist(nextSession: Session) {
    const nextAll = sessions.map((session) => (session.id === nextSession.id ? nextSession : session));
    setSessions(nextAll);
    setSession(nextSession);
    save(KEYS.sessions, nextAll);
  }

  /**
   * Update a single set.
   */
  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetLog>) {
    if (!session) return;

    const next: Session = structuredClone(session);
    const set = next.exercises[exIdx].sets[setIdx];

    if (patch.reps !== undefined) set.reps = clampNumber(patch.reps, 1, 1000);
    if (patch.weight !== undefined) {
      set.weight = patch.weight <= 0 ? undefined : Math.round(patch.weight * 100) / 100;
    }
    if (patch.rpe !== undefined) set.rpe = patch.rpe <= 0 ? undefined : clampNumber(patch.rpe, 1, 10);

    persist(next);
  }

  /**
   * Add a new set to an exercise.
   */
  function addSet(exIdx: number) {
    if (!session) return;

    const next: Session = structuredClone(session);
    const sets = next.exercises[exIdx].sets;
    const last = sets[sets.length - 1];

    sets.push({
      reps: last?.reps ?? 8,
      unit: "reps",
      weight: last?.weight,
      rpe: last?.rpe,
    });

    persist(next);
    toast.info("Set added.");
  }

  /**
   * Save duration and notes into the session.
   */
  function saveMeta() {
    if (!session) return;

    const next: Session = structuredClone(session);
    const duration = durationMinutes.trim() === "" ? undefined : clampNumber(Number(durationMinutes), 1, 600);
    next.durationMinutes = duration;
    next.notes = notes.trim() === "" ? undefined : notes.trim();

    persist(next);
    toast.success("Session saved.");
  }

  /**
   *  Handle invalid states.
   */

  // No date.
  if (!date) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Invalid route. Missing date parameter.</div>
      </div>
    );
  }

  // No planned template. Direct to Plan page.
  if (!templateId) {
    return (
      <div className="container py-4">
        <Link to="/" className="btn btn-outline-secondary mb-3">
          <FaArrowLeft className="me-2" />
          Back to Dashboard
        </Link>

        <div className="alert alert-warning d-flex align-items-start gap-2">
          <FaExclamationTriangle className="mt-1" />
          <div>
            <div className="fw-semibold">No template planned for {date}.</div>
            <div className="text-body-secondary">Assign a workout template to this day in your week plan.</div>
            <div className="mt-2">
              <Link to="/plan" className="btn btn-warning">
                Go to Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Planned template exists but session couldn't be loaded or created.
  if (!session) {
    return (
      <div className="container py-4">
        <Link to="/" className="btn btn-outline-secondary mb-3">
          <FaArrowLeft className="me-2" />
          Back to Dashboard
        </Link>

        <div className="alert alert-danger">
          Could not load or create a session for {date}. (Template: {templateId})
        </div>
      </div>
    );
  }

  
  /**
   *  UI
   */

  return (
    <div className="container py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <Link to="/" className="btn btn-outline-secondary mb-3">
            <FaArrowLeft className="me-2" />
            Back
          </Link>

          <h1 className="h4 mb-1">
            {templateTitle} <span className="text-body-secondary">• {date}</span>
          </h1>
          <div className="text-body-secondary">Log sets as you go. Weight and RPE are optional.</div>
        </div>

        <button className="btn btn-primary" onClick={saveMeta}>
          <FaSave className="me-2" />
          Save
        </button>
      </div>

      <div className="row g-3 mt-1">
        {/* Left column: exercise cards */}
        <div className="col-12 col-lg-8">
          {session.exercises.map((ex, exIdx) => {
            const exMeta = findExercise(exercises, ex.exerciseId);

            return (
              <div className="card shadow-sm mb-3" key={ex.exerciseId}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                    <div>
                      <div className="h5 mb-1">{exMeta?.name ?? "Unknown exercise"}</div>
                      <div className="small text-body-secondary">
                        {exMeta ? `${exMeta.muscleGroup.toUpperCase()} • ${exMeta.equipment}` : ex.exerciseId}
                      </div>
                    </div>

                    <button className="btn btn-outline-secondary btn-sm" onClick={() => addSet(exIdx)}>
                      <FaPlus className="me-2" />
                      Add set
                    </button>
                  </div>

                  {/* Set logging table */}
                  <div className="table-responsive mt-3">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 70 }}>Set</th>
                          <th style={{ width: 120 }}>Reps</th>
                          <th style={{ width: 140 }}>Weight (kg)</th>
                          <th style={{ width: 120 }}>RPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((s, setIdx) => (
                          <tr key={setIdx}>
                            <td className="text-body-secondary">{setIdx + 1}</td>

                            <td>
                              <input
                                className="form-control"
                                type="number"
                                min={1}
                                max={1000}
                                value={s.reps}
                                onChange={(e) => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                              />
                            </td>

                            <td>
                              <input
                                className="form-control"
                                type="number"
                                min={0}
                                step="0.5"
                                placeholder="—"
                                value={s.weight ?? ""}
                                onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                              />
                            </td>

                            <td>
                              <input
                                className="form-control"
                                type="number"
                                min={1}
                                max={10}
                                step="0.5"
                                placeholder="—"
                                value={s.rpe ?? ""}
                                onChange={(e) => updateSet(exIdx, setIdx, { rpe: Number(e.target.value) })}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="small text-body-secondary">
                    Tip: You can skip weight and just log reps/RPE.
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: duration and notes */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="h5 mb-3">Finish</div>

              <label className="form-label">Duration (min)</label>
              <input
                className="form-control mb-3"
                type="number"
                min={1}
                max={600}
                placeholder="e.g. 55"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />

              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="How did it feel? What to change for next time?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button className="btn btn-success w-100 mt-3" onClick={saveMeta}>
                <FaCheck className="me-2" />
                Mark as saved
              </button>

              <div className="mt-3 small text-body-secondary">
                This session page is created automatically from the planned template.
              </div>
            </div>
          </div>

          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <div className="fw-semibold mb-1">Planned template</div>
              <div className="text-body-secondary small">{templateTitle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}