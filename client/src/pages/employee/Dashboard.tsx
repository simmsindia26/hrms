import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  WalletCards,
  AlertCircle,
  Bell,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
   TYPES
========================================================= */

interface EmployeeReference {
  _id?: string;
  id?: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Department {
  _id?: string;
  name?: string;
}

interface Designation {
  _id?: string;
  name?: string;
}

interface Employee {
  _id: string;

  employeeId?: string;

  firstName?: string;
  middleName?: string;
  lastName?: string;

  name?: string;
  email?: string;

  phone?: string;

  department?: Department | string | null;

  designation?: Designation | string | null;

  joiningDate?: string;

  employmentType?: string;

  status?: string;

  employmentStatus?: string;

  profilePhoto?: string;
}

interface AttendanceRecord {
  _id: string;

  date?: string;

  status?: string;

  checkIn?: string;

  checkOut?: string;

  workingHours?: number;

  workHours?: number;

  lateMinutes?: number;

  overtimeMinutes?: number;

  remarks?: string;

  createdAt?: string;
}

interface LeaveType {
  _id?: string;

  name?: string;

  code?: string;

  annualQuota?: number;

  daysPerYear?: number;

  maxDays?: number;

  isPaid?: boolean;
}

interface LeaveRecord {
  _id: string;

  leaveType?:
    | LeaveType
    | string
    | null;

  startDate?: string;

  endDate?: string;

  days?: number;

  reason?: string;

  status?: string;

  createdAt?: string;
}

interface PayrollRecord {
  _id: string;

  month?: number;

  year?: number;

  basicSalary?: number;

  grossSalary?: number;

  totalDeductions?: number;

  netSalary?: number;

  status?: string;

  paidAt?: string;

  createdAt?: string;
}

interface DocumentRecord {
  _id: string;

  title?: string;

  type?: string;

  originalFileName?: string;

  fileName?: string;

  mimeType?: string;

  fileSize?: number;

  issuedAt?: string;

  acknowledged?: boolean;

  createdAt?: string;
}

interface NoticeRecord {
  _id: string;

  title?: string;

  description?: string;

  content?: string;

  createdAt?: string;

  publishedAt?: string;

  status?: string;
}

/* =========================================================
   API RESPONSE HELPERS
========================================================= */

function extractArray<T>(
  response: any
): T[] {
  const data = response?.data;

  const candidates = [
    data?.data?.items,
    data?.data?.attendance,
    data?.data?.leaves,
    data?.data?.payroll,
    data?.data?.documents,
    data?.data?.notices,
    data?.items,
    data?.attendance,
    data?.leaves,
    data?.payroll,
    data?.documents,
    data?.notices,
    data?.data,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function extractObject<T>(
  response: any
): T | null {
  const data = response?.data;

  if (!data) {
    return null;
  }

  if (
    data.data &&
    !Array.isArray(data.data) &&
    typeof data.data === "object"
  ) {
    return data.data as T;
  }

  if (
    data.employee &&
    typeof data.employee === "object"
  ) {
    return data.employee as T;
  }

  return null;
}

/* =========================================================
   HELPERS
========================================================= */

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
    return employee;
  }

  return (
    employee._id ||
    employee.id ||
    employee.employeeId ||
    ""
  );
}

function getEmployeeName(
  employee?: Employee | null
): string {
  if (!employee) {
    return "Employee";
  }

  if (
    employee.name &&
    employee.name.trim()
  ) {
    return employee.name.trim();
  }

  return (
    [
      employee.firstName,
      employee.middleName,
      employee.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Employee"
  );
}

function getInitials(
  name: string
): string {
  const parts = name
    .split(" ")
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("") || "E"
  );
}

function getDepartmentName(
  department?:
    | Department
    | string
    | null
): string {
  if (!department) {
    return "";
  }

  if (typeof department === "string") {
    return department;
  }

  return department.name || "";
}

function getDesignationName(
  designation?:
    | Designation
    | string
    | null
): string {
  if (!designation) {
    return "";
  }

  if (typeof designation === "string") {
    return designation;
  }

  return designation.name || "";
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(
  value?: string
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatCurrency(
  value?: number
): string {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  );
}

function isToday(
  value?: string
): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );
}

