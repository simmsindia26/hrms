import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
    AtSign,
  Bold,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Download,
  Eye,
  FileText,
  Filter,
  Inbox,
  Italic,
  Loader2,
  Mail as MailIcon,
  MailOpen,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import api from "../../lib/axios";

/* =========================================================
   TYPES
========================================================= */

type MailStatus =
  | "queued"
  | "sent"
  | "failed";

type MailCategory =
  | "general"
  | "recruitment"
  | "leave"
  | "attendance"
  | "payroll"
  | "notice"
  | "document"
  | "system";

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: {
    _id?: string;
    name?: string;
  } | string;
  designation?: {
    _id?: string;
    name?: string;
  } | string;
}

interface Candidate {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  html?: string;
  text?: string;
  category?: MailCategory;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Attachment {
  filename: string;
  path?: string;
  contentType?: string;
  size?: number;
}

interface EmailLog {
  _id: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  category?: MailCategory;
  status?: MailStatus;
  messageId?: string;
  error?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  sentBy?: Employee | string;
  relatedEmployee?: Employee | string;
  relatedCandidate?: Candidate | string;
  template?: EmailTemplate | string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}


interface ReceivedEmail {
  _id: string;
  from?:
    | string
    | {
        name?: string;
        address?: string;
      };
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  messageId?: string;
  receivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isRead?: boolean;
  attachments?: Attachment[];
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
    totalPages?: number;
  };
}

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS: {
  value: MailCategory;
  label: string;
}[] = [
  {
    value: "general",
    label: "General",
  },
  {
    value: "recruitment",
    label: "Recruitment",
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
    value: "notice",
    label: "Notice",
  },
  {
    value: "document",
    label: "Document",
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
  employee?: Employee | string,
): string {
  if (!employee) return "Unknown";

  if (typeof employee === "string") {
    return employee;
  }

  if (employee.name) {
    return employee.name;
  }

  const fullName = [
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    employee.employeeId ||
    employee.email ||
    "Unknown"
  );
}


function getCandidateName(
  candidate?: Candidate | string,
): string {
  if (!candidate) return "Unknown";

  if (typeof candidate === "string") {
    return candidate;
  }

  return (
    candidate.name ||
    candidate.email ||
    "Unknown"
  );
}

function normalizeEmails(
  value?: string | string[],
): string {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value;
}


function getSenderName(
  value?: ReceivedEmail["from"],
): string {
  if (!value) return "Unknown sender";

  if (typeof value === "string") {
    const match = value.match(/^(.*?)\s*<([^>]+)>$/);
    if (match) {
      return match[1].trim() || match[2];
    }
    return value;
  }

  return value.name || value.address || "Unknown sender";
}

function getSenderEmail(
  value?: ReceivedEmail["from"],
): string {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/<([^>]+)>/);
    return match ? match[1] : value;
  }

  return value.address || "";
}

function normalizeReceivedEmails(
  value?: string | string[],
): string {
  if (!value) return "";

  return Array.isArray(value)
    ? value.join(", ")
    : value;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) return "—";

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

