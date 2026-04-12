import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { load, save, KEYS } from "../lib/storage";
import { todayKey, weekKeys, addDays, fromKey } from "../lib/dates";
import type { WeekPlan, WorkoutTemplate } from "../models/types";
import { FaArrowLeft, FaCopy, FaEraser, FaSave } from "react-icons/fa";

/**
 * Display the day of week, the month and the day number.
 */
function formatDate(key: string) {
  const date = fromKey(key);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${key.slice(5)}`;
}

/**
 * Ensure weekPlan has entries for all of the day keys.
 */
function ensureWeekKeys(weekPlan: WeekPlan, keys: string[]): WeekPlan {
  const next: WeekPlan = { days: { ...weekPlan.days } };
  for (const key of keys) {
    if (!next.days[key]) next.days[key] = {};
  }
  return next;
}

export default function PlanPage() {
  /**
   * Load saved templates and week plan from localStorage.
   */
  const templates = load<WorkoutTemplate[]>(KEYS.templates, []);
  const storedWeekPlan = load<WeekPlan>(KEYS.weekPlan, { days: {} });

  /**
   * Compute week key arrays.
   */
  const today = todayKey();
  const thisWeek = useMemo(() => weekKeys(today), [today]);
  const lastWeek = useMemo(() => thisWeek.map((key) => addDays(key, -7)), [thisWeek]);

  /**
   * Local week plan state to edit.
   * Dirty flag to represent unsaved changes.
   */
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(() => ensureWeekKeys(storedWeekPlan, thisWeek));
  const [dirty, setDirty] = useState<boolean>(false);

  /**
   * Build selectable options with rest day and all the templates.
   */
  const templateOptions = useMemo(() => {
    return [{ id: "", title: "— Rest day —" }, ...templates.map((template) => ({ id: template.id, title: template.title }))];
  }, [templates]);

  /**
   * Assign a template to a day.
   * Undefined assigned for the rest days.
   */
  function setTemplateForDay(dayKey: string, templateId: string) {
    const next: WeekPlan = {
      days: {
        ...weekPlan.days,
        [dayKey]: { templateId: templateId === "" ? undefined : templateId },
      },
    };
    setWeekPlan(next);
    setDirty(true);
  }

  /**
   * Save week plan to localStorage.
   */
  function savePlan() {
    save(KEYS.weekPlan, weekPlan);
    setDirty(false);
    toast.success("Week plan saved.");
  }

  /**
   * Clear the current week.
   */
  function clearThisWeek() {
    const next: WeekPlan = { days: { ...weekPlan.days } };
    for (const key of thisWeek) next.days[key] = {};
    setWeekPlan(next);
    setDirty(true);
    toast.info("This week cleared (remember to Save).");
  }

  /**
   * Copy the last week's plan into this week's plan.
   */
  function copyLastWeekToThisWeek() {
    const next: WeekPlan = { days: { ...weekPlan.days } };

    for (let i = 0; i < 7; i++) {
      const source = lastWeek[i];
      const destination = thisWeek[i];

      const sourceTemplateId = weekPlan.days?.[source]?.templateId;
      next.days[destination] = { templateId: sourceTemplateId };
    }

    setWeekPlan(ensureWeekKeys(next, thisWeek));
    setDirty(true);
    toast.info("Copied last week into this week (remember to Save).");
  }

  // UI

  return (
    <div className="container py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <Link to="/" className="btn btn-outline-secondary mb-3">
            <FaArrowLeft className="me-2" />
            Back
          </Link>

          <h1 className="h4 mb-1">Week plan</h1>
          <div className="text-body-secondary">
            Assign a template to each day. Sessions will be atomatically created from the planned templates.
          </div>
        </div>

        {/* Action buttons */}
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary" onClick={copyLastWeekToThisWeek}>
            <FaCopy className="me-2" />
            Copy last week
          </button>
          <button className="btn btn-outline-danger" onClick={clearThisWeek}>
            <FaEraser className="me-2" />
            Clear this week
          </button>
          <button className={`btn ${dirty ? "btn-primary" : "btn-outline-primary"}`} onClick={savePlan}>
            <FaSave className="me-2" />
            Save
          </button>
        </div>
      </div>

      <div className="row g-3 mt-2">
        {/* Left: week day list */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="text-body-secondary small">This week</div>
                  <div className="h5 mb-0">Monday → Sunday</div>
                </div>
                {dirty ? (
                  <span className="badge text-bg-warning">Unsaved changes</span>
                ) : (
                  <span className="badge text-bg-success">Saved</span>
                )}
              </div>

              <div className="mt-3">
                {thisWeek.map((dayKey) => {
                  // Store "" as "rest day" in the select UI
                  const selected = weekPlan.days[dayKey]?.templateId ?? "";

                  return (
                    <div
                      key={dayKey}
                      className="d-flex align-items-center justify-content-between gap-3 py-2 border-top"
                    >
                      <div>
                        <div className="fw-semibold">{formatDate(dayKey)}</div>
                        <div className="small text-body-secondary">{dayKey}</div>
                      </div>

                      <div style={{ minWidth: 220 }}>
                        <select
                          className="form-select"
                          value={selected}
                          onChange={(e) => setTemplateForDay(dayKey, e.target.value)}
                        >
                          {templateOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 small text-body-secondary">
                Tip: Keep 2–4 training days planned. The rest days are a part of the plan.
              </div>
            </div>
          </div>
        </div>

        {/* Right: template summary and help */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="h5 mb-2">Templates</div>
              <div className="text-body-secondary small">
                Available workout templates ({templates.length})
              </div>

              <ul className="list-group list-group-flush mt-2">
                {templates.map((template) => (
                  <li key={template.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">{template.title}</span>
                    <span className="badge text-bg-light border">{template.items.length} ex</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3">
                <Link to="/templates" className="btn btn-outline-primary w-100">
                  Edit templates
                </Link>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <div className="fw-semibold mb-1">How it works</div>
              <div className="small text-body-secondary">
                Plan assigns a template to a date. When you open a session page for that date, the app creates a log
                from the template automatically.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}