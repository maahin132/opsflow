import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  FolderKanban,
  LoaderCircle,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import projectService from "../services/projectService";
import organizationService from "../services/organizationService";
import { formatDate } from "../utils/dateFormat";

const ProjectModal = lazy(() => import("../components/ProjectModal"));

const MANAGER_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

const STATUS_OPTIONS = [
  ["ALL", "All projects"],
  ["PLANNING", "Planning"],
  ["ACTIVE", "Active"],
  ["ON_HOLD", "On hold"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

function getApiErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .flatMap(([field, value]) =>
        (Array.isArray(value) ? value : [value]).map((detail) =>
          typeof detail === "string" ? `${field}: ${detail}` : ""
        )
      )
      .filter(Boolean);

    if (messages.length) {
      return messages.join(" ");
    }
  }

  return "Something went wrong. Please try again.";
}

function getStatusLabel(status) {
  const match = STATUS_OPTIONS.find(([value]) => value === status);
  return match?.[1] || status || "Unknown";
}

function getStatusStyle(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-success-soft text-success";
    case "COMPLETED":
      return "bg-stone-100 text-stone-700";
    case "ON_HOLD":
      return "bg-warning-soft text-warning";
    case "CANCELLED":
      return "bg-danger-soft text-danger";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function getPriorityStyle(priority) {
  switch (priority) {
    case "CRITICAL":
      return "bg-danger-soft text-danger";
    case "HIGH":
      return "bg-warning-soft text-warning";
    case "LOW":
      return "bg-stone-100 text-stone-600";
    default:
      return "bg-accent-soft text-accent-strong";
  }
}

function ProjectCard({ project, index, onOpen }) {
  const memberCount = project.members?.length ?? 0;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(project.id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
      }}
      className="group block w-full text-left"
    >
      <article
        className="
          relative flex h-full min-h-[232px] flex-col
          overflow-hidden rounded-[18px]
          border border-line bg-surface
          p-5 shadow-soft
          transition-all duration-300
          hover:-translate-y-1 hover:border-stone-300 hover:shadow-panel
          dark:border-white/[0.08] dark:bg-[#2B2825]
          dark:hover:border-white/[0.15]
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-xl border border-line bg-canvas
                text-muted transition-all duration-300
                group-hover:border-accent/40
                group-hover:bg-accent-soft
                group-hover:text-accent-strong
                dark:border-white/[0.08] dark:bg-[#24211E]
              "
            >
              <FolderKanban size={18} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-display text-[16px] font-semibold tracking-[-0.3px] text-ink dark:text-white">
                {project.name}
              </h2>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                {project.code || "PROJECT"}
              </p>
            </div>
          </div>

          <span
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-full border border-line
              text-muted transition-all duration-300
              group-hover:border-sidebar
              group-hover:bg-sidebar
              group-hover:text-white
              dark:border-white/[0.08]
            "
          >
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>

        {/* Description */}
        <div className="mt-5 min-h-[42px] flex-1">
          <p className="line-clamp-2 text-[13px] leading-6 text-muted dark:text-white/50">
            {project.description || "No project description added yet."}
          </p>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${getStatusStyle(
              project.status
            )}`}
          >
            {getStatusLabel(project.status)}
          </span>

          <span
            className={`rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${getPriorityStyle(
              project.priority
            )}`}
          >
            {project.priority || "MEDIUM"}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 dark:border-white/[0.07]">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <CalendarDays size={13} />
            <span>{formatDate(project.due_date, "No deadline")}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {project.members?.slice(0, 3).map((member) => (
                <span
                  key={member.id}
                  title={member.username}
                  className="
                    flex h-7 w-7 items-center justify-center
                    rounded-full border-2 border-surface
                    bg-stone-200 text-[9px] font-bold text-stone-700
                    dark:border-[#2B2825] dark:bg-stone-700 dark:text-white
                  "
                >
                  {(member.username?.slice(0, 2) || "U").toUpperCase()}
                </span>
              ))}

              {memberCount === 0 && (
                <span
                  className="
                    flex h-7 w-7 items-center justify-center
                    rounded-full border border-line
                    bg-canvas text-[10px] text-muted
                    dark:border-white/[0.08] dark:bg-[#24211E]
                  "
                >
                  0
                </span>
              )}
            </div>

            <span className="text-[10px] text-muted">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-5 right-5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
      </article>
    </motion.button>
  );
}

function LoadingCard() {
  return (
    <div
      className="
        min-h-[232px] animate-pulse
        rounded-[18px] border border-line
        bg-surface p-5
        dark:border-white/[0.08] dark:bg-[#2B2825]
      "
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-stone-200 dark:bg-white/[0.06]" />

        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-stone-200 dark:bg-white/[0.06]" />
          <div className="h-2.5 w-16 rounded bg-stone-200 dark:bg-white/[0.06]" />
        </div>
      </div>

      <div className="mt-7 h-3 w-full rounded bg-stone-200 dark:bg-white/[0.06]" />
      <div className="mt-2 h-3 w-4/5 rounded bg-stone-200 dark:bg-white/[0.06]" />

      <div className="mt-5 h-6 w-24 rounded-md bg-stone-200 dark:bg-white/[0.06]" />

      <div className="mt-5 border-t border-line pt-4 dark:border-white/[0.07]">
        <div className="h-3 w-28 rounded bg-stone-200 dark:bg-white/[0.06]" />
      </div>
    </div>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div
      className="
        relative overflow-hidden rounded-[18px]
        border border-line bg-surface
        px-5 py-4 shadow-soft
        transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-panel
        dark:border-white/[0.08] dark:bg-[#2B2825]
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            {label}
          </p>

          <p className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-1.5px] text-ink dark:text-white">
            {value}
          </p>
        </div>

        <span className="mt-1 h-2 w-2 rounded-full bg-accent/60" />
      </div>

      <p className="mt-3 text-[10px] text-muted">
        {description}
      </p>
    </div>
  );
}

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);

  const [error, setError] = useState("");
  const [organizationsError, setOrganizationsError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await projectService.getProjects();

        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setProjects([]);
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      setOrganizationsLoading(true);
      setOrganizationsError("");

      try {
        const data = await organizationService.getOrganizations();

        if (!cancelled) {
          setOrganizations(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setOrganizations([]);
          setOrganizationsError(getApiErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setOrganizationsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  const manageableOrganizations = useMemo(() => {
    return organizations.filter((organization) =>
      MANAGER_ROLES.has(organization.current_user_role)
    );
  }, [organizations]);
  const canCreateProjects =
    !organizationsLoading &&
    !organizationsError &&
    manageableOrganizations.length > 0;

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const searchableText = [
        project.name,
        project.code,
        project.description,
        project.status,
        project.priority,
        project.organization_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const activeProjects = projects.filter(
    (project) =>
      project.status === "ACTIVE" &&
      !project.is_archived
  ).length;

  const completedProjects = projects.filter(
    (project) =>
      project.status === "COMPLETED" &&
      !project.is_archived
  ).length;

  const openProjectModal = () => {
    setCreateProjectError("");

    if (!canCreateProjects) return;

    setProjectModalOpen(true);
  };

  const handleCreateProject = async (payload) => {
    if (
      !manageableOrganizations.some(
        (organization) =>
          String(organization.id) === String(payload.organization_id)
      )
    ) {
      setCreateProjectError(
        "You do not have project-creation permission in that workspace."
      );
      return;
    }

    setCreatingProject(true);
    setCreateProjectError("");

    try {
      const createdProject =
        await projectService.createProject(payload);

      setProjects((current) => [
        createdProject,
        ...current.filter(
          (project) => project.id !== createdProject.id
        ),
      ]);

      setProjectModalOpen(false);

      setSuccessMessage(
        `${createdProject.name} was created successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4500);
    } catch (requestError) {
      setCreateProjectError(
        getApiErrorMessage(requestError)
      );
    } finally {
      setCreatingProject(false);
    }
  };

  const openProject = (projectId) => {
    navigate(`/app/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-[#24211E] dark:text-white">
      {/* Success notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="
              fixed right-5 top-5 z-[100]
              flex items-center gap-3
              rounded-xl border border-line
              bg-surface px-4 py-3 shadow-panel
              dark:border-white/[0.08] dark:bg-[#2B2825]
            "
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1380px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        {/* Header */}
        <header className="border-b border-line pb-6 dark:border-white/[0.08]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                <FolderKanban size={13} />
                Workspace
              </div>

              <h1 className="mt-2 font-display text-[40px] font-semibold leading-tight tracking-[-1.8px] text-ink sm:text-[46px] dark:text-white">
                Projects
              </h1>

              <p className="mt-2 text-[13px] text-muted dark:text-white/50">
                Organize projects, track progress, and keep your team moving.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/app/dashboard")}
                className="
                  inline-flex h-10 items-center justify-center
                  rounded-xl border border-line bg-surface
                  px-4 text-xs font-semibold text-muted
                  transition hover:border-stone-300 hover:text-ink
                  dark:border-white/[0.08] dark:bg-[#2B2825]
                  dark:text-white/60 dark:hover:text-white
                "
              >
                Home
              </button>

              {canCreateProjects ? (
                <button
                  type="button"
                  onClick={openProjectModal}
                  className="
                  inline-flex h-10 items-center justify-center gap-2
                  rounded-xl bg-sidebar px-4
                  text-xs font-semibold text-white shadow-soft
                  transition hover:-translate-y-0.5 hover:bg-accent
                  hover:shadow-panel
                  dark:bg-white dark:text-[#24211E]
                  dark:hover:bg-stone-200
                "
                >
                  <Plus size={15} />
                  New project
                </button>
              ) : organizationsLoading ? (
                <p role="status" className="text-xs text-muted dark:text-white/45">
                  Checking project permissions...
                </p>
              ) : organizationsError ? (
                <p role="alert" className="max-w-xs text-xs text-danger">
                  Could not verify project permissions: {organizationsError}
                </p>
              ) : (
                <p role="status" className="max-w-xs text-xs text-muted dark:text-white/45">
                  Only workspace owners, admins, and managers can create projects.
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-3">
          <StatCard
            label="Total projects"
            value={projects.length}
            description="All projects in your workspace"
          />

          <StatCard
            label="Active"
            value={activeProjects}
            description="Projects currently in progress"
          />

          <StatCard
            label="Completed"
            value={completedProjects}
            description="Projects marked as completed"
          />
        </section>

        {/* Toolbar */}
        <section className="flex flex-col gap-3 border-b border-line pb-5 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[500px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search projects..."
              className="
                h-10 w-full rounded-xl
                border border-line bg-surface
                pl-11 pr-4 text-sm text-ink
                outline-none transition
                placeholder:text-muted/60
                focus:border-accent
                dark:border-white/[0.08]
                dark:bg-[#2B2825] dark:text-white
              "
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setFilterOpen((current) => !current)
              }
              className="
                flex h-10 w-full items-center justify-between gap-6
                rounded-xl border border-line bg-surface
                px-4 text-xs font-semibold text-ink
                transition hover:border-stone-300
                sm:w-[185px]
                dark:border-white/[0.08]
                dark:bg-[#2B2825] dark:text-white
              "
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-muted" />

                {
                  STATUS_OPTIONS.find(
                    ([value]) => value === statusFilter
                  )?.[1]
                }
              </span>

              <ChevronDown
                size={14}
                className={`text-muted transition-transform ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="
                    absolute right-0 top-[calc(100%+8px)] z-30
                    w-[185px] overflow-hidden rounded-xl
                    border border-line bg-surface p-1.5
                    shadow-panel
                    dark:border-white/[0.08]
                    dark:bg-[#2B2825]
                  "
                >
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(value);
                        setFilterOpen(false);
                      }}
                      className={`
                        flex w-full items-center justify-between
                        rounded-lg px-3 py-2.5
                        text-left text-xs transition
                        ${
                          statusFilter === value
                            ? "bg-accent-soft font-semibold text-accent-strong"
                            : "text-muted hover:bg-canvas hover:text-ink dark:hover:bg-white/[0.05] dark:hover:text-white"
                        }
                      `}
                    >
                      {label}

                      {statusFilter === value && (
                        <Check size={14} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="shrink-0 font-semibold underline underline-offset-4"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Project section */}
        <section className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : filteredProjects.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted">
                  {filteredProjects.length}{" "}
                  {filteredProjects.length === 1
                    ? "project"
                    : "projects"}
                </p>

                {(searchQuery || statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                    }}
                    className="text-[11px] font-semibold text-muted transition hover:text-ink dark:hover:text-white"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onOpen={openProject}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[18px] border border-dashed border-line bg-surface px-6 text-center dark:border-white/[0.1] dark:bg-[#2B2825]">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-canvas text-muted dark:bg-[#24211E]">
                <FolderKanban size={22} />
              </div>

              <h2 className="mt-5 font-display text-xl font-semibold">
                {searchQuery || statusFilter !== "ALL"
                  ? "No matching projects"
                  : "No projects yet"}
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try changing your search or project filter."
                  : "Create your first project to start organizing your work."}
              </p>

              {!searchQuery && statusFilter === "ALL" && canCreateProjects && (
                <button
                  type="button"
                  onClick={openProjectModal}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-sidebar px-4 text-xs font-semibold text-white transition hover:bg-accent dark:bg-white dark:text-[#24211E]"
                >
                  <Plus size={15} />
                  Create project
                </button>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-6 flex flex-col justify-between gap-2 border-t border-line py-5 text-[10px] text-muted sm:flex-row dark:border-white/[0.08]">
          <p>
            Showing {filteredProjects.length} of {projects.length} projects
          </p>

          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            className="transition hover:text-ink dark:hover:text-white"
          >
            Back to workspace
          </button>
        </footer>
      </main>

      {/* Project Modal */}
      <Suspense
        fallback={
          projectModalOpen ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
              <LoaderCircle
                size={24}
                className="animate-spin text-white"
              />
            </div>
          ) : null
        }
      >
        {projectModalOpen && (
          <ProjectModal
            open
            onClose={() => {
              if (!creatingProject) {
                setProjectModalOpen(false);
                setCreateProjectError("");
              }
            }}
            onSubmit={handleCreateProject}
            loading={creatingProject}
            error={createProjectError}
            organizations={manageableOrganizations}
            organizationsLoading={organizationsLoading}
            organizationsError={organizationsError}
          />
        )}
      </Suspense>
    </div>
  );
}

export default Projects;