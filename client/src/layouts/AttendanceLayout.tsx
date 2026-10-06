import { Outlet, NavLink } from "react-router-dom";
import {
  Clock3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AttendanceLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>

        <div className="ml-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
            <Clock3 size={20} className="text-white" />
          </div>

          <div>
            <h1 className="text-sm font-bold">Attendance</h1>
            <p className="text-xs text-gray-500">Terminal</p>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white
          transform transition-transform duration-200
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
              <Clock3 size={22} className="text-white" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-gray-900">
                Attendance
              </h1>

              <p className="text-xs text-gray-500">
                Attendance Terminal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Attendance
          </p>

          <NavLink
            to="/attendance/terminal"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `
              flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium
              transition
              ${
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-red-50 hover:text-red-600"
              }
              `
            }
          >
            <Clock3 size={20} />

            <span>Attendance Terminal</span>
          </NavLink>
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen lg:pl-64">
        {/* Desktop top bar */}
        <div className="hidden h-16 border-b border-gray-200 bg-white lg:flex items-center justify-between px-8">
          <div>
            <h2 className="text-lg font-semibold">
              Attendance Terminal
            </h2>

            <p className="text-xs text-gray-500">
              Employee attendance management
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>

        {/* Mobile spacing */}
        <div className="pt-16 lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}