import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Filter,
  Home,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import organizationService from "../services/organizationService";
import projectService from "../services/projectService";
import taskService from "../services/taskService";
import { formatDate } from "../utils/dateFormat";

const TaskModal = lazy(() => import("../components/TaskModal"));

const TaskDetailsModal = lazy(() =>
  import("../components/TaskDetailsModal")
);

const MANAGER_ROLES = new Set([
  "OWNER",
  "ADMIN",
  "MANAGER",
]);

const STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "All statuses",
  },
  {
    value: "TODO",
    label: "To do",
  },
  {
    value: "IN_PROGRESS",
    label: "In progress",
  },
  {
    value: "IN_REVIEW",
    label: "In review",
  },
  {
    value: "BLOCKED",
    label: "Blocked",
  },
  {
    value: "DONE",
    label: "Done",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "ALL",
    label: "All priorities",
  },
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "CRITICAL",
    label: "Critical",
  },
];

const STATUS_META = {
  TODO: {
    label: "To do",
    className:
      "border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/65",
    dot: "bg-stone-400",
  },

  IN_PROGRESS: {
    label: "In progress",
    className:
      "border-accent/20 bg-accent-soft text-accent-strong dark:border-accent/25 dark:bg-accent/10 dark:text-[#d7c5b8]",
    dot: "bg-accent",
  },

  IN_REVIEW: {
    label: "In review",
    className:
      "border-warning/20 bg-warning-soft text-warning dark:border-warning/25 dark:bg-warning/10 dark:text-[#d6b78f]",
    dot: "bg-warning",
  },

  BLOCKED: {
    label: "Blocked",
    className:
      "border-danger/20 bg-danger-soft text-danger dark:border-danger/25 dark:bg-danger/10 dark:text-[#d8aaa4]",
    dot: "bg-danger",
  },

  DONE: {
    label: "Done",
    className:
      "border-success/20 bg-success-soft text-success dark:border-success/25 dark:bg-success/10 dark:text-[#b8cbb9]",
    dot: "bg-success",
  },
};

const PRIORITY_META = {
  LOW: {
    label: "Low",
    className: "text-muted dark:text-white/45",
  },

  MEDIUM: {
    label: "Medium",
    className:
      "text-accent-strong dark:text-[#c9b9ac]",
  },

  HIGH: {
    label: "High",
    className:
      "text-warning dark:text-[#d5b488]",
  },

  CRITICAL: {
    label: "Critical",
    className:
      "text-danger dark:text-[#dca8a1]",
  },
};

