import { useState } from "react";
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
  ArrowUpRight,
  MoreHorizontal,
  Clock3,
  CircleCheck,
  CircleDashed,
  Circle,
  Command,
  Bell,
  Menu,
  X,
  Zap,
  Activity,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "./context/ThemeContext";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Projects", icon: FolderKanban, count: "4" },
  { label: "My tasks", icon: CheckSquare, count: "8" },
  { label: "Inbox", icon: Inbox, count: "3" },
];

const projects = [
  {
    name: "Website redesign",
    code: "WEB",
    color: "#8B7CFF",
    progress: 72,
    tasks: "18/25",
  },
  {
    name: "Mobile application",
    code: "APP",
    color: "#E5A45B",
    progress: 45,
    tasks: "9/20",
  },
  {
    name: "Marketing launch",
    code: "MKT",
    color: "#63B69B",
    progress: 30,
    tasks: "6/20",
  },
];

const initialTasks = [
  {
    title: "Finalize homepage layout",
    project: "Website redesign",
    code: "WEB-024",
    priority: "High",
    status: "In progress",
    color: "#8B7CFF",
    date: "Today",
  },
  {
    title: "Set up authentication flow",
    project: "Mobile application",
    code: "APP-012",
    priority: "Critical",
    status: "In review",
    color: "#E5A45B",
    date: "Today",
  },
  {
    title: "Prepare launch campaign",
    project: "Marketing launch",
    code: "MKT-008",
    priority: "Medium",
    status: "To do",
    color: "#63B69B",
    date: "Tomorrow",
  },
  {
    title: "Review API documentation",
    project: "Website redesign",
    code: "WEB-021",
    priority: "Low",
    status: "Done",
    color: "#8B7CFF",
    date: "Yesterday",
  },
];

const activities = [
  {
    initials: "AS",
    name: "Aarav Shah",
    action: "completed",
    target: "Wireframes",
    time: "12 min ago",
    color: "#D9E7DF",
    text: "#305744",
  },
  {
    initials: "KP",
    name: "Kavya Patel",
    action: "commented on",
    target: "Homepage layout",
    time: "38 min ago",
    color: "#F1DFD5",
    text: "#88553F",
  },
  {
    initials: "RV",
    name: "Rohan Verma",
    action: "created",
    target: "New task",
    time: "1 hour ago",
    color: "#E1DDF4",
    text: "#65539A",
  },
];

