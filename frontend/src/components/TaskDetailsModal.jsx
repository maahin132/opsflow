import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, CheckSquare, LoaderCircle, MessageSquare, Pencil, Send, Trash2, X } from "lucide-react";
import taskService from "../services/taskService";
import { formatDate, formatDateTime } from "../utils/dateFormat";
import { useDialogFocusReturn } from "../utils/useDialogFocusReturn";

const TASK_STATUSES = [
  ["TODO", "To do"],
  ["IN_PROGRESS", "In progress"],
  ["IN_REVIEW", "In review"],
  ["BLOCKED", "Blocked"],
  ["DONE", "Done"],
];

function readError(error) {
  const response = error?.response?.data;
  if (typeof response?.detail === "string") return response.detail;
  if (response && typeof response === "object") {
    return Object.values(response).flat().filter((value) => typeof value === "string").join(" ");
  }
  return "Could not complete the request. Please try again.";
}

function TaskDetailsModal({ task, project, canManage, canChangeStatus, userId, onClose, onTaskUpdated, onTaskDeleted }) {
  useDialogFocusReturn();
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("comments");
  const [reloadKey, setReloadKey] = useState(0);
  const [editingTask, setEditingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({});
  const [savingTask, setSavingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentMutationId, setCommentMutationId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [nextComments, nextActivities] = await Promise.all([
          taskService.getComments(task.id),
          taskService.getActivities(task.id),
        ]);
        if (!cancelled) {
          setComments(nextComments);
          setActivities(nextActivities);
        }
      } catch (error) {
        if (!cancelled) setLoadError(readError(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetail();
    return () => { cancelled = true; };
  }, [task.id, reloadKey]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const changeStatus = async (status) => {
    setChangingStatus(true);
    setActionError("");
    try {
      const updatedTask = await taskService.updateStatus(task.id, status);
      onTaskUpdated(updatedTask);
    } catch (error) {
      setActionError(readError(error));
    } finally {
      setChangingStatus(false);
    }
  };

  const changeAssignee = async (event) => {
    const userId = event.target.value;
    setAssigning(true);
    setActionError("");
    try {
      const updatedTask = await taskService.assignTask(task.id, userId || null);
      onTaskUpdated(updatedTask);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(readError(error));
    } finally {
      setAssigning(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const content = comment.trim();
    if (!content) return setCommentError("Write a comment before sending.");

    setPostingComment(true);
    setCommentError("");
    try {
      const created = await taskService.addComment(task.id, content);
      setComments((current) => [...current, created]);
      setComment("");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setCommentError(readError(error));
    } finally {
      setPostingComment(false);
    }
  };

  const beginTaskEdit = () => {
    setTaskForm({
      title: task.title ?? "",
      description: task.description ?? "",
      code: task.code ?? "",
      priority: task.priority ?? "MEDIUM",
      start_date: task.start_date ?? "",
      due_date: task.due_date ?? "",
    });
    setActionError("");
    setEditingTask(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) return setActionError("Task title is required.");
    if (taskForm.start_date && taskForm.due_date && taskForm.due_date < taskForm.start_date) {
      return setActionError("Due date cannot be before the start date.");
    }

    setSavingTask(true);
    setActionError("");
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        code: taskForm.code.trim().toUpperCase(),
        start_date: taskForm.start_date || null,
        due_date: taskForm.due_date || null,
      });
      onTaskUpdated(updatedTask);
      setEditingTask(false);
    } catch (error) {
      setActionError(readError(error));
    } finally {
      setSavingTask(false);
    }
  };

  const deleteTask = async () => {
    if (!window.confirm(`Delete "${task.title}"? This also removes its comments and activity.`)) return;
    setDeletingTask(true);
    setActionError("");
    try {
      await onTaskDeleted(task.id);
    } catch (error) {
      setActionError(error.message || "Unable to delete this task.");
      setDeletingTask(false);
    }
  };

  const saveComment = async (event, commentId) => {
    event.preventDefault();
    const content = commentDraft.trim();
    if (!content) return setCommentError("Comment cannot be empty.");

    setCommentMutationId(commentId);
    setCommentError("");
    try {
      const updatedComment = await taskService.updateComment(task.id, commentId, content);
      setComments((current) => current.map((item) => item.id === commentId ? updatedComment : item));
      setEditingCommentId(null);
      setCommentDraft("");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setCommentError(readError(error));
    } finally {
      setCommentMutationId(null);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    setCommentMutationId(commentId);
    setCommentError("");
    try {
      await taskService.deleteComment(task.id, commentId);
      setComments((current) => current.filter((item) => item.id !== commentId));
      setReloadKey((key) => key + 1);
    } catch (error) {
      setCommentError(readError(error));
    } finally {
      setCommentMutationId(null);
    }
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.button type="button" aria-label="Close task details" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] cursor-default bg-black/55 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-5">
            <motion.section role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#19191c] text-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl">
              <header className="flex items-start justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7">
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/40"><span>{project?.name || task.project_name}</span><span>/</span><span>{task.code || `Task ${task.id}`}</span></p>
                  <h2 id="task-detail-title" className="truncate pr-4 text-lg font-bold">{task.title}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canManage && <>
                    <button type="button" onClick={editingTask ? () => setEditingTask(false) : beginTaskEdit} disabled={savingTask || deletingTask} aria-label={editingTask ? "Cancel task editing" : "Edit task"} title={editingTask ? "Cancel edit" : "Edit task"} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"><Pencil size={16} /></button>
                    <button type="button" onClick={deleteTask} disabled={deletingTask || savingTask} aria-label="Delete task" title="Delete task" className="rounded-lg p-2 text-red-300/70 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-40">{deletingTask ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                  </>}
                  <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6 border-b border-white/[0.08] p-5 sm:p-7 lg:border-b-0 lg:border-r">
                  {(actionError || loadError) && <div role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-200">{actionError || loadError}</div>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-semibold text-white/55">Status
                      <select value={task.status} onChange={(event) => changeStatus(event.target.value)} disabled={changingStatus || !canChangeStatus} aria-describedby={!canChangeStatus ? "task-status-permission" : undefined} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF] disabled:opacity-55">
                        {TASK_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {!canChangeStatus && <span id="task-status-permission" className="text-[10px] font-normal text-white/35">Only the assignee or a project manager can update status.</span>}
                    </label>
                    <div className="grid gap-2 text-xs font-semibold text-white/55">Priority
                      <span className="flex h-10 items-center rounded-lg border border-white/10 bg-[#242428] px-3 text-sm font-medium text-white">{task.priority?.toLowerCase() || "Not set"}</span>
                    </div>
                    <div className="grid gap-2 text-xs font-semibold text-white/55">Assignee
                      {canManage ? (
                        <select value={task.assigned_to ?? ""} onChange={changeAssignee} disabled={assigning} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF]">
                          <option value="">Unassigned</option>
                          {project?.members?.map((member) => <option key={member.user} value={member.user}>{member.username || member.user_email}</option>)}
                        </select>
                      ) : <span className="flex h-10 items-center rounded-lg border border-white/10 bg-[#242428] px-3 text-sm font-medium text-white">{task.assigned_to_email || "Unassigned"}</span>}
                    </div>
                    <div className="grid gap-2 text-xs font-semibold text-white/55">Due date
                      <span className="flex h-10 items-center rounded-lg border border-white/10 bg-[#242428] px-3 text-sm font-medium text-white">{formatDate(task.due_date, "No due date")}</span>
                    </div>
                  </div>

                  {editingTask ? (
                    <form onSubmit={saveTask} className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                      <label className="grid gap-1.5 text-xs font-semibold text-white/65">Title
                        <input autoFocus maxLength={200} value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} disabled={savingTask} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF]" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-white/65">Description
                        <textarea rows={3} value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} disabled={savingTask} className="resize-y rounded-lg border border-white/10 bg-[#242428] px-3 py-2 text-sm text-white outline-none focus:border-[#827BFF]" />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-xs font-semibold text-white/65">Code
                          <input maxLength={30} value={taskForm.code} onChange={(event) => setTaskForm((current) => ({ ...current, code: event.target.value }))} disabled={savingTask} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm uppercase text-white outline-none focus:border-[#827BFF]" />
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-white/65">Priority
                          <select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))} disabled={savingTask} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF]">
                            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-white/65">Start date
                          <input type="date" value={taskForm.start_date} onChange={(event) => setTaskForm((current) => ({ ...current, start_date: event.target.value }))} disabled={savingTask} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF]" />
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-white/65">Due date
                          <input type="date" value={taskForm.due_date} min={taskForm.start_date || undefined} onChange={(event) => setTaskForm((current) => ({ ...current, due_date: event.target.value }))} disabled={savingTask} className="h-10 rounded-lg border border-white/10 bg-[#242428] px-3 text-sm text-white outline-none focus:border-[#827BFF]" />
                        </label>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setEditingTask(false)} disabled={savingTask} className="h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/65 hover:bg-white/5">Cancel</button>
                        <button type="submit" disabled={savingTask} className="h-9 rounded-lg bg-[#635BFF] px-4 text-xs font-bold text-white hover:bg-[#766fff] disabled:opacity-50">{savingTask ? "Saving…" : "Save task"}</button>
                      </div>
                    </form>
                  ) : <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">Description</h3>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/75">{task.description || "No description provided."}</p>
                  </div>}

                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/75"><Activity size={15} className="text-[#9a94ff]" />Recent activity</div>
                    {loading ? <div className="flex items-center gap-2 py-3 text-xs text-white/45"><LoaderCircle size={14} className="animate-spin" />Loading activity…</div> : activities.length ? (
                      <ol className="space-y-3">
                        {activities.slice(0, 8).map((item) => <li key={item.id} className="border-l border-white/10 pl-3 text-xs">
                          <p className="text-white/75">{item.description || item.action}</p>
                          <p className="mt-1 text-[10px] text-white/35">{item.actor_name || "OpsFlow"} · {formatDateTime(item.created_at)}</p>
                        </li>)}
                      </ol>
                    ) : <p className="py-2 text-xs text-white/40">No activity recorded yet.</p>}
                  </div>
                </div>

                <div className="flex min-h-[360px] flex-col p-5 sm:p-7">
                  <div className="mb-4 flex gap-1 border-b border-white/[0.08]">
                    <button type="button" onClick={() => setActiveTab("comments")} className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold ${activeTab === "comments" ? "border-[#827BFF] text-white" : "border-transparent text-white/45"}`}><MessageSquare size={14} />Comments <span className="text-white/40">{comments.length}</span></button>
                    <button type="button" onClick={() => setActiveTab("activity")} className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold ${activeTab === "activity" ? "border-[#827BFF] text-white" : "border-transparent text-white/45"}`}><Activity size={14} />Activity</button>
                  </div>

                  {activeTab === "comments" ? (
                    <>
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                        {loading ? <p className="py-8 text-center text-xs text-white/40">Loading comments…</p> : comments.length ? comments.map((item) => {
                          const canManageComment = canManage || item.author === userId;
                          return <article key={item.id} className="flex gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#635BFF]/20 text-[10px] font-bold text-[#c0bcff]">{item.author_name?.slice(0, 2).toUpperCase() || "U"}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2"><span className="text-xs font-semibold text-white/85">{item.author_name}</span><time dateTime={item.created_at} className="text-[10px] text-white/35">{formatDateTime(item.created_at)}</time></div>
                              {editingCommentId === item.id ? <form onSubmit={(event) => saveComment(event, item.id)} className="mt-2 space-y-2">
                                <label className="sr-only" htmlFor={`comment-edit-${item.id}`}>Edit comment</label>
                                <textarea id={`comment-edit-${item.id}`} autoFocus maxLength={4000} value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} disabled={commentMutationId === item.id} className="w-full resize-y rounded-lg border border-white/10 bg-[#242428] px-3 py-2 text-sm text-white outline-none focus:border-[#827BFF]" />
                                <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => { setEditingCommentId(null); setCommentError(""); }} className="rounded-md px-2 py-1 text-[10px] font-semibold text-white/50 hover:bg-white/5">Cancel</button>
                                  <button type="submit" disabled={commentMutationId === item.id || !commentDraft.trim()} className="rounded-md bg-[#635BFF] px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-40">Save</button>
                                </div>
                              </form> : <>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-white/70">{item.content}</p>
                                {canManageComment && <div className="mt-1 flex gap-1">
                                  <button type="button" onClick={() => { setEditingCommentId(item.id); setCommentDraft(item.content); setCommentError(""); }} aria-label="Edit comment" className="rounded px-1.5 py-1 text-[10px] font-semibold text-white/40 hover:bg-white/5 hover:text-white/80">Edit</button>
                                  <button type="button" onClick={() => deleteComment(item.id)} disabled={commentMutationId === item.id} aria-label="Delete comment" className="rounded px-1.5 py-1 text-[10px] font-semibold text-red-300/60 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-40">{commentMutationId === item.id ? "Deleting…" : "Delete"}</button>
                                </div>}
                              </>}
                            </div>
                          </article>;
                        }) : <div className="py-10 text-center"><MessageSquare size={21} className="mx-auto mb-3 text-white/25" /><p className="text-xs text-white/45">No comments yet. Start the conversation.</p></div>}
                      </div>
                      <form onSubmit={submitComment} className="mt-5 border-t border-white/[0.08] pt-4">
                        {commentError && <p role="alert" className="mb-2 text-xs text-red-300">{commentError}</p>}
                        <label className="sr-only" htmlFor="task-comment">Write a comment</label>
                        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-[#242428] p-2 focus-within:border-[#827BFF]">
                          <textarea id="task-comment" value={comment} onChange={(event) => { setComment(event.target.value); setCommentError(""); }} maxLength={4000} rows={2} placeholder="Write a comment…" className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-white/30" />
                          <button type="submit" disabled={postingComment || !comment.trim()} aria-label="Send comment" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#635BFF] text-white hover:bg-[#766fff] disabled:cursor-not-allowed disabled:opacity-40">{postingComment ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}</button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                      {activities.length ? activities.map((item) => <article key={item.id} className="rounded-lg border border-white/[0.07] p-3">
                        <p className="text-xs text-white/75">{item.description || item.action}</p>
                        <p className="mt-1.5 text-[10px] text-white/35">{item.actor_name || "OpsFlow"} · {formatDateTime(item.created_at)}</p>
                      </article>) : <div className="py-10 text-center"><CheckSquare size={21} className="mx-auto mb-3 text-white/25" /><p className="text-xs text-white/45">No activity recorded yet.</p></div>}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default TaskDetailsModal;