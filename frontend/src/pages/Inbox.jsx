import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Home,
  Inbox as InboxIcon,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import taskService from "../services/taskService";
import { formatDateTime } from "../utils/dateFormat";

function readError(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    const messages = Object.values(data)
      .flat()
      .filter((value) => typeof value === "string");

    if (messages.length) {
      return messages.join(" ");
    }
  }

  return error?.message || "Unable to load activity.";
}

function getInitials(value = "") {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function Inbox() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = useCallback(async () => {
    try {
      const data =
        await taskService.getWorkspaceActivity();

      setActivities(
        Array.isArray(data) ? data : []
      );
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const refreshActivity = () => {
    setLoading(true);
    setError("");
    loadActivity();
  };

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-[#24211E] dark:text-white">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              {/* Navigation */}
              <div className="mb-4 flex flex-wrap items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/dashboard")
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-muted transition hover:bg-stone-100 hover:text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <ChevronRight
                    size={14}
                    className="rotate-180"
                  />

                  Back to Dashboard
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/dashboard")
                  }
                  aria-label="Go to home"
                  title="Home"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:bg-stone-100 hover:text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <Home size={14} />
                </button>

                <ChevronRight
                  size={13}
                  className="text-muted/60 dark:text-white/25"
                />

                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/dashboard")
                  }
                  className="text-xs font-medium text-muted transition hover:text-ink dark:text-white/40 dark:hover:text-white"
                >
                  Dashboard
                </button>

                <ChevronRight
                  size={13}
                  className="text-muted/60 dark:text-white/25"
                />

                <span className="text-xs font-semibold text-ink dark:text-white/75">
                  Inbox
                </span>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
                  <InboxIcon
                    size={19}
                    className="text-accent-strong dark:text-[#cdb8a8]"
                  />
                </div>

                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Inbox
                  </h1>

                  <p className="mt-1 text-sm text-muted dark:text-white/45">
                    Stay up to date with workspace activity.
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshActivity}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
            >
              <RotateCcw
                size={16}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              Refresh
            </button>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <section className="rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025]">

          {/* Section header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-white/10">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:bg-accent/10 dark:text-[#cdb8a8]">
                <Bell size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-ink dark:text-white">
                  Recent activity
                </h2>

                <p className="mt-0.5 text-xs text-muted dark:text-white/40">
                  Latest workspace events
                </p>
              </div>
            </div>

            <span className="text-xs font-medium text-muted dark:text-white/40">
              {activities.length}{" "}
              {activities.length === 1
                ? "event"
                : "events"}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="m-5 rounded-xl border border-danger/20 bg-danger-soft p-4 dark:border-danger/20 dark:bg-danger/10">

              <div className="flex items-start gap-3">

                <Bell
                  size={17}
                  className="mt-0.5 shrink-0 text-danger"
                />

                <div className="flex-1">
                  <p className="text-sm font-semibold text-danger">
                    Could not load activity
                  </p>

                  <p className="mt-1 text-xs leading-5 text-danger/80 dark:text-[#d8aaa4]">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshActivity}
                  className="text-xs font-semibold text-danger hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-muted dark:text-white/45">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Loading activity...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            activities.length === 0 && (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-canvas text-muted dark:border-white/10 dark:bg-[#24211E] dark:text-white/40">
                  <CheckCircle2 size={21} />
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold text-ink dark:text-white">
                  Nothing new yet
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted dark:text-white/45">
                  Workspace activity will appear here as projects and tasks change.
                </p>
              </div>
            )}

          {/* Activity */}
          {!loading &&
            !error &&
            activities.length > 0 && (
              <div className="divide-y divide-line dark:divide-white/10">

                {activities.map(
                  (activity, index) => {
                    const actor =
                      activity.user_name ||
                      activity.created_by_name ||
                      activity.created_by_email ||
                      activity.user_email ||
                      "Workspace member";

                    const title =
                      activity.message ||
                      activity.description ||
                      activity.action ||
                      "Workspace activity";

                    const projectName =
                      activity.project_name ||
                      activity.project?.name;

                    const taskTitle =
                      activity.task_title ||
                      activity.task?.title;

                    return (
                      <div
                        key={
                          activity.id ??
                          `${index}-${title}`
                        }
                        className="flex gap-4 px-5 py-5 transition hover:bg-canvas/60 dark:hover:bg-white/[0.02]"
                      >

                        {/* Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent-strong dark:bg-accent/10 dark:text-[#d2bdac]">
                          {getInitials(actor)}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">

                            <p className="text-sm leading-6 text-ink dark:text-white/80">
                              <span className="font-semibold">
                                {actor}
                              </span>{" "}
                              <span className="text-muted dark:text-white/45">
                                {title}
                              </span>
                            </p>

                            <time
                              dateTime={activity.created_at || activity.timestamp || activity.updated_at}
                              className="shrink-0 text-[11px] text-muted dark:text-white/30"
                            >
                              {formatDateTime(
                                activity.created_at ||
                                  activity.timestamp ||
                                  activity.updated_at
                              )}
                            </time>
                          </div>

                          {(projectName ||
                            taskTitle) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted dark:text-white/40">

                              {projectName && (
                                <span>
                                  {projectName}
                                </span>
                              )}

                              {projectName &&
                                taskTitle && (
                                  <ChevronRight
                                    size={12}
                                  />
                                )}

                              {taskTitle && (
                                <span className="font-medium text-ink/70 dark:text-white/55">
                                  {taskTitle}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default Inbox;