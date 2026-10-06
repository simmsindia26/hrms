import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  Filter,
  Loader2,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import api from "../../lib/axios";

type AttendanceStatus =
  | "present"
  | "absent"
  | "half-day"
  | "leave"
  | "holiday"
  | "week-off";

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  email?: string;
  department?: string | { _id?: string; name?: string };
  designation?: string | { _id?: string; name?: string };
  profilePhoto?: string;
  status?: string;
}

interface LeaveType {
  _id?: string;
  name?: string;
  code?: string;
}

interface Leave {
  _id: string;
  employee?: string | Employee;
  leaveType?: string | LeaveType;
  status?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

interface Attendance {
  _id: string;
  employee?: string | Employee;
  date: string;
  status?: AttendanceStatus | string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  remarks?: string;
}

interface AttendanceRow {
  key: string;
  attendanceId?: string;
  employee: Employee;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  remarks: string;
  isVirtualLeave?: boolean;
}

interface AttendanceForm {
  employee: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  remarks: string;
}

const STATUS_OPTIONS: AttendanceStatus[] = [
  "present",
  "absent",
  "half-day",
  "leave",
  "holiday",
  "week-off",
];

const EMPTY_FORM: AttendanceForm = {
  employee: "",
  date: "",
  status: "present",
  checkIn: "",
  checkOut: "",
  workingHours: "",
  remarks: "",
};

function getId(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    const item = value as { _id?: string; id?: string };
    return item._id || item.id || "";
  }

  return "";
}

function getEmployeeName(
  employee?: Employee | string | null
): string {
  if (!employee) return "Unknown Employee";

  if (typeof employee === "string") {
    return employee;
  }

  const directName =
    typeof employee.name === "string"
      ? employee.name.trim()
      : "";

  if (directName) {
    return directName;
  }

  const firstName =
    typeof (employee as any).firstName === "string"
      ? (employee as any).firstName.trim()
      : "";

  const lastName =
    typeof (employee as any).lastName === "string"
      ? (employee as any).lastName.trim()
      : "";

  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  const user = (employee as any).user;

  if (user) {
    if (
      typeof user.name === "string" &&
      user.name.trim()
    ) {
      return user.name.trim();
    }

    const userFirst =
      typeof user.firstName === "string"
        ? user.firstName.trim()
        : "";

    const userLast =
      typeof user.lastName === "string"
        ? user.lastName.trim()
        : "";

    const userFullName =
      `${userFirst} ${userLast}`.trim();

    if (userFullName) {
      return userFullName;
    }
  }

  return (
    employee.employeeId ||
    "Unknown Employee"
  );
}
function getEmployeeDepartment(employee?: Employee): string {
  if (!employee?.department) return "—";

  if (typeof employee.department === "string") {
    return employee.department;
  }

  return employee.department.name || "—";
}

function getEmployeeDesignation(employee?: Employee): string {
  if (!employee?.designation) return "—";

  if (typeof employee.designation === "string") {
    return employee.designation;
  }

  return employee.designation.name || "—";
}

function getLeaveTypeName(leaveType?: string | LeaveType | null): string {
  if (!leaveType) return "Leave";

  if (typeof leaveType === "string") {
    return leaveType;
  }

  return leaveType.name || leaveType.code || "Leave";
}

function formatDate(date?: string): string {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string): string {
  if (!value) return "—";

  if (/^\d{1,2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours: number): string {
  if (!hours || Number.isNaN(hours)) return "—";

  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);

  if (!minutes) return `${whole}h`;

  return `${whole}h ${minutes}m`;
}

function getDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateWorkingHours(
  checkIn: string,
  checkOut: string
): number {
  if (!checkIn || !checkOut) return 0;

  const [inHour, inMinute] = checkIn.split(":").map(Number);
  const [outHour, outMinute] = checkOut.split(":").map(Number);

  if (
    Number.isNaN(inHour) ||
    Number.isNaN(inMinute) ||
    Number.isNaN(outHour) ||
    Number.isNaN(outMinute)
  ) {
    return 0;
  }

  const start = inHour * 60 + inMinute;
  const end = outHour * 60 + outMinute;

  if (end <= start) return 0;

  return Number(((end - start) / 60).toFixed(2));
}

function statusLabel(status: AttendanceStatus | string): string {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "half-day":
      return "Half Day";
    case "leave":
      return "Leave";
    case "holiday":
      return "Holiday";
    case "week-off":
      return "Week Off";
    default:
      return status || "—";
  }
}

