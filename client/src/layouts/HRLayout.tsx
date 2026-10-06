import {
  useState,
} from "react";

import {
  Outlet,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserRoundSearch,
  CalendarCheck,
  CalendarDays,
  FileText,
  Megaphone,
  WalletCards,
  Mail,
  Bell,
  Building2,
  BriefcaseBusiness,
  Settings,
  ClipboardList,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CircleDollarSign,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const mainNavigation = [
  {
    label: "Dashboard",
    path: "/hr/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Recruitment",
    path: "/hr/recruitment",
    icon: UserRoundSearch,
  },
    {
    label: "Add Job",
    path: "/hr/recruitment/jobs/new",
    icon: UserRoundSearch,
  },
  {
    label: "Employees",
    path: "/hr/employees",
    icon: Users,
  },
  {
    label: "Salary Structures",
    path: "/hr/salary-structures",
    icon: CircleDollarSign,
  },
  {
    label: "Attendance",
    path: "/hr/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Leave Management",
    path: "/hr/leave",
    icon: CalendarDays,
  },
  {
    label: "Leave Types",
    path: "/hr/leave-types",
    icon: CalendarDays,
  },
  {
    label: "Documents",
    path: "/hr/documents",
    icon: FileText,
  },
  {
    label: "Notices",
    path: "/hr/notices",
    icon: Megaphone,
  },
  {
    label: "Payroll",
    path: "/hr/payroll",
    icon: WalletCards,
  },
  {
    label: "Mail",
    path: "/hr/mail",
    icon: Mail,
  },
  {
    label: "Notifications",
    path: "/hr/notifications",
    icon: Bell,
  },
];

const adminNavigation = [
  {
    label: "User Management",
    path: "/hr/users",
    icon: ShieldCheck,
  },
  {
    label: "Departments",
    path: "/hr/departments",
    icon: Building2,
  },
  {
    label: "Designations",
    path: "/hr/designations",
    icon: BriefcaseBusiness,
  },
  {
    label: "Organization",
    path: "/hr/organization",
    icon: Settings,
  },
  {
    label: "Audit Logs",
    path: "/hr/audit-logs",
    icon: ClipboardList,
  },
];

export default function HRLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

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

        {/* Logo / Brand */}

        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FE0000] text-white shadow-lg shadow-red-500/20">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Sellopedia
              </p>

              <p className="text-[11px] text-slate-500">
                HRD Management
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#FE0000] lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

        </div>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}

        <div className="flex-1 overflow-y-auto px-4 py-5">

          {/* Main Menu */}

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">

            {mainNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                    group flex items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-red-50 text-[#FE0000] shadow-sm"
                        : "text-slate-600 hover:bg-red-50/70 hover:text-[#FE0000]"
                    }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className="shrink-0"
                      />

                      <span>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}

          </nav>

          {/* =====================================================
              ADMINISTRATION
          ====================================================== */}

          {user?.role === "super_admin" && (
            <div className="mt-8">

              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Administration
              </p>

              <nav className="space-y-1">

                {adminNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() =>
                        setSidebarOpen(false)
                      }
                      className={({ isActive }) =>
                        `
                        group flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-sm font-medium
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-red-50 text-[#FE0000] shadow-sm"
                            : "text-slate-600 hover:bg-red-50/70 hover:text-[#FE0000]"
                        }
                        `
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={18}
                            strokeWidth={
                              isActive
                                ? 2.2
                                : 1.8
                            }
                            className="shrink-0"
                          />

                          <span>
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}

              </nav>

            </div>
          )}

        </div>

        {/* =====================================================
            SIDEBAR FOOTER
        ====================================================== */}

        <div className="border-t border-slate-100 p-4">

          <div className="rounded-xl bg-slate-50 p-3 transition hover:bg-red-50/50">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-[#FE0000]">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.role === "super_admin"
                    ? "Super Admin"
                    : "HR Admin"}
                </p>

              </div>

            </div>

          </div>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:pl-72">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">

          {/* Left */}

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-xl p-2 text-slate-600 transition hover:bg-red-50 hover:text-[#FE0000] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                HR Administration
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your workforce and HR operations
              </p>
            </div>

          </div>

          {/* =====================================================
              PROFILE
          ====================================================== */}

          <div className="relative">

            <button
              onClick={() =>
                setProfileOpen(
                  (value) => !value
                )
              }
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-red-50"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-[#FE0000]">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div className="hidden text-left sm:block">

                <p className="text-sm font-semibold text-slate-800">
                  {user?.name}
                </p>

                <p className="text-[11px] text-slate-500">
                  {user?.role ===
                  "super_admin"
                    ? "Super Admin"
                    : "HR Admin"}
                </p>

              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {/* Profile Dropdown */}

            {profileOpen && (
              <>
                {/* Desktop outside click layer */}

                <div
                  className="fixed inset-0 z-[-1]"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                />

                <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

                  {/* User Info */}

                  <div className="border-b border-slate-100 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-[#FE0000]">
                        {user?.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-slate-800">
                          {user?.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {user?.email}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Logout */}

                  <button
                    onClick={
                      handleLogout
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />

                    Sign out
                  </button>

                </div>
              </>
            )}

          </div>

        </header>

        {/* =====================================================
            PAGE CONTENT
        ====================================================== */}

        <main className="min-h-[calc(100vh-5rem)]">
          <Outlet />
        </main>

      </div>

    </div>
  );
}