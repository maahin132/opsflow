import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  CheckSquare,
  ChevronRight,
  FolderKanban,
  Home,
  LoaderCircle,
  Users,
} from "lucide-react";

import organizationService from "../services/organizationService";
import projectService from "../services/projectService";
import taskService from "../services/taskService";
import { formatDate, formatDateTime } from "../utils/dateFormat";

const ORGANIZATION_ROLES = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
  MEMBER: "Member",
};

function getErrorMessage(error) {
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

  return error?.message || "Something went wrong. Please try again.";
}

function getInitials(value) {
  const parts = String(value || "")
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

function displayValue(value) {
  return String(value || "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SectionMessage({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
      <Icon size={22} className="text-muted dark:text-white/35" />
      <h3 className="mt-3 text-sm font-semibold text-ink dark:text-white">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted dark:text-white/45">
        {description}
      </p>
    </div>
  );
}

function SectionError({ message }) {
  return (
    <p role="alert" className="m-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger dark:border-danger/20 dark:bg-danger/10 dark:text-[#d8aaa4]">
      {message}
    </p>
  );
}

function TeamMember() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadMemberDetails = async () => {
      setLoading(true);
      setError("");
      setSectionErrors({});
      setMember(null);
      setWorkspaces([]);
      setProjects([]);
      setTasks([]);
      setActivities([]);

      const parsedMemberId = Number(memberId);
      if (!Number.isInteger(parsedMemberId) || parsedMemberId <= 0) {
        setLoading(false);
        return;
      }

      try {
        const organizations = await organizationService.getOrganizations();
        if (cancelled) return;

        const memberships = organizations.flatMap((organization) => {
          const organizationMember = (organization.members ?? []).find(
            (item) => String(item.user_id) === String(parsedMemberId)
          );

          return organizationMember
            ? [{ organization, member: organizationMember }]
            : [];
        });

        if (memberships.length === 0) {
          setLoading(false);
          return;
        }

        setMember(memberships[0].member);
        setWorkspaces(
          memberships.map(({ organization, member: organizationMember }) => ({
            id: organization.id,
            name: organization.name,
            role: organizationMember.role,
          }))
        );

        const [projectsResult, tasksResult, activitiesResult] =
          await Promise.allSettled([
            projectService.getProjects(),
            taskService.getTasks({ assigned_to: parsedMemberId }),
            taskService.getWorkspaceActivity(),
          ]);

        if (cancelled) return;

        const nextSectionErrors = {};
        const organizationIds = new Set(
          memberships.map(({ organization }) => String(organization.id))
        );

        if (projectsResult.status === "fulfilled") {
          const memberProjects = projectsResult.value.filter((project) => {
            const belongsToMember =
              String(project.owner) === String(parsedMemberId) ||
              (project.members ?? []).some(
                (projectMember) =>
                  String(projectMember.user) === String(parsedMemberId)
              );

            return (
              organizationIds.has(String(project.organization_pk)) &&
              belongsToMember
            );
          });
          setProjects(memberProjects);
        } else {
          nextSectionErrors.projects = getErrorMessage(projectsResult.reason);
        }

        if (tasksResult.status === "fulfilled") {
          setTasks(
            tasksResult.value.filter(
              (task) => String(task.assigned_to) === String(parsedMemberId)
            )
          );
        } else {
          nextSectionErrors.tasks = getErrorMessage(tasksResult.reason);
        }

        if (activitiesResult.status === "fulfilled") {
          setActivities(
            activitiesResult.value.filter(
              (activity) => String(activity.actor) === String(parsedMemberId)
            )
          );
        } else {
          nextSectionErrors.activities = getErrorMessage(activitiesResult.reason);
        }

        setSectionErrors(nextSectionErrors);
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMemberDetails();

    return () => {
      cancelled = true;
    };
  }, [memberId, reloadKey]);

  const memberName = member?.username || member?.email || "Team member";

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-[#24211E] dark:text-white">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="mb-7">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/app/team")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-muted transition hover:bg-stone-100 hover:text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to Team
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/dashboard")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-muted transition hover:bg-stone-100 hover:text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <Home size={14} />
              Home
            </button>
            <ChevronRight size={13} aria-hidden="true" className="text-muted/60 dark:text-white/25" />
            <button
              type="button"
              onClick={() => navigate("/app/dashboard")}
              className="text-xs font-medium text-muted transition hover:text-ink dark:text-white/40 dark:hover:text-white"
            >
              Dashboard
            </button>
            <ChevronRight size={13} aria-hidden="true" className="text-muted/60 dark:text-white/25" />
            <button
              type="button"
              onClick={() => navigate("/app/team")}
              className="text-xs font-medium text-muted transition hover:text-ink dark:text-white/40 dark:hover:text-white"
            >
              Team
            </button>
            <ChevronRight size={13} aria-hidden="true" className="text-muted/60 dark:text-white/25" />
            <span aria-current="page" className="text-xs font-semibold text-ink dark:text-white/75">
              Member
            </span>
          </nav>

          {member && (
            <div className="flex flex-col gap-4 border-b border-line pb-6 dark:border-white/[0.08] sm:flex-row sm:items-center">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-accent-soft text-base font-bold text-accent-strong dark:border-white/10 dark:bg-[#3B342E] dark:text-[#d2bdac]">
                {getInitials(memberName)}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted dark:text-white/40">
                  Team member
                </p>
                <h1 className="mt-1 truncate font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
                  {memberName}
                </h1>
                <p className="mt-1 truncate text-sm text-muted dark:text-white/45">
                  {member.email || "No email provided"}
                </p>
              </div>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-muted dark:text-white/45">
            <LoaderCircle size={18} className="animate-spin" />
            Loading member details...
          </div>
        ) : error ? (
          <section role="alert" className="rounded-panel border border-danger/20 bg-danger-soft p-5 dark:border-danger/20 dark:bg-danger/10">
            <h1 className="text-sm font-semibold text-danger dark:text-[#d8aaa4]">Could not load member details</h1>
            <p className="mt-1 text-xs leading-5 text-danger/80 dark:text-[#d8aaa4]">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-3 text-xs font-semibold text-danger underline underline-offset-2"
            >
              Try again
            </button>
          </section>
        ) : !member ? (
          <SectionMessage
            icon={Users}
            title="Member not found"
            description="This person is not a member of a workspace you can access."
          />
        ) : (
          <>
            <section aria-labelledby="workspaces-heading" className="mb-5 rounded-panel border border-line bg-surface p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.025] sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users size={16} className="text-accent-strong dark:text-[#cdb8a8]" />
                <h2 id="workspaces-heading" className="text-sm font-semibold text-ink dark:text-white">
                  Workspaces and roles
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                    <span className="truncate text-xs font-semibold text-ink dark:text-white">
                      {workspace.name}
                    </span>
                    <span className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent-strong dark:bg-[#3B342E] dark:text-[#d2bdac]">
                      {ORGANIZATION_ROLES[workspace.role] || workspace.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section aria-labelledby="member-projects-heading" className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-center justify-between border-b border-line px-4 py-4 dark:border-white/10 sm:px-5">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={16} className="text-accent-strong dark:text-[#cdb8a8]" />
                    <h2 id="member-projects-heading" className="text-sm font-semibold text-ink dark:text-white">
                      Projects
                    </h2>
                  </div>
                  <span className="text-xs text-muted dark:text-white/40">{projects.length}</span>
                </div>
                {sectionErrors.projects ? (
                  <SectionError message={sectionErrors.projects} />
                ) : projects.length === 0 ? (
                  <SectionMessage
                    icon={FolderKanban}
                    title="No project associations"
                    description="No accessible projects list this person as the owner or a project member."
                  />
                ) : (
                  <ul className="divide-y divide-line dark:divide-white/10">
                    {projects.map((project) => (
                      <li key={project.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/app/projects/${project.id}`)}
                          className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas/70 dark:hover:bg-white/[0.03] sm:px-5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:bg-[#3B342E] dark:text-[#d2bdac]">
                            <FolderKanban size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink dark:text-white">
                              {project.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted dark:text-white/45">
                              {project.organization_name}
                              {project.code ? ` · ${project.code}` : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[10px] font-semibold text-muted dark:text-white/50">
                              {displayValue(project.status)}
                            </span>
                            <span className="mt-1 block text-[10px] text-muted/80 dark:text-white/35">
                              {project.is_archived ? "Archived" : formatDate(project.due_date, "No due date")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="member-tasks-heading" className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-center justify-between border-b border-line px-4 py-4 dark:border-white/10 sm:px-5">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-accent-strong dark:text-[#cdb8a8]" />
                    <h2 id="member-tasks-heading" className="text-sm font-semibold text-ink dark:text-white">
                      Assigned tasks
                    </h2>
                  </div>
                  <span className="text-xs text-muted dark:text-white/40">{tasks.length}</span>
                </div>
                {sectionErrors.tasks ? (
                  <SectionError message={sectionErrors.tasks} />
                ) : tasks.length === 0 ? (
                  <SectionMessage
                    icon={CheckSquare}
                    title="No assigned tasks"
                    description="There are no tasks assigned to this member in the workspaces you can access."
                  />
                ) : (
                  <ul className="divide-y divide-line dark:divide-white/10">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45">
                          <CheckSquare size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink dark:text-white">
                            {task.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted dark:text-white/45">
                            {task.project_name}
                            {task.code ? ` · ${task.code}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[10px] font-semibold text-muted dark:text-white/50">
                            {displayValue(task.status)}
                          </span>
                          <span className="mt-1 block text-[10px] text-muted/80 dark:text-white/35">
                            {task.is_archived ? "Archived" : formatDate(task.due_date, "No due date")}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="member-activity-heading" className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025] xl:col-span-2">
                <div className="flex items-center justify-between border-b border-line px-4 py-4 dark:border-white/10 sm:px-5">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-accent-strong dark:text-[#cdb8a8]" />
                    <h2 id="member-activity-heading" className="text-sm font-semibold text-ink dark:text-white">
                      Activity by {memberName}
                    </h2>
                  </div>
                  <span className="text-xs text-muted dark:text-white/40">{activities.length}</span>
                </div>
                {sectionErrors.activities ? (
                  <SectionError message={sectionErrors.activities} />
                ) : activities.length === 0 ? (
                  <SectionMessage
                    icon={Activity}
                    title="No activity found"
                    description="No workspace activity by this member is available."
                  />
                ) : (
                  <ol className="divide-y divide-line dark:divide-white/10">
                    {activities.map((activity) => (
                      <li key={activity.id} className="flex min-w-0 items-start gap-3 px-4 py-4 sm:px-5">
                        <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong dark:bg-[#3B342E] dark:text-[#d2bdac]">
                          <Activity size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-5 text-ink dark:text-white/80">
                            {activity.description || displayValue(activity.action)}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted dark:text-white/40">
                            {activity.project_name}
                            {activity.task_title ? ` · ${activity.task_title}` : ""}
                          </p>
                        </div>
                        <time dateTime={activity.created_at} className="shrink-0 text-right text-[10px] text-muted dark:text-white/40">
                          {formatDateTime(activity.created_at)}
                        </time>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default TeamMember;
