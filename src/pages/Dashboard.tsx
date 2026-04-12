import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { load, KEYS, save } from "../lib/storage";
import { todayKey, weekKeys, fromKey } from "../lib/dates";
import type { Session, WeekPlan, WorkoutTemplate } from "../models/types";
import { FaPlay, FaCalendarAlt, FaBolt, FaCheckCircle, FaRegClock } from "react-icons/fa";
import { toast } from "react-toastify";

/**
 * Resolve a template title to display.
 */
function getTemplateTitle(templates: WorkoutTemplate[], templateId?: string) {
  if (!templateId) return null;
  return templates.find((template) => template.id === templateId)?.title ?? "Unknown template";
}

/**
 * Format a date key into a label like "Mon 03-05"
 */
function formatDateLabel(key: string) {
  const date = fromKey(key);
  const dayOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  return `${dayOfTheWeek} ${key.slice(5)}`;
}

/**
 * Find a session by the date key.
 */
function findSessionByDate(sessions: Session[], dateKey: string) {
  return sessions.find((session) => session.date === dateKey);
}

/**
 * Sort sessions by the date string with newest first.
 */
function sortSessionsDesc(sessions: Session[]) {
  return [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Derive a status for each day Done/Planned/Rest.
 */
function statusForDay(templateId?: string, hasSession?: boolean) {
  if (hasSession) return { label: "Done", icon: <FaCheckCircle />, variant: "success" as const };
  if (templateId) return { label: "Planned", icon: <FaBolt />, variant: "primary" as const };
  return { label: "Rest", icon: <FaRegClock />, variant: "secondary" as const };
}

export default function Dashboard() {
  /**
   * Load saved sessions, templates and week plan from localStorage.
   */
  const [templates] = useState(() => load<WorkoutTemplate[]>(KEYS.templates, []));
  const [sessions] = useState(() => load<Session[]>(KEYS.sessions, []));
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(() => load<WeekPlan>(KEYS.weekPlan, { days: {} }));


  /**
   * Update week plan on change.
   */
  useEffect(() => {
    function onUpdate() {
      setWeekPlan(load(KEYS.weekPlan, { days: {} }));
    }

    window.addEventListener("wp-storage", onUpdate);

    return () => window.removeEventListener("wp-storage", onUpdate);
  }, []);

  /**
   * Compute current week keys from Monday to Sunday.
   */
  const today = todayKey();
  const week = weekKeys(today);

  /**
   * The planned template and possible session for today.
   */
  const todayTemplateId = weekPlan.days[today]?.templateId;
  const todayTemplateTitle = getTemplateTitle(templates, todayTemplateId);
  const todaySession = findSessionByDate(sessions, today);

  /**
   * Recent sessions list with the last 5 sessions.
   */
  const recent = sortSessionsDesc(sessions).slice(0, 5);

  /**
   * Clear this week's plan assignments in localStorage.
   */
  function quickClearWeek() {
    const next: WeekPlan = { days: { ...weekPlan.days } };
    for (const key of week) next.days[key] = {};
    setWeekPlan(next);
    save(KEYS.weekPlan, next);
    toast.info("This week cleared.");
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="h3 mb-1">Dashboard</h1>
          <div className="text-body-secondary">Plan and track your training sessions.</div>
        </div>

        <div className="d-flex gap-2">
          <Link className="btn btn-outline-primary" to="/plan">
            <FaCalendarAlt className="me-2" />
            Edit week
          </Link>
          <button className="btn btn-outline-secondary" onClick={quickClearWeek}>
            Clear this week
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mt-3">
        <MetricCard
          title="Planned days"
          value={`${week.filter((key) => !!weekPlan.days[key]?.templateId).length} / 7`}
          hint="Templates assigned this week"
        />
        <MetricCard
          title="Completed days"
          value={`${week.filter((key) => !!findSessionByDate(sessions, key)).length} / 7`}
          hint="Sessions logged this week"
        />
        <MetricCard
          title="Total sessions"
          value={`${sessions.length}`}
          hint="All-time logged sessions"
        />
      </div>

      <div className="row g-3 mt-1">
        {/* Today card */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-body-secondary small">Today</div>
                  <div className="h5 mb-0">{today}</div>
                </div>

                <DayStatusPill templateId={todayTemplateId} hasSession={!!todaySession} />
              </div>

              <hr className="my-3" />

              {todayTemplateId ? (
                <>
                  <div className="mb-2">
                    <div className="text-body-secondary small">Template</div>
                    <div className="fw-semibold">{todayTemplateTitle}</div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <Link
                      to={`/session/${today}`}
                      className={`btn ${todaySession ? "btn-outline-success" : "btn-primary"}`}
                    >
                      <FaPlay className="me-2" />
                      {todaySession ? "Open session" : "Start session"}
                    </Link>
                    <Link to="/templates" className="btn btn-outline-secondary">
                      Edit templates
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2">
                    <div className="fw-semibold">No workout planned for today.</div>
                    <div className="text-body-secondary">Assign a template to this day in your week plan.</div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <Link to="/plan" className="btn btn-primary">
                      <FaCalendarAlt className="me-2" />
                      Pick a template
                    </Link>
                    <Link to="/templates" className="btn btn-outline-secondary">
                      Browse templates
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Week overview */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="text-body-secondary small">Week overview</div>
                  <div className="h5 mb-0">Monday → Sunday</div>
                </div>
                <div className="text-body-secondary small">
                  Click a day to open a session (or plan it)
                </div>
              </div>

              <div className="row g-2 mt-2">
                {week.map((key) => {
                  const templateId = weekPlan.days[key]?.templateId;
                  const title = getTemplateTitle(templates, templateId);
                  const session = findSessionByDate(sessions, key);
                  const status = statusForDay(templateId, !!session);

                  // If there is a planned template, go to the session page, otherwise go to the Plan page.
                  const href = templateId ? `/session/${key}` : "/plan";

                  return (
                    <div className="col-12 col-sm-6 col-xl-4" key={key}>
                      <Link to={href} className="text-decoration-none">
                        <div
                          className="card h-100 border-0 shadow-sm"
                          style={{ transition: "transform 120ms ease" }}
                          // Lift on hover effect
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between gap-2">
                              <div>
                                <div className="small text-body-secondary">{formatDateLabel(key)}</div>
                                <div className="fw-semibold">{title ?? "Rest day"}</div>
                              </div>

                              <span className={`badge text-bg-${status.variant} d-inline-flex align-items-center gap-1`}>
                                {status.icon}
                                {status.label}
                              </span>
                            </div>

                            {session ? (
                              <div className="mt-3 small text-body-secondary">
                                Logged {session.exercises.length} exercise{session.exercises.length === 1 ? "" : "s"}
                                {typeof session.durationMinutes === "number" ? ` • ${session.durationMinutes} min` : ""}
                              </div>
                            ) : (
                              <div className="mt-3 small text-body-secondary">
                                {templateId ? "Click to start logging" : "Click to plan this day"}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="text-body-secondary small">Recent sessions</div>
                  <div className="h5 mb-0">Last logs</div>
                </div>
                <Link to="/plan" className="btn btn-sm btn-outline-primary">
                  Plan week
                </Link>
              </div>

              <div className="mt-3">
                {recent.length === 0 ? (
                  <div className="text-body-secondary">No sessions yet. Start one from Today.</div>
                ) : (
                  <div className="list-group">
                    {recent.map((s) => {
                      const title = getTemplateTitle(templates, s.templateId) ?? "Session";
                      return (
                        <Link
                          key={s.id}
                          to={`/session/${s.date}`}
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">{title}</div>
                            <div className="small text-body-secondary">
                              {s.date} • {s.exercises.length} exercise{s.exercises.length === 1 ? "" : "s"}
                              {typeof s.durationMinutes === "number" ? ` • ${s.durationMinutes} min` : ""}
                            </div>
                          </div>
                          <span className="badge text-bg-light border">Open</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Badge for the day status Done/Planned/Rest.
 */
function DayStatusPill({ templateId, hasSession }: { templateId?: string; hasSession: boolean }) {
  const status = statusForDay(templateId, hasSession);
  return (
    <span className={`badge text-bg-${status.variant} d-inline-flex align-items-center gap-1`}>
      {status.icon}
      {status.label}
    </span>
  );
}

/**
 * Metric card component used for the top of dashboard.
 */
function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="col-12 col-md-4">
      <div className="card shadow-sm h-100">
        <div className="card-body">
          <div className="text-body-secondary small">{title}</div>
          <div className="h4 mb-1">{value}</div>
          <div className="small text-body-secondary">{hint}</div>
        </div>
      </div>
    </div>
  );
}