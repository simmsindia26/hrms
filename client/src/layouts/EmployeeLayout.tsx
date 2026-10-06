import {
  useState,
  type ReactNode,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  UserCircle,
  CalendarCheck,
  CalendarDays,
  FileText,
  WalletCards,
  Megaphone,
  Bell,
  KeyRound,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

// =====================================================
// TYPES
// =====================================================

interface EmployeeReference {
  _id?: string;
  employeeId?: string;

  name?: string;
  firstName?: string;
  lastName?: string;

  email?: string;

  department?:
    | string
    | {
        _id?: string;
        name?: string;
      };

  designation?:
    | string
    | {
        _id?: string;
        name?: string;
      };
}

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
}

// =====================================================
// MENU
// =====================================================

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/employee/dashboard",
    icon: <LayoutDashboard size={19} />,
  },
  {
    label: "My Profile",
    path: "/employee/profile",
    icon: <UserCircle size={19} />,
  },
  {
    label: "Attendance",
    path: "/employee/attendance",
    icon: <CalendarCheck size={19} />,
  },
  {
    label: "Leave",
    path: "/employee/leave",
    icon: <CalendarDays size={19} />,
  },
  {
    label: "Documents",
    path: "/employee/documents",
    icon: <FileText size={19} />,
  },
  {
    label: "Payslips",
    path: "/employee/payslips",
    icon: <WalletCards size={19} />,
  },
  {
    label: "Notices",
    path: "/employee/notices",
    icon: <Megaphone size={19} />,
  },
  {
    label: "Notifications",
    path: "/employee/notifications",
    icon: <Bell size={19} />,
  },
  {
    label: "Change Password",
    path: "/employee/change-password",
    icon: <KeyRound size={19} />,
  },
];

// =====================================================
// EMPLOYEE HELPERS
// =====================================================

function getEmployeeName(
  employee:
    | string
    | EmployeeReference
    | null
    | undefined,
  fallbackName?: string,
  fallbackEmail?: string
): string {
  if (!employee) {
    return (
      fallbackName ||
      fallbackEmail?.split("@")[0] ||
      "Employee"
    );
  }

  if (typeof employee === "string") {
    return (
      fallbackName ||
      fallbackEmail?.split("@")[0] ||
      "Employee"
    );
  }

  if (employee.name?.trim()) {
    return employee.name.trim();
  }

  const fullName =
    `${employee.firstName || ""} ${
      employee.lastName || ""
    }`.trim();

  if (fullName) {
    return fullName;
  }

  return (
    fallbackName ||
    employee.email?.split("@")[0] ||
    fallbackEmail?.split("@")[0] ||
    "Employee"
  );
}

function getEmployeeId(
  employee:
    | string
    | EmployeeReference
    | null
    | undefined
): string {
  if (!employee) {
    return "";
  }

  if (typeof employee === "string") {
    return "";
  }

  return employee.employeeId || "";
}

// =====================================================
// COMPONENT
// =====================================================

export default function EmployeeLayout() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  // ===================================================
  // EMPLOYEE
  // ===================================================

  const employee =
    user?.employee as
      | string
      | EmployeeReference
      | null
      | undefined;

  const employeeName = getEmployeeName(
    employee,
    user?.name,
    user?.email
  );

  const employeeId =
    getEmployeeId(employee);

  const initials = employeeName
    .split(" ")
    .filter(
      (word: string) =>
        word.length > 0
    )
    .slice(0, 2)
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase()
    )
    .join("");

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/employee/dashboard"
              )
            }
            className="flex items-center gap-3"
          >

            {/* Sellopedia Logo */}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-11 w-11 object-contain"
              />
            </div>

            <div className="text-left">

              <div className="text-lg font-bold tracking-tight text-slate-900">
                Sellopedia
              </div>

              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Employee Portal
              </div>

            </div>

          </button>

          {/* Mobile Close */}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-[#FE0000] lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">

          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Employee Menu
          </div>

          <div className="space-y-1">

            {menuItems.map(
              (item: MenuItem) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={({
                    isActive,
                  }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-3",
                      "text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-red-50 text-[#FE0000] shadow-sm"
                        : "text-slate-600 hover:bg-red-50/70 hover:text-[#FE0000]",
                    ].join(" ")
                  }
                >
                  {item.icon}

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              )
            )}

          </div>

        </nav>

        {/* =================================================
            EMPLOYEE CARD
        ================================================= */}

        <div className="border-t border-slate-200 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-red-50/50">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-100 text-sm font-bold text-[#FE0000]">
              {initials || "E"}
            </div>

            <div className="min-w-0">

              <div className="truncate text-sm font-semibold text-slate-800">
                {employeeName}
              </div>

              <div className="truncate text-xs text-slate-500">
                {employeeId || "Employee"}
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={19} />

            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="lg:pl-72">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">

          {/* LEFT */}

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-xl p-2 text-slate-600 transition hover:bg-red-50 hover:text-[#FE0000] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>

              <h1 className="text-base font-semibold text-slate-900">
                Employee Portal
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your employment information
              </p>

            </div>

          </div>

          {/* RIGHT */}

          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (value: boolean) =>
                    !value
                )
              }
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-red-50"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-[#FE0000]">
                {initials || "E"}
              </div>

              <div className="hidden text-left sm:block">

                <div className="max-w-36 truncate text-sm font-semibold text-slate-800">
                  {employeeName}
                </div>

                <div className="text-[11px] text-slate-500">
                  Employee
                </div>

              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {/* =================================================
                PROFILE DROPDOWN
            ================================================= */}

            {profileOpen && (
              <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(
                      "/employee/profile"
                    );
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-red-50 hover:text-[#FE0000]"
                >
                  <UserCircle size={17} />

                  My Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(
                      "/employee/change-password"
                    );
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-red-50 hover:text-[#FE0000]"
                >
                  <KeyRound size={17} />

                  Change Password
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />

                  Logout
                </button>

              </div>
            )}

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}