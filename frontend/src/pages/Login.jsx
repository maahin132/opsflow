import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.identifier.trim() || !formData.password) {
      setError("Please enter your email/username and password.");
      return;
    }

    try {
      setLoading(true);

      await login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      const redirectTo = location.state?.from?.pathname || "/app/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.detail ||
          data?.non_field_errors?.[0] ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-4 py-12 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Login card */}
      <section className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="mb-10 flex items-center justify-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-500/20">
            O
          </div>

          <span className="text-2xl font-semibold tracking-tight">
            OpsFlow
          </span>
        </Link>

        <div className="rounded-2xl border border-white/[0.09] bg-[#10141e]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <LockKeyhole size={22} className="text-blue-400" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Sign in to continue managing your work and projects.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email or username */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email or username
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#090c13] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#090c13] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#10141e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          <div className="my-7 border-t border-white/[0.08]" />

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Secure workspace access · OpsFlow
        </p>
      </section>
    </main>
  );
}