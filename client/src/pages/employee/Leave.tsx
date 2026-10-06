import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  Plus,
  X,
  Loader2,
  RefreshCw,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LeaveType {
  _id: string;
  name: string;
  annualQuota?: number;
  isPaid?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LeaveRecord {
  _id: string;

  leaveType?:
    | string
    | {
        _id?: string;
        name?: string;
        code?: string;
      };

  type?:
    | string
    | {
        _id?: string;
        name?: string;
        code?: string;
      };

  startDate?: string;
  endDate?: string;

  fromDate?: string;
  toDate?: string;

  numberOfDays?: number;
  days?: number;
  totalDays?: number;

  reason?: string;
  remarks?: string;

  status?:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | string;

  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  rejectionReason?: string;
  approvedBy?: string;
}

interface LeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

interface FormState {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
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

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getErrorMessage(
  error: unknown
): string {
  if (isObject(error)) {
    const apiError =
      error as ApiError;

    if (
      apiError.response?.data?.message
    ) {
      return apiError.response.data
        .message;
    }

    if (apiError.message) {
      return apiError.message;
    }
  }

  return "Something went wrong.";
}

/* -------------------------------------------------------------------------- */
/* Extract Leave Types                                                        */
/* -------------------------------------------------------------------------- */

function extractLeaveTypes(
  payload: unknown
): LeaveType[] {
  if (Array.isArray(payload)) {
    return payload as LeaveType[];
  }

  if (!isObject(payload)) {
    return [];
  }

  const candidates: unknown[] = [
    payload.leaveTypes,
    payload.leave_types,
    payload.types,
    payload.items,
    payload.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as LeaveType[];
    }

    if (isObject(candidate)) {
      const nested: unknown[] = [
        candidate.leaveTypes,
        candidate.leave_types,
        candidate.types,
        candidate.items,
      ];

      for (const item of nested) {
        if (Array.isArray(item)) {
          return item as LeaveType[];
        }
      }
    }
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/* Extract Leaves                                                             */
/* -------------------------------------------------------------------------- */

function extractLeaves(
  payload: unknown
): LeaveRecord[] {
  if (Array.isArray(payload)) {
    return payload as LeaveRecord[];
  }

  if (!isObject(payload)) {
    return [];
  }

  const candidates: unknown[] = [
    payload.leaves,
    payload.leaveRequests,
    payload.leave_requests,
    payload.items,
    payload.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as LeaveRecord[];
    }

    if (isObject(candidate)) {
      const nested: unknown[] = [
        candidate.leaves,
        candidate.leaveRequests,
        candidate.leave_requests,
        candidate.items,
      ];

      for (const item of nested) {
        if (Array.isArray(item)) {
          return item as LeaveRecord[];
        }
      }
    }
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/* Extract Summary                                                            */
/* -------------------------------------------------------------------------- */

function extractSummary(
  payload: unknown
): Partial<LeaveSummary> {
  if (!isObject(payload)) {
    return {};
  }

  const candidates: unknown[] = [
    payload.summary,
  ];

  if (isObject(payload.data)) {
    candidates.push(
      payload.data.summary
    );
  }

  for (const candidate of candidates) {
    if (isObject(candidate)) {
      return candidate as Partial<LeaveSummary>;
    }
  }

  return {};
}

/* -------------------------------------------------------------------------- */
/* Date Helpers                                                               */
/* -------------------------------------------------------------------------- */

function formatDate(
  value?: string
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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

/* -------------------------------------------------------------------------- */
/* Calculate Days                                                             */
/* -------------------------------------------------------------------------- */

function calculateDays(
  startDate: string,
  endDate: string
): number {
  if (!startDate || !endDate) {
    return 0;
  }

  /*
   * Use local date values instead of UTC
   * conversion so dates don't shift by one
   * day depending on timezone.
   */

  const start = new Date(
    `${startDate}T00:00:00`
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  if (end < start) {
    return 0;
  }

  const difference =
    end.getTime() -
    start.getTime();

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

/* -------------------------------------------------------------------------- */
/* Leave Type Name                                                            */
/* -------------------------------------------------------------------------- */

function getLeaveTypeName(
  leave: LeaveRecord
): string {
  const value =
    leave.leaveType ||
    leave.type;

  if (!value) {
    return "Leave";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.code ||
    "Leave"
  );
}

/* -------------------------------------------------------------------------- */
/* Leave Days                                                                 */
/* -------------------------------------------------------------------------- */

function getLeaveDays(
  leave: LeaveRecord
): number {
  const value =
    leave.numberOfDays ??
    leave.totalDays ??
    leave.days;

  if (value !== undefined) {
    const numeric = Number(value);

    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }

  const start =
    leave.startDate ||
    leave.fromDate;

  const end =
    leave.endDate ||
    leave.toDate;

  if (!start || !end) {
    return 0;
  }

  return calculateDays(
    start.substring(0, 10),
    end.substring(0, 10)
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

function getStatusLabel(
  status?: string
): string {
  if (!status) {
    return "Pending";
  }

  switch (status.toLowerCase()) {
    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "cancelled":
      return "Cancelled";

    case "pending":
      return "Pending";

    default:
      return status
        .replace(/_/g, " ")
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );
  }
}

function getStatusClasses(
  status?: string
): string {
  switch (
    status?.toLowerCase()
  ) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "pending":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStatusIcon(
  status?: string
): ReactNode {
  switch (
    status?.toLowerCase()
  ) {
    case "approved":
      return (
        <CheckCircle2 className="h-4 w-4" />
      );

    case "rejected":
      return (
        <XCircle className="h-4 w-4" />
      );

    case "cancelled":
      return (
        <XCircle className="h-4 w-4" />
      );

    case "pending":
    default:
      return (
        <Clock3 className="h-4 w-4" />
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function EmployeeLeave() {
  const { user } = useAuth();

  const [leaveTypes, setLeaveTypes] =
    useState<LeaveType[]>([]);

  const [leaves, setLeaves] =
    useState<LeaveRecord[]>([]);

  const [summary, setSummary] =
    useState<LeaveSummary>({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    });

  const [loading, setLoading] =
    useState<boolean>(true);

  const [refreshing, setRefreshing] =
    useState<boolean>(false);

  const [submitting, setSubmitting] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const [success, setSuccess] =
    useState<string>("");

  const [showApplyModal, setShowApplyModal] =
    useState<boolean>(false);

  const [selectedPage, setSelectedPage] =
    useState<number>(1);

  const [search, setSearch] =
    useState<string>("");

  const [statusFilter, setStatusFilter] =
    useState<string>("all");

  const [form, setForm] =
    useState<FormState>({
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
    });

  /* ------------------------------------------------------------------------ */
  /* Employee ID                                                              */
  /* ------------------------------------------------------------------------ */

  const employeeId =
    useMemo<string>(() => {
      const employee =
        user?.employee;

      if (!employee) {
        return "";
      }

      if (
        typeof employee === "string"
      ) {
        return employee;
      }

      return (
        employee._id ||
        employee.id ||
        ""
      );
    }, [user]);

  /* ------------------------------------------------------------------------ */
  /* Load Leave Types                                                         */
  /* ------------------------------------------------------------------------ */

  const loadLeaveTypes =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/hr/leave-types",
            {
              params: {
                page: 1,
                limit: 100,
              },
            }
          );

        const list =
          extractLeaveTypes(
            response.data
          );

        /*
         * Only active leave types should
         * be available to employees.
         */

        const activeTypes =
          list.filter(
            (type) =>
              type.isActive !== false
          );

        setLeaveTypes(
          activeTypes
        );

        /*
         * Automatically select the first
         * available leave type only if
         * nothing is currently selected.
         */

        setForm((previous) => {
          if (
            previous.leaveType ||
            activeTypes.length === 0
          ) {
            return previous;
          }

          return {
            ...previous,
            leaveType:
              activeTypes[0]._id,
          };
        });
      } catch (err: unknown) {
        console.error(
          "Failed to load leave types:",
          err
        );
      }
    }, []);

  /* ------------------------------------------------------------------------ */
  /* Load Leaves                                                              */
  /* ------------------------------------------------------------------------ */

  const loadLeaves =
    useCallback(
      async (
        showRefresh = false
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
              "/hr/leaves",
              {
                params: {
                  employee:
                    employeeId ||
                    undefined,

                  employeeId:
                    employeeId ||
                    undefined,

                  page: selectedPage,

                  limit: 100,

                  status:
                    statusFilter ===
                    "all"
                      ? undefined
                      : statusFilter,

                  search:
                    search.trim() ||
                    undefined,
                },
              }
            );

          const payload =
            response.data;

          const list =
            extractLeaves(
              payload
            );

          const backendSummary =
            extractSummary(
              payload
            );

          setLeaves(list);

          if (
            Object.keys(
              backendSummary
            ).length > 0
          ) {
            setSummary({
              total:
                Number(
                  backendSummary.total
                ) ||
                list.length,

              pending:
                Number(
                  backendSummary.pending
                ) || 0,

              approved:
                Number(
                  backendSummary.approved
                ) || 0,

              rejected:
                Number(
                  backendSummary.rejected
                ) || 0,

              cancelled:
                Number(
                  backendSummary.cancelled
                ) || 0,
            });
          } else {
            calculateSummary(
              list
            );
          }
        } catch (err: unknown) {
          console.error(
            "Failed to load leaves:",
            err
          );

          setError(
            getErrorMessage(err)
          );

          setLeaves([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        employeeId,
        selectedPage,
        statusFilter,
        search,
      ]
    );

  /* ------------------------------------------------------------------------ */
  /* Summary                                                                  */
  /* ------------------------------------------------------------------------ */

  const calculateSummary = (
    list: LeaveRecord[]
  ) => {
    const result: LeaveSummary = {
      total: list.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    list.forEach((leave) => {
      switch (
        leave.status?.toLowerCase()
      ) {
        case "approved":
          result.approved += 1;
          break;

        case "rejected":
          result.rejected += 1;
          break;

        case "cancelled":
          result.cancelled += 1;
          break;

        case "pending":
        default:
          result.pending += 1;
          break;
      }
    });

    setSummary(result);
  };

  /* ------------------------------------------------------------------------ */
  /* Initial Load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    void loadLeaveTypes();
  }, [loadLeaveTypes]);

  useEffect(() => {
    void loadLeaves();
  }, [loadLeaves]);

  /* ------------------------------------------------------------------------ */
  /* Form Change                                                              */
  /* ------------------------------------------------------------------------ */

  const handleFormChange = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Reset Form                                                               */
  /* ------------------------------------------------------------------------ */

  const resetForm = () => {
    setForm({
      leaveType:
        leaveTypes[0]?._id || "",
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Apply Leave                                                              */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    /* --------------------------------------------------
       Validate Employee
    -------------------------------------------------- */

    if (!employeeId) {
      setError(
        "Employee profile is not linked to your account."
      );
      return;
    }

    /* --------------------------------------------------
       Validate Leave Type
    -------------------------------------------------- */

    if (!form.leaveType) {
      setError(
        "Please select a leave type."
      );
      return;
    }

    /* --------------------------------------------------
       Validate Start Date
    -------------------------------------------------- */

    if (!form.startDate) {
      setError(
        "Please select the start date."
      );
      return;
    }

    /* --------------------------------------------------
       Validate End Date
    -------------------------------------------------- */

    if (!form.endDate) {
      setError(
        "Please select the end date."
      );
      return;
    }

    /* --------------------------------------------------
       Calculate Days
    -------------------------------------------------- */

    const days = calculateDays(
      form.startDate,
      form.endDate
    );

    if (days <= 0) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    /* --------------------------------------------------
       Validate Reason
    -------------------------------------------------- */

    if (!form.reason.trim()) {
      setError(
        "Please provide a reason."
      );
      return;
    }

    try {
      setSubmitting(true);

      /*
       * IMPORTANT:
       *
       * Backend requires:
       * leaveType
       * startDate
       * endDate
       * days
       *
       * This was the missing field in
       * the previous version.
       */

      const payload = {
        employee: employeeId,

        leaveType:
          form.leaveType,

        startDate:
          form.startDate,

        endDate:
          form.endDate,

        days: days,

        reason:
          form.reason.trim(),
      };

      console.log(
        "LEAVE SUBMIT PAYLOAD:",
        payload
      );

      await api.post(
        "/hr/leaves",
        payload
      );

      setSuccess(
        "Leave application submitted successfully."
      );

      setShowApplyModal(false);

      resetForm();

      await loadLeaves(true);
    } catch (err: unknown) {
      console.error(
        "Failed to apply for leave:",
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Cancel Leave                                                             */
  /* ------------------------------------------------------------------------ */

  const handleCancelLeave = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this leave request?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.patch(
        `/hr/leaves/${id}/cancel`
      );

      setSuccess(
        "Leave request cancelled successfully."
      );

      await loadLeaves(true);
    } catch (err: unknown) {
      console.error(
        "Failed to cancel leave:",
        err
      );

      setError(
        getErrorMessage(err)
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Filtered Leaves                                                          */
  /* ------------------------------------------------------------------------ */

  const filteredLeaves =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return leaves.filter(
        (leave) => {
          const matchesSearch =
            !query ||
            getLeaveTypeName(
              leave
            )
              .toLowerCase()
              .includes(query) ||
            (
              leave.reason ||
              ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "all" ||
            leave.status?.toLowerCase() ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      leaves,
      search,
      statusFilter,
    ]);

  /* ------------------------------------------------------------------------ */
  /* Selected Leave Type                                                      */
  /* ------------------------------------------------------------------------ */

  const selectedLeaveType =
    leaveTypes.find(
      (type) =>
        type._id ===
        form.leaveType
    );

  /* ------------------------------------------------------------------------ */
  /* Current Form Days                                                        */
  /* ------------------------------------------------------------------------ */

  const formDays =
    calculateDays(
      form.startDate,
      form.endDate
    );

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Leave Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Apply for leave and track your leave requests.
              </p>
            </div>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                void loadLeaves(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
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
              onClick={() => {
                setError("");
                setSuccess("");
                resetForm();
                setShowApplyModal(
                  true
                );
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />

              Apply Leave
            </button>

          </div>
        </div>

        {/* ================================================================
            ALERTS
        ================================================================ */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{success}</span>
          </div>
        )}

        {/* ================================================================
            SUMMARY
        ================================================================ */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <SummaryCard
            title="Total"
            value={summary.total}
            icon={
              <FileText className="h-5 w-5" />
            }
            className="bg-red-50 text-[#FE0000]"
          />

          <SummaryCard
            title="Pending"
            value={summary.pending}
            icon={
              <Clock3 className="h-5 w-5" />
            }
            className="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Approved"
            value={summary.approved}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            className="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Rejected"
            value={summary.rejected}
            icon={
              <XCircle className="h-5 w-5" />
            }
            className="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Cancelled"
            value={summary.cancelled}
            icon={
              <XCircle className="h-5 w-5" />
            }
            className="bg-slate-100 text-slate-600"
          />

        </div>

        {/* ================================================================
            AVAILABLE LEAVE TYPES
        ================================================================ */}

        {leaveTypes.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                Available Leave Types
              </h2>

              <p className="text-xs text-slate-500">
                Leave categories available for application
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {leaveTypes.map(
                (type) => (
                  <div
                    key={type._id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <p className="font-semibold text-slate-800">
                        {type.name}
                      </p>

                      {type.isPaid !==
                        undefined && (
                        <span
                          className={
                            type.isPaid
                              ? "rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
                              : "rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                          }
                        >
                          {type.isPaid
                            ? "PAID"
                            : "UNPAID"}
                        </span>
                      )}

                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Annual quota
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#FE0000]">
                      {type.annualQuota ??
                        0}{" "}
                      <span className="text-xs font-medium text-slate-500">
                        days/year
                      </span>
                    </p>

                  </div>
                )
              )}

            </div>
          </div>
        )}

        {/* ================================================================
            FILTERS
        ================================================================ */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_200px]">

            <div>
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );

                  setSelectedPage(1);
                }}
                placeholder="Search leave type or reason..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value
                );

                setSelectedPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

          </div>
        </div>

        {/* ================================================================
            LEAVE HISTORY
        ================================================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

            <div>
              <h2 className="font-semibold text-slate-900">
                Leave History
              </h2>

              <p className="text-xs text-slate-500">
                Your submitted leave applications
              </p>
            </div>

            <span className="text-sm text-slate-500">
              {filteredLeaves.length} records
            </span>

          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">

              <div className="flex flex-col items-center gap-3">

                <Loader2 className="h-7 w-7 animate-spin text-[#FE0000]" />

                <p className="text-sm text-slate-500">
                  Loading leave history...
                </p>

              </div>

            </div>
          ) : filteredLeaves.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

              <div className="rounded-full bg-slate-100 p-4">
                <CalendarDays className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No leave records
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                You have no leave applications matching the current filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter(
                    "all"
                  );
                }}
                className="mt-4 text-sm font-semibold text-[#FE0000] hover:text-red-700"
              >
                Clear Filters
              </button>

            </div>
          ) : (
            <>
              {/* Desktop */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full min-w-[900px]">

                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Leave Type
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        From
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        To
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Days
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reason
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredLeaves.map(
                      (leave) => (
                        <LeaveTableRow
                          key={
                            leave._id
                          }
                          leave={leave}
                          onCancel={
                            handleCancelLeave
                          }
                        />
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile */}

              <div className="divide-y divide-slate-100 md:hidden">

                {filteredLeaves.map(
                  (leave) => (
                    <LeaveMobileCard
                      key={
                        leave._id
                      }
                      leave={leave}
                      onCancel={
                        handleCancelLeave
                      }
                    />
                  )
                )}

              </div>
            </>
          )}

        </div>

        {/* ================================================================
            PAGINATION
        ================================================================ */}

        {!loading &&
          filteredLeaves.length >
            0 && (
            <div className="flex items-center justify-between">

              <button
                type="button"
                onClick={() =>
                  setSelectedPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                disabled={
                  selectedPage <= 1
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />

                Previous
              </button>

              <span className="text-sm text-slate-500">
                Page {selectedPage}
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelectedPage(
                    (page) =>
                      page + 1
                  )
                }
                disabled={
                  leaves.length < 100
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next

                <ChevronRight className="h-4 w-4" />
              </button>

            </div>
          )}

      </div>

      {/* ================================================================
          APPLY LEAVE MODAL
      ================================================================ */}

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Apply for Leave
                </h2>

                <p className="text-xs text-slate-500">
                  Submit a new leave request
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setShowApplyModal(
                      false
                    );
                  }
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ==========================================================
                  LEAVE TYPE
              ========================================================== */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Leave Type
                </label>

                <select
                  value={
                    form.leaveType
                  }
                  onChange={(event) =>
                    handleFormChange(
                      "leaveType",
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                >

                  <option value="">
                    Select Leave Type
                  </option>

                  {leaveTypes.map(
                    (type) => (
                      <option
                        key={
                          type._id
                        }
                        value={
                          type._id
                        }
                      >
                        {type.name}
                        {" — "}
                        {type.annualQuota ??
                          0}{" "}
                        days/year
                        {type.isPaid
                          ? " — Paid"
                          : " — Unpaid"}
                      </option>
                    )
                  )}

                </select>

                {selectedLeaveType && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Annual quota:{" "}
                    <strong>
                      {
                        selectedLeaveType.annualQuota
                      }
                    </strong>{" "}
                    days
                    {" • "}
                    {selectedLeaveType.isPaid
                      ? "Paid leave"
                      : "Unpaid leave"}
                  </p>
                )}

              </div>

              {/* ==========================================================
                  DATES
              ========================================================== */}

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Start Date */}

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.startDate
                    }
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(event) =>
                      handleFormChange(
                        "startDate",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />

                </div>

                {/* End Date */}

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.endDate
                    }
                    min={
                      form.startDate ||
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(event) =>
                      handleFormChange(
                        "endDate",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />

                </div>

              </div>

              {/* ==========================================================
                  DAYS
              ========================================================== */}

              {form.startDate &&
                form.endDate &&
                formDays > 0 && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">

                      <CalendarDays className="h-4 w-4" />

                      Leave Duration

                    </div>

                    <div className="mt-2 flex items-end gap-2">

                      <span className="text-2xl font-bold text-red-700">
                        {formDays}
                      </span>

                      <span className="pb-1 text-sm text-[#FE0000]">
                        {formDays === 1
                          ? "day"
                          : "days"}
                      </span>

                    </div>

                    {selectedLeaveType &&
                      selectedLeaveType.annualQuota !==
                        undefined && (
                        <p className="mt-2 text-xs text-[#FE0000]">
                          Annual quota:{" "}
                          {
                            selectedLeaveType.annualQuota
                          }{" "}
                          days
                        </p>
                      )}

                  </div>
                )}

              {/* ==========================================================
                  REASON
              ========================================================== */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Reason
                </label>

                <textarea
                  value={
                    form.reason
                  }
                  onChange={(event) =>
                    handleFormChange(
                      "reason",
                      event.target.value
                    )
                  }
                  rows={4}
                  required
                  placeholder="Enter the reason for your leave..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />

              </div>

              {/* ==========================================================
                  BUTTONS
              ========================================================== */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowApplyModal(
                      false
                    )
                  }
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.leaveType ||
                    !form.startDate ||
                    !form.endDate ||
                    formDays <= 0
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {submitting
                    ? "Submitting..."
                    : "Submit Leave"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  className: string;
}

function SummaryCard({
  title,
  value,
  icon,
  className,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`rounded-xl p-3 ${className}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop Row                                                                */
/* -------------------------------------------------------------------------- */

interface LeaveTableRowProps {
  leave: LeaveRecord;
  onCancel: (
    id: string
  ) => void;
}

function LeaveTableRow({
  leave,
  onCancel,
}: LeaveTableRowProps) {
  const status =
    leave.status ||
    "pending";

  const canCancel =
    status.toLowerCase() ===
    "pending";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">

      <td className="px-6 py-4">

        <div className="font-semibold text-slate-800">
          {getLeaveTypeName(
            leave
          )}
        </div>

        {leave.appliedAt && (
          <div className="mt-1 text-xs text-slate-400">
            Applied{" "}
            {formatDate(
              leave.appliedAt
            )}
          </div>
        )}

      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatDate(
          leave.startDate ||
            leave.fromDate
        )}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatDate(
          leave.endDate ||
            leave.toDate
        )}
      </td>

      <td className="px-6 py-4">

        <span className="font-semibold text-slate-800">
          {getLeaveDays(
            leave
          )}
        </span>

      </td>

      <td className="px-6 py-4">

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            status
          )}`}
        >

          {getStatusIcon(
            status
          )}

          {getStatusLabel(
            status
          )}

        </span>

      </td>

      <td className="max-w-xs px-6 py-4">

        <span className="block truncate text-sm text-slate-500">
          {leave.reason ||
            leave.remarks ||
            "—"}
        </span>

        {leave.rejectionReason && (
          <p className="mt-1 text-xs text-red-500">
            {
              leave.rejectionReason
            }
          </p>
        )}

      </td>

      <td className="px-6 py-4 text-right">

        {canCancel ? (
          <button
            type="button"
            onClick={() =>
              onCancel(
                leave._id
              )
            }
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Cancel
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            —
          </span>
        )}

      </td>

    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Card                                                                */
/* -------------------------------------------------------------------------- */

interface LeaveMobileCardProps {
  leave: LeaveRecord;
  onCancel: (
    id: string
  ) => void;
}

function LeaveMobileCard({
  leave,
  onCancel,
}: LeaveMobileCardProps) {
  const status =
    leave.status ||
    "pending";

  const canCancel =
    status.toLowerCase() ===
    "pending";

  return (
    <div className="p-4">

      <div className="flex items-start justify-between gap-3">

        <div>

          <h3 className="font-semibold text-slate-900">
            {getLeaveTypeName(
              leave
            )}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {formatDate(
              leave.startDate ||
                leave.fromDate
            )}{" "}
            →{" "}
            {formatDate(
              leave.endDate ||
                leave.toDate
            )}
          </p>

        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            status
          )}`}
        >

          {getStatusIcon(
            status
          )}

          {getStatusLabel(
            status
          )}

        </span>

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="rounded-xl bg-slate-50 p-3">

          <p className="text-xs text-slate-400">
            Duration
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {getLeaveDays(
              leave
            )}{" "}
            day(s)
          </p>

        </div>

        <div className="rounded-xl bg-slate-50 p-3">

          <p className="text-xs text-slate-400">
            Applied
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDate(
              leave.appliedAt ||
                leave.createdAt
            )}
          </p>

        </div>

      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3">

        <p className="text-xs text-slate-400">
          Reason
        </p>

        <p className="mt-1 text-sm text-slate-600">
          {leave.reason ||
            leave.remarks ||
            "No reason provided"}
        </p>

      </div>

      {leave.rejectionReason && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">

          <p className="text-xs font-semibold text-red-600">
            Rejection Reason
          </p>

          <p className="mt-1 text-sm text-red-700">
            {
              leave.rejectionReason
            }
          </p>

        </div>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={() =>
            onCancel(
              leave._id
            )
          }
          className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Cancel Leave Request
        </button>
      )}

    </div>
  );
}