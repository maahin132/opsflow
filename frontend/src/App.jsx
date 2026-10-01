
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
const Dashboard = lazy(() => import("./Dashboard"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected application routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/app/dashboard"
            element={(
              <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#111113] text-sm text-white/55">Loading workspace…</div>}>
                <Dashboard />
              </Suspense>
            )}
          />
        </Route>

        {/* Default and unknown routes */}
        <Route
          path="/"
          element={<Navigate to="/app/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/app/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;