import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
  Info,
  CalendarDays,
  FileText,
  CreditCard,
  BriefcaseBusiness,
  Link as LinkIcon,
} from "lucide-react";

import api from "../../lib/axios";

/* =========================================================
   TYPES
========================================================= */

type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "leave"
  | "attendance"
  | "payroll"
  | "recruitment"
  | "document"
  | "notice"
  | "system";

type NotificationStatus = "read" | "unread";

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: any;
  designation?: any;
  status?: string;
  profileImage?: string;
  avatar?: string;
}

interface NotificationUser {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  department?: any;
  designation?: any;
}

interface Notification {
  _id: string;

  title: string;
  message: string;

  type?: NotificationType;

  status?: NotificationStatus;

  isRead?: boolean;

  read?: boolean;

  readAt?: string | null;

  user?: NotificationUser | string;

  employee?: NotificationUser | string;

  relatedModel?: string;

  relatedId?: string;

  actionUrl?: string;

  metadata?: Record<string, unknown>;

  createdAt?: string;

  updatedAt?: string;
}

interface NotificationForm {
  title: string;
  message: string;
  type: NotificationType;
  recipientType: "all" | "employee";
  employee: string;
  actionUrl: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const EMPTY_FORM: NotificationForm = {
  title: "",
  message: "",
  type: "notice",
  recipientType: "all",
  employee: "",
  actionUrl: "",
};

const NOTIFICATION_TYPES: {
  value: NotificationType;
  label: string;
}[] = [
  {
    value: "info",
    label: "Information",
  },
  {
    value: "success",
    label: "Success",
  },
  {
    value: "warning",
    label: "Warning",
  },
  {
    value: "error",
    label: "Error",
  },
  {
    value: "leave",
    label: "Leave",
  },
  {
    value: "attendance",
    label: "Attendance",
  },
  {
    value: "payroll",
    label: "Payroll",
  },
  {
    value: "recruitment",
    label: "Recruitment",
  },
  {
    value: "document",
    label: "Document",
  },
  {
    value: "notice",
    label: "Notice",
  },
  {
    value: "system",
    label: "System",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getEmployeeName(
  employee?: Employee | NotificationUser | string | null,
): string {
  if (!employee) {
    return "Unknown Employee";
  }

  if (typeof employee === "string") {
    return employee;
  }

  const fullName =
    employee.name ||
    [employee.firstName, employee.lastName]
      .filter(Boolean)
      .join(" ");

  return (
    fullName ||
    employee.employeeId ||
    employee.email ||
    "Unknown Employee"
  );
}

function getEmployeeId(
  employee?: Employee | NotificationUser | string | null,
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.employeeId || "";
}

function getDepartmentName(
  employee?: Employee | NotificationUser | string | null,
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  if (typeof employee.department === "string") {
    return employee.department;
  }

  return employee.department?.name || "";
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isRead(notification: Notification): boolean {
  return (
    notification.isRead === true ||
    notification.read === true ||
    notification.status === "read"
  );
}

function getNotificationType(
  notification: Notification,
): NotificationType {
  return notification.type || "info";
}

function getTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    info: "Information",
    success: "Success",
    warning: "Warning",
    error: "Error",
    leave: "Leave",
    attendance: "Attendance",
    payroll: "Payroll",
    recruitment: "Recruitment",
    document: "Document",
    notice: "Notice",
    system: "System",
  };

  return labels[type] || "Information";
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return CheckCheck;

    case "warning":
      return AlertTriangle;

    case "error":
      return XCircle;

    case "leave":
      return CalendarDays;

    case "attendance":
      return Clock3;

    case "payroll":
      return CreditCard;

    case "recruitment":
      return BriefcaseBusiness;

    case "document":
      return FileText;

    case "notice":
      return BellRing;

    case "system":
      return Users;

    case "info":
    default:
      return Info;
  }
}

function getTypeClasses(type: NotificationType) {
  switch (type) {
    case "success":
      return {
        icon: "bg-emerald-50 text-emerald-600",
        badge:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };

    case "warning":
      return {
        icon: "bg-amber-50 text-amber-600",
        badge:
          "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };

    case "error":
      return {
        icon: "bg-red-50 text-red-600",
        badge:
          "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      };

    case "leave":
      return {
        icon: "bg-violet-50 text-violet-600",
        badge:
          "bg-violet-50 text-violet-700 border-violet-200",
        dot: "bg-violet-500",
      };

    case "attendance":
      return {
        icon: "bg-blue-50 text-blue-600",
        badge:
          "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };

    case "payroll":
      return {
        icon: "bg-cyan-50 text-cyan-600",
        badge:
          "bg-cyan-50 text-cyan-700 border-cyan-200",
        dot: "bg-cyan-500",
      };

    case "recruitment":
      return {
        icon: "bg-red-50 text-[#FE0000]",
        badge:
          "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      };

    case "document":
      return {
        icon: "bg-orange-50 text-orange-600",
        badge:
          "bg-orange-50 text-orange-700 border-orange-200",
        dot: "bg-orange-500",
      };

    case "notice":
      return {
        icon: "bg-pink-50 text-pink-600",
        badge:
          "bg-pink-50 text-pink-700 border-pink-200",
        dot: "bg-pink-500",
      };

    case "system":
      return {
        icon: "bg-slate-100 text-slate-600",
        badge:
          "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-500",
      };

    case "info":
    default:
      return {
        icon: "bg-sky-50 text-sky-600",
        badge:
          "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500",
      };
  }
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: typeof Bell;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Notifications() {
  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [notificationLoading, setNotificationLoading] =
    useState(true);

  const [refreshing, setRefreshing] = useState(false);

  /* =======================================================
     EMPLOYEES
  ======================================================= */

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [employeesLoading, setEmployeesLoading] =
    useState(false);

  const [employeeError, setEmployeeError] = useState("");

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<
    NotificationType | "all"
  >("all");

  const [statusFilter, setStatusFilter] = useState<
    NotificationStatus | "all"
  >("all");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  /* =======================================================
     CREATE MODAL
  ======================================================= */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [form, setForm] =
    useState<NotificationForm>(EMPTY_FORM);

  const [creating, setCreating] = useState(false);

  /* =======================================================
     DETAIL MODAL
  ======================================================= */

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  /* =======================================================
     ACTION LOADING
  ======================================================= */

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  /* =======================================================
     LOAD EMPLOYEES
  ======================================================= */

  const loadEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      setEmployeeError("");

      const response = await api.get("/hr/employees");

      const body = response.data;

      const employeeData =
        body?.data?.items ??
        body?.data ??
        body?.employees ??
        body?.items ??
        [];

      if (Array.isArray(employeeData)) {
        setEmployees(employeeData);
      } else {
        setEmployees([]);
      }
    } catch (error: any) {
      console.error(
        "Failed to load employees:",
        error,
      );

      setEmployees([]);

      setEmployeeError(
        error?.response?.data?.message ||
          "Failed to load employees.",
      );
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  const loadNotifications = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setNotificationLoading(true);
        } else {
          setRefreshing(true);
        }

        const params: Record<
          string,
          string | number
        > = {
          page,
          limit: PAGE_SIZE,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (typeFilter !== "all") {
          params.type = typeFilter;
        }

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const response = await api.get(
          "/hr/notifications",
          {
            params,
          },
        );

        const body = response.data;

        /*
         * Backend can return:
         *
         * {
         *   success: true,
         *   data: {
         *     items: [],
         *     pagination: {}
         *   }
         * }
         *
         * OR older formats.
         */

        let rows: Notification[] = [];

        if (Array.isArray(body?.data)) {
          rows = body.data;
        } else if (
          Array.isArray(body?.data?.items)
        ) {
          rows = body.data.items;
        } else if (
          Array.isArray(
            body?.data?.notifications,
          )
        ) {
          rows = body.data.notifications;
        } else if (
          Array.isArray(body?.items)
        ) {
          rows = body.items;
        } else if (
          Array.isArray(body?.notifications)
        ) {
          rows = body.notifications;
        }

        setNotifications(rows);

        /*
         * IMPORTANT:
         * New backend response:
         *
         * data.pagination
         *
         * Also support top-level pagination.
         */

        const pagination =
          body?.data?.pagination ??
          body?.pagination;

        if (pagination) {
          const total = Number(
            pagination.total ?? rows.length,
          );

          const pages = Number(
            pagination.totalPages ??
              pagination.pages ??
              1,
          );

          setTotalRecords(
            Number.isFinite(total)
              ? total
              : rows.length,
          );

          setTotalPages(
            Number.isFinite(pages) &&
              pages > 0
              ? pages
              : 1,
          );
        } else {
          setTotalRecords(rows.length);

          setTotalPages(
            rows.length === PAGE_SIZE
              ? page + 1
              : page,
          );
        }
      } catch (error: any) {
        console.error(
          "Failed to load notifications:",
          error,
        );

        window.alert(
          error?.response?.data?.message ||
            "Failed to load notifications.",
        );
      } finally {
        setNotificationLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      typeFilter,
      statusFilter,
    ],
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    typeFilter,
    statusFilter,
  ]);

  /* =======================================================
     OPEN CREATE MODAL
  ======================================================= */

  function openCreateModal() {
    setForm({
      ...EMPTY_FORM,
    });

    loadEmployees();

    setShowCreateModal(true);
  }

  /* =======================================================
     UPDATE FORM
  ======================================================= */

  function updateForm(
    key: keyof NotificationForm,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =======================================================
     CREATE NOTIFICATION
  ======================================================= */

  async function createNotification() {
    const title = form.title.trim();

    const message = form.message.trim();

    if (!title) {
      window.alert(
        "Please enter notification title.",
      );

      return;
    }

    if (!message) {
      window.alert(
        "Please enter notification message.",
      );

      return;
    }

    if (
      form.recipientType === "employee" &&
      !form.employee
    ) {
      window.alert(
        "Please select an employee.",
      );

      return;
    }

    try {
      setCreating(true);

      const payload: Record<string, any> = {
        title,
        message,
        type: form.type,
        recipientType: form.recipientType,
      };

      if (
        form.recipientType === "employee"
      ) {
        payload.employee = form.employee;
      }

      if (form.actionUrl.trim()) {
        payload.actionUrl =
          form.actionUrl.trim();
      }

      await api.post(
        "/hr/notifications",
        payload,
      );

      window.alert(
        "Notification created successfully.",
      );

      setShowCreateModal(false);

      setForm({
        ...EMPTY_FORM,
      });

      setPage(1);

      /*
       * page is still the old state inside this
       * function. Explicitly fetch page 1 so the
       * newly created notification is visible.
       */
      try {
        const response = await api.get(
          "/hr/notifications",
          {
            params: {
              page: 1,
              limit: PAGE_SIZE,
              ...(search.trim()
                ? {
                    search: search.trim(),
                  }
                : {}),
              ...(typeFilter !== "all"
                ? {
                    type: typeFilter,
                  }
                : {}),
              ...(statusFilter !== "all"
                ? {
                    status: statusFilter,
                  }
                : {}),
            },
          },
        );

        const body = response.data;

        let rows: Notification[] = [];

        if (Array.isArray(body?.data)) {
          rows = body.data;
        } else if (
          Array.isArray(body?.data?.items)
        ) {
          rows = body.data.items;
        } else if (
          Array.isArray(
            body?.data?.notifications,
          )
        ) {
          rows =
            body.data.notifications;
        } else if (
          Array.isArray(body?.items)
        ) {
          rows = body.items;
        } else if (
          Array.isArray(body?.notifications)
        ) {
          rows = body.notifications;
        }

        setNotifications(rows);

        const pagination =
          body?.data?.pagination ??
          body?.pagination;

        if (pagination) {
          setTotalRecords(
            Number(
              pagination.total ??
                rows.length,
            ),
          );

          setTotalPages(
            Number(
              pagination.totalPages ??
                pagination.pages ??
                1,
            ),
          );
        }
      } catch (refreshError) {
        console.error(
          "Failed to refresh notification list:",
          refreshError,
        );
      }
    } catch (error: any) {
      console.error(
        "Failed to create notification:",
        error,
      );

      window.alert(
        error?.response?.data?.message ||
          "Failed to create notification.",
      );
    } finally {
      setCreating(false);
    }
  }

  /* =======================================================
     MARK READ
  ======================================================= */

  async function markAsRead(
    notification: Notification,
  ) {
    if (isRead(notification)) {
      return;
    }

    try {
      setActionLoading(notification._id);

      await api.patch(
        `/hr/notifications/${notification._id}/read`,
      );

      const now =
        new Date().toISOString();

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
                read: true,
                status: "read",
                readAt: now,
              }
            : item,
        ),
      );

      setSelectedNotification((current) =>
        current?._id === notification._id
          ? {
              ...current,
              isRead: true,
              read: true,
              status: "read",
              readAt: now,
            }
          : current,
      );
    } catch (error: any) {
      console.error(error);

      window.alert(
        error?.response?.data?.message ||
          "Failed to mark notification as read.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =======================================================
     MARK UNREAD
  ======================================================= */

  async function markAsUnread(
    notification: Notification,
  ) {
    if (!isRead(notification)) {
      return;
    }

    try {
      setActionLoading(notification._id);

      await api.patch(
        `/hr/notifications/${notification._id}/unread`,
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: false,
                read: false,
                status: "unread",
                readAt: null,
              }
            : item,
        ),
      );

      setSelectedNotification((current) =>
        current?._id === notification._id
          ? {
              ...current,
              isRead: false,
              read: false,
              status: "unread",
              readAt: null,
            }
          : current,
      );
    } catch (error: any) {
      console.error(error);

      window.alert(
        error?.response?.data?.message ||
          "Failed to mark notification as unread.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =======================================================
     MARK ALL READ
  ======================================================= */

  async function markAllAsRead() {
    if (stats.unread === 0) {
      return;
    }

    try {
      setActionLoading("all");

      await api.patch(
        "/hr/notifications/read-all",
      );

      const now =
        new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          read: true,
          status: "read",
          readAt: item.readAt || now,
        })),
      );

      setSelectedNotification(
        (current) =>
          current
            ? {
                ...current,
                isRead: true,
                read: true,
                status: "read",
                readAt:
                  current.readAt || now,
              }
            : current,
      );
    } catch (error: any) {
      console.error(error);

      window.alert(
        error?.response?.data?.message ||
          "Failed to mark all notifications as read.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteNotification(
    notification: Notification,
  ) {
    const confirmed = window.confirm(
      `Delete "${notification.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(notification._id);

      await api.delete(
        `/hr/notifications/${notification._id}`,
      );

      setNotifications((current) =>
        current.filter(
          (item) =>
            item._id !== notification._id,
        ),
      );

      setTotalRecords((current) =>
        Math.max(0, current - 1),
      );

      if (
        selectedNotification?._id ===
        notification._id
      ) {
        setSelectedNotification(null);
      }
    } catch (error: any) {
      console.error(error);

      window.alert(
        error?.response?.data?.message ||
          "Failed to delete notification.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =======================================================
     OPEN DETAIL
  ======================================================= */

  async function openNotification(
    notification: Notification,
  ) {
    setSelectedNotification(notification);

    if (!isRead(notification)) {
      await markAsRead(notification);
    }
  }

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const unread = notifications.filter(
      (item) => !isRead(item),
    ).length;

    const read = notifications.filter(
      (item) => isRead(item),
    ).length;

    const alerts = notifications.filter(
      (item) => {
        const type =
          getNotificationType(item);

        return (
          type === "warning" ||
          type === "error"
        );
      },
    ).length;

    return {
      total: totalRecords,
      unread,
      read,
      alerts,
    };
  }, [
    notifications,
    totalRecords,
  ]);

  /* =======================================================
     EMPLOYEE OPTIONS
  ======================================================= */

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) =>
      getEmployeeName(a).localeCompare(
        getEmployeeName(b),
      ),
    );
  }, [employees]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const startRecord =
    totalRecords === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    page * PAGE_SIZE,
    totalRecords,
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-red-100 overflow-hidden shadow-sm">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>

              <p className="text-sm text-slate-500">
                Manage HRMS notifications and employee alerts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FE0000] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Add Notification
            </button>

            <button
              type="button"
              onClick={() =>
                loadNotifications(false)
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={
                stats.unread === 0 ||
                actionLoading === "all"
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "all" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}

              Mark all as read
            </button>
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Bell}
            iconClass="bg-red-50 text-[#FE0000]"
          />

          <StatCard
            label="Unread"
            value={stats.unread}
            icon={BellRing}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Read"
            value={stats.read}
            icon={CheckCheck}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Alerts"
            value={stats.alerts}
            icon={AlertTriangle}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* SEARCH */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value,
                  );
                  setPage(1);
                }}
                placeholder="Search notifications..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:bg-white focus:ring-4 focus:ring-red-50"
              />
            </div>

            {/* TYPE */}

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(
                    event.target.value as
                      | NotificationType
                      | "all",
                  );

                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pl-10 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
              >
                <option value="all">
                  All Types
                </option>

                {NOTIFICATION_TYPES.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as
                    | NotificationStatus
                    | "all",
                );

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
            >
              <option value="all">
                All Notifications
              </option>

              <option value="unread">
                Unread
              </option>

              <option value="read">
                Read
              </option>
            </select>
          </div>
        </div>

        {/* =================================================
            LIST
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Notification Center
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {totalRecords} notifications
              </p>
            </div>
          </div>

          {notificationLoading ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#FE0000]" />

                Loading notifications...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center">
              <Bell className="h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No notifications found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters.
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  DESKTOP
              ================================================= */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Notification
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Employee
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {notifications.map(
                      (notification) => {
                        const type =
                          getNotificationType(
                            notification,
                          );

                        const classes =
                          getTypeClasses(type);

                        const Icon =
                          getTypeIcon(type);

                        const read =
                          isRead(
                            notification,
                          );

                        const employee =
                          notification.employee ||
                          notification.user;

                        return (
                          <tr
                            key={
                              notification._id
                            }
                            className={`transition hover:bg-slate-50 ${
                              !read
                                ? "bg-red-50/30"
                                : ""
                            }`}
                          >
                            {/* NOTIFICATION */}

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openNotification(
                                    notification,
                                  )
                                }
                                className="flex max-w-lg items-start gap-3 text-left"
                              >
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {!read && (
                                      <span
                                        className={`h-2 w-2 rounded-full ${classes.dot}`}
                                      />
                                    )}

                                    <p
                                      className={`truncate text-sm ${
                                        read
                                          ? "font-semibold text-slate-800"
                                          : "font-bold text-slate-900"
                                      }`}
                                    >
                                      {
                                        notification.title
                                      }
                                    </p>
                                  </div>

                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                    {
                                      notification.message
                                    }
                                  </p>
                                </div>
                              </button>
                            </td>

                            {/* TYPE */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes.badge}`}
                              >
                                {getTypeLabel(
                                  type,
                                )}
                              </span>
                            </td>

                            {/* EMPLOYEE */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <UserRound className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="max-w-40 truncate text-sm font-medium text-slate-700">
                                    {getEmployeeName(
                                      employee,
                                    )}
                                  </p>

                                  {getEmployeeId(
                                    employee,
                                  ) && (
                                    <p className="text-xs text-slate-400">
                                      {getEmployeeId(
                                        employee,
                                      )}
                                    </p>
                                  )}

                                  {getDepartmentName(
                                    employee,
                                  ) && (
                                    <p className="text-[11px] text-slate-400">
                                      {getDepartmentName(
                                        employee,
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* DATE */}

                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-700">
                                {formatDate(
                                  notification.createdAt,
                                )}
                              </p>

                              <p className="text-xs text-slate-400">
                                {formatTime(
                                  notification.createdAt,
                                )}
                              </p>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  read
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    read
                                      ? "bg-slate-400"
                                      : "bg-red-500"
                                  }`}
                                />

                                {read
                                  ? "Read"
                                  : "Unread"}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openNotification(
                                      notification,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {!read ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAsRead(
                                        notification,
                                      )
                                    }
                                    disabled={
                                      actionLoading ===
                                      notification._id
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                    title="Mark as read"
                                  >
                                    {actionLoading ===
                                    notification._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAsUnread(
                                        notification,
                                      )
                                    }
                                    disabled={
                                      actionLoading ===
                                      notification._id
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                                    title="Mark as unread"
                                  >
                                    <Bell className="h-4 w-4" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteNotification(
                                      notification,
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    notification._id
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  MOBILE
              ================================================= */}

              <div className="divide-y divide-slate-100 lg:hidden">
                {notifications.map(
                  (notification) => {
                    const type =
                      getNotificationType(
                        notification,
                      );

                    const classes =
                      getTypeClasses(type);

                    const Icon =
                      getTypeIcon(type);

                    const read =
                      isRead(
                        notification,
                      );

                    const employee =
                      notification.employee ||
                      notification.user;

                    return (
                      <div
                        key={
                          notification._id
                        }
                        className={`p-4 ${
                          !read
                            ? "bg-red-50/30"
                            : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  {!read && (
                                    <span
                                      className={`h-2 w-2 rounded-full ${classes.dot}`}
                                    />
                                  )}

                                  <p className="text-sm font-semibold text-slate-900">
                                    {
                                      notification.title
                                    }
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${classes.badge}`}
                              >
                                {getTypeLabel(
                                  type,
                                )}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {
                                notification.message
                              }
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <UserRound className="h-3.5 w-3.5" />

                                {getEmployeeName(
                                  employee,
                                )}
                              </span>

                              <span>
                                {formatDate(
                                  notification.createdAt,
                                )}
                              </span>

                              <span
                                className={
                                  read
                                    ? "text-slate-400"
                                    : "font-semibold text-[#FE0000]"
                                }
                              >
                                {read
                                  ? "Read"
                                  : "Unread"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openNotification(
                                    notification,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                View
                              </button>

                              {!read ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    markAsRead(
                                      notification,
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    notification._id
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                                >
                                  Mark read
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    markAsUnread(
                                      notification,
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    notification._id
                                  }
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                                >
                                  Mark unread
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteNotification(
                                    notification,
                                  )
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!notificationLoading &&
            notifications.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <strong>
                    {startRecord}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {endRecord}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {totalRecords}
                  </strong>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                    disabled={page <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 text-xs font-semibold text-slate-600">
                    Page {page} /{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current + 1,
                          ),
                      )
                    }
                    disabled={
                      page >= totalPages
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* =====================================================
          CREATE NOTIFICATION MODAL
      ===================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-[#FE0000]">
                  <BellRing className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Add Notification
                  </h2>

                  <p className="text-sm text-slate-500">
                    Send a notification to employees.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                disabled={creating}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                {/* TITLE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Notification Title
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value,
                      )
                    }
                    placeholder="Enter notification title"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                  />
                </div>

                {/* MESSAGE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      updateForm(
                        "message",
                        event.target.value,
                      )
                    }
                    rows={5}
                    placeholder="Write your notification message..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                  />
                </div>

                {/* TYPE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Notification Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      updateForm(
                        "type",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                  >
                    {NOTIFICATION_TYPES.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* RECIPIENT */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Send To
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* ALL EMPLOYEES */}

                    <button
                      type="button"
                      onClick={() =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            recipientType:
                              "all",
                            employee: "",
                          }),
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        form.recipientType ===
                        "all"
                          ? "border-[#FE0000] bg-red-50 ring-2 ring-red-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            form.recipientType ===
                            "all"
                              ? "bg-[#FE0000] text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Users className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            All Employees
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Send to everyone
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* ONE EMPLOYEE */}

                    <button
                      type="button"
                      onClick={() =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            recipientType:
                              "employee",
                          }),
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        form.recipientType ===
                        "employee"
                          ? "border-[#FE0000] bg-red-50 ring-2 ring-red-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            form.recipientType ===
                            "employee"
                              ? "bg-[#FE0000] text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Specific Employee
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Select one employee
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* EMPLOYEE SELECT */}

                {form.recipientType ===
                  "employee" && (
                  <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Select Employee
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    {employeesLoading ? (
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-[#FE0000]" />

                        Loading employees...
                      </div>
                    ) : (
                      <>
                        <select
                          value={
                            form.employee
                          }
                          onChange={(event) =>
                            updateForm(
                              "employee",
                              event.target.value,
                            )
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                        >
                          <option value="">
                            Select employee
                          </option>

                          {sortedEmployees.map(
                            (employee) => (
                              <option
                                key={
                                  employee._id
                                }
                                value={
                                  employee._id
                                }
                              >
                                {getEmployeeName(
                                  employee,
                                )}
                                {employee.employeeId
                                  ? ` — ${employee.employeeId}`
                                  : ""}
                              </option>
                            ),
                          )}
                        </select>

                        {employees.length ===
                          0 && (
                          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            {employeeError ||
                              "No employees were returned by the API."}
                          </div>
                        )}

                        {employeeError &&
                          employees.length >
                            0 && (
                            <p className="mt-2 text-xs text-amber-600">
                              {
                                employeeError
                              }
                            </p>
                          )}
                      </>
                    )}
                  </div>
                )}

                {/* SELECTED EMPLOYEE */}

                {form.recipientType ===
                  "employee" &&
                  form.employee && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div>
                        {(() => {
                          const selected =
                            employees.find(
                              (employee) =>
                                employee._id ===
                                form.employee,
                            );

                          return (
                            <>
                              <p className="text-sm font-bold text-emerald-900">
                                {getEmployeeName(
                                  selected,
                                )}
                              </p>

                              <p className="text-xs text-emerald-700">
                                {selected?.employeeId ||
                                  selected?.email ||
                                  "Employee selected"}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                {/* ACTION URL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Action URL
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Optional
                    </span>
                  </label>

                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={
                        form.actionUrl
                      }
                      onChange={(event) =>
                        updateForm(
                          "actionUrl",
                          event.target.value,
                        )
                      }
                      placeholder="/hr/payroll"
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Example: /hr/payroll or
                    /hr/leave
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                disabled={creating}
                className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  createNotification
                }
                disabled={creating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Create Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DETAIL MODAL
      ===================================================== */}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                {(() => {
                  const type =
                    getNotificationType(
                      selectedNotification,
                    );

                  const classes =
                    getTypeClasses(type);

                  const Icon =
                    getTypeIcon(type);

                  return (
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${classes.icon}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })()}

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {
                      selectedNotification.title
                    }
                  </h2>

                  <div className="mt-1">
                    <span className="text-xs text-slate-400">
                      {formatDateTime(
                        selectedNotification.createdAt,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(
                    null,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}

            <div className="max-h-[65vh] overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    getTypeClasses(
                      getNotificationType(
                        selectedNotification,
                      ),
                    ).badge
                  }`}
                >
                  {getTypeLabel(
                    getNotificationType(
                      selectedNotification,
                    ),
                  )}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {isRead(
                    selectedNotification,
                  )
                    ? "Read"
                    : "Unread"}
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {
                    selectedNotification.message
                  }
                </p>
              </div>

              {/* EMPLOYEE */}

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employee
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-[#FE0000]">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {getEmployeeName(
                        selectedNotification.employee ||
                          selectedNotification.user,
                      )}
                    </p>

                    {getEmployeeId(
                      selectedNotification.employee ||
                        selectedNotification.user,
                    ) && (
                      <p className="text-xs text-slate-400">
                        {getEmployeeId(
                          selectedNotification.employee ||
                            selectedNotification.user,
                        )}
                      </p>
                    )}

                    {getDepartmentName(
                      selectedNotification.employee ||
                        selectedNotification.user,
                    ) && (
                      <p className="text-xs text-slate-400">
                        {getDepartmentName(
                          selectedNotification.employee ||
                            selectedNotification.user,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION */}

              {selectedNotification.actionUrl && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const url =
                        selectedNotification.actionUrl;

                      if (!url) {
                        return;
                      }

                      if (
                        url.startsWith(
                          "http://",
                        ) ||
                        url.startsWith(
                          "https://",
                        )
                      ) {
                        window.open(
                          url,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      } else {
                        window.location.href =
                          url;
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <LinkIcon className="h-4 w-4" />

                    Open Related Page

                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  deleteNotification(
                    selectedNotification,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />

                Delete
              </button>

              <div className="flex justify-end gap-2">
                {!isRead(
                  selectedNotification,
                ) ? (
                  <button
                    type="button"
                    onClick={() =>
                      markAsRead(
                        selectedNotification,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <Check className="h-4 w-4" />

                    Mark as read
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      markAsUnread(
                        selectedNotification,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    <Bell className="h-4 w-4" />

                    Mark as unread
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedNotification(
                      null,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}