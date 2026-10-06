import {
  Users,
  UserRoundSearch,
  CalendarCheck,
  WalletCards,
  TrendingUp,
  Clock3,
  UserPlus,
  FileWarning,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import api from "../../lib/axios";

interface DashboardData {
  employees?: number;
  candidates?: number;
  todayAttendance?: number;
  pendingLeaves?: number;
  pendingPayroll?: number;
  openJobs?: number;
  notices?: number;

  // Backend compatibility
  activeJobs?: number;
  payrollPending?: number;
  failedEmails?: number;
  unreadNotifications?: number;
}

interface DashboardCard {
  key:
    | "employees"
    | "candidates"
    | "todayAttendance"
    | "pendingLeaves"
    | "pendingPayroll"
    | "openJobs";

  title: string;
  icon: typeof Users;
  description: string;
}

const cards: DashboardCard[] = [
  {
    key: "employees",
    title: "Total Employees",
    icon: Users,
    description: "Active employees",
  },
  {
    key: "candidates",
    title: "Candidates",
    icon: UserRoundSearch,
    description: "Recruitment candidates",
  },
  {
    key: "todayAttendance",
    title: "Today's Attendance",
    icon: CalendarCheck,
    description: "Attendance marked today",
  },
  {
    key: "pendingLeaves",
    title: "Pending Leaves",
    icon: Clock3,
    description: "Leave requests awaiting review",
  },
  {
    key: "pendingPayroll",
    title: "Pending Payroll",
    icon: WalletCards,
    description: "Payroll records awaiting processing",
  },
  {
    key: "openJobs",
    title: "Open Positions",
    icon: UserPlus,
    description: "Currently active job openings",
  },
];

function getDashboardValue(
  data: DashboardData,
  key: DashboardCard["key"]
): number {
  switch (key) {
    case "employees":
      return Number(data.employees ?? 0);

    case "candidates":
      return Number(data.candidates ?? 0);

    case "todayAttendance":
      return Number(data.todayAttendance ?? 0);

    case "pendingLeaves":
      return Number(data.pendingLeaves ?? 0);

    case "pendingPayroll":
      return Number(
        data.pendingPayroll ??
          data.payrollPending ??
          0
      );

    case "openJobs":
      return Number(
        data.openJobs ??
          data.activeJobs ??
          0
      );

    default:
      return 0;
  }
}

function extractDashboardData(
  responseData: any
): DashboardData {
  return (
    responseData?.data?.data ||
    responseData?.data ||
    responseData ||
    {}
  );
}

export default function HRDashboard() {
  const [data, setData] =
    useState<DashboardData>({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(
    async (
      showRefresh = false
    ) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await api.get(
            "/hr/dashboard"
          );

        const dashboardData =
          extractDashboardData(
            response.data
          );

        setData(
          dashboardData
        );
      } catch (error: any) {
        console.error(
          "HR dashboard error:",
          error
        );

        setError(
          error?.response?.data
            ?.message ||
            "Failed to load HR dashboard."
        );

        setData({});
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getValue = (
    key: DashboardCard["key"]
  ) => {
    if (loading) {
      return "—";
    }

    return getDashboardValue(
      data,
      key
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 sm:p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

        <div className="flex items-start gap-3">
          <img
            src="/logo.png"
            alt="Sellopedia"
            className="mt-1 h-9 w-auto object-contain"
          />
          <div>          <p className="text-sm font-semibold text-[#FE0000]">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            HR Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor your organization's HR
            operations from one place.
          </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
            <TrendingUp
              size={17}
              className="text-emerald-500"
            />

            HR Operations
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>
      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-red-800">
              Dashboard could not be loaded
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>

        </div>
      )}


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {cards.map(
          (card) => {
            const Icon =
              card.icon;

            const value =
              getValue(
                card.key
              );

            return (
              <div
                key={card.key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

                <div className="flex items-start justify-between">

                  <div className="min-w-0">

                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {card.description}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#FE0000]">
                    <Icon
                      size={21}
                    />
                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>


      {/* =====================================================
          LOWER SECTION
      ===================================================== */}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">


        {/* ===================================================
            HR OPERATIONS
        =================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="mb-6">

            <h2 className="font-semibold text-slate-900">
              HR Operations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage your organization's
              workforce activity.
            </p>

          </div>


          <div className="grid gap-4 sm:grid-cols-2">


            {/* Attendance */}

            <a
              href="/hr/attendance"
              className="group rounded-xl border border-transparent bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <CalendarCheck
                    size={18}
                    className="text-[#FE0000]"
                  />

                  <span className="text-sm font-semibold text-slate-800">
                    Attendance
                  </span>

                </div>

                <ArrowRight
                  size={15}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
                />

              </div>

              <p className="text-sm text-slate-500">
                Track employee attendance,
                late arrivals and absences.
              </p>

            </a>


            {/* Payroll */}

            <a
              href="/hr/payroll"
              className="group rounded-xl border border-transparent bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <WalletCards
                    size={18}
                    className="text-emerald-600"
                  />

                  <span className="text-sm font-semibold text-slate-800">
                    Payroll
                  </span>

                </div>

                <ArrowRight
                  size={15}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                />

              </div>

              <p className="text-sm text-slate-500">
                Manage monthly payroll and
                salary calculations.
              </p>

            </a>


            {/* Recruitment */}

            <a
              href="/hr/recruitment"
              className="group rounded-xl border border-transparent bg-slate-50 p-4 transition hover:border-violet-200 hover:bg-violet-50"
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <UserRoundSearch
                    size={18}
                    className="text-violet-600"
                  />

                  <span className="text-sm font-semibold text-slate-800">
                    Recruitment
                  </span>

                </div>

                <ArrowRight
                  size={15}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-600"
                />

              </div>

              <p className="text-sm text-slate-500">
                Manage candidates, interviews,
                offers and selection.
              </p>

            </a>


            {/* Notices */}

            <a
              href="/hr/notices"
              className="group rounded-xl border border-transparent bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50"
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <FileWarning
                    size={18}
                    className="text-orange-600"
                  />

                  <span className="text-sm font-semibold text-slate-800">
                    HR Notices
                  </span>

                </div>

                <ArrowRight
                  size={15}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600"
                />

              </div>

              <p className="text-sm text-slate-500">
                Manage employee notices and
                communications.
              </p>

            </a>

          </div>

        </div>


        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-semibold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Frequently used HR modules.
          </p>


          <div className="mt-5 space-y-3">


            <a
              href="/hr/recruitment"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-red-200 hover:bg-red-50"
            >

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Manage Recruitment
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Candidates & interviews
                </p>

              </div>

              <ArrowRight
                size={16}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
              />

            </a>


            <a
              href="/hr/employees"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-red-200 hover:bg-red-50"
            >

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Employees
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  View employee records
                </p>

              </div>

              <ArrowRight
                size={16}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
              />

            </a>


            <a
              href="/hr/attendance"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-red-200 hover:bg-red-50"
            >

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Attendance
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Today's attendance
                </p>

              </div>

              <ArrowRight
                size={16}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
              />

            </a>


            <a
              href="/hr/payroll"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-red-200 hover:bg-red-50"
            >

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Payroll
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Monthly salary processing
                </p>

              </div>

              <ArrowRight
                size={16}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
              />

            </a>


            <a
              href="/hr/leaves"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-red-200 hover:bg-red-50"
            >

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Leave Management
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Review leave requests
                </p>

              </div>

              <ArrowRight
                size={16}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
              />

            </a>

          </div>

        </div>

      </div>

    </div>
  );
}