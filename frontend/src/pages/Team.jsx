import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Home,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import organizationService from "../services/organizationService";

const ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MEMBER", label: "Member" },
];

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

function canManageOrganization(organization) {
  return ["OWNER", "ADMIN"].includes(organization?.current_user_role);
}

function canManageMember(organization, member) {
  if (!canManageOrganization(organization) || member.role === "OWNER") {
    return false;
  }

  return member.role !== "ADMIN" || organization.current_user_role === "OWNER";
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

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

function Team() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");
  const [addingMember, setAddingMember] = useState(false);
  const [memberActionId, setMemberActionId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await organizationService.getOrganizations();

        if (!cancelled) {
          setOrganizations(data);
          setSelectedOrganizationId((currentId) => {
            if (data.some((organization) => String(organization.id) === currentId)) {
              return currentId;
            }

            return data[0] ? String(data[0].id) : "";
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setOrganizations([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const organization = organizations.find(
    (item) => String(item.id) === selectedOrganizationId
  );
  const members = organization?.members ?? [];
  const managerCanManage = canManageOrganization(organization);
  const assignableRoles = ROLE_OPTIONS.filter(
    (option) =>
      option.value !== "OWNER" &&
      (organization?.current_user_role === "OWNER" || option.value !== "ADMIN")
  );

  const query = search.trim().toLowerCase();
  const filteredMembers = members.filter((member) => {
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    const matchesSearch =
      !query ||
      [member.username, member.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

    return matchesRole && matchesSearch;
  });

  const updateOrganizationMember = (organizationId, updatedMember) => {
    setOrganizations((current) =>
      current.map((item) =>
        item.id === organizationId
          ? {
              ...item,
              members: (item.members ?? []).map((member) =>
                String(member.user_id) === String(updatedMember.user_id)
                  ? updatedMember
                  : member
              ),
            }
          : item
      )
    );
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!organization || !email.trim()) return;

    setAddingMember(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const addedMember = await organizationService.addMember(
        organization.id,
        email.trim(),
        newMemberRole
      );

      setOrganizations((current) =>
        current.map((item) =>
          item.id === organization.id
            ? {
                ...item,
                members: [...(item.members ?? []), addedMember],
                member_count: Number(item.member_count || 0) + 1,
              }
            : item
        )
      );
      setEmail("");
      setAddMemberOpen(false);
      setSuccessMessage(`${addedMember.username} was added to the workspace.`);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (member, role) => {
    if (!organization || !canManageMember(organization, member)) return;

    setMemberActionId(String(member.user_id));
    setActionError("");
    setSuccessMessage("");

    try {
      const updatedMember = await organizationService.updateMemberRole(
        organization.id,
        member.user_id,
        role
      );
      updateOrganizationMember(organization.id, updatedMember);
      setSuccessMessage(`${updatedMember.username}'s role was updated.`);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setMemberActionId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!organization || !canManageMember(organization, member)) return;

    const confirmed = window.confirm(
      `Remove ${member.username} from ${organization.name}? This also removes their project memberships and unassigns their tasks in this workspace.`
    );
    if (!confirmed) return;

    setMemberActionId(String(member.user_id));
    setActionError("");
    setSuccessMessage("");

    try {
      await organizationService.removeMember(organization.id, member.user_id);
      setOrganizations((current) =>
        current.map((item) =>
          item.id === organization.id
            ? {
                ...item,
                members: (item.members ?? []).filter(
                  (itemMember) =>
                    String(itemMember.user_id) !== String(member.user_id)
                ),
                member_count: Math.max(0, Number(item.member_count || 0) - 1),
              }
            : item
        )
      );
      setSuccessMessage(`${member.username} was removed from the workspace.`);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setMemberActionId(null);
    }
  };

  const closeAddMember = () => {
    setAddMemberOpen(false);
    setEmail("");
    setNewMemberRole("MEMBER");
    setActionError("");
  };

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-[#24211E] dark:text-white">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="mb-7">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/app/dashboard")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-muted transition hover:bg-stone-100 hover:text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
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
            <span aria-current="page" className="text-xs font-semibold text-ink dark:text-white/75">
              Team
            </span>
          </nav>

          <div className="flex flex-col gap-5 border-b border-line pb-6 dark:border-white/[0.08] sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-accent-strong shadow-soft dark:border-white/10 dark:bg-white/[0.03] dark:text-[#cdb8a8]">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted dark:text-white/40">
                  Workspace team
                </p>
                <h1 className="mt-1 truncate font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
                  {organization?.name || "Team"}
                </h1>
                <p className="mt-1 text-sm text-muted dark:text-white/45">
                  Manage workspace members and their roles.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {organizations.length > 1 && (
                <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/45">
                  Workspace
                  <select
                    aria-label="Select workspace"
                    value={selectedOrganizationId}
                    onChange={(event) => {
                      setSelectedOrganizationId(event.target.value);
                      setActionError("");
                      setSuccessMessage("");
                    }}
                    className="h-10 min-w-48 rounded-lg border border-line bg-surface px-3 text-sm font-medium normal-case tracking-normal text-ink outline-none focus:border-accent dark:border-white/10 dark:bg-[#2B2825] dark:text-white"
                  >
                    {organizations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex items-center gap-3">
                <div className="min-w-28 rounded-lg border border-line bg-surface px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted dark:text-white/40">
                    Members
                  </p>
                  <p className="mt-0.5 text-lg font-semibold leading-5 text-ink dark:text-white">
                    {loading ? "..." : organization?.member_count ?? 0}
                  </p>
                </div>
                {managerCanManage && (
                  <button
                    type="button"
                    onClick={() => {
                      if (addMemberOpen) {
                        closeAddMember();
                      } else {
                        setActionError("");
                        setAddMemberOpen(true);
                      }
                    }}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sidebar px-4 text-sm font-semibold text-white transition hover:bg-[#302c28] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-[#24211E] dark:hover:bg-white/90"
                    title="Add a workspace member"
                  >
                    {addMemberOpen ? <X size={16} /> : <Plus size={16} />}
                    <span>{addMemberOpen ? "Close" : "Add member"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {successMessage && (
          <div role="status" aria-live="polite" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-success/20 bg-success-soft px-4 py-3 text-sm text-success dark:border-success/20 dark:bg-success/10 dark:text-[#c2d2c3]">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
              className="rounded p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {actionError && (
          <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger dark:border-danger/20 dark:bg-danger/10 dark:text-[#d8aaa4]">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Dismiss error"
              className="rounded p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {addMemberOpen && managerCanManage && organization && (
          <section aria-labelledby="add-member-heading" className="mb-5 rounded-panel border border-line bg-surface p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.025] sm:p-6">
            <div className="mb-4">
              <h2 id="add-member-heading" className="text-sm font-semibold text-ink dark:text-white">
                Add a workspace member
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted dark:text-white/45">
                Enter the email of an existing OpsFlow user. This does not send an invitation.
              </p>
            </div>
            <form onSubmit={handleAddMember} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
              <label className="grid gap-1.5 text-xs font-semibold text-ink dark:text-white/75">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  disabled={addingMember}
                  className="h-10 min-w-0 rounded-lg border border-line bg-canvas px-3 text-sm font-normal text-ink outline-none placeholder:text-muted/70 focus:border-accent disabled:opacity-60 dark:border-white/10 dark:bg-[#24211E] dark:text-white dark:placeholder:text-white/30"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-ink dark:text-white/75">
                Organization role
                <select
                  value={newMemberRole}
                  onChange={(event) => setNewMemberRole(event.target.value)}
                  disabled={addingMember}
                  className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm font-normal text-ink outline-none focus:border-accent disabled:opacity-60 dark:border-white/10 dark:bg-[#24211E] dark:text-white"
                >
                  {assignableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={addingMember || !email.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sidebar px-4 text-sm font-semibold text-white transition hover:bg-[#302c28] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#24211E] dark:hover:bg-white/90"
              >
                {addingMember ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
                Add member
              </button>
            </form>
          </section>
        )}

        <section aria-labelledby="members-heading" className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025]">
          <div className="flex flex-col gap-3 border-b border-line p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 id="members-heading" className="text-sm font-semibold text-ink dark:text-white">
                Workspace members
              </h2>
              <p className="mt-1 text-xs text-muted dark:text-white/40">
                {loading ? "Loading members..." : `${filteredMembers.length} shown of ${organization?.member_count ?? 0}`}
                {organization?.current_user_role && ` · Your role: ${getRoleLabel(organization.current_user_role)}`}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
              <label className="relative min-w-0 sm:w-64">
                <span className="sr-only">Search members</span>
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-white/35" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email"
                  className="h-10 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent dark:border-white/10 dark:bg-[#24211E] dark:text-white dark:placeholder:text-white/30"
                />
              </label>
              <label className="sr-only" htmlFor="member-role-filter">Filter by organization role</label>
              <select
                id="member-role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent dark:border-white/10 dark:bg-[#24211E] dark:text-white"
              >
                <option value="ALL">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                disabled={loading}
                aria-label="Refresh members"
                title="Refresh members"
                className="hidden h-10 w-10 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-canvas disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/[0.05] sm:inline-flex"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted dark:text-white/45">
              <LoaderCircle size={18} className="animate-spin" />
              Loading workspace members...
            </div>
          ) : error ? (
            <div className="m-5 rounded-lg border border-danger/20 bg-danger-soft p-5 dark:border-danger/20 dark:bg-danger/10">
              <p className="text-sm font-semibold text-danger dark:text-[#d8aaa4]">Could not load team members</p>
              <p className="mt-1 text-xs leading-5 text-danger/80 dark:text-[#d8aaa4]">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="mt-3 text-xs font-semibold text-danger underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : !organization ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Users size={24} className="text-muted dark:text-white/35" />
              <h3 className="mt-4 text-sm font-semibold text-ink dark:text-white">No workspace found</h3>
              <p className="mt-2 max-w-sm text-xs leading-5 text-muted dark:text-white/45">
                Your account is not a member of any workspace yet.
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Users size={24} className="text-muted dark:text-white/35" />
              <h3 className="mt-4 text-sm font-semibold text-ink dark:text-white">No members in this workspace</h3>
              <p className="mt-2 max-w-sm text-xs leading-5 text-muted dark:text-white/45">
                {managerCanManage ? "Add an existing OpsFlow user to get this team started." : "Workspace members will appear here."}
              </p>
              {managerCanManage && (
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(true)}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-sidebar px-3 text-xs font-semibold text-white dark:bg-white dark:text-[#24211E]"
                >
                  <Plus size={14} />
                  Add member
                </button>
              )}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
              <Search size={21} className="text-muted dark:text-white/35" />
              <h3 className="mt-3 text-sm font-semibold text-ink dark:text-white">No matching members</h3>
              <p className="mt-1 text-xs text-muted dark:text-white/45">Change the search or role filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                }}
                className="mt-3 text-xs font-semibold text-accent-strong underline underline-offset-2 dark:text-[#cdb8a8]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div role="table" aria-label={`${organization.name} members`}>
              <div role="row" className={`hidden border-b border-line bg-canvas/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted dark:border-white/10 dark:bg-white/[0.02] dark:text-white/40 md:grid ${managerCanManage ? "md:grid-cols-[minmax(0,1fr)_190px_150px]" : "md:grid-cols-[minmax(0,1fr)_190px]"}`}>
                <span role="columnheader">Member</span>
                <span role="columnheader">Organization role</span>
                {managerCanManage && <span role="columnheader" className="text-right">Actions</span>}
              </div>
              <div className="divide-y divide-line dark:divide-white/10">
                {filteredMembers.map((member) => {
                  const name = member.username || member.email || "Workspace member";
                  const canEditMember = canManageMember(organization, member);
                  const memberBusy = memberActionId === String(member.user_id);

                  return (
                    <div
                      role="row"
                      key={member.id}
                      className={`grid gap-3 px-4 py-4 sm:px-5 md:items-center ${managerCanManage ? "md:grid-cols-[minmax(0,1fr)_190px_150px]" : "md:grid-cols-[minmax(0,1fr)_190px]"}`}
                    >
                      <div role="cell" className="flex min-w-0 items-center gap-3">
                        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-accent-soft text-xs font-bold text-accent-strong dark:border-white/10 dark:bg-[#3B342E] dark:text-[#d2bdac]">
                          {getInitials(name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink dark:text-white">
                            <button
                              type="button"
                              onClick={() => navigate(`/app/team/${member.user_id}`)}
                              className="text-left hover:underline hover:underline-offset-2"
                            >
                              {name}
                            </button>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted dark:text-white/45">{member.email || "No email provided"}</p>
                        </div>
                      </div>

                      <div role="cell" className="flex items-center gap-2 pl-[52px] md:pl-0">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted md:hidden">Role</span>
                        {canEditMember ? (
                          <label className="sr-only" htmlFor={`member-role-${member.user_id}`}>
                            Organization role for {name}
                          </label>
                        ) : null}
                        {canEditMember ? (
                          <select
                            id={`member-role-${member.user_id}`}
                            value={member.role}
                            disabled={memberBusy}
                            onChange={(event) => handleRoleChange(member, event.target.value)}
                            className="h-9 min-w-32 rounded-lg border border-line bg-canvas px-2.5 text-xs font-semibold text-ink outline-none focus:border-accent disabled:opacity-55 dark:border-white/10 dark:bg-[#24211E] dark:text-white"
                          >
                            {assignableRoles.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex h-8 items-center rounded-md border border-line bg-canvas px-2.5 text-xs font-semibold text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                            {getRoleLabel(member.role)}
                          </span>
                        )}
                      </div>

                      {managerCanManage && (
                        <div role="cell" className="flex min-h-8 items-center justify-end pl-[52px] md:pl-0">
                          {canEditMember && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              disabled={memberBusy}
                              aria-label={`Remove ${name} from ${organization.name}`}
                              className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#d8aaa4] dark:hover:bg-danger/10"
                            >
                              {memberBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && organization && !managerCanManage && (
            <p className="border-t border-line px-4 py-3 text-xs text-muted dark:border-white/10 dark:text-white/40 sm:px-5">
              Only workspace owners and admins can manage member access.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Team;
