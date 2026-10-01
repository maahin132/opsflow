import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

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
  MoreHorizontal,
  CircleCheck,
  Command,
  Bell,
  Menu,
  X,
  Zap,
  Activity,
  Sun,
  Moon,
  RefreshCw,
  AlertCircle,
  CircleDot,
  CircleDashed,
  CircleCheckBig,
} from "lucide-react";

import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import projectService from "./services/projectService";
import organizationService from "./services/organizationService";
import taskService from "./services/taskService";

const ProjectModal = lazy(() => import("./components/ProjectModal"));
const TaskModal = lazy(() => import("./components/TaskModal"));
const TaskDetailsModal = lazy(() => import("./components/TaskDetailsModal"));
const ProjectDetailsModal = lazy(() => import("./components/ProjectDetailsModal"));

const navigation = [
  {
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    icon: FolderKanban,
  },
  {
    label: "My tasks",
    icon: CheckSquare,
  },
  {
    label: "Inbox",
    icon: Inbox,
  },
];

const projectColors = [
  "#8B7CFF",
  "#E5A45B",
  "#63B69B",
  "#7298D6",
];

const taskColumns = [
  { status: "TODO", label: "To do", icon: CircleDashed },
  { status: "IN_PROGRESS", label: "In progress", icon: CircleDot },
  { status: "IN_REVIEW", label: "In review", icon: Activity },
  { status: "BLOCKED", label: "Blocked", icon: AlertCircle },
  { status: "DONE", label: "Done", icon: CircleCheckBig },
];

const managerRoles = new Set(["OWNER", "ADMIN", "MANAGER"]);

function getApiErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") return data.detail;

  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .flatMap(([field, value]) =>
        (Array.isArray(value) ? value : [value]).map((detail) =>
          typeof detail === "string" ? `${field}: ${detail}` : ""
        )
      )
      .filter(Boolean);

    if (messages.length) return messages.join(" ");
  }

  return "The request could not be completed. Please try again.";
}

