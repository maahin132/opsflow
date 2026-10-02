import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { MotionConfig } from "framer-motion";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

const Dashboard = lazy(() => import("./Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Team = lazy(() => import("./pages/Team"));
const TeamMember = lazy(() => import("./pages/TeamMember"));
const Settings = lazy(() => import("./pages/Settings"));

function AppLoading() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted dark:bg-[#24211E] dark:text-white/50">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span>Loading workspace...</span>
      </div>
    </main>
  );
}

function AppScrollUtilities() {
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isAppRoute = location.pathname.startsWith("/app/");

  useEffect(() => {
    if (!isAppRoute) return undefined;

    let frame = 0;
    const updateScrollState = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
          : 0;

        setScrollProgress((current) => current === progress ? current : progress);
        setShowBackToTop((current) => current === (window.scrollY > 400)
          ? current
          : window.scrollY > 400);
      });
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [isAppRoute]);

  if (!isAppRoute) return null;

  return (
    <>
      <div
        className="app-scroll-progress"
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress * 100)}
        data-no-print
      >
        <span style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>
      {showBackToTop && (
        <button
          type="button"
          onClick={() => {
            const reduceMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches;
            window.scrollTo({
              top: 0,
              behavior: reduceMotion ? "auto" : "smooth",
            });
          }}
          aria-label="Back to top"
          title="Back to top"
          data-no-print
          className="app-back-to-top fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface text-ink shadow-panel transition hover:bg-canvas dark:border-white/10 dark:bg-[#2B2825] dark:text-white dark:hover:bg-white/[0.08]"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppScrollUtilities />
      <MotionConfig reducedMotion="user">
        <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ====================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =====================================================
            PROTECTED APP
        ====================================================== */}

        <Route element={<ProtectedRoute />}>

          {/* Dashboard */}
          <Route
            path="/app/dashboard"
            element={
              <Suspense fallback={<AppLoading />}>
                <Dashboard />
              </Suspense>
            }
          />

          {/* Projects */}
          <Route
            path="/app/projects"
            element={
              <Suspense fallback={<AppLoading />}>
                <Projects />
              </Suspense>
            }
          />

          {/* Project Details */}
          <Route
            path="/app/projects/:projectId"
            element={
              <Suspense fallback={<AppLoading />}>
                <ProjectDetails />
              </Suspense>
            }
          />

          {/* Tasks */}
          <Route
            path="/app/tasks"
            element={
              <Suspense fallback={<AppLoading />}>
                <Tasks />
              </Suspense>
            }
          />

          {/* Inbox / Activity */}
          <Route
            path="/app/inbox"
            element={
              <Suspense fallback={<AppLoading />}>
                <Inbox />
              </Suspense>
            }
          />

          {/* Team */}
          <Route
            path="/app/team"
            element={
              <Suspense fallback={<AppLoading />}>
                <Team />
              </Suspense>
            }
          />

          {/* Team Member */}
          <Route
            path="/app/team/:memberId"
            element={
              <Suspense fallback={<AppLoading />}>
                <TeamMember />
              </Suspense>
            }
          />

          {/* Settings */}
          <Route
            path="/app/settings"
            element={
              <Suspense fallback={<AppLoading />}>
                <Settings />
              </Suspense>
            }
          />

        </Route>

        {/* =====================================================
            DEFAULT ROUTES
        ====================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/app/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/app/dashboard"
              replace
            />
          }
        />

        </Routes>
      </MotionConfig>
    </BrowserRouter>
  );
}

export default App;