function statusClasses(status: AttendanceStatus | string): string {
  switch (status) {
    case "present":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "absent":
      return "bg-red-50 text-red-700 border-red-200";

    case "half-day":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "leave":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "holiday":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "week-off":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function extractItems(responseData: any, keys: string[] = []) {
  const data = responseData;

  for (const key of keys) {
    if (Array.isArray(data?.data?.[key])) {
      return data.data[key];
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function EmployeeAvatar({
  employee,
}: {
  employee?: Employee | null;
}) {
  const name = getEmployeeName(employee);

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "E";

  if (employee?.profilePhoto) {
    return (
      <img
        src={employee.profilePhoto}
        alt={name}
        className="h-10 w-10 rounded-xl object-cover border border-slate-200"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-700 border border-red-100">
      {initials}
    </div>
  );
}

export default function Attendance() {
  const now = new Date();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);

  const [form, setForm] = useState<AttendanceForm>(EMPTY_FORM);

  const loadEmployees = async () => {
    try {
      const response = await api.get("/hr/employees");

      const items = extractItems(response.data, [
        "employees",
        "items",
      ]);

      setEmployees(items);
    } catch (error) {
      console.error("Failed to load employees:", error);
      setEmployees([]);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await api.get("/hr/attendance", {
        params: {
          month,
        },
      });

      const items = extractItems(response.data, [
        "attendance",
        "items",
      ]);

      setAttendance(items);
    } catch (error) {
      console.error("Failed to load attendance:", error);
      setAttendance([]);
    }
  };

  const loadLeaves = async () => {
    try {
      const response = await api.get("/hr/leaves", {
        params: {
          month,
        },
      });

      const items = extractItems(response.data, [
        "leaves",
        "items",
      ]);

      setLeaves(items);
    } catch (error) {
      console.error("Failed to load leaves:", error);
      setLeaves([]);
    }
  };

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      loadEmployees(),
      loadAttendance(),
      loadLeaves(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();

    employees.forEach((employee) => {
      if (employee._id) {
        map.set(employee._id, employee);
      }
    });

    return map;
  }, [employees]);

  const attendanceRows = useMemo<AttendanceRow[]>(() => {
    const rows: AttendanceRow[] = [];

    attendance.forEach((item) => {
      const employeeId = getId(item.employee);

      const employee =
        typeof item.employee === "object"
          ? item.employee
          : employeeMap.get(employeeId);

      if (!employee) return;

      rows.push({
        key: item._id,
        attendanceId: item._id,
        employee,
        date: getDateKey(item.date),
        status:
          (item.status as AttendanceStatus) || "present",
        checkIn: item.checkIn || "",
        checkOut: item.checkOut || "",
        workingHours: Number(item.workingHours || 0),
        remarks: item.remarks || "",
      });
    });

    /*
     * Add approved leave days that don't already have an attendance
     * record. This makes leave visible on the attendance page.
     */
    const existingKeys = new Set(
      rows.map(
        (row) =>
          `${row.employee._id}_${row.date}`
      )
    );

    leaves
      .filter(
        (leave) =>
          String(leave.status || "").toLowerCase() ===
          "approved"
      )
      .forEach((leave) => {
        const employeeId = getId(leave.employee);

        const employee =
          typeof leave.employee === "object"
            ? leave.employee
            : employeeMap.get(employeeId);

        if (!employee || !leave.startDate) return;

        const start = new Date(leave.startDate);

        const end = new Date(
          leave.endDate || leave.startDate
        );

        if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime())
        ) {
          return;
        }

        const cursor = new Date(start);

        while (cursor <= end) {
          const dateKey = getDateKey(cursor);

          if (!dateKey.startsWith(month)) {
            cursor.setDate(cursor.getDate() + 1);
            continue;
          }

          const key = `${employee._id}_${dateKey}`;

          if (!existingKeys.has(key)) {
            rows.push({
              key: `leave-${leave._id}-${dateKey}`,
              employee,
              date: dateKey,
              status: "leave",
              checkIn: "",
              checkOut: "",
              workingHours: 0,
              remarks:
                leave.reason ||
                getLeaveTypeName(leave.leaveType),
              isVirtualLeave: true,
            });

            existingKeys.add(key);
          }

          cursor.setDate(cursor.getDate() + 1);
        }
      });

    return rows.sort((a, b) => {
      const dateCompare =
        b.date.localeCompare(a.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return getEmployeeName(a.employee).localeCompare(
        getEmployeeName(b.employee)
      );
    });
  }, [
    attendance,
    leaves,
    employeeMap,
    month,
  ]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attendanceRows.filter((row) => {
      if (
        selectedDate &&
        row.date !== selectedDate
      ) {
        return false;
      }

      if (
        employeeFilter &&
        row.employee._id !== employeeFilter
      ) {
        return false;
      }

      if (
        statusFilter &&
        row.status !== statusFilter
      ) {
        return false;
      }

      if (query) {
        const name =
          getEmployeeName(row.employee).toLowerCase();

        const employeeId =
          row.employee.employeeId
            ?.toLowerCase() || "";

        const department =
          getEmployeeDepartment(row.employee)
            .toLowerCase();

        if (
          !name.includes(query) &&
          !employeeId.includes(query) &&
          !department.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    attendanceRows,
    selectedDate,
    employeeFilter,
    statusFilter,
    search,
  ]);

  // Overview follows the active day, employee and status filters.
  // No selected day = full selected-month overview.
  const summary = useMemo(() => {
    let source = attendanceRows;

    if (selectedDate) {
      source = source.filter(
        (row) => row.date === selectedDate
      );
    }

    if (employeeFilter) {
      source = source.filter(
        (row) => row.employee._id === employeeFilter
      );
    }

    if (statusFilter) {
      source = source.filter(
        (row) => row.status === statusFilter
      );
    }

    return {
      total: source.length,

      present: source.filter(
        (row) => row.status === "present"
      ).length,

      absent: source.filter(
        (row) => row.status === "absent"
      ).length,

      halfDay: source.filter(
        (row) => row.status === "half-day"
      ).length,

      leave: source.filter(
        (row) => row.status === "leave"
      ).length,
    };
  }, [
    attendanceRows,
    selectedDate,
    employeeFilter,
    statusFilter,
  ]);

  // Per-day overview for the selected month. Each day shows the
  // attendance breakdown and can be clicked to filter the detail table.
  const dailyOverview = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    if (!year || !monthNumber) return [];

    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const rows: Array<{
      date: string;
      total: number;
      present: number;
      absent: number;
      halfDay: number;
      leave: number;
      holiday: number;
      weekOff: number;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const source = attendanceRows.filter((row) => row.date === date);

      rows.push({
        date,
        total: source.length,
        present: source.filter((row) => row.status === "present").length,
        absent: source.filter((row) => row.status === "absent").length,
        halfDay: source.filter((row) => row.status === "half-day").length,
        leave: source.filter((row) => row.status === "leave").length,
        holiday: source.filter((row) => row.status === "holiday").length,
        weekOff: source.filter((row) => row.status === "week-off").length,
      });
    }

    return rows;
  }, [attendanceRows, month]);

  const monthName = useMemo(() => {
    const [year, monthNumber] = month
      .split("-")
      .map(Number);

    if (!year || !monthNumber) return "";

    return new Date(
      year,
      monthNumber - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const moveMonth = (direction: number) => {
    const [year, monthNumber] = month
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      monthNumber - 1 + direction,
      1
    );

    setMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );

    setSelectedDate("");
  };

  const openAddModal = () => {
    setEditingRow(null);

    setForm({
      ...EMPTY_FORM,
      employee:
        employeeFilter || "",
      date:
        selectedDate ||
        `${month}-01`,
    });

    setShowModal(true);
  };

  const openEditModal = (row: AttendanceRow) => {
    if (row.isVirtualLeave) {
      setEditingRow(null);

      setForm({
        employee: row.employee._id,
        date: row.date,
        status: "leave",
        checkIn: "",
        checkOut: "",
        workingHours: "",
        remarks: row.remarks || "",
      });

      setShowModal(true);

      return;
    }

    setEditingRow(row);

    setForm({
      employee: row.employee._id,
      date: row.date,
      status: row.status,
      checkIn: row.checkIn || "",
      checkOut: row.checkOut || "",
      workingHours:
        row.workingHours
          ? String(row.workingHours)
          : "",
      remarks: row.remarks || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingRow(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (
    field: keyof AttendanceForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!form.employee) {
      alert("Please select an employee.");
      return;
    }

    if (!form.date) {
      alert("Please select a date.");
      return;
    }

    setSaving(true);

    try {
      const calculatedHours =
        form.workingHours
          ? Number(form.workingHours)
          : calculateWorkingHours(
              form.checkIn,
              form.checkOut
            );

      const payload = {
        employee: form.employee,
        date: form.date,
        status: form.status,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        workingHours:
          calculatedHours || undefined,
        remarks:
          form.remarks.trim() || undefined,
      };

      if (editingRow?.attendanceId) {
        await api.put(
          `/hr/attendance/${editingRow.attendanceId}`,
          payload
        );
      } else {
        await api.post(
          "/hr/attendance",
          payload
        );
      }

      closeModal();

      await loadAttendance();
    } catch (error: any) {
      console.error(
        "Failed to save attendance:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!filteredRows.length) {
      alert("No attendance records to export.");
      return;
    }

    const headers = [
      "Date",
      "Employee ID",
      "Employee",
      "Department",
      "Designation",
      "Status",
      "Check In",
      "Check Out",
      "Working Hours",
      "Remarks",
    ];

    const csvRows = filteredRows.map((row) => [
      row.date,
      row.employee.employeeId || "",
      getEmployeeName(row.employee),
      getEmployeeDepartment(row.employee),
      getEmployeeDesignation(row.employee),
      statusLabel(row.status),
      formatTime(row.checkIn),
      formatTime(row.checkOut),
      row.workingHours
        ? formatHours(row.workingHours)
        : "",
      row.remarks || "",
    ]);

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const content = [
      headers.map(escapeCSV).join(","),
      ...csvRows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `attendance-${month}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedDate("");
    setEmployeeFilter("");
    setStatusFilter("");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-red-100 overflow-hidden shadow-sm">
                <img
                  src="/logo.png"
                  alt="Sellopedia"
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                  Attendance
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage employee attendance and monthly records
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
            >
              <Check size={17} />
              Mark Attendance
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft size={19} />
              </button>

              <div className="min-w-[180px] text-center">
                <p className="text-lg font-bold text-slate-900">
                  {monthName}
                </p>

                <p className="text-xs text-slate-500">
                  Monthly attendance
                </p>
              </div>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronRight size={19} />
              </button>
            </div>

            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setSelectedDate("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        {/* Active overview */}
        {selectedDate && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                Daily Overview
              </p>
              <p className="mt-0.5 text-sm font-bold text-red-950">
                {formatDate(selectedDate)}
              </p>
              <p className="mt-0.5 text-xs text-[#FE0000]">
                The overview cards and attendance table are filtered to this day.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-indigo-100 transition hover:bg-red-100"
            >
              View Full Month
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Users size={19} />
            </div>

            <p className="text-xs font-medium text-slate-500">
              Total Records
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={19} />
            </div>

            <p className="text-xs font-medium text-slate-500">
              Present
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {summary.present}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <X size={19} />
            </div>

            <p className="text-xs font-medium text-slate-500">
              Absent
            </p>

            <p className="mt-1 text-2xl font-bold text-red-700">
              {summary.absent}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={19} />
            </div>

            <p className="text-xs font-medium text-slate-500">
              Half Day
            </p>

            <p className="mt-1 text-2xl font-bold text-amber-700">
              {summary.halfDay}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={19} />
            </div>

            <p className="text-xs font-medium text-slate-500">
              Leave
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700">
              {summary.leave}
            </p>
          </div>
        </div>

        {/* Per Day Overview */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Per Day Overview</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Daily attendance breakdown for {monthName}. Click a day to view its detailed records.
              </p>
            </div>

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="w-fit rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Show All Days
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-emerald-600">Present</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-red-600">Absent</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-amber-600">Half Day</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-blue-600">Leave</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-purple-600">Holiday</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">Week Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyOverview.map((day) => {
                  const active = selectedDate === day.date;
                  const dayDate = new Date(`${day.date}T00:00:00`);

                  return (
                    <tr
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`cursor-pointer transition hover:bg-red-50/60 ${active ? "bg-red-50" : ""}`}
                    >
                      <td className="whitespace-nowrap px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 flex-col items-center justify-center rounded-lg ${active ? "bg-[#FE0000] text-white" : "bg-slate-100 text-slate-700"}`}>
                            <span className="text-[9px] font-bold uppercase">{dayDate.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                            <span className="text-sm font-bold">{dayDate.getDate()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{formatDate(day.date)}</p>
                            {active && <p className="text-[10px] font-semibold text-[#FE0000]">Selected</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-slate-800">{day.total}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-emerald-700">{day.present}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-red-700">{day.absent}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-amber-700">{day.halfDay}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-blue-700">{day.leave}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-purple-700">{day.holiday}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-slate-600">{day.weekOff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter
                size={17}
                className="text-slate-500"
              />

              <h2 className="text-sm font-bold text-slate-800">
                Filters
              </h2>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#FE0000] hover:text-red-700"
            >
              Clear filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search employee..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={employeeFilter}
              onChange={(event) =>
                setEmployeeFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            >
              <option value="">
                All Employees
              </option>

              {employees.map((employee) => (
                <option
                  key={employee._id}
                  value={employee._id}
                >
                  {getEmployeeName(employee)}
                  {employee.employeeId
                    ? ` (${employee.employeeId})`
                    : ""}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              min={`${month}-01`}
              max={`${month}-${new Date(
                Number(month.slice(0, 4)),
                Number(month.slice(5, 7)),
                0
              )
                .getDate()
                .toString()
                .padStart(2, "0")}`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            >
              <option value="">
                All Status
              </option>

              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Department
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Check In
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Check Out
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Working Hours
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Loader2
                          size={28}
                          className="animate-spin text-[#FE0000]"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-600">
                          Loading attendance...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <CalendarDays size={26} />
                        </div>

                        <h3 className="mt-4 text-sm font-bold text-slate-800">
                          No attendance records
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          No records match the current filters.
                        </p>

                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 text-sm font-semibold text-[#FE0000]"
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.key}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(row.date)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <EmployeeAvatar
                            employee={row.employee}
                          />

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {getEmployeeName(
                                row.employee
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {row.employee.employeeId ||
                                "No Employee ID"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {getEmployeeDepartment(
                            row.employee
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {getEmployeeDesignation(
                            row.employee
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(
                            row.status
                          )}`}
                        >
                          {statusLabel(row.status)}
                        </span>

                        {row.isVirtualLeave && (
                          <span className="ml-2 text-[10px] font-medium text-blue-500">
                            Leave record
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatTime(row.checkIn)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatTime(row.checkOut)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-700">
                          {formatHours(
                            row.workingHours
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(row)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Edit3 size={14} />
                          {row.isVirtualLeave
                            ? "Mark"
                            : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            filteredRows.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-700">
                    {filteredRows.length}
                  </span>{" "}
                  attendance record
                  {filteredRows.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingRow
                    ? "Edit Attendance"
                    : "Mark Attendance"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Add or update employee attendance
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-5 p-5"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Employee
                  </label>

                  <select
                    value={form.employee}
                    onChange={(event) =>
                      handleFormChange(
                        "employee",
                        event.target.value
                      )
                    }
                    disabled={Boolean(editingRow)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      Select Employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee._id}
                        value={employee._id}
                      >
                        {getEmployeeName(employee)}
                        {employee.employeeId
                          ? ` — ${employee.employeeId}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Date
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      handleFormChange(
                        "date",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      handleFormChange(
                        "status",
                        event.target
                          .value as AttendanceStatus
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  >
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {statusLabel(status)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Working Hours
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.01"
                    value={form.workingHours}
                    onChange={(event) =>
                      handleFormChange(
                        "workingHours",
                        event.target.value
                      )
                    }
                    placeholder="Auto calculated"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Check In
                  </label>

                  <input
                    type="time"
                    value={form.checkIn}
                    onChange={(event) =>
                      handleFormChange(
                        "checkIn",
                        event.target.value
                      )
                    }
                    disabled={
                      form.status !== "present" &&
                      form.status !== "half-day"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Check Out
                  </label>

                  <input
                    type="time"
                    value={form.checkOut}
                    onChange={(event) =>
                      handleFormChange(
                        "checkOut",
                        event.target.value
                      )
                    }
                    disabled={
                      form.status !== "present" &&
                      form.status !== "half-day"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Remarks
                  </label>

                  <textarea
                    value={form.remarks}
                    onChange={(event) =>
                      handleFormChange(
                        "remarks",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Add attendance remarks..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingRow
                    ? "Update Attendance"
                    : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}