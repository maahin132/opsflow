import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait until Django session authentication is checked
  if (loading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex min-h-screen items-center justify-center bg-canvas text-ink dark:bg-[#24211E] dark:text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent dark:border-white/10 dark:border-t-[#cdb8a8]" />

          <p className="text-sm text-muted dark:text-white/45">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Render protected page
  return <Outlet />;
}

export default ProtectedRoute;