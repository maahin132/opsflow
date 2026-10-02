import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDot,
  FileText,
  LoaderCircle,
  Pencil,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

import projectService from "../services/projectService";
import organizationService from "../services/organizationService";
import { formatDate, formatDateTime } from "../utils/dateFormat";

const PROJECT_MANAGER_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

const STATUS_LABELS = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_CLASSES = {
  PLANNING: "bg-stone-100 text-stone-700",
  ACTIVE: "bg-success-soft text-success",
  ON_HOLD: "bg-warning-soft text-warning",
  COMPLETED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-danger-soft text-danger",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function safeText(value, fallback = "") {
  if (
    value === null ||
    value === undefined ||
    typeof value === "object"
  ) {
    return fallback;
  }

  return String(value);
}

function formatInputDate(value) {
  const dateValue = safeText(value);

  if (!dateValue) {
    return "";
  }

  return dateValue.slice(0, 10);
}

function getInitials(value) {
  const text = safeText(value, "User");

  const parts = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div
      className="
        rounded-[18px]
        border border-line
        bg-surface
        p-5
        shadow-soft
        transition
        hover:-translate-y-0.5
        hover:shadow-panel
        dark:border-white/[0.08]
        dark:bg-[#2B2825]
      "
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted dark:text-white/40">
        <Icon size={15} />
        <span>{label}</span>
      </div>

      <p className="mt-3 text-sm font-semibold text-ink dark:text-white">
        {safeText(value, "Not set")}
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
      {children}
    </label>
  );
}

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [permissionError, setPermissionError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    due_date: "",
  });

  const canManageProject = PROJECT_MANAGER_ROLES.has(currentUserRole);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setCurrentUserRole(null);
      setPermissionError("");

      const data = await projectService.getProject(projectId);

      if (!data || typeof data !== "object") {
        throw new Error("Invalid project response.");
      }

      setProject(data);

      setForm({
        name: safeText(data.name),
        code: safeText(data.code),
        description: safeText(data.description),
        status: safeText(data.status, "PLANNING"),
        priority: safeText(data.priority, "MEDIUM"),
        start_date: formatInputDate(data.start_date),
        due_date: formatInputDate(data.due_date),
      });

      try {
        const organizations = await organizationService.getOrganizations();
        const organization = organizations.find(
          (item) => String(item.id) === String(data.organization_pk)
        );

        if (organization?.current_user_role) {
          setCurrentUserRole(organization.current_user_role);
        } else {
          setPermissionError(
            "Your workspace role could not be confirmed. Project management actions are disabled."
          );
        }
      } catch (permissionRequestError) {
        const detail = permissionRequestError?.response?.data?.detail;
        const messages = permissionRequestError?.response?.data
          ? Object.values(permissionRequestError.response.data)
              .flat()
              .filter((value) => typeof value === "string")
          : [];

        setPermissionError(
          (typeof detail === "string" && detail) ||
            messages.join(" ") ||
            "Could not verify project permissions. Management actions are disabled."
        );
      }
    } catch (requestError) {
      console.error("Project details error:", requestError);

      const detail = requestError?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to load this project."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const showSuccess = (message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  const getErrorMessage = (requestError) => {
    const data = requestError?.response?.data;

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (data && typeof data === "object") {
      const messages = Object.entries(data)
        .flatMap(([field, value]) =>
          (Array.isArray(value) ? value : [value]).map((item) =>
            typeof item === "string"
              ? `${field}: ${item}`
              : ""
          )
        )
        .filter(Boolean);

      if (messages.length) {
        return messages.join(" ");
      }
    }

    return "Something went wrong. Please try again.";
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditStart = () => {
    if (!canManageProject) return;
    setActionError("");

    setForm({
      name: safeText(project?.name),
      code: safeText(project?.code),
      description: safeText(project?.description),
      status: safeText(project?.status, "PLANNING"),
      priority: safeText(project?.priority, "MEDIUM"),
      start_date: formatInputDate(project?.start_date),
      due_date: formatInputDate(project?.due_date),
    });

    setEditing(true);
  };

  const handleEditCancel = () => {
    if (saving) return;

    setActionError("");

    setForm({
      name: safeText(project?.name),
      code: safeText(project?.code),
      description: safeText(project?.description),
      status: safeText(project?.status, "PLANNING"),
      priority: safeText(project?.priority, "MEDIUM"),
      start_date: formatInputDate(project?.start_date),
      due_date: formatInputDate(project?.due_date),
    });

    setEditing(false);
  };

  const handleSave = async () => {
    if (!canManageProject) {
      setActionError("Only workspace owners, admins, and managers can edit projects.");
      return;
    }

    if (!form.name.trim()) {
      setActionError("Project name is required.");
      return;
    }

    if (!form.code.trim()) {
      setActionError("Project code is required.");
      return;
    }

    setSaving(true);
    setActionError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      };

      const updatedProject =
        await projectService.updateProject(
          projectId,
          payload
        );

      setProject(updatedProject);

      setForm({
        name: safeText(updatedProject.name),
        code: safeText(updatedProject.code),
        description: safeText(updatedProject.description),
        status: safeText(
          updatedProject.status,
          "PLANNING"
        ),
        priority: safeText(
          updatedProject.priority,
          "MEDIUM"
        ),
        start_date: formatInputDate(
          updatedProject.start_date
        ),
        due_date: formatInputDate(
          updatedProject.due_date
        ),
      });

      setEditing(false);

      showSuccess("Project updated successfully.");
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickUpdate = async (changes, message) => {
    if (!canManageProject) {
      setActionError("Only workspace owners, admins, and managers can edit projects.");
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const updatedProject =
        await projectService.updateProject(
          projectId,
          changes
        );

      setProject(updatedProject);

      setForm({
        name: safeText(updatedProject.name),
        code: safeText(updatedProject.code),
        description: safeText(updatedProject.description),
        status: safeText(
          updatedProject.status,
          "PLANNING"
        ),
        priority: safeText(
          updatedProject.priority,
          "MEDIUM"
        ),
        start_date: formatInputDate(
          updatedProject.start_date
        ),
        due_date: formatInputDate(
          updatedProject.due_date
        ),
      });

      showSuccess(message);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    const nextArchived = !project?.is_archived;

    await handleQuickUpdate(
      {
        is_archived: nextArchived,
      },
      nextArchived
        ? "Project archived successfully."
        : "Project restored successfully."
    );
  };

  const handleDelete = async () => {
    if (!canManageProject) {
      setActionError("Only workspace owners, admins, and managers can delete projects.");
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await projectService.deleteProject(projectId);

      navigate("/app/projects", {
        replace: true,
        state: {
          successMessage:
            "Project deleted successfully.",
        },
      });
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-[#24211E]">
        <div className="flex items-center gap-3 text-sm text-muted dark:text-white/50">
          <LoaderCircle
            size={19}
            className="animate-spin text-accent"
          />
          Loading project...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-canvas px-5 py-8 text-ink dark:bg-[#24211E] dark:text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[18px] border border-line bg-surface p-8 text-center shadow-soft dark:border-white/[0.08] dark:bg-[#2B2825]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <X size={21} />
            </div>

            <h1 className="mt-5 font-display text-xl font-semibold">
              Project could not be loaded
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted dark:text-white/45">
              {error || "This project does not exist."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/app/projects")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sidebar px-4 text-sm font-semibold text-white transition hover:bg-accent dark:bg-white dark:text-ink"
              >
                <ArrowLeft size={15} />
                Back to Projects
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/dashboard")}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:border-stone-300 dark:border-white/[0.08] dark:bg-[#24211E] dark:text-white"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = safeText(
    project.status,
    "PLANNING"
  );

  const priority = safeText(
    project.priority,
    "MEDIUM"
  );

  const members = Array.isArray(project.members)
    ? project.members
    : [];

  const projectName = safeText(
    project.name,
    "Untitled project"
  );

  const projectCode = safeText(
    project.code,
    `PROJECT-${project.id}`
  );

  const description = safeText(
    project.description,
    "No project description has been added yet."
  );

  const organizationName = safeText(
    project.organization_name,
    "Workspace"
  );

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-[#24211E] dark:text-white">
      {/* Success */}
      {successMessage && (
        <div className="fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-panel dark:border-white/[0.08] dark:bg-[#2B2825]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={15} />
          </span>

          <p className="text-xs font-semibold">
            {successMessage}
          </p>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="ml-2 text-muted hover:text-ink dark:hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1380px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/app/projects")}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink dark:text-white/45 dark:hover:text-white"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back to Projects
          </button>

          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface px-4 text-xs font-semibold text-muted transition hover:border-stone-300 hover:text-ink dark:border-white/[0.08] dark:bg-[#2B2825] dark:text-white/55 dark:hover:text-white"
          >
            Home
          </button>
        </div>

        {/* Header */}
        <header className="mt-8 border-b border-line pb-8 dark:border-white/[0.08]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                    STATUS_CLASSES[status] ||
                    STATUS_CLASSES.PLANNING
                  }`}
                >
                  {STATUS_LABELS[status] || status}
                </span>

                {project.is_archived && (
                  <span className="rounded-md bg-stone-200 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-stone-700">
                    Archived
                  </span>
                )}
              </div>

              <h1 className="mt-4 break-words font-display text-3xl font-semibold tracking-[-1px] sm:text-4xl lg:text-[42px]">
                {projectName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted dark:text-white/40">
                <span>{projectCode}</span>
                <span className="h-1 w-1 rounded-full bg-stone-400" />
                <span>{organizationName}</span>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-muted dark:text-white/50">
                {description}
              </p>
            </div>

            {canManageProject && (
              <button
                type="button"
                onClick={handleEditStart}
                disabled={actionLoading}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-sidebar px-4 text-xs font-semibold text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#24211E]"
              >
                <Pencil size={14} />
                Edit project
              </button>
            )}
          </div>
        </header>

        {!canManageProject && (
          <p
            role={permissionError ? "alert" : "status"}
            className="mt-5 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45"
          >
            {permissionError || "Read-only access. Only workspace owners, admins, and managers can edit this project."}
          </p>
        )}

        {/* Action error */}
        {actionError && (
          <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() => setActionError("")}
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Project information */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailCard
            icon={CircleDot}
            label="Status"
            value={STATUS_LABELS[status] || status}
          />

          <DetailCard
            icon={FileText}
            label="Priority"
            value={
              PRIORITY_LABELS[priority] ||
              priority
            }
          />

          <DetailCard
            icon={CalendarDays}
            label="Start date"
            value={formatDate(project.start_date)}
          />

          <DetailCard
            icon={CalendarDays}
            label="Due date"
            value={formatDate(project.due_date)}
          />
        </section>

        {/* Main */}
        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Overview */}
          <div className="rounded-[18px] border border-line bg-surface shadow-soft dark:border-white/[0.08] dark:bg-[#2B2825]">
            <div className="border-b border-line px-6 py-5 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong dark:bg-white/10 dark:text-white">
                  <FileText size={18} />
                </div>

                <div>
                  <h2 className="font-display text-base font-semibold">
                    Project Overview
                  </h2>

                  <p className="mt-1 text-xs text-muted dark:text-white/40">
                    Current project information
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted dark:text-white/35">
                Description
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted dark:text-white/55">
                {description}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-canvas p-5 dark:border-white/[0.08] dark:bg-[#24211E]">
                  <p className="text-xs text-muted dark:text-white/40">
                    Created
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDateTime(project.created_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-canvas p-5 dark:border-white/[0.08] dark:bg-[#24211E]">
                  <p className="text-xs text-muted dark:text-white/40">
                    Last updated
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDateTime(project.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <aside className="rounded-[18px] border border-line bg-surface shadow-soft dark:border-white/[0.08] dark:bg-[#2B2825]">
            <div className="border-b border-line px-6 py-5 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong dark:bg-white/10 dark:text-white">
                  <Users size={18} />
                </div>

                <div>
                  <h2 className="font-display text-base font-semibold">
                    Project Team
                  </h2>

                  <p className="mt-1 text-xs text-muted dark:text-white/40">
                    {members.length}{" "}
                    {members.length === 1
                      ? "member"
                      : "members"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member, index) => {
                    const username = safeText(
                      member.username,
                      "Team member"
                    );

                    const email = safeText(
                      member.email ||
                        member.user_email,
                      ""
                    );

                    const role = safeText(
                      member.role,
                      "MEMBER"
                    );

                    return (
                      <div
                        key={
                          member.id ??
                          member.user ??
                          member.user_id ??
                          index
                        }
                        className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 dark:border-white/[0.08] dark:bg-[#24211E]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent-strong dark:bg-white/10 dark:text-white">
                          {getInitials(username)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">
                            {username}
                          </p>

                          {email && (
                            <p className="mt-0.5 truncate text-[10px] text-muted dark:text-white/35">
                              {email}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 text-[9px] font-semibold uppercase text-muted dark:text-white/35">
                          {role.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Users
                    size={22}
                    className="mx-auto text-muted dark:text-white/30"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    No team members
                  </p>

                  <p className="mt-1 text-xs text-muted dark:text-white/40">
                    No members are assigned to this project yet.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* Project management */}
        <section className="mt-5 rounded-[18px] border border-line bg-surface shadow-soft dark:border-white/[0.08] dark:bg-[#2B2825]">
          <div className="border-b border-line px-6 py-5 dark:border-white/[0.08]">
            <div>
              <h2 className="font-display text-base font-semibold">
                Project Management
              </h2>

              <p className="mt-1 text-xs text-muted dark:text-white/40">
                Manage the current project state.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            {/* Status */}
            <div>
              <FieldLabel>Status</FieldLabel>

              <select
                value={status}
                disabled={actionLoading || editing || !canManageProject}
                onChange={(event) =>
                  handleQuickUpdate(
                    {
                      status: event.target.value,
                    },
                    `Status changed to ${STATUS_LABELS[event.target.value]}.`
                  )
                }
                className="
                  h-11 w-full rounded-xl
                  border border-line bg-canvas
                  px-3 text-sm text-ink outline-none
                  transition focus:border-accent
                  disabled:cursor-not-allowed disabled:opacity-60
                  dark:border-white/[0.08]
                  dark:bg-[#24211E] dark:text-white
                "
              >
                {Object.entries(STATUS_LABELS).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Priority */}
            <div>
              <FieldLabel>Priority</FieldLabel>

              <select
                value={priority}
                disabled={actionLoading || editing || !canManageProject}
                onChange={(event) =>
                  handleQuickUpdate(
                    {
                      priority: event.target.value,
                    },
                    `Priority changed to ${PRIORITY_LABELS[event.target.value]}.`
                  )
                }
                className="
                  h-11 w-full rounded-xl
                  border border-line bg-canvas
                  px-3 text-sm text-ink outline-none
                  transition focus:border-accent
                  disabled:cursor-not-allowed disabled:opacity-60
                  dark:border-white/[0.08]
                  dark:bg-[#24211E] dark:text-white
                "
              >
                {Object.entries(
                  PRIORITY_LABELS
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Archive */}
            {canManageProject && <div className="rounded-xl border border-line bg-canvas p-4 dark:border-white/[0.08] dark:bg-[#24211E]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:bg-white/10 dark:text-white">
                  <Archive size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {project.is_archived
                      ? "Restore project"
                      : "Archive project"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    {project.is_archived
                      ? "Make this project active again."
                      : "Hide this project from active workspace views."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleArchiveToggle}
                  className="
                    shrink-0 rounded-lg
                    border border-line
                    px-3 py-2
                    text-[10px] font-semibold
                    text-muted
                    transition hover:border-stone-300
                    hover:text-ink
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    dark:border-white/[0.08]
                    dark:hover:text-white
                  "
                >
                  {actionLoading
                    ? "Saving..."
                    : project.is_archived
                    ? "Restore"
                    : "Archive"}
                </button>
              </div>
            </div>}

            {/* Delete */}
            {canManageProject && <div className="rounded-xl border border-danger/15 bg-danger-soft/40 p-4 dark:bg-danger/5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
                  <Trash2 size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Delete project
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Permanently remove this project.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteOpen(true)}
                  className="
                    shrink-0 rounded-lg
                    border border-danger/20
                    px-3 py-2
                    text-[10px] font-semibold
                    text-danger
                    transition hover:bg-danger-soft
                    disabled:opacity-50
                  "
                >
                  Delete
                </button>
              </div>
            </div>}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-line pt-5 dark:border-white/[0.08]">
          <p className="text-xs text-muted dark:text-white/35">
            Project #{safeText(project.id)}
          </p>

          <p className="text-xs text-muted dark:text-white/35">
            Last updated {formatDateTime(project.updated_at)}
          </p>
        </div>
      </main>

      {/* Edit modal */}
      {editing && canManageProject && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[20px] border border-line bg-surface shadow-elevated dark:border-white/[0.08] dark:bg-[#2B2825]">
            <div className="flex items-center justify-between border-b border-line px-6 py-5 dark:border-white/[0.08]">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Edit project
                </h2>

                <p className="mt-1 text-xs text-muted">
                  Update project information.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleEditCancel}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink disabled:opacity-50 dark:hover:bg-white/[0.05] dark:hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Name / Code */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>
                    Project name
                  </FieldLabel>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    className="
                      h-11 w-full rounded-xl
                      border border-line bg-canvas
                      px-3 text-sm text-ink outline-none
                      transition focus:border-accent
                      dark:border-white/[0.08]
                      dark:bg-[#24211E]
                      dark:text-white
                    "
                  />
                </div>

                <div>
                  <FieldLabel>
                    Project code
                  </FieldLabel>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) =>
                      updateForm(
                        "code",
                        event.target.value
                      )
                    }
                    className="
                      h-11 w-full rounded-xl
                      border border-line bg-canvas
                      px-3 text-sm uppercase text-ink outline-none
                      transition focus:border-accent
                      dark:border-white/[0.08]
                      dark:bg-[#24211E]
                      dark:text-white
                    "
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <FieldLabel>
                  Description
                </FieldLabel>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  className="
                    w-full resize-none rounded-xl
                    border border-line bg-canvas
                    px-3 py-3 text-sm text-ink outline-none
                    transition focus:border-accent
                    dark:border-white/[0.08]
                    dark:bg-[#24211E]
                    dark:text-white
                  "
                />
              </div>

              {/* Status / Priority */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>
                    Status
                  </FieldLabel>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value
                      )
                    }
                    className="
                      h-11 w-full rounded-xl
                      border border-line bg-canvas
                      px-3 text-sm text-ink outline-none
                      focus:border-accent
                      dark:border-white/[0.08]
                      dark:bg-[#24211E]
                      dark:text-white
                    "
                  >
                    {Object.entries(
                      STATUS_LABELS
                    ).map(([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>
                    Priority
                  </FieldLabel>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm(
                        "priority",
                        event.target.value
                      )
                    }
                    className="
                      h-11 w-full rounded-xl
                      border border-line bg-canvas
                      px-3 text-sm text-ink outline-none
                      focus:border-accent
                      dark:border-white/[0.08]
                      dark:bg-[#24211E]
                      dark:text-white
                    "
                  >
                    {Object.entries(
                      PRIORITY_LABELS
                    ).map(([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>
                    Start date
                  </FieldLabel>

                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      updateForm(
                        "start_date",
                        event.target.value
                      )
                    }
                    className="
                      h-11 w-full rounded-xl
                      border border-line bg-canvas
                      px-3 text-sm text-ink outline-none
                      focus:border-accent
                      dark:border-white/[0.08]
                      dark:bg-[#24211E]
                      dark:text-white
                    "
                  />
                </div>

                <div>
                  <FieldLabel>
                    Due date
                  </FieldLabel>

                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      updateForm(
                        "due_date",
                        event.target.value
                      )
                    }
                    className="
                      h-11 w-full rounded-xl
                      border border-line bg-canvas
                      px-3 text-sm text-ink outline-none
                      focus:border-accent
                      dark:border-white/[0.08]
                      dark:bg-[#24211E]
                      dark:text-white
                    "
                  />
                </div>
              </div>

              {actionError && (
                <div className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-xs text-danger">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4 dark:border-white/[0.08]">
              <button
                type="button"
                disabled={saving}
                onClick={handleEditCancel}
                className="
                  h-10 rounded-xl
                  border border-line
                  bg-surface px-4
                  text-xs font-semibold text-muted
                  transition hover:border-stone-300
                  hover:text-ink
                  disabled:opacity-50
                  dark:border-white/[0.08]
                  dark:bg-[#24211E]
                  dark:hover:text-white
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="
                  inline-flex h-10
                  items-center gap-2
                  rounded-xl
                  bg-sidebar px-5
                  text-xs font-semibold text-white
                  transition hover:bg-accent
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-white
                  dark:text-[#24211E]
                "
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteOpen && canManageProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[20px] border border-line bg-surface p-6 shadow-elevated dark:border-white/[0.08] dark:bg-[#2B2825]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Trash2 size={19} />
            </div>

            <h2 className="mt-5 font-display text-xl font-semibold">
              Delete project?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted dark:text-white/50">
              This will permanently delete{" "}
              <span className="font-semibold text-ink dark:text-white">
                {projectName}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteOpen(false)
                }
                className="
                  h-10 rounded-xl
                  border border-line
                  bg-surface px-4
                  text-xs font-semibold text-muted
                  transition hover:border-stone-300
                  hover:text-ink
                  disabled:opacity-50
                  dark:border-white/[0.08]
                  dark:bg-[#24211E]
                  dark:hover:text-white
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="
                  inline-flex h-10
                  items-center justify-center gap-2
                  rounded-xl
                  bg-danger px-4
                  text-xs font-semibold text-white
                  transition hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {deleting ? (
                  <>
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;