function readError(error) {
  const response = error?.response?.data;

  if (typeof response?.detail === "string") {
    return response.detail;
  }

  if (response && typeof response === "object") {
    const messages = Object.values(response)
      .flat()
      .filter((value) => typeof value === "string");

    if (messages.length) {
      return messages.join(" ");
    }
  }

  if (
    typeof error?.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getInitials(name = "") {
  const parts = String(name)
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

function TaskStatusBadge({ status }) {
  const meta =
    STATUS_META[status] ??
    STATUS_META.TODO;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
      />

      {meta.label}
    </span>
  );
}

function TaskPriority({ priority }) {
  const meta =
    PRIORITY_META[priority] ??
    PRIORITY_META.MEDIUM;

  return (
    <span
      className={`text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function TasksLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted dark:text-white/45">
        <LoaderCircle
          size={18}
          className="animate-spin"
        />

        Loading tasks...
      </div>
    </div>
  );
}

function EmptyTasks({
  hasFilters,
  onClear,
  onCreate,
  canCreate,
  permissionMessage,
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45">
        <CheckCircle2 size={21} />
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-ink dark:text-white">
        {hasFilters
          ? "No matching tasks"
          : "No tasks yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted dark:text-white/45">
        {hasFilters
          ? "Try changing your search or filters to find another task."
          : "Create the first task in one of your projects to start tracking work."}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
          >
            <RotateCcw size={15} />
            Clear filters
          </button>
        )}

        {!hasFilters && canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sidebar px-4 text-sm font-semibold text-white transition hover:bg-[#302c28] dark:bg-white dark:text-[#24211E] dark:hover:bg-white/90"
          >
            <Plus size={16} />
            Create task
          </button>
        )}
        {!hasFilters && !canCreate && permissionMessage && (
          <p role="status" className="max-w-sm text-xs leading-5 text-muted dark:text-white/45">
            {permissionMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [projectsError, setProjectsError] =
    useState("");

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [projectFilter, setProjectFilter] =
    useState("ALL");

  const [showFilters, setShowFilters] =
    useState(false);

  const [taskModalOpen, setTaskModalOpen] =
    useState(false);

  const [taskModalLoading, setTaskModalLoading] =
    useState(false);

  const [taskModalError, setTaskModalError] =
    useState("");

  const [selectedTask, setSelectedTask] = useState(
    () => location.state?.searchTask ?? null
  );

  const [toast, setToast] = useState("");

  const currentUserId = user?.id;

  const organizationRoleById = useMemo(
    () => new Map(organizations.map((organization) => [
      String(organization.id),
      organization.current_user_role,
    ])),
    [organizations]
  );

  const manageableProjects = useMemo(
    () => projects.filter((project) =>
      !project.is_archived &&
      MANAGER_ROLES.has(organizationRoleById.get(String(project.organization_pk)))
    ),
    [organizationRoleById, projects]
  );

  const canCreateTask =
    !projectsLoading &&
    !projectsError &&
    !organizationsLoading &&
    !organizationsError &&
    manageableProjects.length > 0;

  const taskPermissionMessage = organizationsLoading || projectsLoading
    ? "Checking task permissions..."
    : organizationsError
      ? `Could not verify task permissions: ${organizationsError}`
      : projectsError
        ? `Could not verify available projects: ${projectsError}`
        : manageableProjects.length > 0
          ? ""
          : organizations.some((organization) =>
              MANAGER_ROLES.has(organization.current_user_role)
            )
            ? "No active projects are available for task creation."
            : "Only workspace owners, admins, and managers can create tasks.";

  useEffect(() => {
    if (!location.state?.searchTask) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const canManage = useCallback(
    (task) => {
      const project = projects.find(
        (item) =>
          String(item.id) ===
          String(
            task?.project_pk ??
              task?.project_id
          )
      );

      if (!project) {
        return false;
      }

      return MANAGER_ROLES.has(
        organizationRoleById.get(String(project.organization_pk))
      );
    },
    [organizationRoleById, projects]
  );

  const canChangeStatus = useCallback(
    (task) => {
      if (!task) {
        return false;
      }

      if (canManage(task)) {
        return true;
      }

      return Boolean(
        currentUserId &&
          task.assigned_to &&
          String(task.assigned_to) ===
            String(currentUserId)
      );
    },
    [canManage, currentUserId]
  );

  const loadTasks = useCallback(async () => {
    try {
      const data =
        await taskService.getTasks();

      setTasks(
        Array.isArray(data) ? data : []
      );
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const data =
        await projectService.getProjects();

      setProjects(
        Array.isArray(data) ? data : []
      );
    } catch (requestError) {
      setProjectsError(
        readError(requestError)
      );
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [loadTasks, loadProjects]);

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        const data = await organizationService.getOrganizations();
        if (!cancelled) setOrganizations(data);
      } catch (requestError) {
        if (!cancelled) {
          setOrganizations([]);
          setOrganizationsError(readError(requestError));
        }
      } finally {
        if (!cancelled) setOrganizationsLoading(false);
      }
    };

    loadOrganizations();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshTasks = () => {
    setLoading(true);
    setError("");
    loadTasks();
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast("");
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  const projectMap = useMemo(() => {
    return new Map(
      projects.map((project) => [
        String(project.id),
        project,
      ])
    );
  }, [projects]);

  const filteredTasks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (scope === "MINE") {
          const isMine =
            String(
              task.assigned_to ?? ""
            ) ===
            String(currentUserId ?? "");

          if (!isMine) {
            return false;
          }
        }

        if (
          status !== "ALL" &&
          task.status !== status
        ) {
          return false;
        }

        if (
          priority !== "ALL" &&
          task.priority !== priority
        ) {
          return false;
        }

        if (
          projectFilter !== "ALL" &&
          String(
            task.project_pk ??
              task.project_id
          ) !== String(projectFilter)
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const searchable = [
          task.title,
          task.description,
          task.code,
          task.project_name,
          task.assigned_to_email,
          task.created_by_email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => {
        const aDate = a.due_date
          ? new Date(
              `${a.due_date}T00:00:00`
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bDate = b.due_date
          ? new Date(
              `${b.due_date}T00:00:00`
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

        return aDate - bDate;
      });
  }, [
    tasks,
    search,
    scope,
    status,
    priority,
    projectFilter,
    currentUserId,
  ]);

  const activeFilterCount = [
    status !== "ALL",
    priority !== "ALL",
    projectFilter !== "ALL",
  ].filter(Boolean).length;

  const hasFilters =
    Boolean(search.trim()) ||
    scope !== "ALL" ||
    status !== "ALL" ||
    priority !== "ALL" ||
    projectFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setScope("ALL");
    setStatus("ALL");
    setPriority("ALL");
    setProjectFilter("ALL");
  };

  const openCreateTask = () => {
    setTaskModalError("");
    if (!canCreateTask) return;

    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    if (taskModalLoading) {
      return;
    }

    setTaskModalOpen(false);
    setTaskModalError("");
  };

  const handleCreateTask = async (payload) => {
    if (
      !manageableProjects.some(
        (project) => String(project.id) === String(payload.project_id)
      )
    ) {
      setTaskModalError(
        taskPermissionMessage ||
          "You do not have permission to create a task in that project."
      );
      return;
    }

    setTaskModalLoading(true);
    setTaskModalError("");

    try {
      const createdTask =
        await taskService.createTask(
          payload
        );

      setTasks((current) => [
        createdTask,
        ...current,
      ]);

      setTaskModalOpen(false);

      setToast(
        "Task created successfully."
      );
    } catch (requestError) {
      setTaskModalError(
        readError(requestError)
      );
    } finally {
      setTaskModalLoading(false);
    }
  };

  const handleTaskUpdated = (
    updatedTask
  ) => {
    if (!updatedTask) {
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        String(task.id) ===
        String(updatedTask.id)
          ? updatedTask
          : task
      )
    );

    setSelectedTask(updatedTask);

    setToast("Task updated.");
  };

  const handleTaskDeleted = async (
    taskId
  ) => {
    await taskService.deleteTask(
      taskId
    );

    setTasks((current) =>
      current.filter(
        (task) =>
          String(task.id) !==
          String(taskId)
      )
    );

    setSelectedTask(null);

    setToast("Task deleted.");
  };

  const selectedProject = selectedTask
    ? projectMap.get(
        String(
          selectedTask.project_pk ??
            selectedTask.project_id
        )
      )
    : null;

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
                    navigate(
                      "/app/dashboard"
                    )
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-muted transition hover:bg-stone-100 hover:text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <ArrowLeft size={14} />

                  Back to Dashboard
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/app/dashboard"
                    )
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
                    navigate(
                      "/app/dashboard"
                    )
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
                  Tasks
                </span>
              </div>

              {/* Page title */}
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
                  <CheckCircle2
                    size={19}
                    className="text-accent-strong dark:text-[#cdb8a8]"
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Tasks
                  </h1>

                  <p className="mt-1 text-sm text-muted dark:text-white/45">
                    Track work across your
                    projects.
                  </p>
                </div>
              </div>
            </div>

            {/* New task */}
            {canCreateTask ? (
              <button
                type="button"
                onClick={openCreateTask}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sidebar px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#302c28] dark:bg-white dark:text-[#24211E] dark:hover:bg-white/90"
              >
                <Plus size={17} />
                New task
              </button>
            ) : (
              <p
                role={organizationsError || projectsError ? "alert" : "status"}
                className="max-w-sm text-xs leading-5 text-muted dark:text-white/45"
              >
                {taskPermissionMessage}
              </p>
            )}
          </div>
        </header>

        {/* =====================================================
            TASK WORKSPACE
        ====================================================== */}

        <section className="rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025]">

          {/* Search / Controls */}
          <div className="border-b border-line p-4 dark:border-white/10 sm:p-5">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* Search */}
              <div className="relative min-w-0 flex-1">

                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-white/35"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search tasks, codes, projects or assignees..."
                  className="h-11 w-full rounded-lg border border-line bg-canvas pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent dark:border-white/10 dark:bg-[#24211E] dark:text-white dark:placeholder:text-white/30 dark:focus:border-accent"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-black/5 hover:text-ink dark:text-white/35 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2">

                {/* Scope */}
                <div className="flex rounded-lg border border-line bg-canvas p-1 dark:border-white/10 dark:bg-[#24211E]">

                  <button
                    type="button"
                    onClick={() =>
                      setScope("ALL")
                    }
                    className={`h-9 rounded-md px-3 text-xs font-semibold transition ${
                      scope === "ALL"
                        ? "bg-surface text-ink shadow-sm dark:bg-white/10 dark:text-white"
                        : "text-muted hover:text-ink dark:text-white/40 dark:hover:text-white"
                    }`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setScope("MINE")
                    }
                    className={`h-9 rounded-md px-3 text-xs font-semibold transition ${
                      scope === "MINE"
                        ? "bg-surface text-ink shadow-sm dark:bg-white/10 dark:text-white"
                        : "text-muted hover:text-ink dark:text-white/40 dark:hover:text-white"
                    }`}
                  >
                    Mine
                  </button>
                </div>

                {/* Filters */}
                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(
                      (current) =>
                        !current
                    )
                  }
                  className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition ${
                    showFilters ||
                    activeFilterCount
                      ? "border-accent/30 bg-accent-soft text-accent-strong dark:border-accent/30 dark:bg-accent/10 dark:text-[#d6c3b5]"
                      : "border-line bg-canvas text-ink hover:bg-stone-100 dark:border-white/10 dark:bg-[#24211E] dark:text-white dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <SlidersHorizontal
                    size={16}
                  />

                  Filters

                  {activeFilterCount >
                    0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                      {
                        activeFilterCount
                      }
                    </span>
                  )}
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={refreshTasks}
                  disabled={loading}
                  aria-label="Refresh tasks"
                  title="Refresh tasks"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-canvas text-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#24211E] dark:text-white/45 dark:hover:text-white"
                >
                  <RotateCcw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                className="mt-4 grid gap-3 border-t border-line pt-4 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3"
              >

                {/* Status */}
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-muted dark:text-white/50">
                    Status
                  </span>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value
                      )
                    }
                    className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent dark:border-white/10 dark:bg-[#24211E] dark:text-white"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {/* Priority */}
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-muted dark:text-white/50">
                    Priority
                  </span>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value
                      )
                    }
                    className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent dark:border-white/10 dark:bg-[#24211E] dark:text-white"
                  >
                    {PRIORITY_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {/* Project */}
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-muted dark:text-white/50">
                    Project
                  </span>

                  <select
                    value={projectFilter}
                    onChange={(event) =>
                      setProjectFilter(
                        event.target.value
                      )
                    }
                    disabled={
                      projectsLoading
                    }
                    className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent disabled:opacity-60 dark:border-white/10 dark:bg-[#24211E] dark:text-white"
                  >
                    <option value="ALL">
                      All projects
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </motion.div>
            )}
          </div>

          {/* Result summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 dark:border-white/10 sm:px-5">

            <div className="flex items-center gap-2 text-xs text-muted dark:text-white/40">
              <Filter size={14} />

              <span>
                {filteredTasks.length}{" "}
                {filteredTasks.length ===
                1
                  ? "task"
                  : "tasks"}
              </span>

              {scope === "MINE" && (
                <span className="border-l border-line pl-2 dark:border-white/10">
                  Assigned to you
                </span>
              )}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-accent-strong hover:underline dark:text-[#cdb7a7]"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* =====================================================
              ERROR
          ====================================================== */}

          {error ? (
            <div className="p-5">
              <div className="flex flex-col gap-4 rounded-xl border border-danger/20 bg-danger-soft p-5 dark:border-danger/20 dark:bg-danger/10 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex gap-3">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-danger"
                  />

                  <div>
                    <h3 className="text-sm font-semibold text-danger">
                      Could not load tasks
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-danger/80 dark:text-[#d8aaa4]">
                      {error}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadTasks}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-danger/20 bg-surface px-3 text-xs font-semibold text-danger hover:bg-white/50 dark:bg-white/[0.03]"
                >
                  <RotateCcw
                    size={14}
                  />

                  Try again
                </button>
              </div>
            </div>
          ) : loading ? (
            <TasksLoading />
          ) : filteredTasks.length ===
            0 ? (
            <EmptyTasks
              hasFilters={hasFilters}
              onClear={clearFilters}
              onCreate={openCreateTask}
              canCreate={canCreateTask}
              permissionMessage={taskPermissionMessage}
            />
          ) : (
            /* =====================================================
               TASK LIST
            ====================================================== */

            <div className="divide-y divide-line dark:divide-white/10">
              {filteredTasks.map(
                (task, index) => {
                  const project =
                    projectMap.get(
                      String(
                        task.project_pk ??
                          task.project_id
                      )
                    ) ?? null;

                  return (
                    <motion.button
                      key={task.id}
                      type="button"
                      onClick={() =>
                        setSelectedTask(
                          task
                        )
                      }
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(
                          index * 0.025,
                          0.2
                        ),
                      }}
                      className="group grid w-full gap-4 px-4 py-4 text-left transition hover:bg-canvas/70 dark:hover:bg-white/[0.025] sm:px-5 lg:grid-cols-[minmax(0,1fr)_150px_130px_145px_24px] lg:items-center"
                    >

                      {/* Task */}
                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          {task.code && (
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-white/35">
                              {task.code}
                            </span>
                          )}

                          <TaskStatusBadge
                            status={
                              task.status
                            }
                          />
                        </div>

                        <h3 className="mt-2 truncate text-sm font-semibold text-ink transition group-hover:text-accent-strong dark:text-white dark:group-hover:text-[#d7c4b4]">
                          {task.title}
                        </h3>

                        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted dark:text-white/40">

                          <span className="truncate">
                            {project?.name ||
                              task.project_name ||
                              "Unknown project"}
                          </span>

                          {task.description && (
                            <>
                              <span className="shrink-0">
                                ·
                              </span>

                              <span className="hidden truncate md:block">
                                {
                                  task.description
                                }
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="hidden lg:block">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted dark:text-white/30">
                          Priority
                        </p>

                        <div className="mt-1.5">
                          <TaskPriority
                            priority={
                              task.priority
                            }
                          />
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="hidden lg:block">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted dark:text-white/30">
                          Assignee
                        </p>

                        <div className="mt-1.5 flex items-center gap-2">

                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[9px] font-bold text-accent-strong dark:bg-accent/10 dark:text-[#d4c0b0]">
                            {getInitials(
                              task.assigned_to_email ||
                                "Unassigned"
                            )}
                          </span>

                          <span className="max-w-[95px] truncate text-xs font-medium text-ink dark:text-white/65">
                            {task.assigned_to_email ||
                              "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {/* Due */}
                      <div className="hidden lg:block">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted dark:text-white/30">
                          Due
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink dark:text-white/60">
                          <Clock3
                            size={13}
                            className="text-muted"
                          />

                          {formatDate(task.due_date, "No due date")}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        size={16}
                        className="hidden text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink dark:text-white/25 dark:group-hover:text-white lg:block"
                      />

                      {/* Mobile meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:hidden">

                        <span className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-white/45">
                          <CircleDot
                            size={13}
                          />

                          <TaskPriority
                            priority={
                              task.priority
                            }
                          />
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-white/45">
                          <UserRound
                            size={13}
                          />

                          {task.assigned_to_email ||
                            "Unassigned"}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-white/45">
                          <Clock3
                            size={13}
                          />

                          {formatDate(task.due_date, "No due date")}
                        </span>
                      </div>
                    </motion.button>
                  );
                }
              )}
            </div>
          )}
        </section>
      </main>

      {/* =====================================================
          SUCCESS TOAST
      ====================================================== */}

      {toast && (
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="fixed bottom-5 right-5 z-[120] flex max-w-sm items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-elevated dark:border-white/10 dark:bg-[#2b2825] dark:text-white"
        >
          <CheckCircle2
            size={17}
            className="text-success"
          />

          {toast}
        </motion.div>
      )}

      {/* =====================================================
          MODALS
      ====================================================== */}

      <Suspense fallback={null}>
        <TaskModal
          open={taskModalOpen}
          onClose={closeTaskModal}
          onSubmit={handleCreateTask}
          projects={manageableProjects}
          loading={taskModalLoading}
          error={taskModalError}
        />

        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            project={selectedProject}
            canManage={canManage(
              selectedTask
            )}
            canChangeStatus={canChangeStatus(
              selectedTask
            )}
            userId={currentUserId}
            onClose={() =>
              setSelectedTask(null)
            }
            onTaskUpdated={
              handleTaskUpdated
            }
            onTaskDeleted={
              handleTaskDeleted
            }
          />
        )}
      </Suspense>

      {/* =====================================================
          PROJECT LOAD WARNING
      ====================================================== */}

      {projectsError &&
        !projectsLoading && (
          <div className="fixed bottom-5 left-5 z-[110] hidden max-w-sm rounded-lg border border-warning/20 bg-warning-soft px-3 py-2 text-xs text-warning shadow-soft sm:block dark:border-warning/20 dark:bg-warning/10 dark:text-[#d4b287]">
            Project data could not be loaded.
            Task assignment options may be
            limited.
          </div>
        )}
    </div>
  );
}

export default Tasks;