function formatDateTime(
  value?: string | null,
): string {
  if (!value) return "—";

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

function formatBytes(
  bytes?: number,
): string {
  if (!bytes) return "0 KB";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(
  category?: MailCategory,
): string {
  return (
    CATEGORY_OPTIONS.find(
      (item) => item.value === category,
    )?.label ||
    "General"
  );
}

function getStatusClasses(
  status?: MailStatus,
): string {
  switch (status) {
    case "sent":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "failed":
      return "bg-red-50 text-red-700 border-red-200";

    case "queued":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getCategoryClasses(
  category?: MailCategory,
): string {
  switch (category) {
    case "recruitment":
      return "bg-red-50 text-red-700 border-red-200";

    case "leave":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "attendance":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "payroll":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "notice":
      return "bg-pink-50 text-pink-700 border-pink-200";

    case "document":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "system":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: typeof MailIcon;
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

function StatusBadge({
  status,
}: {
  status?: MailStatus;
}) {
  const label =
    status === "sent"
      ? "Sent"
      : status === "failed"
        ? "Failed"
        : status === "queued"
          ? "Queued"
          : "Unknown";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
        status,
      )}`}
    >
      {status === "sent" && (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}

      {status === "failed" && (
        <XCircle className="h-3.5 w-3.5" />
      )}

      {status === "queued" && (
        <Clock3 className="h-3.5 w-3.5" />
      )}

      {label}
    </span>
  );
}

function CategoryBadge({
  category,
}: {
  category?: MailCategory;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryClasses(
        category,
      )}`}
    >
      {getCategoryLabel(category)}
    </span>
  );
}

/* =========================================================
   COMPOSE FORM
========================================================= */

interface ComposeState {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  html: string;
  text: string;
  category: MailCategory;
  employeeId: string;
  candidateId: string;
  templateId: string;
}

const EMPTY_COMPOSE: ComposeState = {
  to: "",
  cc: "",
  bcc: "",
  subject: "",
  html: "",
  text: "",
  category: "general",
  employeeId: "",
  candidateId: "",
  templateId: "",
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Mail() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(
    [],
  );
  const [candidates, setCandidates] = useState<
    Candidate[]
  >([]);
  const [templates, setTemplates] = useState<
    EmailTemplate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MailStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] =
    useState<MailCategory | "all">("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] =
    useState(0);

  const [activeTab, setActiveTab] = useState<
    "inbox" | "logs" | "templates"
  >("inbox");

  const [inbox, setInbox] = useState<ReceivedEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxRefreshing, setInboxRefreshing] = useState(false);
  const [inboxSearch, setInboxSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState<
    "all" | "unread" | "read"
  >("all");
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxTotalPages, setInboxTotalPages] = useState(1);
  const [inboxTotalRecords, setInboxTotalRecords] = useState(0);
  const [selectedInboxEmail, setSelectedInboxEmail] =
    useState<ReceivedEmail | null>(null);

  const [showFilters, setShowFilters] =
    useState(false);

  const [showCompose, setShowCompose] =
    useState(false);

  const [selectedLog, setSelectedLog] =
    useState<EmailLog | null>(null);

  const [compose, setCompose] =
    useState<ComposeState>(EMPTY_COMPOSE);

  const [attachments, setAttachments] =
    useState<File[]>([]);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /* =======================================================
     LOAD RECEIVED MAIL / INBOX
  ======================================================= */

  const loadInbox = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setInboxLoading(true);
        } else {
          setInboxRefreshing(true);
        }

        const params: Record<string, string | number> = {
          page: inboxPage,
          limit: PAGE_SIZE,
        };

        if (inboxSearch.trim()) {
          params.search = inboxSearch.trim();
        }

        if (inboxFilter !== "all") {
          params.read = inboxFilter === "read" ? "true" : "false";
        }

        const response = await api.get(
          "/email/inbox",
          { params },
        );

        const body =
          response.data as ApiResponse<
            | ReceivedEmail[]
            | {
                emails?: ReceivedEmail[];
                inbox?: ReceivedEmail[];
                messages?: ReceivedEmail[];
              }
          >;

        let rows: ReceivedEmail[] = [];

        if (Array.isArray(body?.data)) {
          rows = body.data;
        } else if (
          body?.data &&
          typeof body.data === "object"
        ) {
          if ("emails" in body.data) {
            rows = body.data.emails || [];
          } else if ("inbox" in body.data) {
            rows = body.data.inbox || [];
          } else if ("messages" in body.data) {
            rows = body.data.messages || [];
          }
        }

        setInbox(rows);

        const pagination = body?.pagination;

        if (pagination) {
          setInboxTotalPages(
            pagination.totalPages ||
              pagination.pages ||
              1,
          );

          setInboxTotalRecords(
            pagination.total || rows.length,
          );
        } else {
          setInboxTotalRecords(rows.length);
          setInboxTotalPages(
            rows.length === PAGE_SIZE
              ? inboxPage + 1
              : inboxPage,
          );
        }
      } catch (error: any) {
        console.error(
          "Failed to load received mail:",
          error,
        );

        window.alert(
          error?.response?.data?.message ||
            "Failed to load received mail.",
        );
      } finally {
        setInboxLoading(false);
        setInboxRefreshing(false);
      }
    },
    [
      inboxPage,
      inboxSearch,
      inboxFilter,
    ],
  );

  const syncInbox = async () => {
    try {
      setInboxRefreshing(true);

      await api.post("/email/inbox/sync");

      await loadInbox(false);
    } catch (error: any) {
      console.error(
        "Failed to sync received mail:",
        error,
      );

      window.alert(
        error?.response?.data?.message ||
          "Failed to sync inbox.",
      );
    } finally {
      setInboxRefreshing(false);
    }
  };

  const markInboxRead = async (
    email: ReceivedEmail,
  ) => {
    if (!email._id) return;

    try {
      await api.patch(
        `/email/inbox/${email._id}/read`,
      );

      setInbox((current) =>
        current.map((item) =>
          item._id === email._id
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setSelectedInboxEmail((current) =>
        current?._id === email._id
          ? { ...current, isRead: true }
          : current,
      );
    } catch (error: any) {
      console.error(
        "Failed to mark email as read:",
        error,
      );

      window.alert(
        error?.response?.data?.message ||
          "Failed to mark email as read.",
      );
    }
  };

  const markInboxUnread = async (
    email: ReceivedEmail,
  ) => {
    if (!email._id) return;

    try {
      await api.patch(
        `/email/inbox/${email._id}/unread`,
      );

      setInbox((current) =>
        current.map((item) =>
          item._id === email._id
            ? { ...item, isRead: false }
            : item,
        ),
      );

      setSelectedInboxEmail((current) =>
        current?._id === email._id
          ? { ...current, isRead: false }
          : current,
      );
    } catch (error: any) {
      console.error(
        "Failed to mark email as unread:",
        error,
      );

      window.alert(
        error?.response?.data?.message ||
          "Failed to mark email as unread.",
      );
    }
  };

  const openInboxEmail = async (
    email: ReceivedEmail,
  ) => {
    setSelectedInboxEmail(email);

    if (!email.isRead) {
      await markInboxRead(email);
    }
  };

  /* =======================================================
     LOAD EMAIL LOGS
  ======================================================= */

  const loadLogs = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
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

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (categoryFilter !== "all") {
          params.category = categoryFilter;
        }

        const response = await api.get(
          "/email/logs",
          { params },
        );

        const body =
          response.data as ApiResponse<
            EmailLog[] | { logs?: EmailLog[] }
          >;

        let rows: EmailLog[] = [];

        if (Array.isArray(body?.data)) {
          rows = body.data;
        } else if (
          body?.data &&
          typeof body.data === "object" &&
          "logs" in body.data
        ) {
          rows = body.data.logs || [];
        }

        setLogs(rows);

        const pagination =
          body?.pagination;

        if (pagination) {
          setTotalPages(
            pagination.totalPages ||
              pagination.pages ||
              1,
          );

          setTotalRecords(
            pagination.total || rows.length,
          );
        } else {
          setTotalRecords(rows.length);

          setTotalPages(
            rows.length === PAGE_SIZE
              ? page + 1
              : page,
          );
        }

        setLastUpdated(new Date());
      } catch (error: any) {
        console.error(
          "Failed to load email logs:",
          error,
        );

        window.alert(
          error?.response?.data?.message ||
            "Failed to load email logs.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      statusFilter,
      categoryFilter,
    ],
  );

  /* =======================================================
     LOAD SUPPORTING DATA
  ======================================================= */

  const loadSupportingData =
    useCallback(async () => {
      try {
        const [
          employeesResponse,
          candidatesResponse,
          templatesResponse,
        ] = await Promise.allSettled([
          api.get("/hr/employees", {
            params: {
              page: 1,
              limit: 500,
            },
          }),
          api.get("/hr/candidates", {
            params: {
              page: 1,
              limit: 500,
            },
          }),
          api.get("/email/templates", {
            params: {
              page: 1,
              limit: 500,
            },
          }),
        ]);

        if (
          employeesResponse.status ===
          "fulfilled"
        ) {
          const body =
            employeesResponse.value
              .data as ApiResponse<
              Employee[] | { employees?: Employee[] }
            >;

          if (Array.isArray(body?.data)) {
            setEmployees(body.data);
          } else if (
            body?.data &&
            typeof body.data ===
              "object" &&
            "employees" in body.data
          ) {
            setEmployees(
              body.data.employees || [],
            );
          }
        }

        if (
          candidatesResponse.status ===
          "fulfilled"
        ) {
          const body =
            candidatesResponse.value
              .data as ApiResponse<
              Candidate[] | { candidates?: Candidate[] }
            >;

          if (Array.isArray(body?.data)) {
            setCandidates(body.data);
          } else if (
            body?.data &&
            typeof body.data ===
              "object" &&
            "candidates" in body.data
          ) {
            setCandidates(
              body.data.candidates || [],
            );
          }
        }

        if (
          templatesResponse.status ===
          "fulfilled"
        ) {
          const body =
            templatesResponse.value
              .data as ApiResponse<
              EmailTemplate[] | {
                templates?: EmailTemplate[];
              }
            >;

          if (Array.isArray(body?.data)) {
            setTemplates(body.data);
          } else if (
            body?.data &&
            typeof body.data ===
              "object" &&
            "templates" in body.data
          ) {
            setTemplates(
              body.data.templates || [],
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load mail support data:",
          error,
        );
      }
    }, []);

  useEffect(() => {
    loadLogs(true);
  }, [loadLogs]);

  useEffect(() => {
    loadSupportingData();
  }, [loadSupportingData]);

  useEffect(() => {
    loadInbox(true);
  }, [loadInbox]);

  useEffect(() => {
    setInboxPage(1);
  }, [inboxSearch, inboxFilter]);



  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    categoryFilter,
  ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const sent = logs.filter(
      (log) => log.status === "sent",
    ).length;

    const failed = logs.filter(
      (log) => log.status === "failed",
    ).length;

    const queued = logs.filter(
      (log) => log.status === "queued",
    ).length;

    const today = new Date();

    const todaySent = logs.filter((log) => {
      if (
        log.status !== "sent" ||
        !log.sentAt
      ) {
        return false;
      }

      const date = new Date(log.sentAt);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() ===
          today.getMonth() &&
        date.getFullYear() ===
          today.getFullYear()
      );
    }).length;

    return {
      total: totalRecords,
      sent,
      failed,
      queued,
      todaySent,
    };
  }, [logs, totalRecords]);

  /* =======================================================
     TEMPLATE ACTIONS
  ======================================================= */

  const applyTemplate = (
    template: EmailTemplate,
  ) => {
    setCompose((current) => ({
      ...current,
      templateId: template._id,
      subject: template.subject || "",
      html:
        template.html ||
        template.text ||
        "",
      text:
        template.text ||
        template.html ||
        "",
      category:
        template.category ||
        current.category,
    }));
  };

  const handleEmployeeChange = (
    employeeId: string,
  ) => {
    const employee = employees.find(
      (item) => item._id === employeeId,
    );

    setCompose((current) => ({
      ...current,
      employeeId,
      to:
        employee?.email ||
        current.to,
    }));
  };

  const handleCandidateChange = (
    candidateId: string,
  ) => {
    const candidate = candidates.find(
      (item) => item._id === candidateId,
    );

    setCompose((current) => ({
      ...current,
      candidateId,
      to:
        candidate?.email ||
        current.to,
    }));
  };

  /* =======================================================
     SEND EMAIL
  ======================================================= */

  const sendEmail = async () => {
    if (!compose.to.trim()) {
      window.alert(
        "Please enter at least one recipient.",
      );
      return;
    }

    if (!compose.subject.trim()) {
      window.alert(
        "Please enter an email subject.",
      );
      return;
    }

    if (!compose.html.trim() && !compose.text.trim()) {
      window.alert(
        "Please enter an email message.",
      );
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      formData.append(
        "to",
        compose.to.trim(),
      );

      if (compose.cc.trim()) {
        formData.append(
          "cc",
          compose.cc.trim(),
        );
      }

      if (compose.bcc.trim()) {
        formData.append(
          "bcc",
          compose.bcc.trim(),
        );
      }

      formData.append(
        "subject",
        compose.subject.trim(),
      );

      formData.append(
        "html",
        compose.html,
      );

      formData.append(
        "text",
        compose.text ||
          compose.html.replace(
            /<[^>]+>/g,
            " ",
          ),
      );

      formData.append(
        "category",
        compose.category,
      );

      if (compose.employeeId) {
        formData.append(
          "relatedEmployee",
          compose.employeeId,
        );
      }

      if (compose.candidateId) {
        formData.append(
          "relatedCandidate",
          compose.candidateId,
        );
      }

      if (compose.templateId) {
        formData.append(
          "template",
          compose.templateId,
        );
      }

      attachments.forEach((file) => {
        formData.append(
          "attachments",
          file,
        );
      });

      await api.post(
        "/email/send",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

      window.alert(
        "Email sent successfully.",
      );

      setCompose(EMPTY_COMPOSE);
      setAttachments([]);
      setShowCompose(false);

      await loadLogs(false);
    } catch (error: any) {
      console.error(
        "Failed to send email:",
        error,
      );

      window.alert(
        error?.response?.data?.message ||
          "Failed to send email.",
      );
    } finally {
      setSending(false);
    }
  };

  /* =======================================================
     RESEND
  ======================================================= */

  const resendEmail = async (
    log: EmailLog,
  ) => {
    if (!log._id) return;

    try {
      setActionLoading(log._id);

      await api.post(
        `/email/logs/${log._id}/resend`,
      );

      window.alert(
        "Email resend request submitted.",
      );

      await loadLogs(false);
    } catch (error: any) {
      console.error(
        "Failed to resend email:",
        error,
      );

      /*
       * Fallback: populate compose form if
       * resend endpoint is not available.
       */
      setCompose({
        to: normalizeEmails(log.to),
        cc: normalizeEmails(log.cc),
        bcc: normalizeEmails(log.bcc),
        subject: log.subject || "",
        html: log.html || "",
        text: log.text || "",
        category:
          log.category || "general",
        employeeId:
          typeof log.relatedEmployee ===
          "string"
            ? log.relatedEmployee
            : log.relatedEmployee?._id ||
              "",
        candidateId:
          typeof log.relatedCandidate ===
          "string"
            ? log.relatedCandidate
            : log.relatedCandidate?._id ||
              "",
        templateId:
          typeof log.template ===
          "string"
            ? log.template
            : log.template?._id || "",
      });

      setShowCompose(true);
    } finally {
      setActionLoading(null);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteLog = async (
    log: EmailLog,
  ) => {
    const confirmed = window.confirm(
      `Delete email log for "${log.subject || "this email"}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(log._id);

      await api.delete(
        `/email/logs/${log._id}`,
      );

      setLogs((current) =>
        current.filter(
          (item) => item._id !== log._id,
        ),
      );

      setTotalRecords((current) =>
        Math.max(0, current - 1),
      );

      setSelectedLog((current) =>
        current?._id === log._id
          ? null
          : current,
      );
    } catch (error: any) {
      console.error(
        "Failed to delete email log:",
        error,
      );

      window.alert(
        error?.response?.data?.message ||
          "Failed to delete email log.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =======================================================
     FILES
  ======================================================= */

  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files || [],
    );

    if (!files.length) return;

    setAttachments((current) => [
      ...current,
      ...files,
    ]);

    event.target.value = "";
  };

  const removeAttachment = (
    index: number,
  ) => {
    setAttachments((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  };

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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FE0000] text-white shadow-sm">
              <MailIcon className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Mail Management
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Send, track and manage HR emails.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await Promise.all([
                  loadLogs(false),
                  loadInbox(false),
                ]);
              }}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
              onClick={() =>
                setShowCompose(true)
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FE0000] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Compose Email
            </button>
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total Emails"
            value={stats.total}
            icon={MailIcon}
            iconClass="bg-red-50 text-[#FE0000]"
          />

          <StatCard
            label="Sent"
            value={stats.sent}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Failed"
            value={stats.failed}
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />

          <StatCard
            label="Queued"
            value={stats.queued}
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* =================================================
            TABS
        ================================================= */}

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setActiveTab("inbox")
            }
            className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              activeTab === "inbox"
                ? "bg-[#FE0000] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Inbox className="h-4 w-4" />
            Received Mail
            {inbox.filter((item) => !item.isRead).length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeTab === "inbox"
                    ? "bg-white/20 text-white"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {inbox.filter((item) => !item.isRead).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("logs")
            }
            className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              activeTab === "logs"
                ? "bg-[#FE0000] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Inbox className="h-4 w-4" />
            Mail Logs
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("templates")
            }
            className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              activeTab === "templates"
                ? "bg-[#FE0000] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText className="h-4 w-4" />
            Templates
          </button>
        </div>

        {/* =================================================
            RECEIVED MAIL
        ================================================= */}

        {activeTab === "inbox" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={inboxSearch}
                    onChange={(event) =>
                      setInboxSearch(event.target.value)
                    }
                    placeholder="Search sender, subject or email..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:bg-white focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <select
                  value={inboxFilter}
                  onChange={(event) =>
                    setInboxFilter(
                      event.target.value as
                        | "all"
                        | "unread"
                        | "read",
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                >
                  <option value="all">All Mail</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>

                <button
                  type="button"
                  onClick={syncInbox}
                  disabled={inboxRefreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      inboxRefreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Sync Inbox
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Received Mail
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Emails received in your configured HR mailbox.
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  {inboxTotalRecords} records
                </span>
              </div>

              {inboxLoading ? (
                <div className="flex min-h-80 items-center justify-center">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#FE0000]" />
                    Loading received mail...
                  </div>
                </div>
              ) : inbox.length === 0 ? (
                <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <MailOpen className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    No received emails
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    Your inbox is empty or no emails match the current filter.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {inbox.map((email) => (
                      <button
                        key={email._id}
                        type="button"
                        onClick={() =>
                          openInboxEmail(email)
                        }
                        className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 ${
                          !email.isRead
                            ? "bg-red-50/40"
                            : "bg-white"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            email.isRead
                              ? "bg-slate-100 text-slate-500"
                              : "bg-red-100 text-[#FE0000]"
                          }`}
                        >
                          {email.isRead ? (
                            <MailOpen className="h-4 w-4" />
                          ) : (
                            <MailIcon className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                              <p
                                className={`truncate text-sm ${
                                  email.isRead
                                    ? "font-medium text-slate-700"
                                    : "font-bold text-slate-900"
                                }`}
                              >
                                {getSenderName(email.from)}
                              </p>

                              {!email.isRead && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#FE0000]" />
                              )}
                            </div>

                            <p className="shrink-0 text-xs text-slate-400">
                              {formatDateTime(
                                email.receivedAt ||
                                  email.createdAt,
                              )}
                            </p>
                          </div>

                          <p
                            className={`mt-1 truncate text-sm ${
                              email.isRead
                                ? "font-medium text-slate-700"
                                : "font-bold text-slate-900"
                            }`}
                          >
                            {email.subject ||
                              "(No subject)"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {getSenderEmail(email.from)}
                          </p>

                          {(email.attachments?.length || 0) >
                            0 && (
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <Paperclip className="h-3.5 w-3.5" />
                              {email.attachments?.length} attachment
                              {(email.attachments?.length || 0) !== 1
                                ? "s"
                                : ""}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {inboxTotalRecords === 0
                          ? 0
                          : (inboxPage - 1) *
                              PAGE_SIZE +
                            1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-700">
                        {Math.min(
                          inboxPage * PAGE_SIZE,
                          inboxTotalRecords,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700">
                        {inboxTotalRecords}
                      </span>
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInboxPage((current) =>
                            Math.max(
                              1,
                              current - 1,
                            ),
                          )
                        }
                        disabled={inboxPage <= 1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <span className="inline-flex h-9 min-w-20 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                        Page {inboxPage} of{" "}
                        {Math.max(
                          1,
                          inboxTotalPages,
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setInboxPage((current) =>
                            Math.min(
                              inboxTotalPages,
                              current + 1,
                            ),
                          )
                        }
                        disabled={
                          inboxPage >=
                          inboxTotalPages
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            MAIL LOGS
        ================================================= */}

        {activeTab === "logs" && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search subject, recipient or email..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FE0000] focus:bg-white focus:ring-4 focus:ring-red-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowFilters(
                        (current) =>
                          !current,
                      )
                    }
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                      showFilters
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </label>

                      <select
                        value={
                          statusFilter
                        }
                        onChange={(
                          event,
                        ) =>
                          setStatusFilter(
                            event.target
                              .value as
                              | MailStatus
                              | "all",
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                      >
                        <option value="all">
                          All Status
                        </option>
                        <option value="sent">
                          Sent
                        </option>
                        <option value="failed">
                          Failed
                        </option>
                        <option value="queued">
                          Queued
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                      </label>

                      <select
                        value={
                          categoryFilter
                        }
                        onChange={(
                          event,
                        ) =>
                          setCategoryFilter(
                            event.target
                              .value as
                              | MailCategory
                              | "all",
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                      >
                        <option value="all">
                          All Categories
                        </option>

                        {CATEGORY_OPTIONS.map(
                          (category) => (
                            <option
                              key={
                                category.value
                              }
                              value={
                                category.value
                              }
                            >
                              {
                                category.label
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter(
                            "all",
                          );
                          setCategoryFilter(
                            "all",
                          );
                        }}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Email History
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {lastUpdated
                      ? `Last updated ${formatDateTime(
                          lastUpdated.toISOString(),
                        )}`
                      : "Loading..."}
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  {totalRecords} records
                </span>
              </div>

              {loading ? (
                <div className="flex min-h-96 items-center justify-center">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#FE0000]" />
                    Loading mail logs...
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <MailOpen className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    No email logs found
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    No emails match your current filters.
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-240">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Email
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Recipient
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Category
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Date
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                          <tr
                            key={log._id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedLog(
                                    log,
                                  )
                                }
                                className="max-w-lg text-left"
                              >
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {log.subject ||
                                    "(No subject)"}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-400">
                                  {log.messageId ||
                                    "Email"}
                                </p>
                              </button>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <AtSign className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-52 truncate text-sm font-medium text-slate-700">
                                    {normalizeEmails(
                                      log.to,
                                    )}
                                  </p>

                                  {log.cc && (
                                    <p className="text-xs text-slate-400">
                                      CC:{" "}
                                      {normalizeEmails(
                                        log.cc,
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <CategoryBadge
                                category={
                                  log.category
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  log.status
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-700">
                                {formatDate(
                                  log.sentAt ||
                                    log.createdAt,
                                )}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {formatDateTime(
                                  log.sentAt ||
                                    log.createdAt,
                                ).split(
                                  ",",
                                )[1] || ""}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1.5">
                                <IconButton
                                  title="View email"
                                  onClick={() =>
                                    setSelectedLog(
                                      log,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </IconButton>

                                {log.status ===
                                  "failed" && (
                                  <IconButton
                                    title="Resend"
                                    onClick={() =>
                                      resendEmail(
                                        log,
                                      )
                                    }
                                    disabled={
                                      actionLoading ===
                                      log._id
                                    }
                                  >
                                    {actionLoading ===
                                    log._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                  </IconButton>
                                )}

                                <IconButton
                                  title="Delete log"
                                  onClick={() =>
                                    deleteLog(
                                      log,
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    log._id
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE */}
                  <div className="divide-y divide-slate-100 lg:hidden">
                    {logs.map((log) => (
                      <div
                        key={log._id}
                        className="p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                            <MailIcon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedLog(
                                    log,
                                  )
                                }
                                className="min-w-0 text-left"
                              >
                                <p className="text-sm font-bold text-slate-900">
                                  {log.subject ||
                                    "(No subject)"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {normalizeEmails(
                                    log.to,
                                  )}
                                </p>
                              </button>

                              <StatusBadge
                                status={
                                  log.status
                                }
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <CategoryBadge
                                category={
                                  log.category
                                }
                              />

                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(
                                  log.sentAt ||
                                    log.createdAt,
                                )}
                              </span>
                            </div>

                            {log.error && (
                              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                {log.error}
                              </div>
                            )}

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedLog(
                                    log,
                                  )
                                }
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>

                              {log.status ===
                                "failed" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    resendEmail(
                                      log,
                                    )
                                  }
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Resend
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteLog(
                                    log,
                                  )
                                }
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PAGINATION */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {startRecord}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-700">
                        {endRecord}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700">
                        {totalRecords}
                      </span>
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <span className="inline-flex h-9 min-w-20 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                        Page {page} of{" "}
                        {Math.max(
                          1,
                          totalPages,
                        )}
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* =================================================
            TEMPLATES
        ================================================= */}

        {activeTab === "templates" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Email Templates
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Reusable HR email templates.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCompose(true)
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FE0000] px-3 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Compose
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FileText className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  No templates found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Create templates from the email template management module.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {templates.map(
                  (template) => (
                    <div
                      key={template._id}
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                          <FileText className="h-4 w-4" />
                        </div>

                        {template.category && (
                          <CategoryBadge
                            category={
                              template.category
                            }
                          />
                        )}
                      </div>

                      <h3 className="mt-4 text-sm font-bold text-slate-900">
                        {template.name}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {template.description ||
                          template.subject}
                      </p>

                      <div className="mt-4 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Subject
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {template.subject}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          applyTemplate(
                            template,
                          );
                          setShowCompose(true);
                        }}
                        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Use Template
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          COMPOSE MODAL
      ===================================================== */}

      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !sending
            ) {
              setShowCompose(false);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                  <Send className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Compose Email
                  </h2>

                  <p className="text-xs text-slate-500">
                    Send an email through your configured SMTP server.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCompose(false)
                }
                disabled={sending}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
                {/* LEFT */}
                <div className="space-y-4">
                  {/* TEMPLATE */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-slate-500" />

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Template
                      </p>
                    </div>

                    <select
                      value={
                        compose.templateId
                      }
                      onChange={(event) => {
                        const template =
                          templates.find(
                            (item) =>
                              item._id ===
                              event.target
                                .value,
                          );

                        if (template) {
                          applyTemplate(
                            template,
                          );
                        } else {
                          setCompose(
                            (current) => ({
                              ...current,
                              templateId:
                                "",
                            }),
                          );
                        }
                      }}
                      className="mt-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    >
                      <option value="">
                        Select template
                      </option>

                      {templates
                        .filter(
                          (template) =>
                            template.isActive !==
                            false,
                        )
                        .map(
                          (template) => (
                            <option
                              key={
                                template._id
                              }
                              value={
                                template._id
                              }
                            >
                              {
                                template.name
                              }
                            </option>
                          ),
                        )}
                    </select>
                  </div>

                  {/* RECIPIENT */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      To
                    </label>

                    <div className="relative">
                      <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        value={compose.to}
                        onChange={(
                          event,
                        ) =>
                          setCompose(
                            (current) => ({
                              ...current,
                              to: event.target
                                .value,
                            }),
                          )
                        }
                        placeholder="recipient@example.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                      />
                    </div>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Multiple recipients can be separated by commas.
                    </p>
                  </div>

                  {/* CC BCC */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        CC
                      </label>

                      <input
                        type="text"
                        value={compose.cc}
                        onChange={(
                          event,
                        ) =>
                          setCompose(
                            (current) => ({
                              ...current,
                              cc: event.target
                                .value,
                            }),
                          )
                        }
                        placeholder="cc@example.com"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        BCC
                      </label>

                      <input
                        type="text"
                        value={compose.bcc}
                        onChange={(
                          event,
                        ) =>
                          setCompose(
                            (current) => ({
                              ...current,
                              bcc: event.target
                                .value,
                            }),
                          )
                        }
                        placeholder="bcc@example.com"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                      />
                    </div>
                  </div>

                  {/* SUBJECT */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Subject
                    </label>

                    <input
                      type="text"
                      value={compose.subject}
                      onChange={(event) =>
                        setCompose(
                          (current) => ({
                            ...current,
                            subject:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Enter email subject"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    />
                  </div>

                  {/* MESSAGE */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Message
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Bold"
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Italic"
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          title="HTML"
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={compose.html}
                      onChange={(event) =>
                        setCompose(
                          (current) => ({
                            ...current,
                            html: event.target
                              .value,
                            text: event.target
                              .value
                              .replace(
                                /<[^>]+>/g,
                                " ",
                              ),
                          }),
                        )
                      }
                      rows={12}
                      placeholder="Write your email message..."
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    />
                  </div>

                  {/* ATTACHMENTS */}
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Attachments
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Add supporting documents to this email.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Add Attachment
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={
                          handleFiles
                        }
                      />
                    </div>

                    {attachments.length >
                      0 && (
                      <div className="mt-4 space-y-2">
                        {attachments.map(
                          (
                            file,
                            index,
                          ) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0 text-[#FE0000]" />

                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-700">
                                    {
                                      file.name
                                    }
                                  </p>

                                  <p className="text-[11px] text-slate-400">
                                    {formatBytes(
                                      file.size,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeAttachment(
                                    index,
                                  )
                                }
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
                  {/* CATEGORY */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-slate-500" />

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Email Category
                      </p>
                    </div>

                    <select
                      value={
                        compose.category
                      }
                      onChange={(event) =>
                        setCompose(
                          (current) => ({
                            ...current,
                            category:
                              event.target
                                .value as MailCategory,
                          }),
                        )
                      }
                      className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    >
                      {CATEGORY_OPTIONS.map(
                        (category) => (
                          <option
                            key={
                              category.value
                            }
                            value={
                              category.value
                            }
                          >
                            {
                              category.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {/* EMPLOYEE */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-slate-500" />

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Employee
                      </p>
                    </div>

                    <select
                      value={
                        compose.employeeId
                      }
                      onChange={(event) =>
                        handleEmployeeChange(
                          event.target
                            .value,
                        )
                      }
                      className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    >
                      <option value="">
                        Select employee
                      </option>

                      {employees.map(
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
                            {employee.email
                              ? ` — ${employee.email}`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {/* CANDIDATE */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Candidate
                      </p>
                    </div>

                    <select
                      value={
                        compose.candidateId
                      }
                      onChange={(event) =>
                        handleCandidateChange(
                          event.target
                            .value,
                        )
                      }
                      className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FE0000] focus:ring-4 focus:ring-red-50"
                    >
                      <option value="">
                        Select candidate
                      </option>

                      {candidates.map(
                        (candidate) => (
                          <option
                            key={
                              candidate._id
                            }
                            value={
                              candidate._id
                            }
                          >
                            {getCandidateName(
                              candidate,
                            )}
                            {candidate.email
                              ? ` — ${candidate.email}`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {/* SMTP INFO */}
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#FE0000]">
                        <MailIcon className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          SMTP Mail
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-700">
                          Emails are delivered using the SMTP credentials configured on the HRD server.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECURITY */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <p className="text-xs leading-5 text-slate-500">
                        BCC recipients are hidden from other recipients. Email activity is recorded in the HR mail logs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  setShowCompose(false)
                }
                disabled={sending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="button"
                onClick={sendEmail}
                disabled={sending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                {sending
                  ? "Sending..."
                  : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EMAIL DETAIL MODAL
      ===================================================== */}

      {/* =====================================================
          RECEIVED MAIL VIEW MODAL
      ===================================================== */}

      {selectedInboxEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedInboxEmail(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                  <MailOpen className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {selectedInboxEmail.subject ||
                      "(No subject)"}
                  </h2>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {getSenderEmail(
                      selectedInboxEmail.from,
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedInboxEmail(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[70px_1fr]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    From
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {getSenderName(
                        selectedInboxEmail.from,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {getSenderEmail(
                        selectedInboxEmail.from,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[70px_1fr]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    To
                  </p>
                  <p className="text-sm text-slate-700">
                    {normalizeReceivedEmails(
                      selectedInboxEmail.to,
                    ) || "—"}
                  </p>
                </div>

                {selectedInboxEmail.cc && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[70px_1fr]">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      CC
                    </p>
                    <p className="text-sm text-slate-700">
                      {normalizeReceivedEmails(
                        selectedInboxEmail.cc,
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[70px_1fr]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="text-sm text-slate-700">
                    {formatDateTime(
                      selectedInboxEmail.receivedAt ||
                        selectedInboxEmail.createdAt,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                {selectedInboxEmail.html ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedInboxEmail.html,
                    }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedInboxEmail.text ||
                      "No message content."}
                  </div>
                )}
              </div>

              {selectedInboxEmail.attachments &&
                selectedInboxEmail.attachments.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Attachments
                    </p>

                    <div className="mt-3 space-y-2">
                      {selectedInboxEmail.attachments.map(
                        (attachment, index) => (
                          <div
                            key={`${attachment.filename}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <Paperclip className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700">
                                  {attachment.filename}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {formatBytes(
                                    attachment.size,
                                  )}
                                </p>
                              </div>
                            </div>

                            {attachment.path && (
                              <a
                                href={attachment.path}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  selectedInboxEmail.isRead
                    ? markInboxUnread(
                        selectedInboxEmail,
                      )
                    : markInboxRead(
                        selectedInboxEmail,
                      )
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {selectedInboxEmail.isRead ? (
                  <>
                    <MailIcon className="h-4 w-4" />
                    Mark Unread
                  </>
                ) : (
                  <>
                    <MailOpen className="h-4 w-4" />
                    Mark Read
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedInboxEmail(null)
                }
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedLog(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                  <MailIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedLog.subject ||
                      "(No subject)"}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      status={
                        selectedLog.status
                      }
                    />

                    <CategoryBadge
                      category={
                        selectedLog.category
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    From
                  </p>

                  <p className="text-sm text-slate-700">
                    HR Mail System
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    To
                  </p>

                  <p className="wrap-break-word text-sm text-slate-700">
                    {normalizeEmails(
                      selectedLog.to,
                    )}
                  </p>
                </div>

                {selectedLog.cc && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      CC
                    </p>

                    <p className="wrap-break-word text-sm text-slate-700">
                      {normalizeEmails(
                        selectedLog.cc,
                      )}
                    </p>
                  </div>
                )}

                {selectedLog.bcc && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      BCC
                    </p>

                    <p className="wrap-break-word text-sm text-slate-700">
                      {normalizeEmails(
                        selectedLog.bcc,
                      )}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Date
                  </p>

                  <p className="text-sm text-slate-700">
                    {formatDateTime(
                      selectedLog.sentAt ||
                        selectedLog.createdAt,
                    )}
                  </p>
                </div>
              </div>

              {selectedLog.error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                    <div>
                      <p className="text-sm font-bold text-red-800">
                        Delivery Error
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-700 wrap-break-word">
                        {
                          selectedLog.error
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedLog.html ||
                      selectedLog.text ||
                      "<p>No message content.</p>",
                  }}
                />
              </div>

              {selectedLog.attachments &&
                selectedLog.attachments
                  .length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Attachments
                    </p>

                    <div className="mt-3 space-y-2">
                      {selectedLog.attachments.map(
                        (
                          attachment,
                          index,
                        ) => (
                          <div
                            key={`${attachment.filename}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <Paperclip className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700">
                                  {
                                    attachment.filename
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  {formatBytes(
                                    attachment.size,
                                  )}
                                </p>
                              </div>
                            </div>

                            {attachment.path && (
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  deleteLog(selectedLog)
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Log
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedLog.status ===
                  "failed" && (
                  <button
                    type="button"
                    onClick={() =>
                      resendEmail(
                        selectedLog,
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Resend
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedLog(null)
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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