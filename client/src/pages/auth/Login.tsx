import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const user = await login(
        email,
        password
      );

      // =====================================================
      // DEBUG
      // =====================================================

      console.log("LOGIN USER:", user);

      console.log("LOGIN ROLE:", user?.role);

      // Normalize role
      const role = String(
        user?.role || ""
      )
        .trim()
        .toLowerCase();

      console.log("NORMALIZED ROLE:", role);

      // =====================================================
      // ATTENDANCE TERMINAL
      // =====================================================

      if (role === "attendance") {
        console.log(
          "Redirecting attendance user to attendance terminal..."
        );

        navigate(
          "/admin/attendance-terminal",
          {
            replace: true,
          }
        );

        return;
      }

      // =====================================================
      // EMPLOYEE
      // =====================================================

      if (role === "employee") {
        console.log(
          "Redirecting employee to employee dashboard..."
        );

        navigate(
          "/employee/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // =====================================================
      // HR
      // =====================================================

      if (
        role === "hr" ||
        role === "hrd" ||
        role === "super_admin"
      ) {
        console.log(
          "Redirecting HR user to HR dashboard..."
        );

        navigate(
          "/hr/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // =====================================================
      // INVALID ROLE
      // =====================================================

      console.error(
        "INVALID USER ROLE:",
        user?.role
      );

      setError(
        `Your account role "${user?.role || "unknown"}" is not configured for portal access.`
      );
    } catch (err: any) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">

      {/* =====================================================
          LEFT PANEL
      ====================================================== */}

      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">

        {/* Background */}

        <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-slate-950" />

        {/* Red Glow */}

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-400/20 blur-3xl" />

        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl" />

        {/* Content */}

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">

          {/* =================================================
              BRAND
          ================================================= */}

          <div>

            <div className="flex items-center gap-3">

              {/* Logo */}

              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">

                <img
                  src="/logo.png"
                  alt="Sellopedia"
                  className="h-full w-full object-contain"
                />

              </div>

              <div>

                <h1 className="text-xl font-bold">
                  Sellopedia
                </h1>

                <p className="text-xs text-white/60">
                  Human Resource Division
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              HERO
          ================================================= */}

          <div className="max-w-lg">

            <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-red-200">
              HR Management System
            </p>

            <h2 className="text-5xl font-bold leading-tight xl:text-6xl">

              Manage your

              <span className="block text-red-200">
                people better.
              </span>

            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              A centralized platform for recruitment,
              employees, attendance, leave,
              payroll, documents and HR operations.
            </p>

            {/* Features */}

            <div className="mt-10 grid grid-cols-2 gap-4">

              {[
                "Recruitment",
                "Employee Management",
                "Attendance & Leave",
                "Payroll Management",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur transition hover:border-red-400/30 hover:bg-red-500/10"
                >
                  <p className="text-sm text-white/80">
                    {item}
                  </p>
                </div>
              ))}

            </div>

          </div>

          {/* Copyright */}

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Sellopedia.
            All rights reserved.
          </p>

        </div>

      </div>

      {/* =====================================================
          LOGIN PANEL
      ====================================================== */}

      <div className="flex w-full items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* =================================================
              MOBILE LOGO
          ================================================= */}

          <div className="mb-10 flex items-center gap-3 lg:hidden">

            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">

              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-full w-full object-contain"
              />

            </div>

            <div>

              <h1 className="font-bold text-slate-900">
                Sellopedia
              </h1>

              <p className="text-xs text-slate-500">
                Human Resource Division
              </p>

            </div>

          </div>

          {/* =================================================
              HEADING
          ================================================= */}

          <div className="mb-8">

            <p className="mb-2 text-sm font-semibold text-[#FE0000]">
              Welcome back
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to access
              the HR management system.
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* =================================================
                EMAIL
            ================================================= */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10"
                />

              </div>

            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

              </div>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#FE0000]"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#FE0000] px-4 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <span className="flex items-center gap-2">

                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Signing in...

                </span>
              ) : (
                "Sign In"
              )}

            </button>

          </form>

          {/* =================================================
              SECURITY CARD
          ================================================= */}

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">

            <div className="flex gap-3">

              <div className="mt-0.5 text-[#FE0000]">

                <ShieldCheck size={18} />

              </div>

              <div>

                <p className="text-xs font-semibold text-slate-700">
                  Secure HR Portal
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Access is controlled according
                  to your assigned HRD role and
                  permissions.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}