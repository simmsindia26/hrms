import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";

interface EmployeeReference {
  _id?: string;
  id?: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Notice {
  _id: string;
  title: string;
  subject?: string;
  description?: string;
  content?: string;
  message?: string;

  type?: string;
  priority?: string;

  status?: string;
  isPublished?: boolean;
  published?: boolean;

  targetAudience?: string;
  audience?: string;
  department?: string | { _id?: string; name?: string };
  designation?: string | { _id?: string; name?: string };

  employees?: Array<string | EmployeeReference>;
  employee?: string | EmployeeReference;

  attachment?: string;
  attachmentUrl?: string;
  fileUrl?: string;

  publishDate?: string;
  publishedAt?: string;
  effectiveDate?: string;
  expiryDate?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface NoticeResponse {
  notices?: Notice[];
  items?: Notice[];
  docs?: Notice[];
  data?:
    | Notice[]
    | {
        notices?: Notice[];
        items?: Notice[];
        docs?: Notice[];
      };
}

const getEmployeeId = (
  employee: string | EmployeeReference | null | undefined,
) => {
  if (!employee) return "";

  if (typeof employee === "string") {
    return employee;
  }

  return employee._id || employee.id || employee.employeeId || "";
};

const getEmployeeName = (
  employee: string | EmployeeReference | null | undefined,
) => {
  if (!employee) return "";

  if (typeof employee === "string") {
    return "";
  }

  if (employee.name?.trim()) {
    return employee.name.trim();
  }

  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getNoticeDate = (notice: Notice) => {
  return (
    notice.publishDate ||
    notice.publishedAt ||
    notice.effectiveDate ||
    notice.createdAt
  );
};

const getNoticeContent = (notice: Notice) => {
  return notice.description || notice.content || notice.message || "";
};

const getNoticeType = (notice: Notice) => {
  return (notice.type || "general").toLowerCase();
};

const getPriority = (notice: Notice) => {
  return (notice.priority || "normal").toLowerCase();
};

const extractNotices = (payload: unknown): Notice[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as NoticeResponse;

  if (Array.isArray(response.notices)) {
    return response.notices;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.docs)) {
    return response.docs;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === "object") {
    if (Array.isArray(response.data.notices)) {
      return response.data.notices;
    }

    if (Array.isArray(response.data.items)) {
      return response.data.items;
    }

    if (Array.isArray(response.data.docs)) {
      return response.data.docs;
    }
  }

  return [];
};

const getTypeClasses = (type: string) => {
  switch (type) {
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "urgent":
      return "bg-red-50 text-red-700 border-red-200";

    case "holiday":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "policy":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "announcement":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getPriorityClasses = (priority: string) => {
  switch (priority) {
    case "high":
    case "urgent":
      return "text-red-600";

    case "medium":
      return "text-amber-600";

    default:
      return "text-slate-500";
  }
};

const EmployeeNotices = () => {
  const { user } = useAuth();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const employeeId = useMemo(
    () => getEmployeeId(user?.employee),
    [user?.employee],
  );

  const employeeName = useMemo(() => {
    const linkedName = getEmployeeName(user?.employee);

    if (linkedName) return linkedName;

    if (user?.name) return user.name;

    const fullName = `${user?.firstName || ""} ${
      user?.lastName || ""
    }`.trim();

    return fullName || user?.email?.split("@")[0] || "Employee";
  }, [user]);

  const loadNotices = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/hr/notices", {
          params: {
            page: 1,
            limit: 500,
            employee: employeeId || undefined,
            employeeId: employeeId || undefined,
          },
        });

        const list = extractNotices(response.data);

        setNotices(list);
        setCurrentPage(1);
      } catch (err: any) {
        console.error("Failed to load notices:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load notices. Please try again.",
        );

        setNotices([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId],
  );

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const noticeTypes = useMemo(() => {
    return [
      ...new Set(
        notices
          .map((notice) => getNoticeType(notice))
          .filter(Boolean),
      ),
    ];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const title = (
        notice.title ||
        notice.subject ||
        ""
      ).toLowerCase();

      const content = getNoticeContent(notice).toLowerCase();

      const type = getNoticeType(notice);
      const priority = getPriority(notice);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        content.includes(query) ||
        type.includes(query);

      const matchesType =
        typeFilter === "all" || type === typeFilter;

      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesPriority
      );
    });
  }, [notices, search, typeFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotices.length / itemsPerPage),
  );

  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredNotices.slice(
      start,
      start + itemsPerPage,
    );
  }, [filteredNotices, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summary = useMemo(() => {
    const urgent = notices.filter((notice) => {
      const priority = getPriority(notice);
      const type = getNoticeType(notice);

      return (
        priority === "high" ||
        priority === "urgent" ||
        type === "urgent" ||
        type === "warning"
      );
    }).length;

    const published = notices.filter(
      (notice) =>
        notice.isPublished === true ||
        notice.published === true ||
        notice.status === "published",
    ).length;

    return {
      total: notices.length,
      urgent,
      published,
    };
  }, [notices]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPriorityFilter("all");
    setCurrentPage(1);
  };

  const getTitle = (notice: Notice) => {
    return notice.title || notice.subject || "Notice";
  };

  const hasAttachment = (notice: Notice) => {
    return Boolean(
      notice.attachment ||
        notice.attachmentUrl ||
        notice.fileUrl,
    );
  };

  const getAttachmentUrl = (notice: Notice) => {
    return (
      notice.attachmentUrl ||
      notice.fileUrl ||
      notice.attachment ||
      ""
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#FE0000]">
              <Bell size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notices
              </h1>

              <p className="text-sm text-slate-500">
                Company announcements and important updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadNotices(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* Welcome */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#FE0000] to-red-700 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-red-100">
                Welcome, {employeeName}
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Stay updated with company notices
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-red-100">
                Important announcements, policies, holidays and
                HR communications will appear here.
              </p>
            </div>

            <div className="hidden rounded-2xl bg-white/10 p-4 sm:block">
              <Bell size={32} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-[#FE0000]">
                <FileText size={20} />
              </div>

              <p className="text-sm text-slate-500">
                Total Notices
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>

              <p className="text-sm text-slate-500">
                Published
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {summary.published}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <AlertCircle size={20} />
              </div>

              <p className="text-sm text-slate-500">
                Important
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {summary.urgent}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search notices..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            >
              <option value="all">All Types</option>

              {noticeTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() +
                    type.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            {(search ||
              typeFilter !== "all" ||
              priorityFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2
                size={28}
                className="animate-spin text-[#FE0000]"
              />
              <span className="text-sm">
                Loading notices...
              </span>
            </div>
          </div>
        ) : paginatedNotices.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Bell size={32} />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              No notices found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Company notices and announcements published for
              employees will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Notice Cards */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paginatedNotices.map((notice) => {
                const type = getNoticeType(notice);
                const priority = getPriority(notice);
                const title = getTitle(notice);
                const content = getNoticeContent(notice);

                return (
                  <article
                    key={notice._id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Card Top */}
                    <div className="border-b border-slate-100 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getTypeClasses(
                            type,
                          )}`}
                        >
                          {type.replace(/_/g, " ")}
                        </span>

                        <div
                          className={`flex items-center gap-1 text-xs font-medium capitalize ${getPriorityClasses(
                            priority,
                          )}`}
                        >
                          {priority === "urgent" ||
                          priority === "high" ? (
                            <AlertCircle size={14} />
                          ) : (
                            <Clock3 size={14} />
                          )}

                          {priority}
                        </div>
                      </div>

                      <h3 className="mt-4 line-clamp-2 text-lg font-semibold text-slate-900">
                        {title}
                      </h3>

                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays size={14} />

                        <span>
                          {formatDate(
                            getNoticeDate(notice),
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="line-clamp-4 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {content ||
                          "No additional details available."}
                      </p>

                      {hasAttachment(notice) && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <FileText size={15} />
                          Attachment available
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedNotice(notice)
                        }
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        <Eye size={16} />
                        View Notice
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {filteredNotices.length === 0
                    ? 0
                    : (currentPage - 1) *
                        itemsPerPage +
                      1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredNotices.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {filteredNotices.length}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="min-w-20 text-center text-sm font-medium text-slate-700">
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        totalPages,
                        page + 1,
                      ),
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getTypeClasses(
                      getNoticeType(selectedNotice),
                    )}`}
                  >
                    {getNoticeType(
                      selectedNotice,
                    ).replace(/_/g, " ")}
                  </span>

                  <span
                    className={`text-xs font-medium capitalize ${getPriorityClasses(
                      getPriority(selectedNotice),
                    )}`}
                  >
                    {getPriority(
                      selectedNotice,
                    )}{" "}
                    priority
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  {getTitle(selectedNotice)}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={15} />
                  {formatDate(
                    getNoticeDate(selectedNotice),
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotice(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {getNoticeContent(selectedNotice) ||
                    "No additional details available."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Published
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(
                      selectedNotice.publishDate ||
                        selectedNotice.publishedAt ||
                        selectedNotice.createdAt,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Effective Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(
                      selectedNotice.effectiveDate,
                    )}
                  </p>
                </div>
              </div>

              {selectedNotice.expiryDate && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                    Notice Expiry
                  </p>

                  <p className="mt-1 font-medium text-amber-900">
                    {formatDate(
                      selectedNotice.expiryDate,
                    )}
                  </p>
                </div>
              )}

              {hasAttachment(selectedNotice) && (
                <a
                  href={getAttachmentUrl(selectedNotice)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-red-50"
                >
                  <FileText size={17} />
                  Open Attachment
                </a>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNotice(null)
                  }
                  className="rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
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
};

export default EmployeeNotices;