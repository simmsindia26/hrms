import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Globe,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import api from "../../lib/axios";

type AuditAction =
  | "login"
  | "logout"
  | "login_failed"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "publish"
  | "upload"
  | "download"
  | "password_change"
  | "password_reset"
  | "status_change"
  | "other";

interface UserRef {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuditLog {
  _id: string;
  user?: UserRef | string | null;
  action: AuditAction | string;
  module?: string;
  entity?: string;
  entityId?: string;
  description?: string;
  method?: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  success?: boolean;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AuditResponse {
  success?: boolean;
  data?:
    | AuditLog[]
    | {
        logs?: AuditLog[];
        items?: AuditLog[];
        docs?: AuditLog[];
        pagination?: Pagination;
        meta?: Pagination;
      };
  logs?: AuditLog[];
  items?: AuditLog[];
  docs?: AuditLog[];
  pagination?: Pagination;
  meta?: Pagination;
}

interface Stats {
  total: number;
  today: number;
  security: number;
  changes: number;
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "login_failed", label: "Failed Login" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "publish", label: "Publish" },
  { value: "upload", label: "Upload" },
  { value: "download", label: "Download" },
  { value: "password_change", label: "Password Change" },
  { value: "password_reset", label: "Password Reset" },
  { value: "status_change", label: "Status Change" },
  { value: "other", label: "Other" },
];

const MODULE_OPTIONS = [
  "auth",
  "users",
  "employees",
  "recruitment",
  "jobs",
  "attendance",
  "leave",
  "documents",
  "notices",
  "payroll",
  "email",
  "settings",
  "departments",
  "designations",
  "notifications",
  "system",
];

const actionLabel = (action?: string) => {
  if (!action) return "Unknown";

  const found = ACTION_OPTIONS.find((item) => item.value === action);

  if (found) return found.label;

  return action
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const moduleLabel = (module?: string) => {
  if (!module) return "System";

  return module
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getUserName = (user?: UserRef | string | null) => {
  if (!user) return "System";

  if (typeof user === "string") {
    return user;
  }

  return user.name || user.email || "Unknown User";
};

const getUserEmail = (user?: UserRef | string | null) => {
  if (!user || typeof user === "string") return "";

  return user.email || "";
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isToday = (value?: string) => {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const getActionClasses = (action?: string) => {
  switch (action) {
    case "login":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "logout":
      return "bg-slate-100 text-slate-700 border-slate-200";

    case "login_failed":
    case "reject":
    case "delete":
      return "bg-red-50 text-red-700 border-red-200";

    case "create":
    case "approve":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "update":
    case "status_change":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "publish":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "upload":
    case "download":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "password_change":
    case "password_reset":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getActionIcon = (action?: string) => {
  switch (action) {
    case "login":
      return <LogIn size={14} />;

    case "logout":
      return <LogOut size={14} />;

    case "login_failed":
      return <AlertCircle size={14} />;

    case "create":
      return <UserPlus size={14} />;

    case "delete":
      return <Trash2 size={14} />;

    case "password_change":
    case "password_reset":
      return <KeyRound size={14} />;

    default:
      return <Activity size={14} />;
  }
};

const getMethodClasses = (method?: string) => {
  switch (method?.toUpperCase()) {
    case "GET":
      return "bg-blue-50 text-blue-700";

    case "POST":
      return "bg-emerald-50 text-emerald-700";

    case "PUT":
    case "PATCH":
      return "bg-amber-50 text-amber-700";

    case "DELETE":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

const prettyJson = (value: unknown) => {
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  });

  const [stats, setStats] = useState<Stats>({
    total: 0,
    today: 0,
    security: 0,
    changes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const [users, setUsers] = useState<UserRef[]>([]);

  const activeFilterCount = useMemo(() => {
    return [
      action,
      module,
      userId,
      dateFrom,
      dateTo,
    ].filter(Boolean).length;
  }, [action, module, userId, dateFrom, dateTo]);

  const extractLogs = (response: AuditResponse): AuditLog[] => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (response?.data && typeof response.data === "object") {
      if (Array.isArray(response.data.logs)) {
        return response.data.logs;
      }

      if (Array.isArray(response.data.items)) {
        return response.data.items;
      }

      if (Array.isArray(response.data.docs)) {
        return response.data.docs;
      }
    }

    if (Array.isArray(response?.logs)) {
      return response.logs;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    if (Array.isArray(response?.docs)) {
      return response.docs;
    }

    return [];
  };

  const extractPagination = (
    response: AuditResponse,
    fallbackPage: number,
    fallbackLimit: number,
    itemCount: number,
  ): Pagination => {
    const nestedData =
      response?.data && !Array.isArray(response.data)
        ? response.data
        : undefined;

    const pagination =
      response?.pagination ||
      response?.meta ||
      nestedData?.pagination ||
      nestedData?.meta;

    if (pagination) {
      return {
        page: Number(pagination.page) || fallbackPage,
        limit: Number(pagination.limit) || fallbackLimit,
        total: Number(pagination.total) || itemCount,
        pages:
          Number(pagination.pages) ||
          Math.max(
            1,
            Math.ceil(
              (Number(pagination.total) || itemCount) /
                (Number(pagination.limit) || fallbackLimit),
            ),
          ),
      };
    }

    return {
      page: fallbackPage,
      limit: fallbackLimit,
      total: itemCount,
      pages: Math.max(1, Math.ceil(itemCount / fallbackLimit)),
    };
  };

  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get("/hr/users", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const data = response.data?.data;

      const userList = Array.isArray(data)
        ? data
        : data?.users ||
          data?.items ||
          data?.docs ||
          response.data?.users ||
          response.data?.items ||
          response.data?.docs ||
          [];

      setUsers(
        userList.map((item: UserRef) => ({
          _id: item._id,
          name: item.name,
          email: item.email,
          role: item.role,
        })),
      );
    } catch {
      // User filter is optional. Do not block audit log loading.
    }
  }, []);

  const calculateStats = useCallback((items: AuditLog[], total: number) => {
    const today = items.filter((item) => isToday(item.createdAt)).length;

    const securityActions = [
      "login",
      "logout",
      "login_failed",
      "password_change",
      "password_reset",
    ];

    const changeActions = [
      "create",
      "update",
      "delete",
      "approve",
      "reject",
      "publish",
      "status_change",
    ];

    const security = items.filter((item) =>
      securityActions.includes(item.action),
    ).length;

    const changes = items.filter((item) =>
      changeActions.includes(item.action),
    ).length;

    setStats({
      total,
      today,
      security,
      changes,
    });
  }, []);

  const loadLogs = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get("/hr/audit-logs", {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search: search || undefined,
            action: action || undefined,
            module: module || undefined,
            user: userId || undefined,
            userId: userId || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
        });

        const payload: AuditResponse = response.data || {};

        const nextLogs = extractLogs(payload);

        const nextPagination = extractPagination(
          payload,
          pagination.page,
          pagination.limit,
          nextLogs.length,
        );

        setLogs(nextLogs);
        setPagination((current) => ({
          ...current,
          ...nextPagination,
        }));

        calculateStats(nextLogs, nextPagination.total || 0);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load audit logs.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      action,
      calculateStats,
      dateFrom,
      dateTo,
      module,
      pagination.limit,
      pagination.page,
      search,
      userId,
    ],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setModule("");
    setUserId("");
    setDateFrom("");
    setDateTo("");

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter(value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const changePage = (page: number) => {
    if (page < 1 || page > Math.max(1, pagination.pages)) return;

    setPagination((current) => ({
      ...current,
      page,
    }));
  };

  const visiblePages = useMemo(() => {
    const totalPages = Math.max(1, pagination.pages);
    const current = pagination.page;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (current >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [current - 2, current - 1, current, current + 1, current + 2];
  }, [pagination.page, pagination.pages]);

  const firstItem =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const lastItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <Shield size={16} />
              Administration
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track system activity, security events, and administrative
              changes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLogs(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Activity"
            value={stats.total}
            subtitle="Recorded audit events"
            icon={<Activity size={20} />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Today's Activity"
            value={stats.today}
            subtitle="Events recorded today"
            icon={<Clock size={20} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Security Events"
            value={stats.security}
            subtitle="Login & security actions"
            icon={<Shield size={20} />}
            iconClass="bg-orange-50 text-orange-600"
          />

          <StatCard
            title="Data Changes"
            value={stats.changes}
            subtitle="Create, update & delete"
            icon={<Activity size={20} />}
            iconClass="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Search / Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Search user, action, module, endpoint, description..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                showFilters || activeFilterCount > 0
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter size={17} />
              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <FilterSelect
                  label="Action"
                  value={action}
                  onChange={(value) =>
                    handleFilterChange(setAction, value)
                  }
                  options={ACTION_OPTIONS.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />

                <FilterSelect
                  label="Module"
                  value={module}
                  onChange={(value) =>
                    handleFilterChange(setModule, value)
                  }
                  options={[
                    { value: "", label: "All Modules" },
                    ...MODULE_OPTIONS.map((item) => ({
                      value: item,
                      label: moduleLabel(item),
                    })),
                  ]}
                />

                <FilterSelect
                  label="User"
                  value={userId}
                  onChange={(value) =>
                    handleFilterChange(setUserId, value)
                  }
                  options={[
                    { value: "", label: "All Users" },
                    ...users
                      .filter((user) => user._id)
                      .map((user) => ({
                        value: user._id as string,
                        label: user.name || user.email || "Unknown User",
                      })),
                  ]}
                />

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    From
                  </label>

                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) =>
                        handleFilterChange(
                          setDateFrom,
                          event.target.value,
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    To
                  </label>

                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) =>
                        handleFilterChange(
                          setDateTo,
                          event.target.value,
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    <X size={15} />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />

            <div className="flex-1">
              <p className="text-sm font-semibold">
                Unable to load audit logs
              </p>

              <p className="mt-1 text-sm">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => loadLogs()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Activity History
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Showing {firstItem}–{lastItem} of {pagination.total} records
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live audit history
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-96 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2
                  size={30}
                  className="animate-spin text-blue-600"
                />
                <span className="text-sm">Loading audit logs...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              hasFilters={
                Boolean(search) ||
                activeFilterCount > 0
              }
              onClear={clearFilters}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        User
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Module
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Activity
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Request
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        IP Address
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <AuditTableRow
                        key={log._id}
                        log={log}
                        onView={() => setSelectedLog(log)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {logs.map((log) => (
                  <AuditMobileCard
                    key={log._id}
                    log={log}
                    onView={() => setSelectedLog(log)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Page {pagination.page} of{" "}
                {Math.max(1, pagination.pages)}
              </div>

              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    changePage(pagination.page - 1)
                  }
                  disabled={pagination.page <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changePage(page)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
                      page === pagination.page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    changePage(pagination.page + 1)
                  }
                  disabled={
                    pagination.page >= pagination.pages
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <AuditDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
        {options.map((option) => (
          <option
            key={`${label}-${option.value}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AuditTableRow({
  log,
  onView,
}: {
  log: AuditLog;
  onView: () => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <User size={16} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {getUserName(log.user)}
            </p>

            {getUserEmail(log.user) && (
              <p className="truncate text-xs text-slate-400">
                {getUserEmail(log.user)}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionClasses(
            log.action,
          )}`}
        >
          {getActionIcon(log.action)}
          {actionLabel(log.action)}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {moduleLabel(log.module)}
        </span>

        {log.entity && (
          <p className="mt-1 max-w-32 truncate text-xs text-slate-400">
            {log.entity}
          </p>
        )}
      </td>

      <td className="max-w-72 px-5 py-4">
        <p className="truncate text-sm font-medium text-slate-700">
          {log.description || "System activity recorded"}
        </p>

        {log.entityId && (
          <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
            ID: {log.entityId}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {log.method && (
            <span
              className={`rounded-md px-2 py-1 text-[10px] font-bold ${getMethodClasses(
                log.method,
              )}`}
            >
              {log.method.toUpperCase()}
            </span>
          )}

          {log.statusCode !== undefined && (
            <span
              className={`text-xs font-semibold ${
                log.statusCode >= 400
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {log.statusCode}
            </span>
          )}
        </div>

        {log.endpoint && (
          <p className="mt-1 max-w-52 truncate font-mono text-[10px] text-slate-400">
            {log.endpoint}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Globe size={14} className="text-slate-400" />
          {log.ipAddress || "-"}
        </div>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <p className="text-sm font-medium text-slate-700">
          {formatDate(log.createdAt)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {log.createdAt
            ? new Date(log.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </p>
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          title="View details"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  );
}

function AuditMobileCard({
  log,
  onView,
}: {
  log: AuditLog;
  onView: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <User size={17} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {getUserName(log.user)}
            </p>

            <p className="text-xs text-slate-400">
              {formatDateTime(log.createdAt)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <Eye size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionClasses(
            log.action,
          )}`}
        >
          {getActionIcon(log.action)}
          {actionLabel(log.action)}
        </span>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {moduleLabel(log.module)}
        </span>

        {log.method && (
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-bold ${getMethodClasses(
              log.method,
            )}`}
          >
            {log.method.toUpperCase()}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-700">
        {log.description || "System activity recorded"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            IP Address
          </p>
          <p className="mt-1 truncate text-xs font-medium text-slate-600">
            {log.ipAddress || "-"}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Entity
          </p>
          <p className="mt-1 truncate text-xs font-medium text-slate-600">
            {log.entity || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Activity size={28} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-800">
        No audit logs found
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No activity matches the selected search or filters."
          : "There are no audit events available yet."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function AuditDetailsModal({
  log,
  onClose,
}: {
  log: AuditLog;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionClasses(
                  log.action,
                )}`}
              >
                {getActionIcon(log.action)}
                {actionLabel(log.action)}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {moduleLabel(log.module)}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-slate-900">
              Audit Log Details
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {formatDateTime(log.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailItem
              label="User"
              value={getUserName(log.user)}
            />

            <DetailItem
              label="Email"
              value={getUserEmail(log.user) || "-"}
            />

            <DetailItem
              label="Action"
              value={actionLabel(log.action)}
            />

            <DetailItem
              label="Module"
              value={moduleLabel(log.module)}
            />

            <DetailItem
              label="Entity"
              value={log.entity || "-"}
            />

            <DetailItem
              label="Entity ID"
              value={log.entityId || "-"}
              mono
            />

            <DetailItem
              label="IP Address"
              value={log.ipAddress || "-"}
              mono
            />

            <DetailItem
              label="Request Method"
              value={log.method?.toUpperCase() || "-"}
              mono
            />

            <DetailItem
              label="Status Code"
              value={
                log.statusCode !== undefined
                  ? String(log.statusCode)
                  : "-"
              }
            />

            <DetailItem
              label="Success"
              value={
                log.success === undefined
                  ? "-"
                  : log.success
                    ? "Yes"
                    : "No"
              }
            />

            <div className="md:col-span-2">
              <DetailItem
                label="Endpoint"
                value={log.endpoint || "-"}
                mono
              />
            </div>

            <div className="md:col-span-2">
              <DetailItem
                label="Description"
                value={
                  log.description ||
                  "No description available."
                }
              />
            </div>

            {log.userAgent && (
              <div className="md:col-span-2">
                <DetailItem
                  label="User Agent"
                  value={log.userAgent}
                />
              </div>
            )}
          </div>

          {/* Old / New Values */}
          {(log.oldValues || log.newValues) && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Data Changes
              </h3>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <JsonPanel
                  title="Previous Values"
                  value={log.oldValues}
                  emptyText="No previous values recorded."
                />

                <JsonPanel
                  title="New Values"
                  value={log.newValues}
                  emptyText="No new values recorded."
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata &&
            Object.keys(log.metadata).length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Metadata
                </h3>

                <JsonPanel
                  title="Additional Metadata"
                  value={log.metadata}
                  emptyText="No metadata recorded."
                />
              </div>
            )}

          {/* Timestamp */}
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <Clock size={15} />

            <span>
              Recorded on{" "}
              <strong className="font-semibold text-slate-700">
                {formatDateTime(log.createdAt)}
              </strong>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1.5 wrap-break-word text-sm text-slate-700 ${
          mono ? "font-mono text-xs" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function JsonPanel({
  title,
  value,
  emptyText,
}: {
  title: string;
  value?: Record<string, unknown> | null;
  emptyText: string;
}) {
  const content =
    value && Object.keys(value).length > 0
      ? prettyJson(value)
      : "";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-700">
          {title}
        </p>
      </div>

      <div className="max-h-72 overflow-auto bg-slate-950 p-4">
        {content ? (
          <pre className="wrap-break-word whitespace-pre-wrap font-mono text-xs leading-5 text-slate-200">
            {content}
          </pre>
        ) : (
          <p className="text-xs text-slate-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}