function normalizeStatus(
  value?: string
): string {
  return (
    value
      ?.toLowerCase()
      .trim()
      .replaceAll("_", "-") || ""
  );
}

function getLeaveTypeName(
  leaveType?:
    | LeaveType
    | string
    | null
): string {
  if (!leaveType) {
    return "Leave";
  }

  if (typeof leaveType === "string") {
    return leaveType;
  }

  return (
    leaveType.name ||
    leaveType.code ||
    "Leave"
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EmployeeDashboard() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  const [leaves, setLeaves] =
    useState<LeaveRecord[]>([]);

  const [payroll, setPayroll] =
    useState<PayrollRecord[]>([]);

  const [documents, setDocuments] =
    useState<DocumentRecord[]>([]);

  const [notices, setNotices] =
    useState<NoticeRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     EMPLOYEE ID
  ======================================================= */

  const employeeId = useMemo(() => {
    return getEmployeeId(
      user?.employee
    );
  }, [user?.employee]);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
    async (
      showRefresh = false
    ) => {
      if (!employeeId) {
        setLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
         * Load all dashboard data together.
         *
         * The existing HRMS backend supports:
         *
         * /hr/employees/:id
         * /hr/attendance?employee=id
         * /hr/leaves?employee=id
         * /hr/payroll?employee=id
         * /documents?employee=id
         * /hr/notices?employee=id
         */

        const results =
          await Promise.allSettled([
            api.get(
              `/hr/employees/${employeeId}`
            ),

            api.get(
              `/hr/attendance?employee=${employeeId}&limit=100`
            ),

            api.get(
              `/hr/leaves?employee=${employeeId}&limit=100`
            ),

            api.get(
              `/hr/payroll?employee=${employeeId}&limit=100`
            ),

            api.get(
              `/hr/documents?employee=${employeeId}`
            ),

            api.get(
              `/hr/notices?employee=${employeeId}&limit=20`
            ),
          ]);

        /* -----------------------------------------------
           EMPLOYEE
        ------------------------------------------------ */

        const employeeResponse =
          results[0];

        if (
          employeeResponse.status ===
          "fulfilled"
        ) {
          const data =
            extractObject<Employee>(
              employeeResponse.value
            );

          if (data) {
            setEmployee(data);
          }
        }

        /* -----------------------------------------------
           ATTENDANCE
        ------------------------------------------------ */

        const attendanceResponse =
          results[1];

        if (
          attendanceResponse.status ===
          "fulfilled"
        ) {
          setAttendance(
            extractArray<AttendanceRecord>(
              attendanceResponse.value
            )
          );
        }

        /* -----------------------------------------------
           LEAVES
        ------------------------------------------------ */

        const leaveResponse =
          results[2];

        if (
          leaveResponse.status ===
          "fulfilled"
        ) {
          setLeaves(
            extractArray<LeaveRecord>(
              leaveResponse.value
            )
          );
        }

        /* -----------------------------------------------
           PAYROLL
        ------------------------------------------------ */

        const payrollResponse =
          results[3];

        if (
          payrollResponse.status ===
          "fulfilled"
        ) {
          setPayroll(
            extractArray<PayrollRecord>(
              payrollResponse.value
            )
          );
        }

        /* -----------------------------------------------
           DOCUMENTS
        ------------------------------------------------ */

        const documentsResponse =
          results[4];

        if (
          documentsResponse.status ===
          "fulfilled"
        ) {
          setDocuments(
            extractArray<DocumentRecord>(
              documentsResponse.value
            )
          );
        }

        /* -----------------------------------------------
           NOTICES
        ------------------------------------------------ */

        const noticesResponse =
          results[5];

        if (
          noticesResponse.status ===
          "fulfilled"
        ) {
          setNotices(
            extractArray<NoticeRecord>(
              noticesResponse.value
            )
          );
        }

        /*
         * Only show an error when the primary
         * employee request failed.
         */

        if (
          employeeResponse.status ===
          "rejected"
        ) {
          setError(
            employeeResponse.reason
              ?.response?.data?.message ||
              "Unable to load employee information."
          );
        }
      } catch (err: any) {
        console.error(
          "Employee dashboard error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadDashboard();
  }, [
    authLoading,
    loadDashboard,
  ]);

  /* =======================================================
     CALCULATED DATA
  ======================================================= */

  const employeeName = useMemo(() => {
    return getEmployeeName(
      employee
    );
  }, [employee]);

  const todayAttendance =
    useMemo(() => {
      return (
        attendance.find((item) =>
          isToday(item.date)
        ) || null
      );
    }, [attendance]);

  const latestPayroll =
    useMemo(() => {
      if (!payroll.length) {
        return null;
      }

      return [...payroll].sort(
        (a, b) => {
          const aDate =
            new Date(
              a.paidAt ||
                a.createdAt ||
                `${a.year || 0}-${a.month || 0}-01`
            ).getTime();

          const bDate =
            new Date(
              b.paidAt ||
                b.createdAt ||
                `${b.year || 0}-${b.month || 0}-01`
            ).getTime();

          return bDate - aDate;
        }
      )[0];
    }, [payroll]);

  const approvedLeaveDays =
    useMemo(() => {
      return leaves
        .filter(
          (leave) =>
            normalizeStatus(
              leave.status
            ) === "approved"
        )
        .reduce(
          (total, leave) =>
            total +
            Number(
              leave.days || 0
            ),
          0
        );
    }, [leaves]);

  /*
   * Calculate leave quota from populated
   * leave types when available.
   */
  const totalLeaveQuota =
    useMemo(() => {
      const quotas =
        leaves
          .map(
            (leave) =>
              typeof leave.leaveType ===
              "object"
                ? Number(
                    leave.leaveType
                      ?.annualQuota ||
                      leave.leaveType
                        ?.daysPerYear ||
                      leave.leaveType
                        ?.maxDays ||
                      0
                  )
                : 0
          )
          .filter(
            (quota) => quota > 0
          );

      /*
       * Remove duplicate quotas where the
       * same leave type appears multiple times.
       */
      return Array.from(
        new Set(quotas)
      ).reduce(
        (sum, quota) =>
          sum + quota,
        0
      );
    }, [leaves]);

  const leaveBalance =
    totalLeaveQuota > 0
      ? Math.max(
          totalLeaveQuota -
            approvedLeaveDays,
          0
        )
      : null;

  const presentDays =
    attendance.filter(
      (item) =>
        normalizeStatus(
          item.status
        ) === "present"
    ).length;

  const absentDays =
    attendance.filter(
      (item) =>
        normalizeStatus(
          item.status
        ) === "absent"
    ).length;

  const pendingLeaves =
    leaves.filter(
      (leave) =>
        normalizeStatus(
          leave.status
        ) === "pending"
    ).length;

  const latestNotices =
    useMemo(() => {
      return [...notices]
        .sort((a, b) => {
          const aDate =
            new Date(
              a.publishedAt ||
                a.createdAt ||
                0
            ).getTime();

          const bDate =
            new Date(
              b.publishedAt ||
                b.createdAt ||
                0
            ).getTime();

          return bDate - aDate;
        })
        .slice(0, 3);
    }, [notices]);

  const recentLeaves =
    useMemo(() => {
      return [...leaves]
        .sort((a, b) => {
          const aDate =
            new Date(
              a.createdAt ||
                a.startDate ||
                0
            ).getTime();

          const bDate =
            new Date(
              b.createdAt ||
                b.startDate ||
                0
            ).getTime();

          return bDate - aDate;
        })
        .slice(0, 3);
    }, [leaves]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="h-32 animate-pulse rounded-2xl bg-white" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              1,
              2,
              3,
              4,
            ].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl bg-white lg:col-span-2" />

            <div className="h-72 animate-pulse rounded-2xl bg-white" />
          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    !employee
  ) {
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={26} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadDashboard()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>

          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50 p-5 sm:p-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
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

                <p className="text-sm font-semibold text-[#FE0000]">
                  Employee Portal
                </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome, {employeeName} 👋
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Here's what's happening with your
                employee account today.
              </p>

              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                loadDashboard(true)
              }
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

          {/* Employee information */}

          <div className="mt-5 flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-3">

              {employee?.profilePhoto ? (
                <img
                  src={
                    employee.profilePhoto
                  }
                  alt={employeeName}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FE0000] text-sm font-bold text-white shadow-sm">
                  {getInitials(
                    employeeName
                  )}
                </div>
              )}

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  {employee?.employeeId ||
                    "Employee"}
                </p>

                <p className="text-xs text-slate-500">
                  {getDepartmentName(
                    employee?.department
                  )}

                  {getDepartmentName(
                    employee?.department
                  ) &&
                    getDesignationName(
                      employee?.designation
                    )
                    ? " • "
                    : ""}

                  {getDesignationName(
                    employee?.designation
                  )}
                </p>

              </div>

            </div>

            {employee?.status && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                {employee.status.replaceAll(
                  "_",
                  " "
                )}
              </span>
            )}

          </div>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Attendance */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Attendance
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {todayAttendance
                    ? normalizeStatus(
                        todayAttendance.status
                      ) === "present"
                      ? "Present"
                      : todayAttendance.status ||
                        "Marked"
                    : "Not Marked"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Today's attendance
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <CalendarCheck size={21} />
              </div>

            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

              <span className="text-xs font-medium text-slate-500">
                {todayAttendance?.checkIn
                  ? `In ${formatTime(
                      todayAttendance.checkIn
                    )}`
                  : "No check-in"}
              </span>

              <Link
                to="/employee/attendance"
                className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
              >
                View
              </Link>

            </div>

          </div>

          {/* Leave */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Leave Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {leaveBalance !== null
                    ? `${leaveBalance} Days`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Available leave
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#FE0000]">
                <CalendarDays size={21} />
              </div>

            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

              <span className="text-xs font-medium text-slate-500">
                {pendingLeaves > 0
                  ? `${pendingLeaves} pending`
                  : "No pending requests"}
              </span>

              <Link
                to="/employee/leave"
                className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
              >
                Manage
              </Link>

            </div>

          </div>

          {/* Payroll */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Latest Payslip
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    latestPayroll?.netSalary
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {latestPayroll
                    ? `${latestPayroll.month || ""}/${latestPayroll.year || ""}`
                    : "No payroll record"}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <WalletCards size={21} />
              </div>

            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

              <span className="text-xs font-medium capitalize text-slate-500">
                {latestPayroll?.status ||
                  "Not available"}
              </span>

              <Link
                to="/employee/payslips"
                className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
              >
                View
              </Link>

            </div>

          </div>

          {/* Documents */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Documents
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {documents.length}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  HR documents
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <FileText size={21} />
              </div>

            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

              <span className="text-xs font-medium text-slate-500">
                Available
              </span>

              <Link
                to="/employee/documents"
                className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
              >
                View
              </Link>

            </div>

          </div>

        </div>

        {/* =================================================
            ATTENDANCE + PROFILE
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Attendance */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Today's Attendance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your attendance information for today.
                </p>

              </div>

              <Link
                to="/employee/attendance"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FE0000] hover:text-red-700"
              >
                View Attendance
                <ArrowRight size={15} />
              </Link>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Status
                </p>

                <p className="mt-1 text-base font-bold capitalize text-slate-900">
                  {todayAttendance?.status ||
                    "Not Marked"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Check In
                </p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  {formatTime(
                    todayAttendance?.checkIn
                  )}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Check Out
                </p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  {formatTime(
                    todayAttendance?.checkOut
                  )}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Working Hours
                </p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  {todayAttendance?.workingHours ??
                    todayAttendance?.workHours ??
                    "—"}
                </p>

              </div>

            </div>

            <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-5">

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2
                  size={15}
                  className="text-emerald-500"
                />

                Present:
                <span className="font-semibold text-slate-700">
                  {presentDays}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3
                  size={15}
                  className="text-blue-500"
                />

                Attendance records:
                <span className="font-semibold text-slate-700">
                  {attendance.length}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertCircle
                  size={15}
                  className="text-red-500"
                />

                Absent:
                <span className="font-semibold text-slate-700">
                  {absentDays}
                </span>
              </div>

            </div>

          </div>

          {/* Employee Profile */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              {employee?.profilePhoto ? (
                <img
                  src={
                    employee.profilePhoto
                  }
                  alt={employeeName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FE0000] font-bold text-white shadow-sm">
                  {getInitials(
                    employeeName
                  )}
                </div>
              )}

              <div>

                <h2 className="font-semibold text-slate-900">
                  {employeeName}
                </h2>

                <p className="text-xs text-slate-500">
                  {employee?.employeeId ||
                    "Employee"}
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Department
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {getDepartmentName(
                    employee?.department
                  ) || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Designation
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {getDesignationName(
                    employee?.designation
                  ) || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Joining Date
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(
                    employee?.joiningDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Employment Type
                </p>

                <p className="mt-1 text-sm font-medium capitalize text-slate-800">
                  {employee?.employmentType?.replaceAll(
                    "_",
                    " "
                  ) || "—"}
                </p>
              </div>

            </div>

            <Link
              to="/employee/profile"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View My Profile
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>

        {/* =================================================
            QUICK SERVICES
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div>

            <h2 className="font-semibold text-slate-900">
              My HR Services
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quickly access your employee services.
            </p>

          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              to="/employee/leave"
              className="group rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-red-50 hover:shadow-sm"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <CalendarDays size={20} />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    Apply for Leave
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Submit and track leave applications.
                  </p>

                </div>

                <ArrowRight
                  size={16}
                  className="mt-0.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
                />

              </div>

            </Link>

            <Link
              to="/employee/documents"
              className="group rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50 hover:shadow-sm"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <FileText size={20} />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    My Documents
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Access your HR documents.
                  </p>

                </div>

                <ArrowRight
                  size={16}
                  className="mt-0.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
                />

              </div>

            </Link>

            <Link
              to="/employee/payslips"
              className="group rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50 hover:shadow-sm"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <WalletCards size={20} />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    Payslips
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    View your salary records.
                  </p>

                </div>

                <ArrowRight
                  size={16}
                  className="mt-0.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
                />

              </div>

            </Link>

            <Link
              to="/employee/attendance"
              className="group rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50 hover:shadow-sm"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#FE0000]">
                <CalendarCheck size={20} />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    Attendance
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    View attendance and working hours.
                  </p>

                </div>

                <ArrowRight
                  size={16}
                  className="mt-0.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#FE0000]"
                />

              </div>

            </Link>

          </div>

        </div>

        {/* =================================================
            RECENT LEAVE + NOTICES
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* Recent Leave */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Recent Leave Requests
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest leave activity.
                </p>

              </div>

              <Link
                to="/employee/leave"
                className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
              >
                View All
              </Link>

            </div>

            <div className="mt-5">

              {recentLeaves.length === 0 ? (
                <div className="rounded-xl bg-slate-50 py-10 text-center">

                  <CalendarDays
                    size={24}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No leave requests
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Your recent leave applications will appear here.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {recentLeaves.map(
                    (leave) => {

                      const status =
                        normalizeStatus(
                          leave.status
                        );

                      return (
                        <div
                          key={leave._id}
                          className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                        >

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                            <CalendarDays size={18} />
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-slate-800">
                              {getLeaveTypeName(
                                leave.leaveType
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(
                                leave.startDate
                              )}

                              {" — "}

                              {formatDate(
                                leave.endDate
                              )}

                              {leave.days
                                ? ` • ${leave.days} day${
                                    Number(
                                      leave.days
                                    ) === 1
                                      ? ""
                                      : "s"
                                  }`
                                : ""}
                            </p>

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                              status ===
                              "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : status ===
                                  "rejected"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {leave.status ||
                              "Pending"}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </div>

          {/* Notices */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Latest Notices
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Important HR announcements.
                </p>

              </div>

              <Link
                to="/employee/notices"
                className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
              >
                View All
              </Link>

            </div>

            <div className="mt-5">

              {latestNotices.length === 0 ? (
                <div className="rounded-xl bg-slate-50 py-10 text-center">

                  <Bell
                    size={24}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No notices
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New HR announcements will appear here.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {latestNotices.map(
                    (notice) => (
                      <div
                        key={notice._id}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                          <Bell size={18} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-semibold text-slate-800">
                            {notice.title ||
                              "HR Notice"}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {notice.description ||
                              notice.content ||
                              "New HR announcement available."}
                          </p>

                          <p className="mt-2 text-[11px] text-slate-400">
                            {formatDate(
                              notice.publishedAt ||
                                notice.createdAt
                            )}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="pb-5 pt-8 text-center">

          <p className="text-xs text-slate-400">
            Need help with HR services? Contact your HR department.
          </p>

        </div>

      </div>
    </div>
  );
}