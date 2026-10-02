import { Children, cloneElement, isValidElement, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  FolderKanban,
  CalendarDays,
  FileText,
  Hash,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { useDialogFocusReturn } from "../utils/useDialogFocusReturn";

const INITIAL_FORM = {
  name: "",
  code: "",
  description: "",
  status: "PLANNING",
  priority: "MEDIUM",
  start_date: "",
  due_date: "",
};

function ProjectModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = "",
  organizations = [],
  organizationsLoading = false,
  organizationsError = "",
}) {
  useDialogFocusReturn();
  const [form, setForm] = useState(INITIAL_FORM);
  const [localError, setLocalError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const selectedOrganizationId = organizationId || String(organizations[0]?.id ?? "");

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setLocalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setLocalError("Project name is required.");
      return;
    }

    if (!form.code.trim()) {
      setLocalError("Project code is required.");
      return;
    }

    if (!selectedOrganizationId) {
      setLocalError("Choose a workspace for this project.");
      return;
    }

    if (form.start_date && form.due_date) {
      if (form.due_date < form.start_date) {
        setLocalError(
          "Due date cannot be before the start date."
        );
        return;
      }
    }

    const payload = {
      organization_id: Number(selectedOrganizationId),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    };

    await onSubmit(payload);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm"
          />

          {/* Modal wrapper */}
          <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4">
            <motion.div
              initial={{
                opacity: 0,
                y: 24,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 24,
                scale: 0.98,
              }}
              transition={{
                duration: 0.22,
                ease: "easeOut",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
              aria-describedby="project-modal-description"
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
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#19191C]"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-line px-6 py-5 dark:border-white/[0.08] sm:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6258F5]/10 text-[#6258F5]">
                    <FolderKanban size={21} />
                  </div>

                  <div>
                    <h2 id="project-modal-title" className="text-lg font-bold tracking-tight text-ink dark:text-white">
                      Create project
                    </h2>

                    <p id="project-modal-description" className="mt-1 text-xs leading-5 text-muted">
                      Add a new project to your OpsFlow workspace.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  aria-label="Close project form"
                  className="rounded-xl p-2 text-muted transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6 sm:px-7">
                  {/* Error */}
                  {(localError || error || organizationsError) && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                      {localError || error || organizationsError}
                    </div>
                  )}

                  <Field label="Workspace" required>
                    <SelectField
                      name="organization"
                      value={selectedOrganizationId}
                      onChange={(event) => {
                        setOrganizationId(event.target.value);
                        setLocalError("");
                      }}
                      disabled={loading || organizationsLoading || organizations.length === 0}
                      options={organizations.map((organization) => [
                        String(organization.id),
                        organization.name,
                      ])}
                      placeholder={organizationsLoading ? "Loading workspaces..." : "Select a workspace"}
                    />
                    {!organizationsLoading && organizations.length === 0 && !organizationsError && (
                      <p className="mt-2 text-xs text-muted">No workspaces are available for project creation. An owner, admin, or manager role is required.</p>
                    )}
                  </Field>

                  {/* Project name + code */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_180px]">
                    <Field
                      label="Project name"
                      icon={<FolderKanban size={15} />}
                      required
                    >
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Website redesign"
                        maxLength={200}
                        disabled={loading}
                        autoComplete="off"
                        autoFocus
                        required
                        className="input-field"
                      />
                    </Field>

                    <Field
                      label="Project code"
                      icon={<Hash size={15} />}
                      required
                    >
                      <input
                        type="text"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        placeholder="WEB"
                        maxLength={20}
                        disabled={loading}
                        autoComplete="off"
                        required
                        className="input-field uppercase"
                      />
                    </Field>
                  </div>

                  {/* Description */}
                  <Field
                    label="Description"
                    icon={<FileText size={15} />}
                  >
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="What is this project about?"
                      maxLength={2000}
                      rows={4}
                      disabled={loading}
                      className="input-field resize-none"
                    />
                  </Field>

                  {/* Status + Priority */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Status">
                      <SelectField
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        disabled={loading}
                        options={[
                          ["PLANNING", "Planning"],
                          ["ACTIVE", "Active"],
                          ["ON_HOLD", "On Hold"],
                          ["COMPLETED", "Completed"],
                          ["CANCELLED", "Cancelled"],
                        ]}
                      />
                    </Field>

                    <Field label="Priority">
                      <SelectField
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        disabled={loading}
                        options={[
                          ["LOW", "Low"],
                          ["MEDIUM", "Medium"],
                          ["HIGH", "High"],
                          ["CRITICAL", "Critical"],
                        ]}
                      />
                    </Field>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                      label="Start date"
                      icon={<CalendarDays size={15} />}
                    >
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        disabled={loading}
                        className="input-field"
                      />
                    </Field>

                    <Field
                      label="Due date"
                      icon={<CalendarDays size={15} />}
                    >
                      <input
                        type="date"
                        name="due_date"
                        value={form.due_date}
                        min={form.start_date || undefined}
                        onChange={handleChange}
                        disabled={loading}
                        className="input-field"
                      />
                    </Field>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-line bg-canvas/50 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.015] sm:flex-row sm:justify-end sm:px-7">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.10] dark:hover:bg-white/[0.05] dark:hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading || organizationsLoading || organizations.length === 0}
                    className="rounded-xl bg-[#6258F5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6258F5]/20 transition hover:bg-[#554BEA] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Creating...
                      </span>
                    ) : "Create project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------
   Field
------------------------------------------------------- */

function Field({
  label,
  icon,
  required = false,
  children,
}) {
  const fieldId = `project-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink dark:text-white">
        {icon && (
          <span className="text-muted">
            {icon}
          </span>
        )}

        <span>{label}</span>

        {required && (
          <span className="text-[#6258F5]">*</span>
        )}
      </label>

      {Children.map(children, (child) => {
        if (!isValidElement(child) || child.type === "p") return child;

        return cloneElement(child, {
          id: child.props.id ?? fieldId,
          required: required || child.props.required,
          "aria-required": required || child.props["aria-required"],
        });
      })}
    </div>
  );
}

/* -------------------------------------------------------
   SelectField
------------------------------------------------------- */

function SelectField({
  name,
  value,
  onChange,
  options,
  disabled,
  placeholder,
  required = false,
}) {
  return (
    <div className="relative">
      <select
        id={name === "organization" ? "project-workspace" : `project-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="input-field appearance-none pr-10"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export default ProjectModal;