import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Inbox,
  Settings,
  Search,
  Plus,
  ChevronDown,
  CalendarDays,
  Bell,
  Menu,
  X,
  Zap,
  Activity,
  Sun,
  Moon,
  AlertCircle,
  CircleDot,
  CircleDashed,
  CircleCheckBig,
  CircleCheck,
} from "lucide-react";

import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import projectService from "./services/projectService";
import organizationService from "./services/organizationService";
import taskService from "./services/taskService";
import { formatDate, formatDateTime } from "./utils/dateFormat";

const ProjectModal = lazy(() => import("./components/ProjectModal"));
const TaskModal = lazy(() => import("./components/TaskModal"));

const navigation = [
  {
    label: "Overview",
    path: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/app/projects",
    icon: FolderKanban,
  },
  {
    label: "My tasks",
    path: "/app/tasks",
    icon: CheckSquare,
  },
  {
    label: "Inbox",
    path: "/app/inbox",
    icon: Inbox,
  },
  {
    label: "Team",
    path: "/app/team",
    icon: Users,
  },
];

const projectColors = [
  "#9A8170",
  "#6F6258",
  "#B7A99A",
  "#4F4A45",
];

const taskColumns = [
  {
    status: "TODO",
    label: "To do",
    icon: CircleDashed,
  },
  {
    status: "IN_PROGRESS",
    label: "In progress",
    icon: CircleDot,
  },
  {
    status: "IN_REVIEW",
    label: "In review",
    icon: Activity,
  },
  {
    status: "BLOCKED",
    label: "Blocked",
    icon: AlertCircle,
  },
  {
    status: "DONE",
    label: "Done",
    icon: CircleCheckBig,
  },
];

const managerRoles = new Set([
  "OWNER",
  "ADMIN",
  "MANAGER",
]);

function getApiErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .flatMap(([field, value]) =>
        (Array.isArray(value) ? value : [value]).map((detail) =>
          typeof detail === "string"
            ? `${field}: ${detail}`
            : ""
        )
      )
      .filter(Boolean);

    if (messages.length) {
      return messages.join(" ");
    }
  }

  return "The request could not be completed. Please try again.";
}

function Avatar({
  initials,
  color = "#E8E2DA",
  text = "#4F4A45",
  size = 36,
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: color,
        color: text,
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      className="rounded-[18px] border border-line bg-surface p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-panel dark:border-white/[0.08] dark:bg-[#1B1A18]"
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">
          {label}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon size={17} />
        </div>
      </div>

      <p className="font-display text-[32px] font-extrabold tracking-[-1.5px]">
        {value}
      </p>

      <p className="mt-2 text-[11px] text-muted">
        {description}
      </p>
    </motion.div>
  );
}