function Avatar({ initials, color, text, size = 34 }) {
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

  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskList, setTaskList] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const completed = taskList.filter(
    (task) => task.status === "Done"
  ).length;

  const toggleTask = (index) => {
    setTaskList((prev) =>
      prev.map((task, i) =>
        i === index
          ? {
              ...task,
              status:
                task.status === "Done" ? "To do" : "Done",
            }
          : task
      )
    );
  };

  const createTask = (e) => {
    e.preventDefault();

    if (!taskName.trim()) return;

    setTaskList((prev) => [
      {
        title: taskName.trim(),
        project: "Website redesign",
        code: `WEB-${String(25 + prev.length).padStart(3, "0")}`,
        priority: "Medium",
        status: "To do",
        color: "#8B7CFF",
        date: "Today",
      },
      ...prev,
    ]);

    setTaskName("");
    setShowCreate(false);
  };

  const filteredTasks = taskList.filter((task) =>
    `${task.title} ${task.project} ${task.code}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
            <Zap size={19} fill="white" strokeWidth={1.8} />
          </div>

          <div>
            <p className="font-display text-[17px] font-extrabold tracking-[-0.7px]">
              opsflow<span className="text-accent">.</span>
            </p>
            <p className="mt-0.5 text-[10px] tracking-[1.5px] text-white/35">
              WORKSPACE
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 pt-6">
        <button className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.045] p-3 text-left transition hover:bg-white/[0.08]">
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
              Free workspace
            </p>
          </div>

          <ChevronDown size={15} className="text-white/40" />
        </button>
      </div>

      <div className="px-6 pb-3 pt-8 text-[10px] font-bold uppercase tracking-[1.8px] text-white/30">
        Workspace
      </div>

      <nav className="space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.label;

          return (
            <button
              key={item.label}
              onClick={() => {
                setActive(item.label);
                setMobileOpen(false);
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition-all ${
                selected
                  ? "bg-white/[0.10] text-white shadow-sm"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={selected ? 2.2 : 1.8}
                className={selected ? "text-[#A69EFF]" : ""}
              />

              <span className="flex-1">{item.label}</span>

              {item.count && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] ${
                    selected
                      ? "bg-white/10 text-white/80"
                      : "text-white/35"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-6 mb-3 mt-8 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-white/30">
          Your projects
        </p>

        <button
          onClick={() => setActive("Projects")}
          className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="space-y-1 px-3">
        {projects.map((project) => (
          <button
            key={project.code}
            onClick={() => {
              setActive("Projects");
              setMobileOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
          >
            <span
              className="h-2.5 w-2.5 rounded-[4px]"
              style={{ background: project.color }}
            />
            <span className="flex-1 truncate">
              {project.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-auto p-4">
        <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={15} className="text-[#A69EFF]" />
            <span className="text-xs font-semibold text-white/80">
              Your workspace
            </span>
          </div>

          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="text-white/40">Storage used</span>
            <span className="text-white/70">68%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[68%] rounded-full bg-accent" />
          </div>
        </div>

        <button
          onClick={() => setActive("Team")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Users size={17} />
          Team members
        </button>

        <button
          onClick={() => setActive("Settings")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Settings size={17} />
          Settings
        </button>

        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.08] px-2 pt-4">
          <Avatar
            initials="MJ"
            color="#D9D3FF"
            text="#5A4DC2"
            size={38}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white/90">
              Maahin Jasmin
            </p>
            <p className="mt-1 text-[10px] text-white/40">
              Workspace owner
            </p>
          </div>

          <button className="text-white/40 transition hover:text-white">
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
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block">
          {sidebar}
        </aside>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <button
                className="absolute inset-0 bg-black/50"
                onClick={() => setMobileOpen(false)}
              />

              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 28 }}
                className="absolute inset-y-0 left-0 w-[280px]"
              >
                {sidebar}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="min-w-0 flex-1 lg:ml-[252px]">
          <header
            className={`sticky top-0 z-30 flex h-[76px] items-center justify-between border-b px-5 backdrop-blur-xl sm:px-8 lg:px-10 ${
              isDark
                ? "border-white/[0.08] bg-[#171719]/90"
                : "border-line bg-white/90"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-muted hover:bg-canvas lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
                Workspace
                <span className="text-line">/</span>
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
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`hidden h-10 w-[230px] items-center gap-2.5 rounded-xl border px-3 text-xs text-muted transition hover:border-[#C8C4FF] md:flex ${
                  isDark
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-line bg-[#FAFAF9]"
                }`}
              >
                <Search size={15} />
                <span className="flex-1 text-left">
                  Search anything...
                </span>
                <span className="flex items-center gap-1 rounded-md border border-line bg-white px-1.5 py-1 text-[10px]">
                  <Command size={10} /> K
                </span>
              </button>

              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-canvas md:hidden"
                aria-label="Search"
              >
                <Search size={17} />
              </button>

              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${
                  theme === "dark" ? "light" : "dark"
                } mode`}
                title={`Switch to ${
                  theme === "dark" ? "light" : "dark"
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

              <div className="relative">
                <button
                  onClick={() =>
                    setShowNotifications(!showNotifications)
                  }
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl border text-muted transition ${
                    isDark
                      ? "border-white/10 bg-white/[0.04] hover:bg-white/10"
                      : "border-line bg-white hover:bg-canvas"
                  }`}
                >
                  <Bell size={17} />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-accent" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-white p-4 text-ink shadow-panel dark:border-white/10 dark:bg-[#202023] dark:text-white">
                    <p className="text-sm font-bold">
                      Notifications
                    </p>
                    <p className="mt-3 text-xs leading-5 text-muted">
                      You're all caught up. New notifications will
                      appear here.
                    </p>
                  </div>
                )}
              </div>

              <div className="hidden h-8 w-px bg-line sm:block" />

              <Avatar
                initials="MJ"
                color="#D9D3FF"
                text="#5A4DC2"
                size={36}
              />
            </div>
          </header>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="sticky top-[76px] z-20 border-b border-line bg-white p-4 dark:border-white/10 dark:bg-[#202023]"
              >
                <div className="mx-auto flex max-w-3xl items-center gap-3">
                  <Search size={18} className="text-muted" />

                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    placeholder="Search tasks by name, project or code..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                  />

                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="rounded-lg p-2 text-muted hover:bg-canvas"
                  >
                    <X size={17} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
            >
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#65B89A]" />
                  <span className="text-[11px] font-bold uppercase tracking-[1.6px] text-muted">
                    Monday, September 28
                  </span>
                </div>

                <h1 className="font-display text-[30px] font-extrabold tracking-[-1.5px] sm:text-[38px]">
                  Good morning, Maahin
                  <span className="ml-2">✳</span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  Here’s what’s happening across your workspace.
                  Let’s make today count.
                </p>
              </div>

              <button
                onClick={() => setShowCreate(true)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-[13px] font-semibold text-white shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-accent-hover"
              >
                <Plus size={17} />
                Create task
              </button>
            </motion.div>

            <AnimatePresence>
              {showCreate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                  onClick={() => setShowCreate(false)}
                >
                  <motion.form
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    onSubmit={createTask}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-ink shadow-panel dark:border-white/10 dark:bg-[#202023] dark:text-white"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold">
                        Create a task
                      </h2>

                      <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="rounded-lg p-2 text-muted hover:bg-canvas"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <label className="mb-2 block text-xs font-semibold text-muted">
                      Task name
                    </label>

                    <input
                      autoFocus
                      required
                      value={taskName}
                      onChange={(e) =>
                        setTaskName(e.target.value)
                      }
                      placeholder="What needs to get done?"
                      className="mb-5 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm outline-none transition focus:border-accent dark:border-white/10 dark:bg-white/[0.04]"
                    />

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
                    >
                      Create task
                    </button>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total projects",
                  value: "12",
                  change: "+2 this month",
                  icon: FolderKanban,
                  color: "#8B7CFF",
                  bg: "#EEEDFF",
                },
                {
                  label: "Tasks completed",
                  value: `${24 + completed}`,
                  change: "+8 this week",
                  icon: CircleCheck,
                  color: "#54A88B",
                  bg: "#E5F5EE",
                },
                {
                  label: "In progress",
                  value: "08",
                  change: "Across 4 projects",
                  icon: Clock3,
                  color: "#D59B4D",
                  bg: "#FFF2DE",
                },
                {
                  label: "Team members",
                  value: "06",
                  change: "All members active",
                  icon: Users,
                  color: "#7298D6",
                  bg: "#EAF1FC",
                },
              ].map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.08,
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
                          background: stat.bg,
                          color: stat.color,
                        }}
                      >
                        <Icon size={17} />
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <p className="font-display text-[32px] font-extrabold tracking-[-1.5px]">
                        {stat.value}
                      </p>

                      <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#54A88B]">
                        <ArrowUpRight size={13} />
                        {stat.change}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
              <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1B1E] sm:p-7">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <SectionHeading
                      title="Your projects"
                      action="View all"
                      onAction={() => setActive("Projects")}
                    />

                    <p className="-mt-3 text-xs text-muted">
                      Keep an eye on your team's progress.
                    </p>
                  </div>

                  <button
                    onClick={() => setActive("Projects")}
                    className="rounded-xl border border-line p-2.5 text-muted transition hover:bg-canvas dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.2 + index * 0.1,
                      }}
                      className="group"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold"
                          style={{
                            background: `${project.color}18`,
                            color: project.color,
                          }}
                        >
                          {project.code}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold">
                            {project.name}
                          </p>

                          <p className="mt-1 text-[11px] text-muted">
                            {project.tasks} tasks completed
                          </p>
                        </div>

                        <span className="text-sm font-bold">
                          {project.progress}%
                        </span>
                      </div>

                      <div className="ml-[52px] h-1.5 overflow-hidden rounded-full bg-[#F0F0EE] dark:bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${project.progress}%`,
                          }}
                          transition={{
                            duration: 1,
                            delay: 0.3 + index * 0.15,
                          }}
                          className="h-full rounded-full"
                          style={{
                            background: project.color,
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={() => setActive("Projects")}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3.5 text-xs font-semibold text-muted transition hover:border-accent hover:bg-[#F8F7FF] hover:text-accent dark:border-white/10 dark:hover:bg-white/[0.04]"
                >
                  <Plus size={15} />
                  Create new project
                </button>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-[#1B1B1E] sm:p-7">
                <SectionHeading
                  title="Activity"
                  action="See all"
                  onAction={() => setActive("Inbox")}
                />

                <div className="relative space-y-6">
                  <div className="absolute bottom-4 left-[17px] top-4 w-px bg-line dark:bg-white/10" />

                  {activities.map((activity) => (
                    <div
                      key={activity.name}
                      className="relative flex gap-3"
                    >
                      <Avatar
                        initials={activity.initials}
                        color={activity.color}
                        text={activity.text}
                        size={35}
                      />

                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[12px] leading-5">
                          <span className="font-bold">
                            {activity.name}
                          </span>{" "}
                          <span className="text-muted">
                            {activity.action}
                          </span>{" "}
                          <span className="font-semibold">
                            {activity.target}
                          </span>
                        </p>

                        <p className="mt-1.5 text-[10px] text-muted">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-xl bg-[#F8F7FF] p-4 dark:bg-[#292536]">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap size={15} className="text-accent" />
                    <p className="text-xs font-bold">
                      Team momentum
                    </p>
                  </div>

                  <p className="text-[11px] leading-5 text-muted">
                    Your team has completed 18 tasks this week.
                    Keep the momentum going!
                  </p>
                </div>
              </section>
            </div>

            <section className="mt-7 overflow-hidden rounded-2xl border border-line bg-white shadow-soft dark:border-white/[0.08] dark:bg-[#1B1B1E]">
              <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
                <div>
                  <h2 className="font-display text-[15px] font-bold tracking-[-0.4px]">
                    My tasks
                  </h2>

                  <p className="mt-1.5 text-xs text-muted">
                    Your priorities, all in one place.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:bg-canvas dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <SlidersHorizontal size={14} />
                    Filter
                  </button>

                  <button
                    onClick={() => setActive("My tasks")}
                    className="flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-white/5 dark:hover:text-white sm:self-auto"
                  >
                    View all tasks
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-y border-line bg-[#FAFAF9] text-[10px] font-bold uppercase tracking-[1.2px] text-muted dark:border-white/10 dark:bg-white/[0.025]">
                      <th className="px-7 py-4">Task name</th>
                      <th className="px-5 py-4">Project</th>
                      <th className="px-5 py-4">Priority</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Due date</th>
                      <th className="px-5 py-4"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line dark:divide-white/[0.07]">
                    {filteredTasks.map((task, index) => (
                      <motion.tr
                        key={`${task.code}-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group transition hover:bg-[#FAFAF9] dark:hover:bg-white/[0.025]"
                      >
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTask(index)}
                              className="shrink-0 text-muted transition hover:text-accent"
                              title="Toggle task status"
                            >
                              {task.status === "Done" ? (
                                <CircleCheck
                                  size={18}
                                  className="text-[#54A88B]"
                                />
                              ) : (
                                <Circle size={18} />
                              )}
                            </button>

                            <div>
                              <p
                                className={`text-[12px] font-semibold ${
                                  task.status === "Done"
                                    ? "text-muted line-through"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </p>

                              <p className="mt-1 text-[10px] text-muted">
                                {task.code}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-[11px] text-muted">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                background: task.color,
                              }}
                            />
                            {task.project}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold ${
                              task.priority === "Critical"
                                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                : task.priority === "High"
                                ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                                : task.priority === "Medium"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                              task.status === "Done"
                                ? "text-[#54A88B]"
                                : task.status === "In progress"
                                ? "text-accent"
                                : task.status === "In review"
                                ? "text-[#C28B42]"
                                : "text-muted"
                            }`}
                          >
                            {task.status === "Done" ? (
                              <CircleCheck size={13} />
                            ) : task.status === "In progress" ? (
                              <Clock3 size={13} />
                            ) : task.status === "In review" ? (
                              <CircleDashed size={13} />
                            ) : (
                              <Circle size={13} />
                            )}
                            {task.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-[11px] text-muted">
                            <CalendarDays size={13} />
                            {task.date}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button className="rounded-lg p-2 text-muted opacity-0 transition hover:bg-canvas group-hover:opacity-100">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {filteredTasks.length === 0 && (
                  <div className="p-10 text-center">
                    <Search
                      size={24}
                      className="mx-auto mb-3 text-muted"
                    />
                    <p className="text-sm font-semibold">
                      No tasks found
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Try a different search term.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-line px-7 py-4 dark:border-white/10">
                <p className="text-[11px] text-muted">
                  Showing {filteredTasks.length} tasks
                </p>

                <span className="text-[11px] font-semibold text-accent">
                  {completed} completed
                </span>
              </div>
            </section>

            <footer className="flex flex-col items-center justify-between gap-2 py-8 text-[10px] text-muted sm:flex-row">
              <p>
                © 2026 OpsFlow. Built for teams that get things done.
              </p>

              <p className="flex items-center gap-1.5">
                Made with{" "}
                <span className="text-accent">♥</span> and purpose.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;