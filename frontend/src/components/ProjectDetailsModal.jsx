import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, CalendarDays, LoaderCircle, Plus, Users, X } from "lucide-react";

const STATUS_OPTIONS = [
  ["PLANNING", "Planning"],
  ["ACTIVE", "Active"],
  ["ON_HOLD", "On hold"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

const PRIORITY_OPTIONS = [
  ["LOW", "Low"],
  ["MEDIUM", "Medium"],
  ["HIGH", "High"],
  ["CRITICAL", "Critical"],
];

function ProjectDetailsModal({
  project,
  organization,
  canManage,
  canManageOrganization,
  canGrantAdmin,
  onClose,
  onSave,
  onAddMember,
  onRemoveMember,
  onDelete,
  onAddOrganizationMember,
  onUpdateOrganizationMember,
  onRemoveOrganizationMember,
}) {
  const [form, setForm] = useState({
    name: project.name ?? "",
    code: project.code ?? "",
    description: project.description ?? "",
    status: project.status ?? "PLANNING",
    priority: project.priority ?? "MEDIUM",
    start_date: project.start_date ?? "",
    due_date: project.due_date ?? "",
  });
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [saving, setSaving] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workspaceEmail, setWorkspaceEmail] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState("MEMBER");
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const availableMembers = useMemo(() => {
    const existingIds = new Set((project.members ?? []).map((member) => String(member.user)));
    return (organization?.members ?? []).filter((member) => !existingIds.has(String(member.user_id)));
  }, [organization, project.members]);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
    setSuccess("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Project name is required.");
    if (form.start_date && form.due_date && form.due_date < form.start_date) {
      return setError("Due date cannot be before the start date.");
    }

    setSaving(true);
    setError("");
    try {
      await onSave(project.id, {
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      });
      setSuccess("Project changes saved.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save this project.");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    if (!memberUserId) return setError("Select a team member first.");

    setMemberLoading(true);
    setError("");
    setSuccess("");
    try {
      await onAddMember(project.id, Number(memberUserId), memberRole);
      setMemberUserId("");
      setSuccess("Team member added to the project.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add this team member.");
    } finally {
      setMemberLoading(false);
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.username} from ${project.name}?`)) return;
    setMemberLoading(true);
    setError("");
    setSuccess("");
    try {
      await onRemoveMember(project.id, member.user);
      setSuccess(`${member.username} removed from the project.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to remove this team member.");
    } finally {
      setMemberLoading(false);
    }
  };

  const toggleArchive = async () => {
    const nextArchived = !project.is_archived;
    const action = nextArchived ? "archive" : "restore";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${project.name}?`)) return;
    setSaving(true);
    setError("");
    try {
      await onSave(project.id, { is_archived: nextArchived });
      setSuccess(nextArchived ? "Project archived." : "Project restored.");
    } catch (requestError) {
      setError(requestError.message || `Unable to ${action} this project.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm(`Permanently delete ${project.name} and its tasks? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      await onDelete(project.id);
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this project.");
      setSaving(false);
    }
  };

  const addWorkspaceMember = async (event) => {
    event.preventDefault();
    setWorkspaceBusy(true);
    setWorkspaceError("");
    try {
      await onAddOrganizationMember(project.organization_pk, workspaceEmail.trim(), workspaceRole);
      setWorkspaceEmail("");
    } catch (requestError) {
      setWorkspaceError(requestError.message || "Unable to add workspace member.");
    } finally {
      setWorkspaceBusy(false);
    }
  };

  const changeWorkspaceRole = async (member, role) => {
    setWorkspaceBusy(true);
    setWorkspaceError("");
    try {
      await onUpdateOrganizationMember(project.organization_pk, member.user_id, role);
    } catch (requestError) {
      setWorkspaceError(requestError.message || "Unable to update workspace role.");
    } finally {
      setWorkspaceBusy(false);
    }
  };

  const removeWorkspaceMember = async (member) => {
    if (!window.confirm(`Remove ${member.username} from ${organization?.name}? They will also lose access to its projects.`)) return;
    setWorkspaceBusy(true);
    setWorkspaceError("");
    try {
      await onRemoveOrganizationMember(project.organization_pk, member.user_id);
    } catch (requestError) {
      setWorkspaceError(requestError.message || "Unable to remove workspace member.");
    } finally {
      setWorkspaceBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.button type="button" aria-label="Close project details" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] cursor-default bg-black/55 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-5">
            <motion.section role="dialog" aria-modal="true" aria-labelledby="project-detail-title" onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#19191c] text-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl">
              <header className="flex items-start justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7">
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">{organization?.name || project.organization_name || "Workspace"}</p>
                  <h2 id="project-detail-title" className="truncate pr-3 text-lg font-bold">{project.name}</h2>
                </div>
                <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
              </header>

              <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr_0.82fr]">
                <form onSubmit={save} className="space-y-4 border-b border-white/[0.08] p-5 sm:p-7 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-white/55">Project details</h3>
                    {project.is_archived && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/60">Archived</span>}
                  </div>
                  {(error || success) && <div role={error ? "alert" : "status"} className={`rounded-lg border px-3 py-2.5 text-xs ${error ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>{error || success}</div>}

                  <label className="grid gap-2 text-xs font-semibold text-white/70">Project name
                    <input autoFocus name="name" value={form.name} onChange={change} maxLength={200} disabled={!canManage || saving} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF] disabled:opacity-65" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-semibold text-white/70">Project code
                      <input name="code" value={form.code} onChange={change} maxLength={20} disabled={!canManage || saving} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm uppercase text-white outline-none focus:border-[#827BFF] disabled:opacity-65" />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold text-white/70">Status
                      <select name="status" value={form.status} onChange={change} disabled={!canManage || saving} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF] disabled:opacity-65">
                        {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-semibold text-white/70">Priority
                      <select name="priority" value={form.priority} onChange={change} disabled={!canManage || saving} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF] disabled:opacity-65">
                        {PRIORITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold text-white/70">Start date <span className="relative"><CalendarDays size={14} className="pointer-events-none absolute left-3 top-3 text-white/35" /><input type="date" name="start_date" value={form.start_date} onChange={change} disabled={!canManage || saving} className="h-10 w-full rounded-lg border border-white/10 bg-[#242428] pl-9 pr-2 text-sm text-white outline-none focus:border-[#827BFF] disabled:opacity-65" /></span></label>
                  </div>
                  <label className="grid gap-2 text-xs font-semibold text-white/70">Due date
                    <input type="date" name="due_date" value={form.due_date} min={form.start_date || undefined} onChange={change} disabled={!canManage || saving} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF] disabled:opacity-65" />
                  </label>
                  <label className="grid gap-2 text-xs font-semibold text-white/70">Description
                    <textarea name="description" value={form.description} onChange={change} rows={4} disabled={!canManage || saving} className="resize-y rounded-lg border border-white/10 bg-[#242428] px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-[#827BFF] disabled:opacity-65" />
                  </label>
                  {canManage && <div className="flex flex-wrap justify-between gap-2 pt-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={toggleArchive} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/60 hover:bg-white/[0.05] disabled:opacity-40"><Archive size={14} />{project.is_archived ? "Restore project" : "Archive project"}</button>
                      <button type="button" onClick={deleteProject} disabled={saving} className="h-10 rounded-lg border border-red-400/20 px-3 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-40">Delete</button>
                    </div>
                    <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#635BFF] px-4 text-xs font-bold text-white hover:bg-[#766fff] disabled:opacity-50">{saving && <LoaderCircle size={14} className="animate-spin" />}Save changes</button>
                  </div>}
                </form>

                <section className="space-y-4 p-5 sm:p-7">
                  <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70"><Users size={15} />Workspace members</h3>
                        <p className="mt-1 text-[11px] text-white/40">{organization?.member_count ?? organization?.members?.length ?? 0} people</p>
                      </div>
                    </div>
                    {workspaceError && <p role="alert" className="rounded-md bg-red-400/10 px-2.5 py-2 text-[11px] text-red-200">{workspaceError}</p>}
                    <div className="max-h-44 divide-y divide-white/[0.07] overflow-y-auto">
                      {(organization?.members ?? []).map((member) => {
                        const protectedAdmin = member.role === "ADMIN" && !canGrantAdmin;
                        const protectedOwner = member.role === "OWNER";
                        const canManageMember = canManageOrganization && !protectedOwner && !protectedAdmin;
                        return <div key={member.id} className="flex min-w-0 items-center gap-2 py-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/65">{member.username?.slice(0, 2).toUpperCase()}</span>
                          <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-white/75">{member.username}</p><p className="truncate text-[10px] text-white/35">{member.email}</p></div>
                          {canManageMember ? <select aria-label={`Role for ${member.username}`} value={member.role} disabled={workspaceBusy} onChange={(event) => changeWorkspaceRole(member, event.target.value)} className="max-w-28 rounded-md border border-white/10 bg-[#242428] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#827BFF]">
                            <option value="MANAGER">Manager</option><option value="EMPLOYEE">Employee</option><option value="MEMBER">Member</option>{canGrantAdmin && <option value="ADMIN">Admin</option>}
                          </select> : <span className="text-[10px] text-white/45">{member.role.toLowerCase()}</span>}
                          {canManageMember && <button type="button" disabled={workspaceBusy} onClick={() => removeWorkspaceMember(member)} aria-label={`Remove ${member.username} from workspace`} className="rounded px-1.5 py-1 text-[10px] font-semibold text-white/35 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-40">Remove</button>}
                        </div>;
                      })}
                    </div>
                    {canManageOrganization && <form onSubmit={addWorkspaceMember} className="grid gap-2 border-t border-white/[0.08] pt-3 sm:grid-cols-[1fr_auto_auto]">
                      <label className="sr-only" htmlFor="workspace-member-email">Registered user email</label>
                      <input id="workspace-member-email" type="email" required value={workspaceEmail} onChange={(event) => setWorkspaceEmail(event.target.value)} placeholder="Add registered user by email" disabled={workspaceBusy} className="h-9 min-w-0 rounded-lg border border-white/10 bg-[#242428] px-2.5 text-[11px] text-white outline-none placeholder:text-white/30 focus:border-[#827BFF]" />
                      <label className="sr-only" htmlFor="workspace-member-role">Workspace role</label>
                      <select id="workspace-member-role" value={workspaceRole} onChange={(event) => setWorkspaceRole(event.target.value)} disabled={workspaceBusy} className="h-9 rounded-lg border border-white/10 bg-[#242428] px-2 text-[10px] text-white outline-none focus:border-[#827BFF]">
                        <option value="MANAGER">Manager</option><option value="EMPLOYEE">Employee</option><option value="MEMBER">Member</option>{canGrantAdmin && <option value="ADMIN">Admin</option>}
                      </select>
                      <button type="submit" disabled={workspaceBusy} className="h-9 rounded-lg bg-white/10 px-3 text-[10px] font-semibold text-white hover:bg-white/15 disabled:opacity-40">Add member</button>
                    </form>}
                    {!canManageOrganization && <p className="text-[10px] text-white/35">Only workspace owners and admins can manage this roster.</p>}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70"><Users size={15} />Project team</h3>
                      <p className="mt-1 text-[11px] text-white/40">{project.members?.length ?? 0} assigned</p>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.07] rounded-xl border border-white/[0.08] px-3">
                    {project.members?.length ? project.members.map((member) => <div key={member.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#635BFF]/20 text-[10px] font-bold text-[#c0bcff]">{member.username?.slice(0, 2).toUpperCase() || "U"}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white/85">{member.username}</p><p className="truncate text-[10px] text-white/40">{member.user_email}</p></div>
                      <span className="text-[10px] text-white/45">{member.role.toLowerCase()}</span>
                      {canManage && <button type="button" onClick={() => removeMember(member)} disabled={memberLoading} aria-label={`Remove ${member.username}`} className="rounded-md px-2 py-1 text-[10px] font-semibold text-white/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-40">Remove</button>}
                    </div>) : <p className="py-5 text-center text-xs text-white/40">No project members assigned.</p>}
                  </div>

                  {canManage && <form onSubmit={addMember} className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                    <p className="text-[11px] font-semibold text-white/65">Add an organization member</p>
                    <label className="sr-only" htmlFor="project-member-select">Choose a member</label>
                    <select id="project-member-select" value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)} disabled={memberLoading || availableMembers.length === 0} className="h-10 w-full rounded-lg border border-white/10 bg-[#242428] px-3 text-xs text-white outline-none focus:border-[#827BFF]">
                      <option value="">{availableMembers.length ? "Select a member" : "All organization members are assigned"}</option>
                      {availableMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.username} · {member.email}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <label className="sr-only" htmlFor="project-member-role">Project role</label>
                      <select id="project-member-role" value={memberRole} onChange={(event) => setMemberRole(event.target.value)} disabled={memberLoading} className="h-10 flex-1 rounded-lg border border-white/10 bg-[#242428] px-3 text-xs text-white outline-none focus:border-[#827BFF]">
                        <option value="MANAGER">Project manager</option><option value="MEMBER">Project member</option><option value="VIEWER">Viewer</option>
                      </select>
                      <button type="submit" disabled={memberLoading || !memberUserId} className="flex h-10 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40"><Plus size={14} />Add</button>
                    </div>
                  </form>}
                  {!canManage && <p className="rounded-lg border border-white/[0.07] px-3 py-3 text-xs leading-5 text-white/40">Only workspace owners, admins, and managers can change project details or membership.</p>}
                </section>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ProjectDetailsModal;