import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../lib/axios";

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<RegisterForm>({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const email =
      form.email.trim().toLowerCase();

    const password =
      form.password;

    const confirmPassword =
      form.confirmPassword;

    // ---------------------------------------------------
    // Required fields
    // ---------------------------------------------------

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please fill in all required fields."
      );

      return;
    }

    // ---------------------------------------------------
    // Name validation
    // ---------------------------------------------------

    if (name.length < 2) {
      setError(
        "Please enter a valid name."
      );

      return;
    }

    // ---------------------------------------------------
    // Email validation
    // ---------------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    // ---------------------------------------------------
    // Password validation
    // ---------------------------------------------------

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    // ---------------------------------------------------
    // Confirm password
    // ---------------------------------------------------

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      /*
       * Public registration ALWAYS creates
       * an employee account.
       *
       * Do not send role from the frontend.
       */

      const response =
        await api.post(
          "/auth/register",
          {
            name,
            email,
            password,
          }
        );

      setSuccess(
        response.data?.message ||
          "Employee account created successfully."
      );

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to login after success

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);
    } catch (err: any) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">

      {/* =================================================
          LEFT PANEL
      ================================================= */}

      <div className="relative hidden w-1/2 overflow-hidden lg:flex">

        {/* Background */}

        <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-slate-950" />

        {/* Glows */}

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-400/20 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl" />

        {/* Content */}

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">

          {/* =================================================
              LOGO
          ================================================= */}

          <div className="flex items-center gap-3">

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

          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <div className="max-w-lg">

            <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-red-200">
              Employee Registration
            </p>

            <h2 className="text-5xl font-bold leading-tight xl:text-6xl">

              Start your

              <span className="block text-red-200">
                employee journey.
              </span>

            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              Create your employee account
              and access your attendance,
              leave, documents, payslips
              and HR services from one
              secure portal.
            </p>

            {/* Features */}

            <div className="mt-10 space-y-4">

              {[
                "Personal HR profile",
                "Attendance & leave management",
                "Documents and payslips",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >

                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <ShieldCheck size={14} />
                  </div>

                  <span className="text-sm text-white/75">
                    {item}
                  </span>

                </div>
              ))}

            </div>

          </div>

          {/* Footer */}

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()}{" "}
            Sellopedia. All rights reserved.
          </p>

        </div>
      </div>

      {/* =================================================
          RIGHT PANEL
      ================================================= */}

      <div className="flex w-full items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* =================================================
              MOBILE LOGO
          ================================================= */}

          <div className="mb-8 flex items-center gap-3 lg:hidden">

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

          <div className="mb-7">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
              <UserPlus size={21} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Create employee account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Register as an employee to
              access the Sellopedia HR portal.
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <span className="mt-0.5 font-bold">
                !
              </span>

              <p>{error}</p>

            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#FE0000]">

              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p>{success}</p>

            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* =================================================
                NAME
            ================================================= */}

            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                PHONE
            ================================================= */}

            <div>

              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone Number

                <span className="ml-1 text-slate-400">
                  (Optional)
                </span>
              </label>

              <div className="relative">

                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

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
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#FE0000] disabled:cursor-not-allowed"
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
                CONFIRM PASSWORD
            ================================================= */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm Password

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={
                    form.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#FE0000] disabled:cursor-not-allowed"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
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
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#FE0000] px-4 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">

                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Creating account...

                </span>
              ) : (
                <span className="flex items-center gap-2">

                  <UserPlus size={17} />

                  Create Account

                </span>
              )}
            </button>

          </form>

          {/* =================================================
              LOGIN
          ================================================= */}

          <p className="mt-7 text-center text-sm text-slate-500">

            Already have an account?{" "}

            <Link
              to="/login"
              className="font-semibold text-[#FE0000] transition hover:text-red-700"
            >
              Sign in
            </Link>

          </p>

          {/* =================================================
              NOTICE
          ================================================= */}

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">

            <p className="text-xs leading-5 text-amber-800">

              <strong>
                Note:
              </strong>{" "}

              Public registration creates an
              employee account only. HR Admin
              and Super Admin accounts can only
              be created by authorized administrators.

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}