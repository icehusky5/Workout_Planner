import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { load, save, KEYS } from "../lib/storage";
import { uid } from "../lib/ids";
import type { Exercise, Equipment, MuscleGroup, WorkoutTemplate } from "../models/types";
import { FaPlus, FaTrash, FaSearch } from "react-icons/fa";

/**
 * Normalize strings for case-insensitive comparisons and search.
 */
function normalize(string: string) {
  return string.trim().toLowerCase();
}

/**
 * Validation for exercise names.
 */
function isValidName(name: string) {
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 60;
}

export default function LibraryPage() {
  /**
   * Load saved exercises and templates from localStorage.
   */
  const storedExercises = load<Exercise[]>(KEYS.exercises, []);
  const templates = load<WorkoutTemplate[]>(KEYS.templates, []);

  /**
   * Local exercises and query state to edit.
   */
  const [exercises, setExercises] = useState<Exercise[]>(storedExercises);
  const [query, setQuery] = useState("");

  /**
   * Form state for adding a new exercise.
   */
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("legs");
  const [equipment, setEquipment] = useState<Equipment>("barbell");

  /**
   * Build a Set of exercise IDs used in templates in order to check exercise usage easily.
   */
  const usedExerciseIds = useMemo(() => {
    const ids = new Set<string>();

    for (const template of templates) {
      for (const item of template.items) ids.add(item.exerciseId);
    }

    return ids;
  }, [templates]);

  /**
   * Filter visible exercises by search query.
   */
  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return exercises;
    return exercises.filter((exercise) => normalize(exercise.name).includes(normalizedQuery));
  }, [exercises, query]);

  /**
   * Save exercise list both to the React state and the localStorage.
   */
  function persist(next: Exercise[]) {
    setExercises(next);
    save(KEYS.exercises, next);
  }

  /**
   * Add a new exercise to the library after validation.
   */
  function addExercise() {
    if (!isValidName(name)) {
      toast.error("Name must be 2–60 characters.");
      return;
    }

    const trimmedName = name.trim();
    const exists = exercises.some((exercise) => normalize(exercise.name) === normalize(trimmedName));
    if (exists) {
      toast.warn("Exercise with same name already exists.");
      return;
    }

    const ex: Exercise = {
      id: uid("ex"),
      name: trimmedName,
      muscleGroup,
      equipment,
    };

    const next = [ex, ...exercises];
    persist(next);

    // Reset form to default after a successful add
    setName("");
    setMuscleGroup("legs");
    setEquipment("barbell");

    toast.success("Exercise added.");
  }

  /**
   * Delete an exercise from the library.
   * If the exercise is already used in templates, show a stronger confirmation message.
   */
  function deleteExercise(exerciseToDelete: Exercise) {
    const inUse = usedExerciseIds.has(exerciseToDelete.id);

    const message = inUse
      ? `Exercise "${exerciseToDelete.name}" is used in templates. Delete anyway?`
      : `Delete "${exerciseToDelete.name}"?`;

    if (!confirm(message)) return;

    const next = exercises.filter((exercise) => exercise.id !== exerciseToDelete.id);
    persist(next);

    toast.info("Exercise deleted.");
  }

  return (
    <div className="container py-4">
      {/* Page header and search bar */}
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="h4 mb-1">Exercise library</h1>
          <div className="text-body-secondary">Manage your exercise list.</div>
        </div>

        <div className="input-group" style={{ maxWidth: 360 }}>
          <span className="input-group-text">
            <FaSearch />
          </span>
          <input
            className="form-control"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-3 mt-2">
        {/* Left column: add form */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="h5 mb-3">Add exercise</div>

              <label className="form-label">Name</label>
              <input
                className="form-control"
                placeholder="e.g. Bulgarian Split Squat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addExercise();
                }}
              />
              <div className="form-text">Keep names short and recognizable.</div>

              <div className="row g-2 mt-2">
                <div className="col-6">
                  <label className="form-label">Muscle</label>
                  <select
                    className="form-select"
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                  >
                    <option value="legs">legs</option>
                    <option value="push">push</option>
                    <option value="pull">pull</option>
                    <option value="core">core</option>
                    <option value="other">other</option>
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label">Equipment</label>
                  <select
                    className="form-select"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value as Equipment)}
                  >
                    <option value="barbell">barbell</option>
                    <option value="dumbbell">dumbbell</option>
                    <option value="machine">machine</option>
                    <option value="bodyweight">bodyweight</option>
                    <option value="other">other</option>
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary w-100 mt-3"
                onClick={addExercise}
                disabled={!name.trim()}
              >
                <FaPlus className="me-2" />
                Add
              </button>
            </div>
          </div>

          {/* Side note */}
          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <div className="fw-semibold mb-1">Tip</div>
              <div className="small text-body-secondary">
                Keep your library clean. If you stop using an exercise, delete it.
              </div>
            </div>
          </div>
        </div>

        {/* Right column: exercise table */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="text-body-secondary small">Exercises</div>
                  <div className="h5 mb-0">
                    {filtered.length} <span className="text-body-secondary fw-normal">shown</span>
                  </div>
                </div>

                <span className="badge text-bg-light border">
                  {exercises.length} total
                </span>
              </div>

              <div className="table-responsive mt-3">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th style={{ width: 120 }}>Muscle</th>
                      <th style={{ width: 140 }}>Equipment</th>
                      <th style={{ width: 120 }}>In templates</th>
                      <th style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((excercise) => {
                      const inUse = usedExerciseIds.has(excercise.id);

                      return (
                        <tr key={excercise.id}>
                          <td className="fw-semibold">{excercise.name}</td>
                          <td className="text-body-secondary">{excercise.muscleGroup}</td>
                          <td className="text-body-secondary">{excercise.equipment}</td>

                          <td>
                            {inUse ? (
                              <span className="badge text-bg-success">Used</span>
                            ) : (
                              <span className="badge text-bg-secondary">Unused</span>
                            )}
                          </td>

                          <td className="text-end">
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deleteExercise(excercise)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty state for search results */}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-body-secondary py-4">
                          No exercises match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 small text-body-secondary">
                Note: Deleting an exercise doesn’t automatically remove it from templates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}