import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  Filter,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ThumbsUp,
  User,
  X,
  XCircle,
} from "lucide-react";
import api from "../../lib/axios";

type NoticeType =
  | "general"
  | "warning"
  | "disciplinary"
  | "appreciation"
  | "policy"
  | "announcement";

type NoticeStatus =
  | "draft"
  | "issued"
  | "published"
  | "acknowledged"
  | "cancelled";

interface Department {
  _id: string;
  name?: string;
}

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: Department | string;
  designation?: {
    _id?: string;
    name?: string;
  } | string;
}

interface Notice {
  _id: string;

  title: string;
  subject?: string;
  description?: string;
  content?: string;

  type: NoticeType;
  status?: NoticeStatus;

  employee?: Employee | string | null;
  department?: Department | string | null;

  issuedDate?: string;
  effectiveDate?: string;
  expiryDate?: string;

  acknowledged?: boolean;
  acknowledgedAt?: string;

  issuedBy?: Employee | string;
  createdBy?: Employee | string;

  attachmentUrl?: string;
  attachmentName?: string;

  remarks?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface NoticeForm {
  title: string;
  subject: string;
  description: string;
  type: NoticeType;
  employee: string;
  department: string;
  issuedDate: string;
  effectiveDate: string;
  expiryDate: string;
  content: string;
  remarks: string;
}

const NOTICE_TYPES: Array<{
  value: NoticeType;
  label: string;
  description: string;
}> = [
  {
    value: "general",
    label: "General",
    description: "General communication",
  },
  {
    value: "warning",
    label: "Warning",
    description: "Formal employee warning",
  },
  {
    value: "disciplinary",
    label: "Disciplinary",
    description: "Disciplinary action",
  },
  {
    value: "appreciation",
    label: "Appreciation",
    description: "Recognition or appreciation",
  },
  {
    value: "policy",
    label: "Policy",
    description: "Policy related communication",
  },
  {
    value: "announcement",
    label: "Announcement",
    description: "Company announcement",
  },
];

const STATUS_OPTIONS: NoticeStatus[] = [
  "draft",
  "issued",
  "published",
  "acknowledged",
  "cancelled",
];

const PAGE_SIZE = 10;

const emptyForm: NoticeForm = {
  title: "",
  subject: "",
  description: "",
  type: "general",
  employee: "",
  department: "",
  issuedDate: new Date().toISOString().slice(0, 10),
  effectiveDate: "",
  expiryDate: "",
  content: "",
  remarks: "",
};

function getEmployeeName(
  employee?: Employee | string | null,
): string {
  if (!employee) return "All Employees";

  if (typeof employee === "string") {
    return employee;
  }

  if (employee.name) return employee.name;

  const fullName = `${employee.firstName || ""} ${
    employee.lastName || ""
  }`.trim();

  return fullName || "Unknown Employee";
}

function getEmployeeId(
  employee?: Employee | string | null,
): string {
  if (!employee) return "";

  if (typeof employee === "string") return employee;

  return employee.employeeId || "";
}

function getDepartmentName(
  department?: Department | string | null,
): string {
  if (!department) return "All Departments";

  if (typeof department === "string") return department;

  return department.name || "Unknown Department";
}

function getReferenceName(
  value?: Employee | string | null,
): string {
  if (!value) return "System";

  if (typeof value === "string") return value;

  return getEmployeeName(value);
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeLabel(type: NoticeType) {
  return (
    NOTICE_TYPES.find((item) => item.value === type)?.label ||
    type
  );
}

function getTypeIcon(type: NoticeType) {
  switch (type) {
    case "warning":
      return <AlertTriangle size={15} />;

    case "disciplinary":
      return <ShieldAlert size={15} />;

    case "appreciation":
      return <ThumbsUp size={15} />;

    case "policy":
      return <ClipboardList size={15} />;

    case "announcement":
      return <Megaphone size={15} />;

    default:
      return <Bell size={15} />;
  }
}

function getTypeClasses(type: NoticeType) {
  switch (type) {
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "disciplinary":
      return "bg-red-50 text-red-700 border-red-200";

    case "appreciation":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "policy":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "announcement":
      return "bg-violet-50 text-violet-700 border-violet-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getStatusClasses(status?: NoticeStatus | string | null) {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700";

    case "issued":
      return "bg-amber-100 text-amber-700";

    case "published":
      return "bg-blue-100 text-blue-700";

    case "acknowledged":
      return "bg-emerald-100 text-emerald-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status?: NoticeStatus | string | null) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
  disabled = false,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function NoticeTypeBadge({
  type,
}: {
  type: NoticeType;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
        type,
      )}`}
    >
      {getTypeIcon(type)}
      {getTypeLabel(type)}
    </span>
  );
}

function NoticeStatusBadge({
  status,
}: {
  status?: NoticeStatus;
}) {
  const safeStatus = status || "draft";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
        safeStatus,
      )}`}
    >
      {getStatusLabel(safeStatus)}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
  width = "max-w-3xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div
        className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<NoticeType | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    NoticeStatus | "all"
  >("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotice, setEditingNotice] =
    useState<Notice | null>(null);

  const [viewingNotice, setViewingNotice] =
    useState<Notice | null>(null);

  const [form, setForm] = useState<NoticeForm>(emptyForm);

  async function loadData(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [noticeResponse, employeeResponse, departmentResponse] =
        await Promise.all([
          api.get("/hr/notices"),
          api.get("/hr/employees"),
          api.get("/hr/departments"),
        ]);

      const noticeData =
        noticeResponse.data?.data?.items ??
        noticeResponse.data?.data ??
        noticeResponse.data?.notices ??
        [];

      const employeeData =
        employeeResponse.data?.data?.items ??
        employeeResponse.data?.data ??
        employeeResponse.data?.employees ??
        [];

      const departmentData =
        departmentResponse.data?.data?.items ??
        departmentResponse.data?.data ??
        departmentResponse.data?.departments ??
        [];

      setNotices(Array.isArray(noticeData) ? noticeData : []);
      setEmployees(
        Array.isArray(employeeData) ? employeeData : [],
      );
      setDepartments(
        Array.isArray(departmentData) ? departmentData : [],
      );
    } catch (error: any) {
      console.error("Failed to load notices:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to load notice management data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    typeFilter,
    statusFilter,
    employeeFilter,
    departmentFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: notices.length,

      drafts: notices.filter(
        (notice) => notice.status === "draft",
      ).length,

      active: notices.filter(
        (notice) =>
          notice.status === "issued" ||
          notice.status === "published",
      ).length,

      warnings: notices.filter(
        (notice) =>
          notice.type === "warning" ||
          notice.type === "disciplinary",
      ).length,

      acknowledged: notices.filter(
        (notice) =>
          notice.acknowledged ||
          notice.status === "acknowledged",
      ).length,
    };
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const employeeName = getEmployeeName(notice.employee);
      const employeeId = getEmployeeId(notice.employee);
      const departmentName = getDepartmentName(
        notice.department,
      );

      const matchesSearch =
        !query ||
        notice.title?.toLowerCase().includes(query) ||
        notice.subject?.toLowerCase().includes(query) ||
        notice.description?.toLowerCase().includes(query) ||
        notice.content?.toLowerCase().includes(query) ||
        employeeName.toLowerCase().includes(query) ||
        employeeId.toLowerCase().includes(query) ||
        departmentName.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" || notice.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        notice.status === statusFilter;

      const noticeEmployeeId =
        typeof notice.employee === "string"
          ? notice.employee
          : notice.employee?._id;

      const matchesEmployee =
        employeeFilter === "all" ||
        noticeEmployeeId === employeeFilter;

      const noticeDepartmentId =
        typeof notice.department === "string"
          ? notice.department
          : notice.department?._id;

      const matchesDepartment =
        departmentFilter === "all" ||
        noticeDepartmentId === departmentFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesEmployee &&
        matchesDepartment
      );
    });
  }, [
    notices,
    search,
    typeFilter,
    statusFilter,
    employeeFilter,
    departmentFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotices.length / PAGE_SIZE),
  );

  const paginatedNotices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredNotices.slice(start, start + PAGE_SIZE);
  }, [filteredNotices, page]);

  function openCreateModal() {
    setEditingNotice(null);

    setForm({
      ...emptyForm,
      issuedDate: new Date().toISOString().slice(0, 10),
    });

    setShowCreateModal(true);
  }

  function openEditModal(notice: Notice) {
    setEditingNotice(notice);

    setForm({
      title: notice.title || "",
      subject: notice.subject || "",
      description: notice.description || "",
      type: notice.type || "general",
      employee:
        typeof notice.employee === "string"
          ? notice.employee
          : notice.employee?._id || "",
      department:
        typeof notice.department === "string"
          ? notice.department
          : notice.department?._id || "",
      issuedDate: notice.issuedDate
        ? new Date(notice.issuedDate)
            .toISOString()
            .slice(0, 10)
        : "",
      effectiveDate: notice.effectiveDate
        ? new Date(notice.effectiveDate)
            .toISOString()
            .slice(0, 10)
        : "",
      expiryDate: notice.expiryDate
        ? new Date(notice.expiryDate)
            .toISOString()
            .slice(0, 10)
        : "",
      content: notice.content || "",
      remarks: notice.remarks || "",
    });

    setShowCreateModal(true);
  }

  function updateForm(
    key: keyof NoticeForm,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSave(asDraft = true) {
    if (!form.title.trim()) {
      alert("Please enter a notice title.");
      return;
    }

    if (!form.content.trim()) {
      alert("Please enter the notice content.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        type: form.type,

        employee: form.employee || null,
        department: form.department || null,

        issuedDate: form.issuedDate || null,
        effectiveDate: form.effectiveDate || null,
        expiryDate: form.expiryDate || null,

        content: form.content.trim(),
        remarks: form.remarks.trim(),

        status: asDraft ? "draft" : "issued",
      };

      if (editingNotice) {
        await api.patch(
          `/hr/notices/${editingNotice._id}`,
          payload,
        );
      } else {
        await api.post("/hr/notices", payload);
      }

      setShowCreateModal(false);
      setEditingNotice(null);
      setForm(emptyForm);

      await loadData(false);
    } catch (error: any) {
      console.error("Failed to save notice:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to save notice.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleIssue(notice: Notice) {
    if (
      !window.confirm(
        `Issue "${notice.title}" to ${
          getEmployeeName(notice.employee)
        }?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(notice._id);

      await api.patch(`/hr/notices/${notice._id}/issue`, {
        status: "issued",
      });

      await loadData(false);
    } catch (error: any) {
      console.error("Failed to issue notice:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to issue notice.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePublish(notice: Notice) {
    if (
      !window.confirm(
        `Publish "${notice.title}"?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(notice._id);

      await api.patch(`/hr/notices/${notice._id}/publish`, {
        status: "published",
      });

      await loadData(false);
    } catch (error: any) {
      console.error("Failed to publish notice:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to publish notice.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(notice: Notice) {
    if (
      !window.confirm(
        `Cancel "${notice.title}"?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(notice._id);

      await api.patch(`/hr/notices/${notice._id}`, {
        status: "cancelled",
      });

      await loadData(false);
    } catch (error: any) {
      console.error("Failed to cancel notice:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to cancel notice.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAcknowledge(notice: Notice) {
    try {
      setActionLoading(notice._id);

      await api.patch(
        `/hr/notices/${notice._id}/acknowledge`,
      );

      await loadData(false);
    } catch (error: any) {
      console.error(
        "Failed to acknowledge notice:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to acknowledge notice.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setEmployeeFilter("all");
    setDepartmentFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Bell size={16} />
            <span>HR Management</span>
            <span>/</span>
            <span>Notices & Disciplinary</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Notices & Disciplinary
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee notices, warnings, disciplinary
            actions and company communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Create Notice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Notices"
          value={stats.total}
          icon={<Bell size={20} />}
          description="All recorded notices"
        />

        <StatCard
          label="Drafts"
          value={stats.drafts}
          icon={<FileText size={20} />}
          description="Not yet issued"
        />

        <StatCard
          label="Active"
          value={stats.active}
          icon={<Send size={20} />}
          description="Issued or published"
        />

        <StatCard
          label="Warnings"
          value={stats.warnings}
          icon={<AlertTriangle size={20} />}
          description="Warnings & disciplinary"
        />

        <StatCard
          label="Acknowledged"
          value={stats.acknowledged}
          icon={<Check size={20} />}
          description="Employee acknowledged"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search title, employee, department..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter
                size={17}
                className="text-slate-400"
              />

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as
                      | NoticeType
                      | "all",
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="all">All Types</option>

                {NOTICE_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | NoticeStatus
                      | "all",
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="all">All Status</option>

                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={employeeFilter}
              onChange={(event) =>
                setEmployeeFilter(event.target.value)
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">All Employees</option>

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

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(event.target.value)
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">All Departments</option>

              {departments.map((department) => (
                <option
                  key={department._id}
                  value={department._id}
                >
                  {department.name || "Unnamed Department"}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              <CalendarDays size={15} className="mr-2" />
              {filteredNotices.length} matching notices
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-100 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />
              Loading notices...
            </div>
          </div>
        ) : paginatedNotices.length === 0 ? (
          <div className="flex min-h-100 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Bell size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No notices found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              No notices match your current filters. Create a
              new notice or clear the filters.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Create Notice
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-275">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Notice
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedNotices.map((notice) => (
                    <NoticeTableRow
                      key={notice._id}
                      notice={notice}
                      actionLoading={actionLoading}
                      onView={() =>
                        setViewingNotice(notice)
                      }
                      onEdit={() =>
                        openEditModal(notice)
                      }
                      onIssue={() =>
                        handleIssue(notice)
                      }
                      onPublish={() =>
                        handlePublish(notice)
                      }
                      onCancel={() =>
                        handleCancel(notice)
                      }
                      onAcknowledge={() =>
                        handleAcknowledge(notice)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedNotices.map((notice) => (
                <NoticeMobileCard
                  key={notice._id}
                  notice={notice}
                  actionLoading={actionLoading}
                  onView={() =>
                    setViewingNotice(notice)
                  }
                  onEdit={() =>
                    openEditModal(notice)
                  }
                  onIssue={() =>
                    handleIssue(notice)
                  }
                  onPublish={() =>
                    handlePublish(notice)
                  }
                  onCancel={() =>
                    handleCancel(notice)
                  }
                  onAcknowledge={() =>
                    handleAcknowledge(notice)
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredNotices.length === 0
                    ? 0
                    : (page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    page * PAGE_SIZE,
                    filteredNotices.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredNotices.length}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1),
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
                  Page {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1),
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <Modal
          title={
            editingNotice
              ? "Edit Notice"
              : "Create Notice"
          }
          onClose={() => {
            setShowCreateModal(false);
            setEditingNotice(null);
          }}
          width="max-w-4xl"
        >
          <div className="space-y-6 p-6">
            {/* Basic */}
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notice Information
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Title *
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value,
                      )
                    }
                    placeholder="Enter notice title"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Notice Type *
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      updateForm(
                        "type",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  >
                    {NOTICE_TYPES.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>

                  <input
                    value={form.subject}
                    onChange={(event) =>
                      updateForm(
                        "subject",
                        event.target.value,
                      )
                    }
                    placeholder="Email/notice subject"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Employee
                  </label>

                  <select
                    value={form.employee}
                    onChange={(event) =>
                      updateForm(
                        "employee",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
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
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Department
                  </label>

                  <select
                    value={form.department}
                    onChange={(event) =>
                      updateForm(
                        "department",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">
                      All Departments
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name ||
                          "Unnamed Department"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dates
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Issued Date
                  </label>

                  <input
                    type="date"
                    value={form.issuedDate}
                    onChange={(event) =>
                      updateForm(
                        "issuedDate",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Effective Date
                  </label>

                  <input
                    type="date"
                    value={form.effectiveDate}
                    onChange={(event) =>
                      updateForm(
                        "effectiveDate",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Expiry Date
                  </label>

                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) =>
                      updateForm(
                        "expiryDate",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Short Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Short summary of the notice"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Notice Content *
              </label>

              <textarea
                value={form.content}
                onChange={(event) =>
                  updateForm(
                    "content",
                    event.target.value,
                  )
                }
                rows={10}
                placeholder="Write the complete notice content..."
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Internal Remarks
              </label>

              <textarea
                value={form.remarks}
                onChange={(event) =>
                  updateForm(
                    "remarks",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Internal HR remarks..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingNotice(null);
                }}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                Save Draft
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                <Send size={16} />
                Save & Issue
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewingNotice && (
        <Modal
          title="Notice Details"
          onClose={() => setViewingNotice(null)}
          width="max-w-4xl"
        >
          <div className="p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <NoticeTypeBadge
                    type={viewingNotice.type}
                  />

                  <NoticeStatusBadge
                    status={viewingNotice.status}
                  />
                </div>

                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  {viewingNotice.title}
                </h2>

                {viewingNotice.subject && (
                  <p className="mt-1 text-sm text-slate-500">
                    {viewingNotice.subject}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-400">
                  Issued
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(
                    viewingNotice.issuedDate ||
                      viewingNotice.createdAt,
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 py-5 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employee
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <User
                    size={16}
                    className="text-slate-400"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {getEmployeeName(
                        viewingNotice.employee,
                      )}
                    </p>

                    {getEmployeeId(
                      viewingNotice.employee,
                    ) && (
                      <p className="text-xs text-slate-400">
                        {getEmployeeId(
                          viewingNotice.employee,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Department
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {getDepartmentName(
                    viewingNotice.department,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Issued By
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {getReferenceName(
                    viewingNotice.issuedBy ||
                      viewingNotice.createdBy,
                  )}
                </p>
              </div>
            </div>

            {viewingNotice.description && (
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Summary
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {viewingNotice.description}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notice Content
              </h3>

              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {viewingNotice.content ||
                  "No notice content available."}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Effective Date
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatDate(
                    viewingNotice.effectiveDate,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Expiry Date
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatDate(
                    viewingNotice.expiryDate,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Acknowledged
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {viewingNotice.acknowledged
                    ? `Yes — ${formatDateTime(
                        viewingNotice.acknowledgedAt,
                      )}`
                    : "No"}
                </p>
              </div>
            </div>

            {viewingNotice.remarks && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Internal Remarks
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                  {viewingNotice.remarks}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
              {!viewingNotice.acknowledged &&
                viewingNotice.status !==
                  "cancelled" && (
                  <button
                    type="button"
                    disabled={
                      actionLoading === viewingNotice._id
                    }
                    onClick={() =>
                      handleAcknowledge(viewingNotice)
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <Check size={16} />
                    Acknowledge
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  openEditModal(viewingNotice)
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Edit3 size={16} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => setViewingNotice(null)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NoticeTableRow({
  notice,
  actionLoading,
  onView,
  onEdit,
  onIssue,
  onPublish,
  onCancel,
  onAcknowledge,
}: {
  notice: Notice;
  actionLoading: string | null;
  onView: () => void;
  onEdit: () => void;
  onIssue: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onAcknowledge: () => void;
}) {
  const isLoading = actionLoading === notice._id;

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="max-w-80">
          <p className="truncate text-sm font-bold text-slate-900">
            {notice.title}
          </p>

          {notice.subject && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {notice.subject}
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <NoticeTypeBadge type={notice.type} />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User size={14} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {getEmployeeName(notice.employee)}
            </p>

            {getEmployeeId(notice.employee) && (
              <p className="text-xs text-slate-400">
                {getEmployeeId(notice.employee)}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-slate-600">
          {getDepartmentName(notice.department)}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-slate-600">
          {formatDate(
            notice.issuedDate || notice.createdAt,
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <NoticeStatusBadge status={notice.status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1.5">
          <IconButton
            title="View notice"
            onClick={onView}
          >
            <Eye size={16} />
          </IconButton>

          {notice.status === "draft" && (
            <>
              <IconButton
                title="Edit notice"
                onClick={onEdit}
              >
                <Edit3 size={16} />
              </IconButton>

              <IconButton
                title="Issue notice"
                onClick={onIssue}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={16} />
                )}
              </IconButton>
            </>
          )}

          {notice.status === "issued" && (
            <IconButton
              title="Publish notice"
              onClick={onPublish}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Megaphone size={16} />
              )}
            </IconButton>
          )}

          {!notice.acknowledged &&
            notice.status !== "cancelled" && (
              <IconButton
                title="Mark acknowledged"
                onClick={onAcknowledge}
                disabled={isLoading}
              >
                <Check size={16} />
              </IconButton>
            )}

          {notice.status !== "cancelled" &&
            notice.status !== "acknowledged" && (
              <IconButton
                title="Cancel notice"
                onClick={onCancel}
                disabled={isLoading}
              >
                <XCircle size={16} />
              </IconButton>
            )}
        </div>
      </td>
    </tr>
  );
}

function NoticeMobileCard({
  notice,
  actionLoading,
  onView,
  onEdit,
  onIssue,
  onPublish,
  onCancel,
  onAcknowledge,
}: {
  notice: Notice;
  actionLoading: string | null;
  onView: () => void;
  onEdit: () => void;
  onIssue: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onAcknowledge: () => void;
}) {
  const isLoading = actionLoading === notice._id;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {notice.title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {getEmployeeName(notice.employee)}
          </p>
        </div>

        <NoticeStatusBadge status={notice.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <NoticeTypeBadge type={notice.type} />

        <span className="text-xs text-slate-400">
          {formatDate(
            notice.issuedDate || notice.createdAt,
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Department
          </p>

          <p className="mt-1 truncate text-xs font-medium text-slate-700">
            {getDepartmentName(notice.department)}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Employee ID
          </p>

          <p className="mt-1 truncate text-xs font-medium text-slate-700">
            {getEmployeeId(notice.employee) || "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
        >
          <Eye size={14} />
          View
        </button>

        {notice.status === "draft" && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <Edit3 size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={onIssue}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Send size={14} />
              )}
              Issue
            </button>
          </>
        )}

        {notice.status === "issued" && (
          <button
            type="button"
            onClick={onPublish}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Megaphone size={14} />
            )}
            Publish
          </button>
        )}

        {!notice.acknowledged &&
          notice.status !== "cancelled" && (
            <button
              type="button"
              onClick={onAcknowledge}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-50"
            >
              <Check size={14} />
              Acknowledge
            </button>
          )}

        {notice.status !== "cancelled" &&
          notice.status !== "acknowledged" && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
            >
              <XCircle size={14} />
              Cancel
            </button>
          )}
      </div>
    </div>
  );
}