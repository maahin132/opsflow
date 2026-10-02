import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Home,
  LoaderCircle,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import organizationService from "../services/organizationService";

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

function roleLabel(role) {
  return String(role || "Member")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SettingsSection({ icon: Icon, title, description, children, id }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 overflow-hidden rounded-panel border border-line bg-surface shadow-soft dark:border-white/10 dark:bg-white/[0.025]"
    >
      <div className="flex items-start gap-3 border-b border-line px-4 py-4 dark:border-white/10 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-accent-strong dark:border-white/10 dark:bg-white/[0.03] dark:text-[#cdb8a8]">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-sm font-semibold text-ink dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted dark:text-white/45">
            {description}
          </p>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function AccountField({ label, value }) {
  return (
    <div className="min-w-0 border-b border-line py-3 last:border-b-0 dark:border-white/[0.08] sm:border-b-0 sm:py-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted dark:text-white/40">
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-medium text-ink dark:text-white">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      setOrganizationsLoading(true);
      setOrganizationsError("");

      try {
        const data = await organizationService.getOrganizations();
        if (!cancelled) {
          setOrganizations(data);
        }
      } catch (error) {
        if (!cancelled) {
          setOrganizations([]);
          setOrganizationsError(getErrorMessage(error));
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
  }, [reloadKey]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSuccessMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const handleThemeChange = (nextTheme) => {
    if (nextTheme === theme) return;
    setTheme(nextTheme);
    setSuccessMessage(`Appearance set to ${nextTheme} mode.`);
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm(
      "Sign out of your OpsFlow session on this device?"
    );
    if (!confirmed) return;

    setSigningOut(true);
    setSessionError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setSessionError(getErrorMessage(error));
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-[#24211E] dark:text-white">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
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
              Settings
            </span>
          </nav>

          <div className="border-b border-line pb-5 dark:border-white/[0.08]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted dark:text-white/40">
              Preferences
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-muted dark:text-white/45">
              Account details, appearance, and session controls.
            </p>
          </div>
        </header>

        {successMessage && (
          <div role="status" aria-live="polite" className="mb-5 flex items-center gap-2 rounded-lg border border-success/20 bg-success-soft px-4 py-3 text-sm text-success dark:border-success/20 dark:bg-success/10 dark:text-[#c2d2c3]">
            <Check size={16} aria-hidden="true" />
            {successMessage}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <SettingsSection
            id="account"
            icon={UserRound}
            title="Account"
            description="Profile information returned by your authenticated account endpoint."
          >
            {authLoading ? (
              <div className="flex min-h-28 items-center gap-3 text-sm text-muted dark:text-white/45">
                <LoaderCircle size={17} className="animate-spin" />
                Loading account details...
              </div>
            ) : user ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <AccountField label="Username" value={user.username} />
                <AccountField label="Email" value={user.email} />
                <AccountField label="First name" value={user.first_name} />
                <AccountField label="Last name" value={user.last_name} />
              </dl>
            ) : (
              <p role="alert" className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger dark:border-danger/20 dark:bg-danger/10 dark:text-[#d8aaa4]">
                Account details are unavailable. Sign in again to reload your profile.
              </p>
            )}
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted dark:border-white/[0.08] dark:text-white/40">
              Profile editing is not available through the current account API.
            </p>
          </SettingsSection>

          <SettingsSection
            id="appearance"
            icon={theme === "dark" ? Moon : Sun}
            title="Appearance"
            description="Choose a color theme for this browser. Your choice is saved locally."
          >
            <div role="group" aria-label="Color theme" className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas p-1 dark:border-white/10 dark:bg-[#24211E]">
              <button
                type="button"
                aria-pressed={theme === "light"}
                onClick={() => handleThemeChange("light")}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${theme === "light" ? "bg-surface text-ink shadow-sm dark:bg-white/10 dark:text-white" : "text-muted hover:text-ink dark:text-white/45 dark:hover:text-white"}`}
              >
                <Sun size={16} />
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === "dark"}
                onClick={() => handleThemeChange("dark")}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${theme === "dark" ? "bg-surface text-ink shadow-sm dark:bg-white/10 dark:text-white" : "text-muted hover:text-ink dark:text-white/45 dark:hover:text-white"}`}
              >
                <Moon size={16} />
                Dark
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            id="workspace"
            icon={Users}
            title="Workspace"
            description="Organizations and your current role, loaded from the workspace API."
          >
            {organizationsLoading ? (
              <div className="flex min-h-20 items-center gap-3 text-sm text-muted dark:text-white/45">
                <LoaderCircle size={17} className="animate-spin" />
                Loading workspaces...
              </div>
            ) : organizationsError ? (
              <div role="alert" className="rounded-lg border border-danger/20 bg-danger-soft p-3 dark:border-danger/20 dark:bg-danger/10">
                <p className="text-xs leading-5 text-danger dark:text-[#d8aaa4]">{organizationsError}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-2 text-xs font-semibold text-danger underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : organizations.length ? (
              <ul className="divide-y divide-line dark:divide-white/[0.08]">
                {organizations.map((organization) => (
                  <li key={organization.id} className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink dark:text-white">
                        {organization.name}
                      </p>
                      <p className="mt-1 text-xs text-muted dark:text-white/45">
                        {organization.member_count} {organization.member_count === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[10px] font-semibold text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                      {roleLabel(organization.current_user_role)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-muted dark:text-white/45">
                You are not currently a member of a workspace.
              </p>
            )}
          </SettingsSection>

          <SettingsSection
            id="security"
            icon={ShieldCheck}
            title="Security"
            description="Available security actions depend on the account API."
          >
            <p className="text-sm leading-6 text-muted dark:text-white/55">
              Password changes and password reset are not provided by the current backend API, so no password controls are available here.
            </p>
          </SettingsSection>

          <div className="lg:col-span-2">
            <SettingsSection
              id="session"
              icon={LogOut}
              title="Session"
              description="Sign out of the current authenticated OpsFlow session."
            >
              {sessionError && (
                <p role="alert" className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger dark:border-danger/20 dark:bg-danger/10 dark:text-[#d8aaa4]">
                  {sessionError}
                </p>
              )}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-white">
                    Signed in as {user?.email || user?.username || "your account"}
                  </p>
                  <p className="mt-1 text-xs text-muted dark:text-white/45">
                    Signing out ends the current server session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut || authLoading || !user}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-danger/25 px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50 dark:border-danger/30 dark:text-[#d8aaa4] dark:hover:bg-danger/10"
                >
                  {signingOut ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </SettingsSection>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
