import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Loader2,
  Mail as MailIcon,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../../lib/axios";

interface Notification {
  _id: string;
  title?: string;
  message?: string;
  description?: string;

  type?: string;
  priority?: string;

  isRead?: boolean;
  read?: boolean;

  user?: string;
  employee?: string;

  actionUrl?: string;
  link?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface NotificationResponse {
  notifications?: Notification[];
  items?: Notification[];
  docs?: Notification[];
  data?:
    | Notification[]
    | {
        notifications?: Notification[];
        items?: Notification[];
        docs?: Notification[];
      };
}

type NotificationFilter =
  | "all"
  | "unread"
  | "read";

const extractNotifications = (
  payload: unknown,
): Notification[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response =
    payload as NotificationResponse;

  if (Array.isArray(response.notifications)) {
    return response.notifications;
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

  if (
    response.data &&
    typeof response.data === "object"
  ) {
    if (
      Array.isArray(
        response.data.notifications,
      )
    ) {
      return response.data.notifications;
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

const isRead = (notification: Notification) => {
  return (
    notification.isRead === true ||
    notification.read === true
  );
};

const getTitle = (notification: Notification) => {
  return notification.title || "Notification";
};

const getMessage = (
  notification: Notification,
) => {
  return (
    notification.message ||
    notification.description ||
    "No additional details available."
  );
};

const getType = (notification: Notification) => {
  return (
    notification.type || "general"
  ).toLowerCase();
};

const getPriority = (
  notification: Notification,
) => {
  return (
    notification.priority || "normal"
  ).toLowerCase();
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();

  if (
    date.toDateString() ===
    now.toDateString()
  ) {
    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

const formatFullDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeClasses = (type: string) => {
  switch (type) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "error":
    case "danger":
      return "bg-red-50 text-red-700 border-red-200";

    case "leave":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "attendance":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "payroll":
    case "salary":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "notice":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getPriorityClasses = (
  priority: string,
) => {
  switch (priority) {
    case "urgent":
    case "high":
      return "text-red-600";

    case "medium":
      return "text-amber-600";

    default:
      return "text-slate-400";
  }
};

const NotificationIcon = ({
  type,
}: {
  type: string;
}) => {
  switch (type) {
    case "success":
      return (
        <Check
          size={19}
          strokeWidth={2.5}
        />
      );

    case "warning":
      return (
        <AlertCircle
          size={19}
        />
      );

    case "error":
    case "danger":
      return (
        <AlertCircle
          size={19}
        />
      );

    case "attendance":
      return (
        <Clock3 size={19} />
      );

    case "payroll":
    case "salary":
      return (
        <Info size={19} />
      );

    case "notice":
      return (
        <Bell size={19} />
      );

    default:
      return (
        <Info size={19} />
      );
  }
};

const EmployeeNotifications = () => {
  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState<NotificationFilter>(
      "all",
    );

  const [search, setSearch] =
    useState("");

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState<Notification | null>(
    null,
  );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const itemsPerPage = 10;

  const loadNotifications =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await api.get(
              "/hr/notifications",
              {
                params: {
                  page: 1,
                  limit: 500,
                },
              },
            );

          setNotifications(
            extractNotifications(
              response.data,
            ),
          );

          setCurrentPage(1);
        } catch (err: any) {
          console.error(
            "Failed to load notifications:",
            err,
          );

          setError(
            err?.response?.data
              ?.message ||
              "Unable to load notifications. Please try again.",
          );

          setNotifications([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (item) => !isRead(item),
        ).length,
      [notifications],
    );

  const readCount =
    notifications.length -
    unreadCount;

  const urgentCount =
    useMemo(
      () =>
        notifications.filter(
          (item) => {
            const priority =
              getPriority(item);

            return (
              priority === "urgent" ||
              priority === "high"
            );
          },
        ).length,
      [notifications],
    );

  const filteredNotifications =
    useMemo(() => {
      let list = notifications;

      if (filter === "unread") {
        list = list.filter(
          (item) => !isRead(item),
        );
      }

      if (filter === "read") {
        list = list.filter(
          (item) => isRead(item),
        );
      }

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return list;
      }

      return list.filter(
        (notification) => {
          return (
            getTitle(notification)
              .toLowerCase()
              .includes(query) ||
            getMessage(notification)
              .toLowerCase()
              .includes(query) ||
            getType(notification)
              .includes(query)
          );
        },
      );
    }, [
      notifications,
      filter,
      search,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredNotifications.length /
          itemsPerPage,
      ),
    );

  const paginatedNotifications =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        itemsPerPage;

      return filteredNotifications.slice(
        start,
        start + itemsPerPage,
      );
    }, [
      filteredNotifications,
      currentPage,
    ]);

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const markAsRead = async (
    notification: Notification,
  ) => {
    if (isRead(notification)) {
      return;
    }

    try {
      await api.patch(
        `/hr/notifications/${notification._id}/read`,
      );

      setNotifications(
        (current) =>
          current.map((item) =>
            item._id ===
            notification._id
              ? {
                  ...item,
                  isRead: true,
                  read: true,
                }
              : item,
          ),
      );

      setSelectedNotification(
        (current) =>
          current?._id ===
          notification._id
            ? {
                ...current,
                isRead: true,
                read: true,
              }
            : current,
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err,
      );
    }
  };

  const markAsUnread = async (
    notification: Notification,
  ) => {
    try {
      await api.patch(
        `/hr/notifications/${notification._id}/unread`,
      );

      setNotifications(
        (current) =>
          current.map((item) =>
            item._id ===
            notification._id
              ? {
                  ...item,
                  isRead: false,
                  read: false,
                }
              : item,
          ),
      );

      setSelectedNotification(
        (current) =>
          current?._id ===
          notification._id
            ? {
                ...current,
                isRead: false,
                read: false,
              }
            : current,
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as unread:",
        err,
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(
        "/hr/notifications/read-all",
      );

      setNotifications(
        (current) =>
          current.map((item) => ({
            ...item,
            isRead: true,
            read: true,
          })),
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err,
      );

      // Fallback to updating visible local state
      setNotifications(
        (current) =>
          current.map((item) => ({
            ...item,
            isRead: true,
            read: true,
          })),
      );
    }
  };

  const deleteNotification = async (
    notification: Notification,
  ) => {
    try {
      await api.delete(
        `/hr/notifications/${notification._id}`,
      );

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item._id !==
              notification._id,
          ),
      );

      if (
        selectedNotification?._id ===
        notification._id
      ) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error(
        "Failed to delete notification:",
        err,
      );
    }
  };

  const openNotification = async (
    notification: Notification,
  ) => {
    setSelectedNotification(
      notification,
    );

    await markAsRead(
      notification,
    );
  };

  const openAction = (
    notification: Notification,
  ) => {
    const url =
      notification.actionUrl ||
      notification.link;

    if (!url) {
      return;
    }

    window.location.href = url;
  };

  const filters: Array<{
    key: NotificationFilter;
    label: string;
    count: number;
  }> = [
    {
      key: "all",
      label: "All",
      count: notifications.length,
    },
    {
      key: "unread",
      label: "Unread",
      count: unreadCount,
    },
    {
      key: "read",
      label: "Read",
      count: readCount,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Sellopedia"
              className="h-10 w-auto object-contain"
            />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#FE0000]">
              <Bell size={24} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>

              <p className="text-sm text-slate-500">
                Stay updated with your HRMS activities
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <CheckCheck
                  size={17}
                />
                Mark All Read
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                loadNotifications(
                  true,
                )
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-[#FE0000]">
                <Bell size={20} />
              </div>

              <p className="text-sm text-slate-500">
                Total
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Bell size={20} />
              </div>

              <p className="text-sm text-slate-500">
                Unread
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <AlertCircle
                  size={20}
                />
              </div>

              <p className="text-sm text-slate-500">
                High Priority
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {urgentCount}
            </p>
          </div>
        </div>

        {/* Main */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filter tabs */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
              {filters.map(
                (item) => {
                  const active =
                    filter ===
                    item.key;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() => {
                        setFilter(
                          item.key,
                        );
                        setCurrentPage(
                          1,
                        );
                      }}
                      className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-white text-[#FE0000] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {
                        item.label
                      }

                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                          active
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {
                          item.count
                        }
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(
                  event,
                ) => {
                  setSearch(
                    event.target
                      .value,
                  );
                  setCurrentPage(
                    1,
                  );
                }}
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2
                  size={28}
                  className="animate-spin text-[#FE0000]"
                />
                <span className="text-sm">
                  Loading notifications...
                </span>
              </div>
            </div>
          ) : paginatedNotifications.length ===
            0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <BellOff
                  size={32}
                />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No notifications
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                You're all caught up. New HRMS
                notifications will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Notifications */}
              <div className="divide-y divide-slate-100">
                {paginatedNotifications.map(
                  (notification) => {
                    const read =
                      isRead(
                        notification,
                      );

                    const type =
                      getType(
                        notification,
                      );

                    const priority =
                      getPriority(
                        notification,
                      );

                    return (
                      <div
                        key={
                          notification._id
                        }
                        className={`group flex gap-4 p-4 transition hover:bg-slate-50 sm:p-5 ${
                          !read
                            ? "bg-red-50/30"
                            : ""
                        }`}
                      >
                        {/* Icon */}
                        <button
                          type="button"
                          onClick={() =>
                            openNotification(
                              notification,
                            )
                          }
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getTypeClasses(
                            type,
                          )}`}
                        >
                          <NotificationIcon
                            type={
                              type
                            }
                          />
                        </button>

                        {/* Content */}
                        <button
                          type="button"
                          onClick={() =>
                            openNotification(
                              notification,
                            )
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className={`truncate text-sm ${
                                    read
                                      ? "font-medium text-slate-700"
                                      : "font-bold text-slate-900"
                                  }`}
                                >
                                  {getTitle(
                                    notification,
                                  )}
                                </h3>

                                {!read && (
                                  <span className="h-2 w-2 rounded-full bg-[#FE0000]" />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                                {getMessage(
                                  notification,
                                )}
                              </p>
                            </div>

                            <span className="shrink-0 text-xs text-slate-400">
                              {formatDate(
                                notification.createdAt ||
                                  notification.updatedAt,
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getTypeClasses(
                                type,
                              )}`}
                            >
                              {type.replace(
                                /_/g,
                                " ",
                              )}
                            </span>

                            <span
                              className={`text-xs font-medium capitalize ${getPriorityClasses(
                                priority,
                              )}`}
                            >
                              {priority}{" "}
                              priority
                            </span>
                          </div>
                        </button>

                        {/* Actions */}
                        <div className="flex shrink-0 items-start gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                          {read ? (
                            <button
                              type="button"
                              onClick={() =>
                                markAsUnread(
                                  notification,
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#FE0000]"
                              title="Mark unread"
                            >
                              <MailIcon
                                size={17}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification,
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#FE0000]"
                              title="Mark read"
                            >
                              <Check
                                size={17}
                              />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteNotification(
                                notification,
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {filteredNotifications.length ===
                    0
                      ? 0
                      : (currentPage -
                          1) *
                          itemsPerPage +
                        1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-700">
                    {Math.min(
                      currentPage *
                        itemsPerPage,
                      filteredNotifications.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {
                      filteredNotifications.length
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      currentPage <=
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1,
                          ),
                      )
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <span className="min-w-20 text-center text-sm font-medium text-slate-700">
                    Page{" "}
                    {
                      currentPage
                    }{" "}
                    /{" "}
                    {
                      totalPages
                    }
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage >=
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1,
                          ),
                      )
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getTypeClasses(
                    getType(
                      selectedNotification,
                    ),
                  )}`}
                >
                  <NotificationIcon
                    type={getType(
                      selectedNotification,
                    )}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {getTitle(
                      selectedNotification,
                    )}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatFullDate(
                      selectedNotification.createdAt ||
                        selectedNotification.updatedAt,
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(
                    null,
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getTypeClasses(
                    getType(
                      selectedNotification,
                    ),
                  )}`}
                >
                  {getType(
                    selectedNotification,
                  ).replace(
                    /_/g,
                    " ",
                  )}
                </span>

                <span
                  className={`rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize ${getPriorityClasses(
                    getPriority(
                      selectedNotification,
                    ),
                  )}`}
                >
                  {getPriority(
                    selectedNotification,
                  )}{" "}
                  priority
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {getMessage(
                    selectedNotification,
                  )}
                </p>
              </div>

              {selectedNotification.actionUrl ||
              selectedNotification.link ? (
                <button
                  type="button"
                  onClick={() =>
                    openAction(
                      selectedNotification,
                    )
                  }
                  className="w-full rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Open Related Page
                </button>
              ) : null}

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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Check size={16} />
                    Mark Read
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      markAsUnread(
                        selectedNotification,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <MailIcon size={16} />
                    Mark Unread
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedNotification(
                      null,
                    )
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

export default EmployeeNotifications;