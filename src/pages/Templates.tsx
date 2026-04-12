import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { load, save, KEYS } from "../lib/storage";
import { uid } from "../lib/ids";
import type { Exercise, WorkoutTemplate, ExercisePlan, SetPlan } from "../models/types";
import { FaPlus, FaSave, FaTrash, FaDumbbell, FaEraser } from "react-icons/fa";

/**
 * Avoid mutating React state directly by cloning.
 */
function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Find an exercise name to display.
 */
function findExerciseName(exercises: Exercise[], id: string) {
  return exercises.find((exercise) => exercise.id === id)?.name ?? "Unknown exercise";
}

/**
 * Default set scheme used for adding an exercise into a template.
 */
function defaultSets(): SetPlan[] {
  return [{ reps: 8, unit: "reps", targetRpe: 7 }, { reps: 8, unit: "reps", targetRpe: 8 }, { reps: 8, unit: "reps", targetRpe: 8 }];
}

export default function TemplatesPage() {
  /**
   * Load saved exercise and template data from localStorage.
   */
  const exercises = load<Exercise[]>(KEYS.exercises, []);
  const storedTemplates = load<WorkoutTemplate[]>(KEYS.templates, []);

  /**
   * Templates list that is being edited.
   * SelectedId of the template currently being edited.
   * ShowAddModal to control the modal for adding exercises.
   * ExerciseSearch to filter exercises.
   */
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(storedTemplates);
  const [selectedId, setSelectedId] = useState<string>(storedTemplates[0]?.id ?? "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  /**
   * Selected template based on the selectedId and the templates list.
   */
  const selected = templates.find((template) => template.id === selectedId) ?? null;

  /**
   * Filter exercise library for the "Add exercise" modal.
   */
  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [exercises, exerciseSearch]);

  /**
   * Save the template list to both React state and localStorage.
   */
  function persist(next: WorkoutTemplate[]) {
    setTemplates(next);
    save(KEYS.templates, next);
  }

  /**
   * Keep selection valid after deletes or fall back to the first template or empty selection.
   */
  function selectOrFallback(nextTemplates: WorkoutTemplate[], preferredId?: string) {
    if (preferredId && nextTemplates.some((template) => template.id === preferredId)) {
      setSelectedId(preferredId);
      return;
    }
    setSelectedId(nextTemplates[0]?.id ?? "");
  }

  /**
   * Create a new empty template and select it.
   */
  function createTemplate() {
    const template: WorkoutTemplate = {
      id: uid("tpl"),
      title: "New Template",
      items: [],
    };

    const next = [template, ...templates];
    persist(next);
    setSelectedId(template.id);
    toast.success("Template created.");
  }

  /**
   * Update the selected template title.
   */
  function renameSelected(title: string) {
    if (!selected) return;
    const next = templates.map((template) => (template.id === selected.id ? { ...template, title } : template));
    persist(next);
  }

  /**
   * Delete the selected template.
   */
  function deleteSelected() {
    if (!selected) return;
    if (!confirm(`Delete template "${selected.title}"?`)) return;

    const next = templates.filter((template) => template.id !== selected.id);
    persist(next);
    selectOrFallback(next);
    toast.info("Template deleted.");
  }

  /**
   * Add a new exercise into the selected template.
   * Does not allow duplicate exercises.
   */
  function addExerciseToSelected(exerciseId: string) {
    if (!selected) return;

    if (selected.items.some((item) => item.exerciseId === exerciseId)) {
      toast.warn("Exercise already in template.");
      return;
    }

    const nextSelected: WorkoutTemplate = clone(selected);
    const plan: ExercisePlan = {
      exerciseId,
      sets: defaultSets(),
    };

    nextSelected.items.push(plan);

    const next = templates.map((template) => (template.id === selected.id ? nextSelected : template));
    persist(next);
    toast.success("Exercise added.");
  }

  /**
   * Remove an exercise plan from the selected template.
   */
  function removeExerciseFromSelected(exerciseId: string) {
    if (!selected) return;

    const nextSelected: WorkoutTemplate = clone(selected);
    nextSelected.items = nextSelected.items.filter((item) => item.exerciseId !== exerciseId);

    const next = templates.map((template) => (template.id === selected.id ? nextSelected : template));
    persist(next);
    toast.info("Exercise removed.");
  }

  /**
   * Update a single set plan within an exercise plan.
   */
  function updateSet(exerciseId: string, setIndex: number, patch: Partial<SetPlan>) {
    if (!selected) return;

    const nextSelected: WorkoutTemplate = clone(selected);
    const selectedItem = nextSelected.items.find((item) => item.exerciseId === exerciseId);
    if (!selectedItem) return;

    const set = selectedItem.sets[setIndex];
    if (!set) return;

    // Clamp values to keep data valid
    if (patch.reps !== undefined) set.reps = Math.max(1, Math.min(1000, patch.reps));
    if (patch.targetRpe !== undefined) {
      set.targetRpe = patch.targetRpe <= 0 ? undefined : Math.max(1, Math.min(10, patch.targetRpe));
    }
    if (patch.notes !== undefined) set.notes = patch.notes?.trim() ? patch.notes : undefined;

    const next = templates.map((template) => (template.id === selected.id ? nextSelected : template));
    persist(next);
  }

  /**
   * Add a new set to the exercise plan.
   * Existing values are copied from the last set.
   */
  function addSet(exerciseId: string) {
    if (!selected) return;

    const nextSelected: WorkoutTemplate = clone(selected);
    const selectedItem = nextSelected.items.find((item) => item.exerciseId === exerciseId);
    if (!selectedItem) return;

    const last = selectedItem.sets[selectedItem.sets.length - 1];
    selectedItem.sets.push({
      reps: last?.reps ?? 8,
      unit: "reps",
      targetRpe: last?.targetRpe,
    });

    const next = templates.map((template) => (template.id === selected.id ? nextSelected : template));
    persist(next);
    toast.info("Set added.");
  }

  /**
   * Remove a set from the exercise plan.
   * Avoid empty templates.
   */
  function removeSet(exerciseId: string, setIdx: number) {
    if (!selected) return;

    const nextSelected: WorkoutTemplate = clone(selected);
    const selectedItem = nextSelected.items.find((item) => item.exerciseId === exerciseId);
    if (!selectedItem) return;

    selectedItem.sets.splice(setIdx, 1);

    // Keep at least one set to avoid empty templates.
    if (selectedItem.sets.length === 0) selectedItem.sets = [{ reps: 8, unit: "reps", targetRpe: 7 }];

    const next = templates.map((template) => (template.id === selected.id ? nextSelected : template));
    persist(next);
    toast.info("Set removed.");
  }

  /**
   * Manual save to make sure everything is truly saved.
   */
  function saveAll() {
    save(KEYS.templates, templates);
    toast.success("Templates saved.");
  }

  // UI

  return (
    <div className="container py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="h4 mb-1">Templates</h1>
          <div className="text-body-secondary">Create and edit workout templates (exercises + sets).</div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-primary" onClick={createTemplate}>
            <FaPlus className="me-2" />
            New template
          </button>
          <button className="btn btn-primary" onClick={saveAll}>
            <FaSave className="me-2" />
            Save
          </button>
        </div>
      </div>

      <div className="row g-3 mt-2">
        {/* Left column: template list */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="h5 mb-0">Your templates</div>
                <span className="badge text-bg-light border">{templates.length}</span>
              </div>

              <div className="list-group mt-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      template.id === selectedId ? "active" : ""
                    }`}
                    onClick={() => setSelectedId(template.id)}
                  >
                    <span className="fw-semibold">{template.title}</span>
                    <span className={`badge ${template.id === selectedId ? "text-bg-light" : "text-bg-secondary"}`}>
                      {template.items.length} ex
                    </span>
                  </button>
                ))}

                {templates.length === 0 && (
                  <div className="text-body-secondary mt-2">No templates yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column for templates*/}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              {!selected ? (
                <div className="text-body-secondary">Select a template to edit.</div>
              ) : (
                <>
                  <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                    {/* Template title editor */}
                    <div className="flex-grow-1" style={{ minWidth: 260 }}>
                      <label className="form-label">Title</label>
                      <input
                        className="form-control"
                        value={selected.title}
                        onChange={(e) => renameSelected(e.target.value)}
                      />
                      <div className="form-text">Example: Upper / Lower / Full Body</div>
                    </div>

                    {/* Template actions */}
                    <div className="d-flex gap-2 align-items-end">
                      <button className="btn btn-outline-secondary" onClick={() => setShowAddModal(true)}>
                        <FaDumbbell className="me-2" />
                        Add exercise
                      </button>
                      <button className="btn btn-outline-danger" onClick={deleteSelected}>
                        <FaTrash className="me-2" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <hr className="my-3" />

                  {/* Exercise plan list */}
                  {selected.items.length === 0 ? (
                    <div className="text-body-secondary">
                      No exercises yet. Click <span className="fw-semibold">Add exercise</span>.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {selected.items.map((item) => (
                        <div key={item.exerciseId} className="card border-0 shadow-sm">
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                              <div>
                                <div className="h5 mb-1">{findExerciseName(exercises, item.exerciseId)}</div>
                              </div>

                              <div className="d-flex gap-2">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => addSet(item.exerciseId)}>
                                  <FaPlus className="me-2" />
                                  Add set
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeExerciseFromSelected(item.exerciseId)}
                                >
                                  <FaTrash className="me-2" />
                                  Remove exercise
                                </button>
                              </div>
                            </div>

                            {/* Set plan table */}
                            <div className="table-responsive mt-3">
                              <table className="table align-middle">
                                <thead>
                                  <tr>
                                    <th style={{ width: 70 }}>Set</th>
                                    <th style={{ width: 140 }}>Reps</th>
                                    <th style={{ width: 160 }}>Target RPE</th>
                                    <th>Notes</th>
                                    <th style={{ width: 110 }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.sets.map((set, index) => (
                                    <tr key={index}>
                                      <td className="text-body-secondary">{index + 1}</td>

                                      <td>
                                        <input
                                          className="form-control"
                                          type="number"
                                          min={1}
                                          max={1000}
                                          value={set.reps}
                                          onChange={(e) => updateSet(item.exerciseId, index, { reps: Number(e.target.value) })}
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
                                          value={set.targetRpe ?? ""}
                                          onChange={(e) => updateSet(item.exerciseId, index, { targetRpe: Number(e.target.value) })}
                                        />
                                      </td>

                                      <td>
                                        <input
                                          className="form-control"
                                          placeholder="optional"
                                          value={set.notes ?? ""}
                                          onChange={(e) => updateSet(item.exerciseId, index, { notes: e.target.value })}
                                        />
                                      </td>

                                      <td className="text-end">
                                        <button className="btn btn-outline-danger btn-sm" onClick={() => removeSet(item.exerciseId, index)}>
                                          <FaEraser className="me-2" />
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="small text-body-secondary">
                              Tip: RPE is not necessary.
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAddModal && selected && (
        <>
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-scrollable"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add exercise</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
                </div>

                <div className="modal-body">
                  <input
                    className="form-control"
                    placeholder="Search exercises..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />

                  <div className="list-group mt-3">
                    {filteredExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => {
                          addExerciseToSelected(exercise.id);
                          setShowAddModal(false);
                          setExerciseSearch("");
                        }}
                      >
                        <div>
                          <div className="fw-semibold">{exercise.name}</div>
                          <div className="small text-body-secondary">
                            {exercise.muscleGroup.toUpperCase()} • {exercise.equipment}
                          </div>
                        </div>
                      </button>
                    ))}

                    {filteredExercises.length === 0 && (
                      <div className="text-body-secondary mt-2">No exercises match your search.</div>
                    )}
                  </div>

                  <div className="mt-3 small text-body-secondary">
                    Missing an exercise? Add it in <span className="fw-semibold">Library</span>.
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Modal background */}
          <div className="modal-backdrop show"></div>
        </>
      )}
    </div>
  );
}