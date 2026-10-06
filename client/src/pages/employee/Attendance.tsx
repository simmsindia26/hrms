import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  LogIn,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
} from "lucide-react";

import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "half_day"
  | "leave"
  | "holiday"
  | "weekend"
  | "pending"
  | "unknown";

interface AttendanceRecord {
  _id: string;

  date?: string;
  attendanceDate?: string;

  status?: AttendanceStatus | string;

  checkIn?: string;
  checkOut?: string;

  inTime?: string;
  outTime?: string;

  workHours?: number | string;
  totalHours?: number | string;
  hoursWorked?: number | string;

  lateMinutes?: number;
  overtimeMinutes?: number;

  remarks?: string;
  note?: string;

  employee?:
    | string
    | {
        _id?: string;
        employeeId?: string;
        name?: string;
      };
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  holidays: number;
  weekends: number;
  totalWorkingDays: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string {
  if (isObject(error)) {
    const apiError = error as ApiError;

    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }

    if (apiError.message) {
      return apiError.message;
    }
  }

  return "Unable to load attendance.";
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecordDate(record: AttendanceRecord): string {
  return record.date || record.attendanceDate || "";
}

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatHours(value?: number | string): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  const hours = Math.floor(numeric);

  const minutes = Math.round((numeric - hours) * 60);

  return `${hours}h ${minutes}m`;
}

