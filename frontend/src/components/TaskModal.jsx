import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckSquare, Hash, X } from "lucide-react";

const INITIAL_FORM = {
  project_id: "",
  title: "",
  description: "",
  code: "",
  status: "TODO",
  priority: "MEDIUM",
  assigned_to: "",
  start_date: "",
  due_date: "",
};

function TaskModal({ open, onClose, onSubmit, projects, loading = false, error = "" }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [localError, setLocalError] = useState("");
  const selectedProject = projects.find((project) => String(project.id) === form.project_id);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setLocalError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.project_id) return setLocalError("Choose a project for this task.");
    if (!form.title.trim()) return setLocalError("Task title is required.");
    if (form.start_date && form.due_date && form.due_date < form.start_date) {
      return setLocalError("Due date cannot be before the start date.");
    }

    await onSubmit({
      project_id: Number(form.project_id),
      title: form.title.trim(),
      description: form.description.trim(),
      code: form.code.trim().toUpperCase(),
      status: form.status,
      priority: form.priority,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close task form"
            onClick={loading ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] cursor-default bg-black/55 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-3 sm:p-6">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="task-modal-title"
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const focusable = event.currentTarget.querySelectorAll(
                  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
                );
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
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1e] text-white shadow-2xl"
            >
              <header className="flex items-start justify-between border-b border-white/[0.08] px-5 py-5 sm:px-7">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF]/15 text-[#aaa4ff]"><CheckSquare size={19} /></span>
                  <div>
                    <h2 id="task-modal-title" className="text-base font-bold">Create task</h2>
                    <p className="mt-1 text-xs text-white/50">Add work to a project and assign an owner.</p>
                  </div>
                </div>
                <button type="button" aria-label="Close dialog" onClick={onClose} disabled={loading} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"><X size={18} /></button>
              </header>

              <form onSubmit={submit}>
                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                  {(localError || error) && <div role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-200">{localError || error}</div>}
                  <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Project
                      <select name="project_id" value={form.project_id} onChange={change} disabled={loading} required className="h-11 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF]">
                        <option value="">Select a project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Task code <span className="relative"><Hash size={14} className="absolute left-3 top-3.5 text-white/35" /><input name="code" value={form.code} onChange={change} maxLength={30} disabled={loading} placeholder="Optional" className="h-11 w-full rounded-lg border border-white/10 bg-[#242428] pl-9 pr-3 text-sm uppercase outline-none focus:border-[#827BFF]" /></span></label>
                  </div>
                  <label className="grid gap-2 text-xs font-semibold text-white/80">Task title <input autoFocus name="title" value={form.title} onChange={change} maxLength={200} required disabled={loading} placeholder="What needs to get done?" className="h-11 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#827BFF]" /></label>
                  <label className="grid gap-2 text-xs font-semibold text-white/80">Description <textarea name="description" value={form.description} onChange={change} rows={3} disabled={loading} placeholder="Add context, acceptance criteria, or notes" className="resize-y rounded-lg border border-white/10 bg-[#242428] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#827BFF]" /></label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Status
                      <select name="status" value={form.status} onChange={change} disabled={loading} className="h-11 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm outline-none focus:border-[#827BFF]">
                        <option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="IN_REVIEW">In review</option><option value="BLOCKED">Blocked</option><option value="DONE">Done</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Priority
                      <select name="priority" value={form.priority} onChange={change} disabled={loading} className="h-11 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm outline-none focus:border-[#827BFF]">
                        <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Assignee
                      <select name="assigned_to" value={form.assigned_to} onChange={change} disabled={loading || !selectedProject} className="h-11 min-w-0 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm outline-none focus:border-[#827BFF]">
                        <option value="">Unassigned</option>
                        {selectedProject?.members?.map((member) => <option key={member.user} value={member.user}>{member.username || member.user_email}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Start date <span className="relative"><CalendarDays size={14} className="pointer-events-none absolute left-3 top-3.5 text-white/35" /><input type="date" name="start_date" value={form.start_date} onChange={change} disabled={loading} className="h-11 w-full min-w-0 rounded-lg border border-white/10 bg-[#242428] pl-9 pr-2 text-sm outline-none focus:border-[#827BFF]" /></span></label>
                    <label className="grid gap-2 text-xs font-semibold text-white/80">Due date <input type="date" name="due_date" value={form.due_date} min={form.start_date || undefined} onChange={change} disabled={loading} className="h-11 min-w-0 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm outline-none focus:border-[#827BFF]" /></label>
                  </div>
                </div>

                <footer className="flex flex-col-reverse gap-2 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <button type="button" onClick={onClose} disabled={loading} className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/65 hover:bg-white/[0.05] disabled:opacity-40">Cancel</button>
                  <button type="submit" disabled={loading || projects.length === 0} className="h-10 rounded-lg bg-[#635BFF] px-5 text-sm font-semibold text-white transition hover:bg-[#766fff] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creating task…" : "Create task"}</button>
                </footer>
              </form>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default TaskModal;