function App() {
  const navigate = useNavigate();

  const {
    theme,
    toggleTheme,
    isDark,
  } = useTheme();

  const {
    user,
  } = useAuth();

  const [active, setActive] =
    useState("Overview");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [showSearch, setShowSearch] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState("");

  const searchResultsRef = useRef(null);

  const [projectList, setProjectList] =
    useState([]);

  const [projectsLoading, setProjectsLoading] =
    useState(true);

  const [projectsError, setProjectsError] =
    useState("");

  const [projectReloadKey, setProjectReloadKey] =
    useState(0);

  const [organizations, setOrganizations] =
    useState([]);

  const [
    organizationsLoading,
    setOrganizationsLoading,
  ] = useState(true);

  const [
    organizationsError,
    setOrganizationsError,
  ] = useState("");

  const [
    projectModalOpen,
    setProjectModalOpen,
  ] = useState(false);

  const [
    creatingProject,
    setCreatingProject,
  ] = useState(false);

  const [
    createProjectError,
    setCreateProjectError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [tasks, setTasks] =
    useState([]);

  const [
    tasksLoading,
    setTasksLoading,
  ] = useState(true);

  const [tasksError, setTasksError] =
    useState("");

  const [
    taskModalOpen,
    setTaskModalOpen,
  ] = useState(false);

  const [
    creatingTask,
    setCreatingTask,
  ] = useState(false);

  const [
    createTaskError,
    setCreateTaskError,
  ] = useState("");

  const [taskSuccess, setTaskSuccess] =
    useState("");

  const taskScope = "MINE";
  const taskProjectFilter = "ALL";
  const taskStatusFilter = "ALL";
  const taskPriorityFilter = "ALL";

  const [workspaceActivity, setWorkspaceActivity] =
    useState([]);

  const [
    activityLoading,
    setActivityLoading,
  ] = useState(true);

  const [
    activityError,
    setActivityError,
  ] = useState("");

  const [
    activityReloadKey,
    setActivityReloadKey,
  ] = useState(0);

  /*
   * -------------------------------------------------------
   * Load projects
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError("");

        const data =
          await projectService.getProjects();

        if (cancelled) return;

        setProjectList(
          Array.isArray(data)
            ? data
            : data?.results ?? []
        );
      } catch (error) {
        console.error(
          "Failed to load projects:",
          error
        );

        if (!cancelled) {
          setProjectList([]);
          setProjectsError(
            getApiErrorMessage(error)
          );
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [projectReloadKey]);

  /*
   * -------------------------------------------------------
   * Load organizations
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        setOrganizationsLoading(true);
        setOrganizationsError("");

        const data =
          await organizationService.getOrganizations();

        if (!cancelled) {
          setOrganizations(data ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setOrganizations([]);
          setOrganizationsError(
            getApiErrorMessage(error)
          );
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

  /*
   * -------------------------------------------------------
   * Load tasks
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        setTasksError("");

        const data =
          await taskService.getTasks();

        if (!cancelled) {
          setTasks(
            Array.isArray(data)
              ? data
              : data?.results ?? []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setTasks([]);
          setTasksError(
            getApiErrorMessage(error)
          );
        }
      } finally {
        if (!cancelled) {
          setTasksLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * -------------------------------------------------------
   * Load workspace activity
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      try {
        setActivityLoading(true);
        setActivityError("");

        const data =
          await taskService.getWorkspaceActivity();

        if (!cancelled) {
          setWorkspaceActivity(
            Array.isArray(data)
              ? data
              : data?.results ?? []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setWorkspaceActivity([]);
          setActivityError(
            getApiErrorMessage(error)
          );
        }
      } finally {
        if (!cancelled) {
          setActivityLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, [activityReloadKey]);

  /*
   * -------------------------------------------------------
   * Temporary success messages
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!successMessage) return;

    const timer =
      window.setTimeout(
        () => setSuccessMessage(""),
        5000
      );

    return () =>
      window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!taskSuccess) return;

    const timer =
      window.setTimeout(
        () => setTaskSuccess(""),
        5000
      );

    return () =>
      window.clearTimeout(timer);
  }, [taskSuccess]);

  /*
   * -------------------------------------------------------
   * Navigation
   * -------------------------------------------------------
   */

  const goTo = (
    path,
    label
  ) => {
    setActive(label);
    setMobileOpen(false);
    setProfileOpen(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");

    navigate(path);
  };

  /*
   * -------------------------------------------------------
   * Project permissions
   * -------------------------------------------------------
   */

  const canManageProject = (
    project
  ) => {
    if (!project) return false;

    const organization =
      organizations.find(
        (item) =>
          item.id ===
          project.organization_pk
      );

    return managerRoles.has(
      organization?.current_user_role
    );
  };

  const manageableOrganizations =
    organizations.filter(
      (organization) =>
        managerRoles.has(
          organization.current_user_role
        )
    );
  const canCreateProjects = manageableOrganizations.length > 0;

  /*
   * -------------------------------------------------------
   * Create project
   * -------------------------------------------------------
   */

  const openProjectModal = () => {
    setCreateProjectError("");
    if (!canCreateProjects) return;
    setProjectModalOpen(true);
  };

  const handleCreateProject =
    async (payload) => {
      setCreatingProject(true);
      setCreateProjectError("");

      try {
        const createdProject =
          await projectService.createProject(
            payload
          );

        setProjectList((current) => [
          createdProject,
          ...current.filter(
            (project) =>
              project.id !==
              createdProject.id
          ),
        ]);

        setProjectReloadKey(
          (key) => key + 1
        );

        setProjectModalOpen(false);

        setSuccessMessage(
          `${createdProject.name} was created.`
        );
      } catch (error) {
        setCreateProjectError(
          getApiErrorMessage(error)
        );
      } finally {
        setCreatingProject(false);
      }
    };

  /*
   * -------------------------------------------------------
   * Create task
   * -------------------------------------------------------
   */

  const handleCreateTask =
    async (payload) => {
      setCreatingTask(true);
      setCreateTaskError("");

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

        setTaskSuccess(
          `${createdTask.title} was created.`
        );

        setActivityReloadKey(
          (key) => key + 1
        );
      } catch (error) {
        setCreateTaskError(
          getApiErrorMessage(error)
        );
      } finally {
        setCreatingTask(false);
      }
    };

  /*
   * -------------------------------------------------------
   * Normalized projects
   * -------------------------------------------------------
   */

  const projects = useMemo(() => {
    return projectList.map(
      (project, index) => ({
        ...project,
        color:
          projectColors[
            index %
              projectColors.length
          ],
      })
    );
  }, [projectList]);

  const creatableProjects =
    projects.filter(
      (project) =>
        !project.is_archived &&
        canManageProject(project)
    );

  /*
   * -------------------------------------------------------
   * Statistics
   * -------------------------------------------------------
   */

  const activeProjects =
    projectList.filter(
      (project) =>
        project.status ===
          "ACTIVE" &&
        !project.is_archived
    ).length;

  const archivedProjects =
    projectList.filter(
      (project) =>
        project.is_archived
    ).length;

  const upcomingDeadlines =
    projectList.filter(
      (project) => {
        if (
          !project.due_date ||
          project.is_archived
        ) {
          return false;
        }

        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        const dueDate =
          new Date(
            `${project.due_date}T00:00:00`
          );

        const nextThirtyDays =
          new Date(today);

        nextThirtyDays.setDate(
          nextThirtyDays.getDate() +
            30
        );

        return (
          dueDate >= today &&
          dueDate <=
            nextThirtyDays
        );
      }
    ).length;

  /*
   * -------------------------------------------------------
   * User
   * -------------------------------------------------------
   */

  const firstName =
    user?.first_name ||
    user?.username ||
    "there";

  const initials = (
    user?.first_name?.[0] ||
    user?.username?.[0] ||
    "U"
  ) +
    (user?.last_name?.[0] ||
      "");

  /*
   * -------------------------------------------------------
   * Search
   * -------------------------------------------------------
   */

  const filteredProjects = projects;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      250
    );

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const handleSearchKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowSearch(true);
      }

      if (event.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
        setDebouncedSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleSearchKeys);
    return () => window.removeEventListener("keydown", handleSearchKeys);
  }, [showSearch]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector("[data-mobile-sidebar] nav button")
        ?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileOpen]);

  const globalSearchResults = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) {
      return { projects: [], tasks: [], members: [] };
    }

    const matches = (values) =>
      values
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

    const membersById = new Map();
    organizations.forEach((organization) => {
      (organization.members ?? []).forEach((member) => {
        if (!matches([
          member.username,
          member.email,
          member.role,
          organization.name,
        ])) {
          return;
        }

        const memberId = String(member.user_id);
        const existing = membersById.get(memberId);
        if (existing) {
          existing.workspaces.push(organization.name);
        } else {
          membersById.set(memberId, {
            ...member,
            workspaces: [organization.name],
          });
        }
      });
    });

    return {
      projects: projects
        .filter((project) => matches([
          project.name,
          project.code,
          project.description,
          project.status,
          project.organization_name,
        ]))
        .slice(0, 6),
      tasks: tasks
        .filter((task) => matches([
          task.title,
          task.code,
          task.description,
          task.status,
          task.priority,
          task.project_name,
          task.assigned_to_email,
          task.created_by_email,
        ]))
        .slice(0, 6),
      members: [...membersById.values()].slice(0, 6),
    };
  }, [debouncedSearchQuery, organizations, projects, tasks]);

  const searchIsWaiting =
    searchQuery.trim().toLowerCase() !==
      debouncedSearchQuery.trim().toLowerCase() ||
    projectsLoading ||
    tasksLoading ||
    organizationsLoading;

  const searchErrors = [
    projectsError,
    tasksError,
    organizationsError,
  ].filter(Boolean);

  const searchResultCount =
    globalSearchResults.projects.length +
    globalSearchResults.tasks.length +
    globalSearchResults.members.length;

  const toggleSearch = () => {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery("");
      setDebouncedSearchQuery("");
      return;
    }

    setShowSearch(true);
  };

  const openTaskFromSearch = (task) => {
    setShowSearch(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setActive("My tasks");
    setMobileOpen(false);
    navigate("/app/tasks", { state: { searchTask: task } });
  };

  /*
   * -------------------------------------------------------
   * Tasks
   * -------------------------------------------------------
   */

  const activeTasks =
    useMemo(() => {
      return tasks.filter(
        (task) => {
          if (
            task.is_archived
          ) {
            return false;
          }

          if (
            taskScope ===
              "MINE" &&
            task.assigned_to !==
              user?.id
          ) {
            return false;
          }

          if (
            taskProjectFilter !==
              "ALL" &&
            task.project_id !==
              Number(
                taskProjectFilter
              )
          ) {
            return false;
          }

          if (
            taskStatusFilter !==
              "ALL" &&
            task.status !==
              taskStatusFilter
          ) {
            return false;
          }

          if (
            taskPriorityFilter !==
              "ALL" &&
            task.priority !==
              taskPriorityFilter
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      tasks,
      taskScope,
      taskProjectFilter,
      taskStatusFilter,
      taskPriorityFilter,
      user?.id,
    ]);

  const formattedDate =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    ).format(new Date());

  /*
   * -------------------------------------------------------
   * Sidebar
   * -------------------------------------------------------
   */

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-white">
      {/* Brand */}
      <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-6">
        <button
          type="button"
          onClick={() =>
            goTo(
              "/app/dashboard",
              "Overview"
            )
          }
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <Zap
              size={18}
              fill="white"
              strokeWidth={1.8}
            />
          </div>

          <div className="text-left">
            <p className="font-display text-[17px] font-extrabold tracking-[-0.7px]">
              opsflow
              <span className="text-accent">
                .
              </span>
            </p>

            <p className="mt-0.5 text-[9px] tracking-[1.8px] text-white/35">
              WORKSPACE
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          className="rounded-lg p-2 text-white/50 hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Workspace selector */}
      <div className="px-4 pt-6">
        <div className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.045] p-3 text-left">
          <Avatar
            initials="WS"
            color="#E8E2DA"
            text="#4F4A45"
            size={36}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">
              {organizations.length === 1
                ? organizations[0].name
                : organizations.length > 1
                  ? `${organizations.length} workspaces`
                  : organizationsLoading
                    ? "Loading workspaces..."
                    : "No workspaces"}
            </p>

            <p className="mt-1 text-[10px] text-white/40">
              Accessible workspaces
            </p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="px-6 pb-3 pt-8 text-[10px] font-bold uppercase tracking-[1.8px] text-white/30">
        Workspace
      </div>

      <nav className="space-y-1 px-3">
        {navigation.map(
          (item) => {
            const Icon =
              item.icon;

            const selected =
              active ===
              item.label;

            return (
              <button
                type="button"
                key={item.label}
                onClick={() =>
                  goTo(
                    item.path,
                    item.label
                  )
                }
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition-all ${
                  selected
                    ? "bg-white/[0.10] text-white"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={
                    selected
                      ? 2.2
                      : 1.8
                  }
                  className={
                    selected
                      ? "text-accent"
                      : ""
                  }
                />

                <span className="flex-1">
                  {item.label}
                </span>
              </button>
            );
          }
        )}
      </nav>

      {/* Projects */}
      <div className="mx-6 mb-3 mt-8 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-white/30">
          Your projects
        </p>

        {canCreateProjects && (
          <button
            type="button"
            onClick={openProjectModal}
            className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Create project"
            title="Create project"
          >
            <Plus size={15} />
          </button>
        )}
      </div>

      <div className="space-y-1 px-3">
        {projectsLoading ? (
          <div className="px-3.5 py-2.5 text-[11px] text-white/35">
            Loading projects...
          </div>
        ) : projectsError ? (
          <div className="px-3.5 py-2.5 text-[11px] text-red-300/70">
            Projects unavailable
          </div>
        ) : projects.length ===
          0 ? (
          <div className="px-3.5 py-2.5 text-[11px] text-white/35">
            No projects yet
          </div>
        ) : (
          projects
            .slice(0, 6)
            .map(
              (project) => (
                <button
                  type="button"
                  key={
                    project.id
                  }
                  onClick={() =>
                    navigate(
                      `/app/projects/${project.id}`
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-[4px]"
                    style={{
                      background:
                        project.color,
                    }}
                  />

                  <span className="flex-1 truncate">
                    {
                      project.name
                    }
                  </span>
                </button>
              )
            )
        )}
      </div>

      {/* Bottom area */}
      <div className="mt-auto p-4">
        <button
          type="button"
          onClick={() =>
            goTo(
              "/app/team",
              "Team"
            )
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Users size={17} />
          Team
        </button>

        <button
          type="button"
          onClick={() =>
            goTo(
              "/app/settings",
              "Settings"
            )
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Settings size={17} />
          Settings
        </button>

        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.08] px-2 pt-4">
          <Avatar
            initials={initials}
            color="#E8E2DA"
            text="#4F4A45"
            size={38}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white/90">
              {user?.first_name ||
                user?.username ||
                "Workspace user"}
            </p>

            <p className="mt-1 truncate text-[10px] text-white/40">
              {user?.email ||
                "Workspace member"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setProfileOpen(
                (value) => !value
              )
            }
            className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Open profile menu"
              aria-expanded={profileOpen}
              title="Open profile menu"
          >
            <ChevronDown
              size={16}
              className={
                profileOpen
                  ? "rotate-180"
                  : ""
              }
            />
          </button>
        </div>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{
                opacity: 0,
                y: 5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 5,
              }}
              className="mt-2 rounded-xl border border-white/10 bg-[#302D29] p-2"
            >
              <button
                type="button"
                onClick={() =>
                  goTo(
                    "/app/settings",
                    "Settings"
                  )
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-white/60 hover:bg-white/10 hover:text-white"
              >
                <Settings size={15} />
                Preferences
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen font-sans ${
        isDark
          ? "bg-[#171614] text-white"
          : "bg-canvas text-ink"
      }`}
    >
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block">
          {sidebar}
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setMobileOpen(false);
                  return;
                }
                if (event.key !== "Tab") return;

                const sidebarElement = event.currentTarget.querySelector(
                  "[data-mobile-sidebar]"
                );
                const focusable = Array.from(
                  sidebarElement?.querySelectorAll(
                    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
                  ) ?? []
                ).filter((element) => element.offsetParent !== null);
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <button
                type="button"
                aria-label="Close navigation"
                className="absolute inset-0 bg-black/50"
                onClick={() =>
                  setMobileOpen(false)
                }
              />

              <motion.div
                data-mobile-sidebar
                initial={{
                  x: -280,
                }}
                animate={{
                  x: 0,
                }}
                exit={{
                  x: -280,
                }}
                transition={{
                  type: "spring",
                  damping: 28,
                }}
                className="absolute inset-y-0 left-0 w-[280px]"
              >
                {sidebar}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 lg:ml-[252px]">
          {/* Header */}
          <header
            className={`sticky top-0 z-30 flex h-[76px] items-center justify-between border-b px-5 backdrop-blur-xl sm:px-8 lg:px-10 ${
              isDark
                ? "border-white/[0.08] bg-[#171614]/90"
                : "border-line bg-surface/90"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="rounded-lg p-2 text-muted hover:bg-canvas lg:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>

              <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
                Workspace

                <span className="text-line">
                  /
                </span>

                <span className="font-semibold text-ink dark:text-white">
                  Overview
                </span>
              </div>

              <div className="sm:hidden">
                <p className="font-display text-sm font-bold">
                  Overview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <button
                type="button"
                onClick={toggleSearch}
                className={`hidden h-10 w-[230px] items-center gap-2.5 rounded-xl border px-3 text-xs text-muted transition md:flex ${
                  isDark
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-line bg-surface"
                }`}
              >
                <Search size={15} />

                <span className="flex-1 text-left">
                  Search everything...
                </span>

                <span className="rounded-md border border-line px-1.5 py-1 text-[9px]">
                  Ctrl K
                </span>
              </button>

              <button
                type="button"
                onClick={toggleSearch}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted md:hidden"
                aria-label="Search"
                title="Search"
              >
                <Search size={17} />
              </button>

              {/* Theme */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-white"
                    : "border-line bg-surface text-muted"
                }`}
              >
                {theme === "dark" ? (
                  <Sun size={17} />
                ) : (
                  <Moon size={17} />
                )}
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() =>
                  goTo(
                    "/app/inbox",
                    "Inbox"
                  )
                }
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border ${
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-white"
                    : "border-line bg-surface text-muted"
                }`}
                aria-label="Open inbox"
                title="Open inbox"
              >
                <Bell size={17} />
              </button>

              <div className="hidden h-8 w-px bg-line sm:block" />

              {/* Profile */}
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (value) => !value
                  )
                }
                className="rounded-full"
                aria-label="Open profile"
                title="Open profile"
              >
                <Avatar
                  initials={initials}
                  color="#E8E2DA"
                  text="#4F4A45"
                  size={36}
                />
              </button>
            </div>
          </header>

          {/* Search panel */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                className="sticky top-[76px] z-20 border-b border-line bg-surface p-4 shadow-soft dark:border-white/10 dark:bg-[#201E1B]"
              >
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-center gap-3">
                    <Search size={18} aria-hidden="true" className="shrink-0 text-muted" />
                    <input
                      autoFocus
                      role="combobox"
                      aria-label="Search projects, tasks, and team members"
                      aria-expanded="true"
                      aria-controls="global-search-results"
                      aria-autocomplete="list"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          searchResultsRef.current?.querySelector("button")?.focus();
                        }
                      }}
                      placeholder="Search projects, tasks, and people..."
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                    />
                    <span className="hidden text-[10px] text-muted sm:inline">Esc to close</span>
                    <button
                      type="button"
                      onClick={toggleSearch}
                      className="rounded-lg p-2 text-muted hover:bg-canvas dark:hover:bg-white/[0.06]"
                      aria-label="Close search"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div
                    id="global-search-results"
                    ref={searchResultsRef}
                    role="region"
                    aria-label="Global search results"
                    aria-live="polite"
                    className="mt-3 max-h-[min(65vh,520px)] overflow-y-auto"
                  >
                    {!searchQuery.trim() ? (
                      <p className="px-2 py-4 text-xs text-muted dark:text-white/45">
                        Search accessible projects, tasks, and workspace members.
                      </p>
                    ) : searchIsWaiting ? (
                      <div className="flex items-center gap-2 px-2 py-4 text-xs text-muted dark:text-white/45">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                        Searching...
                      </div>
                    ) : (
                      <>
                        {searchErrors.length > 0 && (
                          <div role="alert" className="mb-3 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs leading-5 text-danger dark:border-danger/20 dark:bg-danger/10 dark:text-[#d8aaa4]">
                            Some search results could not be loaded: {searchErrors.join(" ")}
                          </div>
                        )}

                        {searchResultCount === 0 && searchErrors.length === 0 ? (
                          <p className="px-2 py-6 text-center text-sm text-muted dark:text-white/45">
                            No results for “{debouncedSearchQuery}”.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {globalSearchResults.projects.length > 0 && (
                              <section aria-labelledby="search-projects-heading">
                                <h2 id="search-projects-heading" className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/40">
                                  Projects
                                </h2>
                                <div className="space-y-1">
                                  {globalSearchResults.projects.map((project) => (
                                    <button
                                      type="button"
                                      key={project.id}
                                      onClick={() => {
                                        setShowSearch(false);
                                        setSearchQuery("");
                                        setDebouncedSearchQuery("");
                                        navigate(`/app/projects/${project.id}`);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-white/[0.05]"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:bg-[#3B342E] dark:text-[#d2bdac]">
                                        <FolderKanban size={15} />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold text-ink dark:text-white">{project.name}</span>
                                        <span className="mt-0.5 block truncate text-[10px] text-muted dark:text-white/40">
                                          {[project.code, project.organization_name, project.status?.replaceAll("_", " ")].filter(Boolean).join(" · ")}
                                        </span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </section>
                            )}

                            {globalSearchResults.tasks.length > 0 && (
                              <section aria-labelledby="search-tasks-heading">
                                <h2 id="search-tasks-heading" className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/40">
                                  Tasks
                                </h2>
                                <div className="space-y-1">
                                  {globalSearchResults.tasks.map((task) => (
                                    <button
                                      type="button"
                                      key={task.id}
                                      onClick={() => openTaskFromSearch(task)}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-white/[0.05]"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:bg-[#3B342E] dark:text-[#d2bdac]">
                                        <CheckSquare size={15} />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold text-ink dark:text-white">{task.title}</span>
                                        <span className="mt-0.5 block truncate text-[10px] text-muted dark:text-white/40">
                                          {[task.code, task.project_name, task.status?.replaceAll("_", " ")].filter(Boolean).join(" · ")}
                                        </span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </section>
                            )}

                            {globalSearchResults.members.length > 0 && (
                              <section aria-labelledby="search-members-heading">
                                <h2 id="search-members-heading" className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/40">
                                  Team members
                                </h2>
                                <div className="space-y-1">
                                  {globalSearchResults.members.map((member) => (
                                    <button
                                      type="button"
                                      key={member.user_id}
                                      onClick={() => {
                                        setShowSearch(false);
                                        setSearchQuery("");
                                        setDebouncedSearchQuery("");
                                        navigate(`/app/team/${member.user_id}`);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-white/[0.05]"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent-strong dark:bg-[#3B342E] dark:text-[#d2bdac]">
                                        {(member.username || member.email || "U").slice(0, 2).toUpperCase()}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold text-ink dark:text-white">{member.username || member.email}</span>
                                        <span className="mt-0.5 block truncate text-[10px] text-muted dark:text-white/40">
                                          {[member.email, ...member.workspaces].filter(Boolean).join(" · ")}
                                        </span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </section>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {/* Welcome */}
            <motion.section
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
              }}
              className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
            >
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />

                  <span className="text-[10px] font-bold uppercase tracking-[1.6px] text-muted">
                    {formattedDate}
                  </span>
                </div>

                <h1 className="font-display text-[30px] font-extrabold tracking-[-1.5px] sm:text-[38px]">
                  Good morning,{" "}
                  {firstName}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  A clear view of your
                  workspace, projects
                  and current work.
                </p>
              </div>

              {canCreateProjects && (
                <button
                  type="button"
                  onClick={openProjectModal}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-hover"
                >
                  <Plus size={17} />
                  New project
                </button>
              )}
            </motion.section>

            {organizationsError && (
              <div role="alert" className="mb-6 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger dark:border-danger/20 dark:bg-danger/10 dark:text-[#d8aaa4]">
                Project permissions could not be verified: {organizationsError}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div
                role="status"
                className="mb-6 flex items-center gap-3 rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm text-success-strong"
              >
                <CircleCheck size={17} />
                <span>
                  {successMessage}
                </span>
              </div>
            )}

            {/* Stats */}
            <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total projects"
                value={
                  projectsError
                    ? "—"
                    : projectsLoading
                    ? "…"
                    : projectList.length
                }
                description="Projects in your workspace"
                icon={FolderKanban}
              />

              <StatCard
                label="Upcoming deadlines"
                value={
                  projectsError
                    ? "—"
                    : projectsLoading
                    ? "…"
                    : upcomingDeadlines
                }
                description="Due within 30 days"
                icon={CalendarDays}
              />

              <StatCard
                label="Active projects"
                value={
                  projectsError
                    ? "—"
                    : projectsLoading
                    ? "…"
                    : activeProjects
                }
                description="Currently active"
                icon={Activity}
              />

              <StatCard
                label="Archived projects"
                value={
                  projectsError
                    ? "—"
                    : projectsLoading
                    ? "…"
                    : archivedProjects
                }
                description="Workspace history"
                icon={CircleCheck}
              />
            </section>

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
              {/* Projects */}
              <section className="rounded-[18px] border border-line bg-surface p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1A18] sm:p-7">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-[17px] font-bold tracking-[-0.5px]">
                      Recent projects
                    </h2>

                    <p className="mt-1.5 text-xs text-muted">
                      Your latest workspace
                      projects.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      goTo(
                        "/app/projects",
                        "Projects"
                      )
                    }
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    View all
                  </button>
                </div>

                {projectsLoading ? (
                  <div className="rounded-xl border border-dashed border-line p-10 text-center dark:border-white/10">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />

                    <p className="text-sm font-semibold">
                      Loading projects...
                    </p>
                  </div>
                ) : projectsError ? (
                  <div className="rounded-xl border border-danger/20 bg-danger-soft p-5">
                    <p className="text-sm font-semibold text-danger">
                      Could not load projects
                    </p>

                    <p className="mt-2 text-xs text-muted">
                      {projectsError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setProjectReloadKey(
                          (key) =>
                            key + 1
                        )
                      }
                      className="mt-4 text-xs font-semibold text-danger underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredProjects.length ===
                  0 ? (
                  <div className="rounded-xl border border-dashed border-line p-10 text-center dark:border-white/10">
                    <FolderKanban
                      size={28}
                      className="mx-auto mb-4 text-muted"
                    />

                    <p className="text-sm font-semibold">
                      {searchQuery
                        ? "No matching projects"
                        : "No projects yet"}
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted">
                      {searchQuery
                        ? "Try another project name or code."
                        : "Create your first project to start organizing your work."}
                    </p>

                    {!searchQuery && canCreateProjects && (
                      <button
                        type="button"
                        onClick={
                          openProjectModal
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover"
                      >
                        <Plus size={14} />
                        Create project
                      </button>
                    )}
                    {!searchQuery && !canCreateProjects && !organizationsLoading && !organizationsError && (
                      <p className="mt-5 text-xs text-muted">
                        Only workspace owners, admins, and managers can create projects.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-line dark:divide-white/[0.07]">
                    {filteredProjects
                      .slice(0, 5)
                      .map(
                        (
                          project,
                          index
                        ) => (
                          <motion.button
                            type="button"
                            key={
                              project.id
                            }
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.05,
                            }}
                            onClick={() =>
                              navigate(
                                `/app/projects/${project.id}`
                              )
                            }
                            className="group flex w-full items-center gap-4 py-4 text-left first:pt-0 last:pb-0"
                          >
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold"
                              style={{
                                background: `${project.color}18`,
                                color:
                                  project.color,
                              }}
                            >
                              {project.code ||
                                "PR"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold transition group-hover:text-accent">
                                {
                                  project.name
                                }
                              </p>

                              <p className="mt-1 truncate text-[11px] text-muted">
                                {project.status
                                  ?.replaceAll(
                                    "_",
                                    " "
                                  ) ||
                                  "No status"}

                                {project.priority
                                  ? ` · ${project.priority.toLowerCase()} priority`
                                  : ""}
                              </p>
                            </div>

                            <div className="hidden text-right sm:block">
                              <p className="text-[10px] font-semibold text-muted">
                                {project.due_date
                                  ? `Due ${formatDate(project.due_date)}`
                                  : "No deadline"}
                              </p>

                              <p className="mt-1 text-[10px] text-muted">
                                {project.organization_name ||
                                  "Workspace"}
                              </p>
                            </div>
                          </motion.button>
                        )
                      )}
                  </div>
                )}

                {projects.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      goTo(
                        "/app/projects",
                        "Projects"
                      )
                    }
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3.5 text-xs font-semibold text-muted transition hover:border-accent hover:bg-accent-soft hover:text-accent dark:border-white/10"
                  >
                    Open project workspace
                  </button>
                )}
              </section>

              {/* Activity */}
              <section className="rounded-[18px] border border-line bg-surface p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1A18] sm:p-7">
                <div className="mb-7 flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-[17px] font-bold tracking-[-0.5px]">
                      Recent activity
                    </h2>

                    <p className="mt-1.5 text-xs text-muted">
                      Latest changes in your
                      workspace.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      goTo(
                        "/app/inbox",
                        "Inbox"
                      )
                    }
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Open inbox
                  </button>
                </div>

                {activityLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
                  </div>
                ) : activityError ? (
                  <div className="rounded-xl border border-danger/20 bg-danger-soft p-5">
                    <p className="text-sm font-semibold text-danger">
                      Activity unavailable
                    </p>

                    <p className="mt-2 text-xs text-muted">
                      {activityError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setActivityReloadKey(
                          (key) =>
                            key + 1
                        )
                      }
                      className="mt-4 text-xs font-semibold text-danger underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </div>
                ) : workspaceActivity.length >
                  0 ? (
                  <ol className="divide-y divide-line dark:divide-white/[0.07]">
                    {workspaceActivity
                      .slice(0, 6)
                      .map(
                        (item) => (
                          <li
                            key={
                              item.id
                            }
                            className="flex gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                              <Activity
                                size={14}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold">
                                {item.description ||
                                  item.action ||
                                  "Workspace activity"}
                              </p>

                              <p className="mt-1 truncate text-[10px] text-muted">
                                {item.actor_name ||
                                  "OpsFlow"}

                                {item.task_title
                                  ? ` · ${item.task_title}`
                                  : ""}

                                {item.project_name
                                  ? ` · ${item.project_name}`
                                  : ""}
                              </p>

                              {item.created_at && (
                                <time dateTime={item.created_at} className="mt-1 block text-[10px] text-muted">
                                  {formatDateTime(item.created_at)}
                                </time>
                              )}
                            </div>
                          </li>
                        )
                      )}
                  </ol>
                ) : (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-line px-5 text-center dark:border-white/10">
                    <Activity
                      size={24}
                      className="mb-3 text-muted"
                    />

                    <p className="text-xs font-semibold">
                      No activity yet
                    </p>

                    <p className="mt-1 max-w-xs text-[11px] leading-5 text-muted">
                      Project changes,
                      tasks and other
                      workspace events
                      will appear here.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Tasks preview */}
            <section className="mt-6 rounded-[18px] border border-line bg-surface p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1A18] sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-[17px] font-bold tracking-[-0.5px]">
                    My tasks
                  </h2>

                  <p className="mt-1.5 text-xs text-muted">
                    A quick view of work assigned to you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    goTo(
                      "/app/tasks",
                      "My tasks"
                    )
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-canvas dark:border-white/10"
                >
                  Open task workspace
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {taskColumns
                  .slice(0, 4)
                  .map(
                    (column) => {
                      const Icon =
                        column.icon;

                      const count =
                        activeTasks.filter(
                          (task) =>
                            task.status ===
                            column.status
                        ).length;

                      return (
                        <button
                          type="button"
                          key={
                            column.status
                          }
                          onClick={() =>
                            goTo(
                              "/app/tasks",
                              "My tasks"
                            )
                          }
                          className="rounded-xl border border-line p-4 text-left transition hover:border-accent/40 hover:bg-accent-soft/40 dark:border-white/[0.08]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon
                                size={15}
                                className="text-muted"
                              />

                              <span className="text-xs font-semibold">
                                {
                                  column.label
                                }
                              </span>
                            </div>

                            <span className="text-lg font-bold">
                              {
                                count
                              }
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
              </div>

              {tasksError && (
                <p className="mt-4 text-xs text-danger">
                  {tasksError}
                </p>
              )}
            </section>

            {/* Quick actions */}
            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              {canCreateProjects && <button
                type="button"
                onClick={openProjectModal}
                className="group rounded-[18px] border border-line bg-surface p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-panel dark:border-white/[0.08] dark:bg-[#1B1A18]"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Plus size={18} />
                </div>

                <p className="text-sm font-bold">
                  Create a project
                </p>

                <p className="mt-1.5 text-xs leading-5 text-muted">
                  Start a new project inside your workspace.
                </p>
              </button>}

              <button
                type="button"
                onClick={() =>
                  goTo(
                    "/app/team",
                    "Team"
                  )
                }
                className="group rounded-[18px] border border-line bg-surface p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-panel dark:border-white/[0.08] dark:bg-[#1B1A18]"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Users size={18} />
                </div>

                <p className="text-sm font-bold">
                  Manage your team
                </p>

                <p className="mt-1.5 text-xs leading-5 text-muted">
                  View workspace members and their roles.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  goTo(
                    "/app/settings",
                    "Settings"
                  )
                }
                className="group rounded-[18px] border border-line bg-surface p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-panel dark:border-white/[0.08] dark:bg-[#1B1A18]"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Settings size={18} />
                </div>

                <p className="text-sm font-bold">
                  Workspace settings
                </p>

                <p className="mt-1.5 text-xs leading-5 text-muted">
                  Configure your workspace and preferences.
                </p>
              </button>
            </section>

            {/* Footer */}
            <footer className="flex flex-col items-center justify-between gap-2 py-8 text-[10px] text-muted sm:flex-row">
              <p>
                © 2026 OpsFlow.
              </p>

              <p>
                Project data is provided by the Django API.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Project / Task modals */}
      <Suspense
        fallback={
          <div
            role="status"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 text-sm text-white"
          >
            Opening workspace…
          </div>
        }
      >
        {projectModalOpen && (
          <ProjectModal
            open
            onClose={() =>
              setProjectModalOpen(
                false
              )
            }
            onSubmit={
              handleCreateProject
            }
            loading={
              creatingProject
            }
            error={
              createProjectError
            }
            organizations={
              manageableOrganizations
            }
            organizationsLoading={
              organizationsLoading
            }
            organizationsError={
              organizationsError
            }
          />
        )}

        {taskModalOpen && (
          <TaskModal
            open
            onClose={() =>
              setTaskModalOpen(
                false
              )
            }
            onSubmit={
              handleCreateTask
            }
            projects={
              creatableProjects
            }
            loading={creatingTask}
            error={
              createTaskError
            }
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;