function getStatusLabel(status?: string): string {
  if (!status) {
    return "Unknown";
  }

  switch (status.toLowerCase()) {
    case "half_day":
      return "Half Day";

    case "present":
      return "Present";

    case "absent":
      return "Absent";

    case "late":
      return "Late";

    case "leave":
      return "Leave";

    case "holiday":
      return "Holiday";

    case "weekend":
      return "Weekend";

    case "pending":
      return "Pending";

    default:
      return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function getStatusClasses(status?: string): string {
  switch (status?.toLowerCase()) {
    case "present":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "late":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "absent":
      return "border-red-200 bg-red-50 text-red-700";

    case "half_day":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "leave":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "holiday":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "weekend":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "pending":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getStatusIcon(status?: string): ReactNode {
  switch (status?.toLowerCase()) {
    case "present":
      return <CheckCircle2 className="h-4 w-4" />;

    case "absent":
      return <XCircle className="h-4 w-4" />;

    case "late":
      return <Timer className="h-4 w-4" />;

    case "half_day":
      return <AlertCircle className="h-4 w-4" />;

    case "leave":
      return <CalendarDays className="h-4 w-4" />;

    default:
      return <Clock3 className="h-4 w-4" />;
  }
}

function extractRecords(payload: unknown): AttendanceRecord[] {
  if (Array.isArray(payload)) {
    return payload as AttendanceRecord[];
  }

  if (!isObject(payload)) {
    return [];
  }

  const candidates: unknown[] = [
    payload.attendance,
    payload.records,
    payload.items,
    payload.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as AttendanceRecord[];
    }

    if (isObject(candidate)) {
      const nestedCandidates: unknown[] = [
        candidate.attendance,
        candidate.records,
        candidate.items,
      ];

      for (const nested of nestedCandidates) {
        if (Array.isArray(nested)) {
          return nested as AttendanceRecord[];
        }
      }
    }
  }

  return [];
}

function extractSummary(
  payload: unknown
): Partial<AttendanceSummary> {
  if (!isObject(payload)) {
    return {};
  }

  const candidates: unknown[] = [payload.summary];

  if (isObject(payload.data)) {
    candidates.push(payload.data.summary);
  }

  for (const candidate of candidates) {
    if (isObject(candidate)) {
      return candidate as Partial<AttendanceSummary>;
    }
  }

  return {};
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function EmployeeAttendance() {
  const { user } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const [selectedMonth, setSelectedMonth] = useState<Date>(
    () => new Date()
  );

  const [summary, setSummary] = useState<AttendanceSummary>({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    holidays: 0,
    weekends: 0,
    totalWorkingDays: 0,
  });

  /* ------------------------------------------------------------------------ */
  /* Employee ID                                                              */
  /* ------------------------------------------------------------------------ */

  const employeeId = useMemo<string>(() => {
    const employee = user?.employee;

    if (!employee) {
      return "";
    }

    if (typeof employee === "string") {
      return employee;
    }

    return employee._id || employee.id || "";
  }, [user]);

  /* ------------------------------------------------------------------------ */
  /* Month                                                                    */
  /* ------------------------------------------------------------------------ */

  const monthStart = useMemo(() => {
    return new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1
    );
  }, [selectedMonth]);

  const monthEnd = useMemo(() => {
    return new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    );
  }, [selectedMonth]);

  /* ------------------------------------------------------------------------ */
  /* Calculate Summary                                                        */
  /* ------------------------------------------------------------------------ */

  const calculateSummary = (
    attendanceRecords: AttendanceRecord[]
  ) => {
    const calculated: AttendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
      holidays: 0,
      weekends: 0,
      totalWorkingDays: 0,
    };

    attendanceRecords.forEach((record) => {
      const status = record.status?.toLowerCase();

      switch (status) {
        case "present":
          calculated.present += 1;
          calculated.totalWorkingDays += 1;
          break;

        case "late":
          calculated.late += 1;
          calculated.present += 1;
          calculated.totalWorkingDays += 1;
          break;

        case "absent":
          calculated.absent += 1;
          calculated.totalWorkingDays += 1;
          break;

        case "half_day":
          calculated.halfDay += 1;
          calculated.totalWorkingDays += 1;
          break;

        case "leave":
          calculated.leave += 1;
          break;

        case "holiday":
          calculated.holidays += 1;
          break;

        case "weekend":
          calculated.weekends += 1;
          break;

        default:
          break;
      }
    });

    setSummary(calculated);
  };

  /* ------------------------------------------------------------------------ */
  /* Load Attendance                                                          */
  /* ------------------------------------------------------------------------ */

  const loadAttendance = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const startDate = getDateString(monthStart);
        const endDate = getDateString(monthEnd);

        const response = await api.get("/hr/attendance", {
          params: {
            employee: employeeId || undefined,
            employeeId: employeeId || undefined,

            dateFrom: startDate,
            dateTo: endDate,

            startDate,
            endDate,

            page: 1,
            limit: 100,
          },
        });

        const payload = response.data;

        const extractedRecords = extractRecords(payload);

        const extractedSummary = extractSummary(payload);

        setRecords(extractedRecords);

        if (Object.keys(extractedSummary).length > 0) {
          const summaryRecord =
            extractedSummary as Record<string, unknown>;

          setSummary({
            present: Number(extractedSummary.present) || 0,

            absent: Number(extractedSummary.absent) || 0,

            late: Number(extractedSummary.late) || 0,

            halfDay:
              Number(extractedSummary.halfDay) ||
              Number(summaryRecord.half_day) ||
              0,

            leave: Number(extractedSummary.leave) || 0,

            holidays: Number(extractedSummary.holidays) || 0,

            weekends: Number(extractedSummary.weekends) || 0,

            totalWorkingDays:
              Number(extractedSummary.totalWorkingDays) || 0,
          });
        } else {
          calculateSummary(extractedRecords);
        }
      } catch (err: unknown) {
        console.error("Failed to load attendance:", err);

        setError(getErrorMessage(err));
        setRecords([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId, monthStart, monthEnd]
  );

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  /* ------------------------------------------------------------------------ */
  /* Month Navigation                                                         */
  /* ------------------------------------------------------------------------ */

  const goPreviousMonth = () => {
    setSelectedMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  };

  const goNextMonth = () => {
    setSelectedMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  };

  const goCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  /* ------------------------------------------------------------------------ */
  /* Attendance Percentage                                                    */
  /* ------------------------------------------------------------------------ */

  const attendancePercentage = useMemo(() => {
    if (summary.totalWorkingDays <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (summary.present / summary.totalWorkingDays) * 100
      )
    );
  }, [summary]);

  /* ------------------------------------------------------------------------ */
  /* Sort Records                                                             */
  /* ------------------------------------------------------------------------ */

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateA = new Date(getRecordDate(a)).getTime();

      const dateB = new Date(getRecordDate(b)).getTime();

      return dateB - dateA;
    });
  }, [records]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
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

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Attendance
                </h1>
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              View your attendance, working hours and daily
              attendance history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAttendance(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Month Selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5">
                <CalendarDays className="h-5 w-5 text-[#FE0000]" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Attendance Period
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {getMonthName(selectedMonth)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPreviousMonth}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goCurrentMonth}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
              >
                Current Month
              </button>

              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Present"
            value={summary.present}
            subtitle="Days present"
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Absent"
            value={summary.absent}
            subtitle="Days absent"
            icon={<XCircle className="h-5 w-5" />}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Late"
            value={summary.late}
            subtitle="Late arrivals"
            icon={<Timer className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Leave"
            value={summary.leave}
            subtitle="Approved / recorded"
            icon={<CalendarDays className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-600"
          />
        </div>

        {/* Overview */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Attendance Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Attendance Rate
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {attendancePercentage}%
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3">
                <BadgeCheck className="h-6 w-6 text-[#FE0000]" />
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#FE0000] transition-all duration-500"
                style={{
                  width: `${attendancePercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {summary.present} present out of{" "}
              {summary.totalWorkingDays ||
                summary.present +
                  summary.absent +
                  summary.halfDay}{" "}
              working days
            </p>
          </div>

          {/* Working Days */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Working Days
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {summary.totalWorkingDays}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat
                label="Half Day"
                value={summary.halfDay}
              />

              <MiniStat
                label="Holidays"
                value={summary.holidays}
              />

              <MiniStat
                label="Weekends"
                value={summary.weekends}
              />

              <MiniStat
                label="Leave"
                value={summary.leave}
              />
            </div>
          </div>

          {/* Month Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Month Information
            </p>

            <div className="mt-4 space-y-4">
              <InfoRow
                label="Period"
                value={`${formatDate(
                  getDateString(monthStart)
                )} - ${formatDate(
                  getDateString(monthEnd)
                )}`}
              />

            

              <InfoRow
                label="Records"
                value={String(records.length)}
              />
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Attendance History
              </h2>

              <p className="text-xs text-slate-500">
                Daily attendance records for{" "}
                {getMonthName(selectedMonth)}
              </p>
            </div>

            <span className="text-sm font-medium text-slate-500">
              {records.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-[#FE0000]" />

                <p className="text-sm text-slate-500">
                  Loading attendance...
                </p>
              </div>
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-red-50 p-4">
                <CalendarDays className="h-7 w-7 text-[#FE0000]" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No attendance records
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                There are no attendance records available
                for {getMonthName(selectedMonth)}.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-212.5">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Check In
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Check Out
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Working Hours
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedRecords.map((record, index) => (
                      <AttendanceRow
                        key={
                          record._id ||
                          `${getRecordDate(record)}-${index}`
                        }
                        record={record}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {sortedRecords.map((record, index) => (
                  <AttendanceMobileCard
                    key={
                      record._id ||
                      `${getRecordDate(record)}-${index}`
                    }
                    record={record}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  iconClass: string;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini Stat                                                                  */
/* -------------------------------------------------------------------------- */

interface MiniStatProps {
  label: string;
  value: number;
}

function MiniStat({
  label,
  value,
}: MiniStatProps) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-lg font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Info Row                                                                   */
/* -------------------------------------------------------------------------- */

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Attendance Row                                                             */
/* -------------------------------------------------------------------------- */

interface AttendanceRowProps {
  record: AttendanceRecord;
}

function AttendanceRow({
  record,
}: AttendanceRowProps) {
  const checkIn = record.checkIn || record.inTime;

  const checkOut =
    record.checkOut || record.outTime;

  const workHours =
    record.workHours ??
    record.totalHours ??
    record.hoursWorked;

  const remarks =
    record.remarks ||
    record.note ||
    "—";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-red-50 p-2">
            <CalendarDays className="h-4 w-4 text-[#FE0000]" />
          </div>

          <span className="text-sm font-semibold text-slate-800">
            {formatDate(getRecordDate(record))}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            record.status
          )}`}
        >
          {getStatusIcon(record.status)}
          {getStatusLabel(record.status)}
        </span>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <LogIn className="h-4 w-4 text-emerald-500" />
          {formatTime(checkIn)}
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <LogOut className="h-4 w-4 text-red-500" />
          {formatTime(checkOut)}
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock3 className="h-4 w-4 text-[#FE0000]" />
          {formatHours(workHours)}
        </div>
      </td>

      <td className="max-w-xs px-6 py-4">
        <span className="block truncate text-sm text-slate-500">
          {remarks}
        </span>
      </td>

    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Attendance Card                                                     */
/* -------------------------------------------------------------------------- */

interface AttendanceMobileCardProps {
  record: AttendanceRecord;
}

function AttendanceMobileCard({
  record,
}: AttendanceMobileCardProps) {
  const checkIn = record.checkIn || record.inTime;

  const checkOut =
    record.checkOut || record.outTime;

  const workHours =
    record.workHours ??
    record.totalHours ??
    record.hoursWorked;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="font-semibold text-slate-900">
            {formatDate(getRecordDate(record))}
          </p>

          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                record.status
              )}`}
            >
              {getStatusIcon(record.status)}
              {getStatusLabel(record.status)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">
            Working Hours
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            {formatHours(workHours)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LogIn className="h-3.5 w-3.5 text-emerald-500" />
            Check In
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatTime(checkIn)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LogOut className="h-3.5 w-3.5 text-red-500" />
            Check Out
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatTime(checkOut)}
          </p>
        </div>

      </div>

      {(record.remarks || record.note) && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Remarks
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {record.remarks || record.note}
          </p>
        </div>
      )}
    </div>
  );
}