function Avatar({
  initials,
  color = "#D9D3FF",
  text = "#5A4DC2",
  size = 34,
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

function SectionHeading({ title, action, onAction }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="font-display text-[15px] font-bold tracking-[-0.4px] text-ink dark:text-white">
        {title}
      </h2>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold text-muted transition hover:text-ink dark:hover:text-white"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  const [active, setActive] = useState("Overview");

  const [mobileOpen, setMobileOpen] = useState(false);

  const [showSearch, setShowSearch] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [projectList, setProjectList] = useState([]);

  const [projectsLoading, setProjectsLoading] = useState(true);

  const [projectsError, setProjectsError] = useState("");
  const [projectReloadKey, setProjectReloadKey] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [taskReloadKey, setTaskReloadKey] = useState(0);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState("");
  const [taskSuccess, setTaskSuccess] = useState("");
  const [taskScope, setTaskScope] = useState("MINE");
  const [taskProjectFilter, setTaskProjectFilter] = useState("ALL");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [workspaceActivity, setWorkspaceActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [activityReloadKey, setActivityReloadKey] = useState(0);

  /*
   * Load real projects from Django backend.
   */
  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError("");

        const data = await projectService.getProjects();

        if (!cancelled) {
          setProjectList(
            Array.isArray(data)
              ? data
              : data?.results ?? []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load projects:",
          error
        );

        if (!cancelled) {
          setProjectList([]);

          setProjectsError(
            error?.response?.data?.detail ||
              "Unable to load projects. Please try again."
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

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        setOrganizationsLoading(true);
        setOrganizationsError("");
        const data = await organizationService.getOrganizations();

        if (!cancelled) setOrganizations(data);
      } catch (error) {
        if (!cancelled) {
          setOrganizations([]);
          setOrganizationsError(getApiErrorMessage(error));
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

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      setTasksLoading(true);
      setTasksError("");
      try {
        const data = await taskService.getTasks();
        if (!cancelled) setTasks(data);
      } catch (error) {
        if (!cancelled) {
          setTasks([]);
          setTasksError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    };

    loadTasks();
    return () => { cancelled = true; };
  }, [taskReloadKey]);

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      setActivityLoading(true);
      setActivityError("");
      try {
        const data = await taskService.getWorkspaceActivity();
        if (!cancelled) setWorkspaceActivity(data);
      } catch (error) {
        if (!cancelled) {
          setWorkspaceActivity([]);
          setActivityError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    };

    loadActivity();
    return () => { cancelled = true; };
  }, [activityReloadKey]);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeout = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const openProjectModal = () => {
    setCreateProjectError("");
    setProjectModalOpen(true);
  };

  const canManageProject = (project) => {
    const organization = organizations.find(
      (item) => item.id === project?.organization_pk
    );
    return managerRoles.has(organization?.current_user_role);
  };

  const canManageOrganization = (organization) =>
    ["OWNER", "ADMIN"].includes(organization?.current_user_role);

  const updateOrganizationState = (organizationId, updater) => {
    setOrganizations((current) => current.map((organization) =>
      organization.id === organizationId ? updater(organization) : organization
    ));
  };

  const handleAddOrganizationMember = async (organizationId, email, role) => {
    try {
      const member = await organizationService.addMember(organizationId, email, role);
      updateOrganizationState(organizationId, (organization) => ({
        ...organization,
        members: [...(organization.members ?? []), member],
        member_count: organization.member_count + 1,
      }));
      return member;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleUpdateOrganizationMember = async (organizationId, userId, role) => {
    try {
      const member = await organizationService.updateMemberRole(organizationId, userId, role);
      updateOrganizationState(organizationId, (organization) => ({
        ...organization,
        members: organization.members.map((item) => item.user_id === userId ? member : item),
      }));
      return member;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleRemoveOrganizationMember = async (organizationId, userId) => {
    try {
      await organizationService.removeMember(organizationId, userId);
      updateOrganizationState(organizationId, (organization) => ({
        ...organization,
        members: organization.members.filter((item) => item.user_id !== userId),
        member_count: Math.max(0, organization.member_count - 1),
      }));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleCreateTask = async (payload) => {
    setCreatingTask(true);
    setCreateTaskError("");
    try {
      const createdTask = await taskService.createTask(payload);
      setTasks((current) => [createdTask, ...current]);
      setTaskModalOpen(false);
      setTaskSuccess(`${createdTask.title} was created.`);
      setActivityReloadKey((key) => key + 1);
      window.setTimeout(() => setTaskSuccess(""), 5000);
    } catch (error) {
      setCreateTaskError(getApiErrorMessage(error));
    } finally {
      setCreatingTask(false);
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((current) => current.map((task) => task.id === updatedTask.id ? updatedTask : task));
    setSelectedTask(updatedTask);
    setActivityReloadKey((key) => key + 1);
  };

  const handleTaskDeleted = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      setSelectedTask(null);
      setActivityReloadKey((key) => key + 1);
      setTaskSuccess("Task deleted.");
      window.setTimeout(() => setTaskSuccess(""), 5000);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
    setActivityReloadKey((key) => key + 1);
  };

  const handleSaveProject = async (projectId, payload) => {
    try {
      const updatedProject = await projectService.updateProject(projectId, payload);
      setProjectList((current) => current.map((project) => project.id === projectId ? updatedProject : project));
      setSelectedProject(updatedProject);
      return updatedProject;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const projectName = projectList.find((project) => project.id === projectId)?.name;
      await projectService.deleteProject(projectId);
      setProjectList((current) => current.filter((project) => project.id !== projectId));
      setTasks((current) => current.filter((task) => task.project_pk !== projectId));
      setSelectedProject(null);
      setSuccessMessage(`${projectName || "Project"} was deleted.`);
      setActivityReloadKey((key) => key + 1);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleAddProjectMember = async (projectId, userId, role) => {
    try {
      const addedMember = await projectService.addMember(projectId, userId, role);
      const update = (project) => project.id === projectId
        ? { ...project, members: [...(project.members ?? []), addedMember] }
        : project;
      setProjectList((current) => current.map(update));
      setSelectedProject((current) => current ? update(current) : current);
      return addedMember;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleRemoveProjectMember = async (projectId, userId) => {
    try {
      await projectService.removeMember(projectId, userId);
      const update = (project) => project.id === projectId
        ? { ...project, members: (project.members ?? []).filter((member) => member.user !== userId) }
        : project;
      setProjectList((current) => current.map(update));
      setSelectedProject((current) => current ? update(current) : current);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const handleCreateProject = async (payload) => {
    setCreatingProject(true);
    setCreateProjectError("");

    try {
      const createdProject = await projectService.createProject(payload);
      setProjectList((current) => [
        createdProject,
        ...current.filter((project) => project.id !== createdProject.id),
      ]);
      setProjectReloadKey((key) => key + 1);
      setProjectModalOpen(false);
      setSuccessMessage(`${createdProject.name} was created.`);
    } catch (error) {
      setCreateProjectError(getApiErrorMessage(error));
    } finally {
      setCreatingProject(false);
    }
  };

  /*
   * Normalize backend project data for the UI.
   */
  const projects = useMemo(() => {
    return projectList.map((project, index) => {
      return {
        ...project,
        color:
          projectColors[
            index % projectColors.length
          ],
      };
    });
  }, [projectList]);

  const creatableProjects = projects.filter(
    (project) => !project.is_archived && canManageProject(project)
  );
  const manageableOrganizations = organizations.filter((organization) =>
    managerRoles.has(organization.current_user_role)
  );

  /*
   * Real workspace statistics.
   */
  const activeProjects = useMemo(() => {
    return projectList.filter(
      (project) => project.status === "ACTIVE" && !project.is_archived
    ).length;
  }, [projectList]);

  const archivedProjects = useMemo(() => {
    return projectList.filter(
      (project) => project.is_archived
    ).length;
  }, [projectList]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nextThirtyDays = new Date(now);
    nextThirtyDays.setDate(nextThirtyDays.getDate() + 30);

    return projectList.filter((project) => {
      if (
        !project.due_date ||
        project.is_archived ||
        project.status === "COMPLETED" ||
        project.status === "CANCELLED"
      ) {
        return false;
      }

      const dueDate = new Date(
        `${project.due_date}T00:00:00`
      );

      return (
        dueDate >= now &&
        dueDate <= nextThirtyDays
      );
    }).length;
  }, [projectList]);

  /*
   * User information.
   */
  const firstName =
    user?.first_name ||
    user?.username ||
    "there";

  const initials =
    (
      user?.first_name?.[0] ||
      user?.username?.[0] ||
      "U"
    ) +
    (user?.last_name?.[0] || "");

  /*
   * Project search.
   */
  const filteredProjects = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.code,
        project.description,
        project.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchable.includes(query);
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const activeProjectIds = useMemo(
    () => new Set(projects.filter((project) => !project.is_archived).map((project) => project.id)),
    [projects]
  );

  const activeTasks = useMemo(() => tasks.filter((task) => {
    if (task.is_archived || !activeProjectIds.has(task.project_pk)) return false;
    if (taskScope === "MINE" && task.assigned_to !== user?.id) return false;
    if (taskProjectFilter !== "ALL" && task.project_pk !== Number(taskProjectFilter)) return false;
    if (taskStatusFilter !== "ALL" && task.status !== taskStatusFilter) return false;
    if (taskPriorityFilter !== "ALL" && task.priority !== taskPriorityFilter) return false;
    return true;
  }), [tasks, activeProjectIds, taskScope, taskProjectFilter, taskStatusFilter, taskPriorityFilter, user?.id]);

  const selectedTaskProject = projects.find(
    (project) => project.id === selectedTask?.project_pk
  );
  const canChangeSelectedTask = selectedTask && (
    selectedTask.assigned_to === user?.id || canManageProject(selectedTaskProject)
  );

  const formattedDate =
    new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());

  /*
   * Sidebar.
   */
  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
            <Zap
              size={19}
              fill="white"
              strokeWidth={1.8}
            />
          </div>

          <div>
            <p className="font-display text-[17px] font-extrabold tracking-[-0.7px]">
              opsflow
              <span className="text-accent">
                .
              </span>
            </p>

            <p className="mt-0.5 text-[10px] tracking-[1.5px] text-white/35">
              WORKSPACE
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 pt-6">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.045] p-3 text-left transition hover:bg-white/[0.08]"
        >
          <Avatar
            initials="OF"
            color="#D9D3FF"
            text="#5A4DC2"
            size={36}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">
              OpsFlow Studio
            </p>

            <p className="mt-1 text-[11px] text-white/40">
              Workspace
            </p>
          </div>

          <ChevronDown
            size={15}
            className="text-white/40"
          />
        </button>
      </div>

      <div className="px-6 pb-3 pt-8 text-[10px] font-bold uppercase tracking-[1.8px] text-white/30">
        Workspace
      </div>

      <nav className="space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          const selected =
            active === item.label;

          return (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                setActive(item.label);
                setMobileOpen(false);
                if (item.label === "Projects") {
                  document.getElementById("project-management")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
                if (item.label === "My tasks") {
                  setTaskScope("MINE");
                  document.getElementById("task-management")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
                if (item.label === "Inbox") {
                  document.getElementById("workspace-activity")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition-all ${
                selected
                  ? "bg-white/[0.10] text-white shadow-sm"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={
                  selected ? 2.2 : 1.8
                }
                className={
                  selected
                    ? "text-[#A69EFF]"
                    : ""
                }
              />

              <span className="flex-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mx-6 mb-3 mt-8 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-white/30">
          Your projects
        </p>

        <button
          type="button"
          onClick={openProjectModal}
          aria-label="Create project"
          title="Create project"
          className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="space-y-1 px-3">
        {projectsLoading ? (
          <div className="px-3.5 py-2.5 text-[11px] text-white/35">
            Loading projects...
          </div>
        ) : projectsError ? (
          <div className="px-3.5 py-2.5 text-[11px] leading-5 text-red-300/70">
            Projects unavailable
          </div>
        ) : projects.length === 0 ? (
          <div className="px-3.5 py-2.5 text-[11px] leading-5 text-white/35">
            No projects yet
          </div>
        ) : (
          projects
            .slice(0, 6)
            .map((project) => (
              <button
                type="button"
                key={
                  project.id ??
                  project.code
                }
                onClick={() => {
                  setActive("Projects");
                  setMobileOpen(false);
                }}
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
                  {project.name}
                </span>
              </button>
            ))
        )}
      </div>

      <div className="mt-auto p-4">
        <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity
              size={15}
              className="text-[#A69EFF]"
            />

            <span className="text-xs font-semibold text-white/80">
              Workspace data
            </span>
          </div>

          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="text-white/40">
              Projects available
            </span>

            <span className="text-white/70">
              {projectsLoading
                ? "..."
                : projectsError
                ? "—"
                : projectList.length}
            </span>
          </div>

        </div>

        <button
          type="button"
          onClick={() => {
            setActive("Team");
            setSelectedProject(projects[0] ?? null);
            setMobileOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Users size={17} />
          Team members
        </button>

        <button
          type="button"
          onClick={() =>
            setActive("Settings")
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Settings size={17} />
          Settings
        </button>

        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.08] px-2 pt-4">
          <Avatar
            initials={initials}
            color="#D9D3FF"
            text="#5A4DC2"
            size={38}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white/90">
              {user?.first_name ||
                user?.username ||
                "Workspace user"}
            </p>

            <p className="mt-1 text-[10px] text-white/40">
              Workspace member
            </p>
          </div>

          <button
            type="button"
            className="text-white/40 transition hover:text-white"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isDark
          ? "dark bg-[#111113] text-white"
          : "bg-canvas text-ink"
      }`}
    >
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block">
          {sidebar}
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
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

        <main className="min-w-0 flex-1 lg:ml-[252px]">
          {/* Header */}
          <header
            className={`sticky top-0 z-30 flex h-[76px] items-center justify-between border-b px-5 backdrop-blur-xl sm:px-8 lg:px-10 ${
              isDark
                ? "border-white/[0.08] bg-[#171719]/90"
                : "border-line bg-white/90"
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
              >
                <Menu size={20} />
              </button>

              <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
                Workspace

                <span className="text-line">
                  /
                </span>

                <span className="font-semibold text-ink dark:text-white">
                  {active}
                </span>
              </div>

              <div className="sm:hidden">
                <p className="font-display text-sm font-bold">
                  {active}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Desktop search */}
              <button
                type="button"
                onClick={() =>
                  setShowSearch(
                    (value) => !value
                  )
                }
                className={`hidden h-10 w-[230px] items-center gap-2.5 rounded-xl border px-3 text-xs text-muted transition hover:border-[#C8C4FF] md:flex ${
                  isDark
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-line bg-[#FAFAF9]"
                }`}
              >
                <Search size={15} />

                <span className="flex-1 text-left">
                  Search projects...
                </span>

                <span className="flex items-center gap-1 rounded-md border border-line bg-white px-1.5 py-1 text-[10px] dark:bg-white/10">
                  <Command size={10} />
                  K
                </span>
              </button>

              {/* Mobile search */}
              <button
                type="button"
                onClick={() =>
                  setShowSearch(
                    (value) => !value
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-canvas md:hidden"
                aria-label="Search"
              >
                <Search size={17} />
              </button>

              {/* Theme */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${
                  theme === "dark"
                    ? "light"
                    : "dark"
                } mode`}
                title={`Switch to ${
                  theme === "dark"
                    ? "light"
                    : "dark"
                } mode`}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-amber-300 hover:bg-white/10"
                    : "border-line bg-white text-muted hover:bg-canvas"
                }`}
              >
                {theme === "dark" ? (
                  <Sun size={17} />
                ) : (
                  <Moon size={17} />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(
                      (value) => !value
                    )
                  }
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl border text-muted transition ${
                    isDark
                      ? "border-white/10 bg-white/[0.04] hover:bg-white/10"
                      : "border-line bg-white hover:bg-canvas"
                  }`}
                  aria-label="Notifications"
                >
                  <Bell size={17} />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-white p-4 text-ink shadow-panel dark:border-white/10 dark:bg-[#202023] dark:text-white">
                    <p className="text-sm font-bold">
                      Notifications
                    </p>

                    <p className="mt-3 text-xs leading-5 text-muted">
                      You're all caught up.
                      Notifications from the
                      workspace will appear here.
                    </p>
                  </div>
                )}
              </div>

              <div className="hidden h-8 w-px bg-line sm:block" />

              <Avatar
                initials={initials}
                color="#D9D3FF"
                text="#5A4DC2"
                size={36}
              />
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
                className="sticky top-[76px] z-20 border-b border-line bg-white p-4 dark:border-white/10 dark:bg-[#202023]"
              >
                <div className="mx-auto flex max-w-3xl items-center gap-3">
                  <Search
                    size={18}
                    className="text-muted"
                  />

                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search projects..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="rounded-lg p-2 text-muted hover:bg-canvas"
                    aria-label="Close search"
                  >
                    <X size={17} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {/* Hero */}
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
                duration: 0.45,
              }}
              className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
            >
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#65B89A]" />

                  <span className="text-[11px] font-bold uppercase tracking-[1.6px] text-muted">
                    {formattedDate}
                  </span>
                </div>

                <h1 className="font-display text-[30px] font-extrabold tracking-[-1.5px] sm:text-[38px]">
                  Good morning, {firstName}
                  <span className="ml-2">
                    ✳
                  </span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  Here’s what’s happening across
                  your workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={openProjectModal}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-[13px] font-semibold text-white shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-accent-hover"
              >
                <Plus size={17} />
                New project
              </button>
            </motion.div>

            {successMessage && (
              <div role="status" aria-live="polite" className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                <CircleCheck size={17} aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Stats */}
            <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total projects",
                  value: projectsError ? "—" : projectsLoading ? "…" : projectList.length,
                  change: projectsError ? "Unavailable" : "From workspace",
                  icon: FolderKanban,
                  color: "#8B7CFF",
                  bg: "#EEEDFF",
                },
                {
                  label: "Upcoming deadlines",
                  value: projectsError ? "—" : projectsLoading ? "…" : upcomingDeadlines,
                  change: projectsError ? "Unavailable" : "Next 30 days",
                  icon: CalendarDays,
                  color: "#54A88B",
                  bg: "#E5F5EE",
                },
                {
                  label: "Active projects",
                  value: projectsError ? "—" : projectsLoading ? "…" : activeProjects,
                  change: projectsError ? "Unavailable" : "Status: active",
                  icon: Activity,
                  color: "#D59B4D",
                  bg: "#FFF2DE",
                },
                {
                  label: "Archived projects",
                  value: projectsError ? "—" : projectsLoading ? "…" : archivedProjects,
                  change: projectsError ? "Unavailable" : "Workspace history",
                  icon: CircleCheck,
                  color: "#7298D6",
                  bg: "#EAF1FC",
                },
              ].map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.label}
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.08,
                      duration: 0.4,
                    }}
                    className="rounded-2xl border border-line bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-panel dark:border-white/[0.08] dark:bg-[#1B1B1E]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-muted">
                        {stat.label}
                      </span>

                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background:
                            stat.bg,
                          color:
                            stat.color,
                        }}
                      >
                        <Icon size={17} />
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <p className="font-display text-[32px] font-extrabold tracking-[-1.5px]">
                        {stat.value}
                      </p>

                      <span className="mb-1 text-[10px] font-semibold text-muted">
                        {stat.change}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Projects + Activity */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* Projects */}
              <section id="project-management" className="min-w-0 scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1B1E] sm:p-7">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <SectionHeading
                      title="Your projects"
                      action="View all"
                      onAction={() =>
                        setActive(
                          "Projects"
                        )
                      }
                    />

                    <p className="-mt-3 text-xs text-muted">
                      Live projects from your
                      OpsFlow workspace.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor="project-status-filter">Filter projects by status</label>
                    <select
                      id="project-status-filter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-10 max-w-[145px] rounded-lg border border-line bg-transparent px-2 text-xs text-muted outline-none focus:border-accent dark:border-white/10"
                    >
                      <option value="ALL">All statuses</option>
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On hold</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setProjectReloadKey((key) => key + 1)}
                      disabled={projectsLoading}
                      className="rounded-xl border border-line p-2.5 text-muted transition hover:bg-canvas disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                      aria-label="Refresh projects"
                      title="Refresh projects"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                {projectsLoading ? (
                  <div className="rounded-xl border border-dashed border-line p-10 text-center dark:border-white/10">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />

                    <p className="text-sm font-semibold">
                      Loading projects...
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Syncing your workspace
                      with Django.
                    </p>
                  </div>
                ) : projectsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Could not load projects
                    </p>

                    <p className="mt-2 text-xs leading-5 text-red-600/80 dark:text-red-300/70">
                      {projectsError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setProjectReloadKey((key) => key + 1)}
                      className="mt-4 text-xs font-semibold text-red-700 underline underline-offset-2 dark:text-red-300"
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
                      {searchQuery || statusFilter !== "ALL"
                        ? "No matching projects"
                        : "No projects yet"}
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted">
                      {searchQuery || statusFilter !== "ALL"
                        ? "Try another project name, code or status."
                        : "Your workspace does not have any projects yet. Create your first project to see it here."}
                    </p>

                    {(searchQuery || statusFilter !== "ALL") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }}
                        className="mt-4 text-xs font-semibold text-accent hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredProjects.map(
                      (
                        project,
                        index
                      ) => (
                        <motion.button
                          type="button"
                          key={
                            project.id
                          }
                          onClick={() => setSelectedProject(project)}
                          initial={{
                            opacity: 0,
                            x: -10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            delay:
                              0.1 +
                              index *
                                0.08,
                          }}
                          className="group block w-full text-left"
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold"
                              style={{
                                background: `${project.color}18`,
                                color:
                                  project.color,
                              }}
                            >
                              {project.code || <FolderKanban size={16} aria-label="No project code" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold">
                                {project.name}
                              </p>

                              <p className="mt-1 truncate text-[11px] text-muted">
                                {project.status?.replaceAll("_", " ") || "No status"}
                                {project.priority ? ` · ${project.priority.toLowerCase()} priority` : ""}

                                {project.due_date
                                  ? ` • Due ${new Date(
                                      project.due_date
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )}`
                                  : ""}
                              </p>
                            </div>

                            <span className="text-[11px] font-semibold text-muted">
                              {project.is_archived
                                ? "Archived"
                                : project.organization_name || "Workspace"}
                            </span>
                          </div>
                        </motion.button>
                      )
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={openProjectModal}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3.5 text-xs font-semibold text-muted transition hover:border-accent hover:bg-[#F8F7FF] hover:text-accent dark:border-white/10 dark:hover:bg-white/[0.04]"
                >
                  <Plus size={15} />
                  Create new project
                </button>
              </section>

              {/* Activity */}
              <section id="workspace-activity" className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1B1E] sm:p-7">
                <SectionHeading
                  title="Recent activity"
                  action="View tasks"
                  onAction={() => document.getElementById("task-management")?.scrollIntoView({ behavior: "smooth" })}
                />

                {activityLoading ? <p className="py-8 text-center text-xs text-muted">Loading workspace activity…</p> : activityError ? (
                  <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-700 dark:text-red-200">{activityError}<button type="button" onClick={() => setActivityReloadKey((key) => key + 1)} className="ml-2 font-bold underline underline-offset-2">Try again</button></div>
                ) : workspaceActivity.length ? (
                  <ol className="divide-y divide-line dark:divide-white/[0.07]">
                    {workspaceActivity.slice(0, 6).map((item) => <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Activity size={14} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{item.description || item.action}</p>
                        <p className="mt-1 truncate text-[10px] text-muted">{item.actor_name || "OpsFlow"} · {item.task_title} · {item.project_name}</p>
                        <time className="mt-1 block text-[10px] text-muted">{new Date(item.created_at).toLocaleString()}</time>
                      </div>
                    </li>)}
                  </ol>
                ) : <div className="rounded-xl border border-dashed border-line px-5 py-8 text-center dark:border-white/10"><Activity size={22} className="mx-auto mb-3 text-muted" /><p className="text-xs font-semibold">No activity yet</p><p className="mt-1 text-[11px] text-muted">Task creation, comments, and status updates will appear here.</p></div>}
              </section>
            </div>

            {/* Tasks */}
            <section id="task-management" className="mt-7 scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-white shadow-soft dark:border-white/[0.08] dark:bg-[#1B1B1E]">
              <div className="flex flex-col gap-4 border-b border-line p-5 dark:border-white/10 sm:px-7 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[15px] font-bold tracking-[-0.4px]">Task board</h2>
                    <p className="mt-1.5 text-xs text-muted">Live assignments and workflow across your workspace.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCreateTaskError(""); setTaskModalOpen(true); }}
                    disabled={creatableProjects.length === 0}
                    title={creatableProjects.length ? "Create task" : "You need a manager role on a project to create tasks"}
                    className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Plus size={15} /> New task
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div role="group" aria-label="Task ownership filter" className="inline-flex w-fit rounded-lg border border-line p-1 dark:border-white/10">
                    <button type="button" aria-pressed={taskScope === "MINE"} onClick={() => setTaskScope("MINE")} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${taskScope === "MINE" ? "bg-accent text-white" : "text-muted hover:text-ink dark:hover:text-white"}`}>Assigned to me</button>
                    <button type="button" aria-pressed={taskScope === "ALL"} onClick={() => setTaskScope("ALL")} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${taskScope === "ALL" ? "bg-accent text-white" : "text-muted hover:text-ink dark:hover:text-white"}`}>All tasks</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor="task-project-filter">Filter tasks by project</label>
                    <select id="task-project-filter" value={taskProjectFilter} onChange={(event) => setTaskProjectFilter(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-transparent px-3 text-xs text-muted outline-none focus:border-accent dark:border-white/10 sm:max-w-56">
                      <option value="ALL">All projects</option>
                      {projects.filter((project) => !project.is_archived).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                    <label className="sr-only" htmlFor="task-status-filter">Filter tasks by status</label>
                    <select id="task-status-filter" value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-transparent px-2 text-xs text-muted outline-none focus:border-accent dark:border-white/10 sm:max-w-36">
                      <option value="ALL">All statuses</option>{taskColumns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}
                    </select>
                    <label className="sr-only" htmlFor="task-priority-filter">Filter tasks by priority</label>
                    <select id="task-priority-filter" value={taskPriorityFilter} onChange={(event) => setTaskPriorityFilter(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-transparent px-2 text-xs text-muted outline-none focus:border-accent dark:border-white/10 sm:max-w-32">
                      <option value="ALL">All priorities</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                    </select>
                    <button type="button" onClick={() => setTaskReloadKey((key) => key + 1)} disabled={tasksLoading} aria-label="Refresh tasks" title="Refresh tasks" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-canvas disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"><RefreshCw size={15} /></button>
                  </div>
                </div>
                {taskSuccess && <div role="status" aria-live="polite" className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">{taskSuccess}</div>}
              </div>

              {tasksLoading ? <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />Loading tasks from your workspace…</div> : tasksError ? (
                <div role="alert" className="m-5 rounded-xl border border-red-300/30 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/[0.07] dark:text-red-200">
                  <p className="font-semibold">Tasks could not be loaded</p><p className="mt-1 text-xs">{tasksError}</p>
                  <button type="button" onClick={() => setTaskReloadKey((key) => key + 1)} className="mt-3 text-xs font-bold underline underline-offset-2">Try again</button>
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                  <CheckSquare size={28} className="mb-4 text-muted" />
                  <p className="text-sm font-semibold">{taskScope === "MINE" ? "No tasks assigned to you" : "No tasks in this view"}</p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-muted">{taskScope === "MINE" ? "Switch to all tasks to see your team’s work, or create a task for an eligible project." : "Create a task to start tracking project work."}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {taskScope === "MINE" && <button type="button" onClick={() => setTaskScope("ALL")} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted hover:bg-canvas dark:border-white/10 dark:hover:bg-white/5">See all tasks</button>}
                    {creatableProjects.length > 0 && <button type="button" onClick={() => setTaskModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover"><Plus size={14} />Create task</button>}
                  </div>
                  {taskScope === "ALL" && creatableProjects.length === 0 && <p className="mt-3 text-[11px] text-muted">A project manager can create tasks in this workspace.</p>}
                </div>
              ) : (
                <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-5">
                  {taskColumns.map((column) => {
                    const Icon = column.icon;
                    const columnTasks = activeTasks.filter((task) => task.status === column.status);
                    return <section key={column.status} aria-label={`${column.label} tasks`} className="min-w-0 rounded-xl bg-[#F5F5F3] p-3 dark:bg-white/[0.025]">
                      <header className="mb-3 flex items-center justify-between px-1">
                        <h3 className="flex items-center gap-2 text-xs font-bold text-ink dark:text-white"><Icon size={15} className={column.status === "BLOCKED" ? "text-red-500" : "text-muted"} />{column.label}</h3>
                        <span className="text-[10px] font-semibold text-muted">{columnTasks.length}</span>
                      </header>
                      <div className="space-y-2">
                        {columnTasks.map((task) => {
                          const dueDate = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null;
                          const isOverdue = dueDate && dueDate < new Date(new Date().setHours(0, 0, 0, 0)) && task.status !== "DONE";
                          return <motion.button key={task.id} type="button" onClick={() => setSelectedTask(task)} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} className="w-full rounded-lg border border-line bg-white p-3 text-left shadow-sm transition hover:border-accent/40 hover:shadow-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:border-white/[0.08] dark:bg-[#202023]">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <span className="line-clamp-2 text-xs font-semibold leading-5 text-ink dark:text-white">{task.title}</span>
                              {task.priority === "CRITICAL" && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300">URGENT</span>}
                            </div>
                            <p className="truncate text-[10px] text-muted">{task.project_name}{task.code ? ` · ${task.code}` : ""}</p>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <span className={`text-[10px] font-semibold ${task.priority === "HIGH" || task.priority === "CRITICAL" ? "text-amber-700 dark:text-amber-300" : "text-muted"}`}>{task.priority?.toLowerCase() || "normal"}</span>
                              <span className={`text-[10px] ${isOverdue ? "font-bold text-red-600 dark:text-red-300" : "text-muted"}`}>{dueDate ? `${isOverdue ? "Overdue · " : "Due "}${dueDate.toLocaleDateString()}` : "No due date"}</span>
                            </div>
                            {task.assigned_to_email && <p className="mt-2 truncate border-t border-line pt-2 text-[10px] text-muted dark:border-white/[0.07]">{task.assigned_to_email}</p>}
                          </motion.button>;
                        })}
                        {columnTasks.length === 0 && <p className="rounded-lg border border-dashed border-line px-3 py-5 text-center text-[10px] text-muted dark:border-white/10">No tasks</p>}
                      </div>
                    </section>;
                  })}
                </div>
              )}
            </section>

            {/* Footer */}
            <footer className="flex flex-col items-center justify-between gap-2 py-8 text-[10px] text-muted sm:flex-row">
              <p>
                © 2026 OpsFlow. Built for teams
                that get things done.
              </p>

              <p>Project data is provided by the Django API.</p>
            </footer>
          </div>
        </main>
      </div>
      <Suspense fallback={<div role="status" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 text-sm text-white">Opening workspace…</div>}>
        {projectModalOpen && <ProjectModal
          open
          onClose={() => setProjectModalOpen(false)}
          onSubmit={handleCreateProject}
          loading={creatingProject}
          error={createProjectError}
                      organizations={manageableOrganizations}
          organizationsLoading={organizationsLoading}
          organizationsError={organizationsError}
        />}
        {taskModalOpen && <TaskModal
          open
          onClose={() => setTaskModalOpen(false)}
          onSubmit={handleCreateTask}
          projects={creatableProjects}
          loading={creatingTask}
          error={createTaskError}
        />}
        {selectedProject && <ProjectDetailsModal
          key={selectedProject.id}
          project={selectedProject}
          organization={organizations.find((organization) => organization.id === selectedProject.organization_pk)}
          canManage={canManageProject(selectedProject)}
          canManageOrganization={canManageOrganization(organizations.find((organization) => organization.id === selectedProject.organization_pk))}
          canGrantAdmin={organizations.find((organization) => organization.id === selectedProject.organization_pk)?.current_user_role === "OWNER"}
          onClose={() => setSelectedProject(null)}
          onSave={handleSaveProject}
          onAddMember={handleAddProjectMember}
          onRemoveMember={handleRemoveProjectMember}
          onDelete={handleDeleteProject}
          onAddOrganizationMember={handleAddOrganizationMember}
          onUpdateOrganizationMember={handleUpdateOrganizationMember}
          onRemoveOrganizationMember={handleRemoveOrganizationMember}
        />}
        {selectedTask && <TaskDetailsModal
          key={selectedTask.id}
          task={selectedTask}
          project={selectedTaskProject}
          canManage={canManageProject(selectedTaskProject)}
          canChangeStatus={Boolean(canChangeSelectedTask)}
          userId={user?.id}
          onClose={closeTaskDetails}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />}
      </Suspense>
    </div>
  );
}

export default App;