import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();

  // -----------------------------------------------------
  // AUTH SESSION IS STILL BEING RESTORED
  // -----------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // NOT LOGGED IN
  // -----------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const role = user.role;

  // -----------------------------------------------------
  // ROLE NOT ALLOWED FOR CURRENT ROUTE
  // -----------------------------------------------------

  if (
    allowedRoles &&
    !allowedRoles.includes(role)
  ) {
    // Employee must ALWAYS remain in employee portal
    if (role === "employee") {
      return (
        <Navigate
          to="/employee/dashboard"
          replace
        />
      );
    }

    // HR and Super Admin use HR portal
    if (
      role === "hr" ||
      role === "super_admin"
    ) {
      return (
        <Navigate
          to="/hr/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}