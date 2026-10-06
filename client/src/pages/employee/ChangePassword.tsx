import { useState } from "react";
import type { FormEvent } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";

import api from "../../lib/axios";

const EmployeeChangePassword = () => {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Password Strength                                                        */
  /* ------------------------------------------------------------------------ */

  const passwordStrength = (() => {
    if (!newPassword) {
      return {
        label: "Enter a password",
        width: "0%",
        className: "bg-slate-200",
      };
    }

    let score = 0;

    if (newPassword.length >= 8) {
      score++;
    }

    if (/[A-Z]/.test(newPassword)) {
      score++;
    }

    if (/[a-z]/.test(newPassword)) {
      score++;
    }

    if (/[0-9]/.test(newPassword)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(newPassword)) {
      score++;
    }

    if (score <= 2) {
      return {
        label: "Weak",
        width: "35%",
        className: "bg-red-500",
      };
    }

    if (score <= 3) {
      return {
        label: "Medium",
        width: "65%",
        className: "bg-amber-500",
      };
    }

    return {
      label: "Strong",
      width: "100%",
      className: "bg-emerald-500",
    };
  })();

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword.trim()) {
      setError(
        "Please enter your current password.",
      );
      return;
    }

    if (!newPassword.trim()) {
      setError(
        "Please enter your new password.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must contain at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match.",
      );
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
      );

      setSuccess(
        response.data?.message ||
          "Password changed successfully.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(
        "Change password failed:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to change password. Please check your current password and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">

            {/* Sellopedia Logo */}
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FE0000]">
                Sellopedia
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                Change Password
              </h1>

              <p className="text-sm text-slate-500">
                Update your account password securely
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ---------------------------------------------------------------- */}
          {/* Form                                                             */}
          {/* ---------------------------------------------------------------- */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6">
              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-red-50 p-2.5">
                  <KeyRound
                    size={20}
                    className="text-[#FE0000]"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Update Password
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter your current password and choose
                    a new secure password.
                  </p>
                </div>

              </div>
            </div>

            {/* Success */}
            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <span>{success}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Current Password
                </label>

                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="currentPassword"
                    type={
                      showCurrent
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrent(
                        (value) => !value,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#FE0000]"
                    aria-label={
                      showCurrent
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showCurrent ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  New Password
                </label>

                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="newPassword"
                    type={
                      showNew
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNew(
                        (value) => !value,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#FE0000]"
                    aria-label={
                      showNew
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showNew ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* Password Strength */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Password strength
                      </span>

                      <span
                        className={`text-xs font-semibold ${
                          passwordStrength.label ===
                          "Weak"
                            ? "text-red-600"
                            : passwordStrength.label ===
                              "Medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${passwordStrength.className}`}
                        style={{
                          width:
                            passwordStrength.width,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm New Password
                </label>

                <div className="relative">
                  <ShieldCheck
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:ring-2 ${
                      confirmPassword &&
                      newPassword !==
                        confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#FE0000] focus:ring-red-100"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(
                        (value) => !value,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#FE0000]"
                    aria-label={
                      showConfirm
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {confirmPassword &&
                  newPassword !==
                    confirmPassword && (
                    <p className="mt-2 text-xs text-red-600">
                      Passwords do not match.
                    </p>
                  )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000] disabled:opacity-50"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Security Information                                             */}
          {/* ---------------------------------------------------------------- */}

          <div className="space-y-4">

            {/* Security Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-red-100">
                <img
                  src="/logo.png"
                  alt="Sellopedia"
                  className="h-full w-full object-contain p-1.5"
                />
              </div>

              <h3 className="font-semibold text-slate-900">
                Password Security
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Use a strong password that is difficult
                for others to guess.
              </p>

              <ul className="mt-5 space-y-3 text-sm text-slate-600">

                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  At least 8 characters
                </li>

                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  Use uppercase and lowercase letters
                </li>

                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  Include numbers
                </li>

                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  Include special characters
                </li>

              </ul>
            </div>

            {/* Security Tip */}
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <div className="flex gap-3">

                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-[#FE0000]"
                />

                <div>
                  <h3 className="font-semibold text-red-900">
                    Security Tip
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    Never share your HRMS password with
                    another person or use your company
                    password on an untrusted website.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeChangePassword;