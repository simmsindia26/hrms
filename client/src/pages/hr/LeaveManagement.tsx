import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";
import api from "../../lib/axios";

type LeaveStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

interface DepartmentRef {
  _id?: string;
  name?: string;
}

interface DesignationRef {
  _id?: string;
  name?: string;
}

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: DepartmentRef | string;
  designation?: DesignationRef | string;
}

interface LeaveType {
  _id: string;
  name: string;
  code?: string;
  days?: number;
  isPaid?: boolean;
}

interface Leave {
  _id: string;

  employee: Employee | string;

  leaveType: LeaveType | string;

  startDate: string;
  endDate: string;
  totalDays?: number;

  reason?: string;

  status: LeaveStatus;

  appliedAt?: string;
  reviewedAt?: string;
  reviewedBy?: Employee | string;

  reviewRemark?: string;
  remarks?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface Department {
  _id: string;
  name: string;
}

interface Summary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{
  value: LeaveStatus | "";
  label: string;
}> = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getEmployeeName(
  employee: Leave["employee"] | undefined
): string {
  if (!employee) {
    return "Unknown Employee";
  }

  if (typeof employee === "string") {
    return employee;
  }

  if (employee.name) {
    return employee.name;
  }

  const firstName = employee.firstName || "";
  const lastName = employee.lastName || "";

  return (
    `${firstName} ${lastName}`.trim() ||
    "Unknown Employee"
  );
}

function getEmployeeId(
  employee: Leave["employee"] | undefined
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.employeeId || "";
}

function getEmployeeEmail(
  employee: Leave["employee"] | undefined
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.email || "";
}

function getLeaveTypeName(
  leaveType: Leave["leaveType"] | undefined
): string {
  if (!leaveType) {
    return "Leave";
  }

  if (typeof leaveType === "string") {
    return leaveType;
  }

  return leaveType.name || "Leave";
}

function getLeaveTypeId(
  leaveType: Leave["leaveType"] | undefined
): string {
  if (!leaveType || typeof leaveType === "string") {
    return typeof leaveType === "string"
      ? leaveType
      : "";
  }

  return leaveType._id || "";
}

function getDepartmentId(
  employee: Leave["employee"] | undefined
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  if (
    employee.department &&
    typeof employee.department === "object"
  ) {
    return employee.department._id || "";
  }

  if (typeof employee.department === "string") {
    return employee.department;
  }

  return "";
}

function getDepartmentName(
  employee: Leave["employee"] | undefined
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  if (
    employee.department &&
    typeof employee.department === "object"
  ) {
    return employee.department.name || "";
  }

  return "";
}

function getDesignationName(
  employee: Leave["employee"] | undefined
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  if (
    employee.designation &&
    typeof employee.designation === "object"
  ) {
    return employee.designation.name || "";
  }

  return "";
}

function formatDate(date?: string): string {
  if (!date) {
    return "-";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string): string {
  if (!date) {
    return "-";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDays(
  startDate?: string,
  endDate?: string
): number {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const difference =
    end.getTime() - start.getTime();

  return Math.max(
    1,
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

function statusLabel(status: LeaveStatus): string {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function statusClasses(status: LeaveStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";

    case "cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] =
    useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<
    LeaveType[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<LeaveStatus | "">("");
  const [department, setDepartment] =
    useState("");
  const [leaveType, setLeaveType] =
    useState("");
  const [month, setMonth] = useState("");

  const [page, setPage] = useState(1);

  const [selectedLeave, setSelectedLeave] =
    useState<Leave | null>(null);

  const [reviewLeave, setReviewLeave] =
    useState<Leave | null>(null);

  const [reviewStatus, setReviewStatus] =
    useState<"approved" | "rejected">(
      "approved"
    );

  const [reviewRemark, setReviewRemark] =
    useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [showFilters, setShowFilters] =
    useState(false);

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        leavesResponse,
        employeesResponse,
        departmentsResponse,
        leaveTypesResponse,
      ] = await Promise.allSettled([
        api.get("/hr/leaves"),
        api.get("/hr/employees"),
        api.get("/hr/departments"),
api.get("/hr/leave-types"),      ]);

      if (leavesResponse.status === "fulfilled") {
        const data = leavesResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.leaves ||
          data?.items ||
          data?.leaves ||
          data?.data ||
          [];

        setLeaves(
          Array.isArray(items) ? items : []
        );
      }

      if (employeesResponse.status === "fulfilled") {
        const data =
          employeesResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.employees ||
          data?.items ||
          data?.employees ||
          data?.data ||
          [];

        setEmployees(
          Array.isArray(items) ? items : []
        );
      }

      if (
        departmentsResponse.status ===
        "fulfilled"
      ) {
        const data =
          departmentsResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.departments ||
          data?.items ||
          data?.departments ||
          data?.data ||
          [];

        setDepartments(
          Array.isArray(items) ? items : []
        );
      }

      if (
        leaveTypesResponse.status ===
        "fulfilled"
      ) {
        const data =
          leaveTypesResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.leaveTypes ||
          data?.items ||
          data?.leaveTypes ||
          data?.data ||
          [];

        setLeaveTypes(
          Array.isArray(items) ? items : []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load leave management data:",
        error
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
    status,
    department,
    leaveType,
    month,
  ]);

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leaves.filter((leave) => {
      const employeeName =
        getEmployeeName(
          leave.employee
        ).toLowerCase();

      const employeeCode =
        getEmployeeId(
          leave.employee
        ).toLowerCase();

      const employeeEmail =
        getEmployeeEmail(
          leave.employee
        ).toLowerCase();

      const typeName =
        getLeaveTypeName(
          leave.leaveType
        ).toLowerCase();

      const reason =
        (leave.reason || "").toLowerCase();

      const matchesSearch =
        !query ||
        employeeName.includes(query) ||
        employeeCode.includes(query) ||
        employeeEmail.includes(query) ||
        typeName.includes(query) ||
        reason.includes(query);

      const matchesStatus =
        !status ||
        leave.status === status;

      const departmentId =
        getDepartmentId(
          leave.employee
        );

      const matchesDepartment =
        !department ||
        departmentId === department;

      const leaveTypeId =
        getLeaveTypeId(
          leave.leaveType
        );

      const matchesLeaveType =
        !leaveType ||
        leaveTypeId === leaveType;

      let matchesMonth = true;

      if (month) {
        const start = new Date(
          leave.startDate
        );

        if (!Number.isNaN(start.getTime())) {
          const value = `${start.getFullYear()}-${String(
            start.getMonth() + 1
          ).padStart(2, "0")}`;

          matchesMonth = value === month;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesLeaveType &&
        matchesMonth
      );
    });
  }, [
    leaves,
    search,
    status,
    department,
    leaveType,
    month,
  ]);

  const summary: Summary = useMemo(() => {
    return {
      total: leaves.length,

      pending: leaves.filter(
        (leave) =>
          leave.status === "pending"
      ).length,

      approved: leaves.filter(
        (leave) =>
          leave.status === "approved"
      ).length,

      rejected: leaves.filter(
        (leave) =>
          leave.status === "rejected"
      ).length,

      cancelled: leaves.filter(
        (leave) =>
          leave.status === "cancelled"
      ).length,
    };
  }, [leaves]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLeaves.length /
        PAGE_SIZE
    )
  );

  const paginatedLeaves = useMemo(() => {
    const start =
      (page - 1) * PAGE_SIZE;

    return filteredLeaves.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredLeaves, page]);

  async function submitReview() {
    if (!reviewLeave) {
      return;
    }

    if (
      reviewStatus === "rejected" &&
      !reviewRemark.trim()
    ) {
      alert(
        "Please enter a reason for rejection."
      );
      return;
    }

    try {
      setProcessingId(
        reviewLeave._id
      );

      await api.patch(
        `/hr/leaves/${reviewLeave._id}/review`,
        {
          status: reviewStatus,
          remark: reviewRemark.trim(),
          remarks: reviewRemark.trim(),
        }
      );

      setLeaves((current) =>
        current.map((item) =>
          item._id === reviewLeave._id
            ? {
                ...item,
                status: reviewStatus,
                reviewRemark:
                  reviewRemark.trim(),
                remarks:
                  reviewRemark.trim(),
                reviewedAt:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setReviewLeave(null);
      setReviewRemark("");
    } catch (error) {
      console.error(
        "Failed to review leave:",
        error
      );

      alert(
        "Unable to update the leave request."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function openApprove(leave: Leave) {
    setReviewLeave(leave);
    setReviewStatus("approved");
    setReviewRemark("");
  }

  function openReject(leave: Leave) {
    setReviewLeave(leave);
    setReviewStatus("rejected");
    setReviewRemark("");
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setDepartment("");
    setLeaveType("");
    setMonth("");
    setPage(1);
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(department) ||
    Boolean(leaveType) ||
    Boolean(month);

  if (loading) {
    return (
      <div className="flex min-h-125 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>
            Loading leave management...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            HR Management
            <span>/</span>
            Leave Management
          </div>

          <div className="mb-2 flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Sellopedia"
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-900">
              Leave Management
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Review employee leave requests,
            manage approvals and monitor leave
            activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Requests"
          value={summary.total}
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          className="bg-white"
        />

        <StatCard
          title="Pending"
          value={summary.pending}
          icon={
            <Clock3 className="h-5 w-5" />
          }
          className="bg-amber-50"
          valueClass="text-amber-700"
        />

        <StatCard
          title="Approved"
          value={summary.approved}
          icon={
            <Check className="h-5 w-5" />
          }
          className="bg-emerald-50"
          valueClass="text-emerald-700"
        />

        <StatCard
          title="Rejected"
          value={summary.rejected}
          icon={
            <XCircle className="h-5 w-5" />
          }
          className="bg-red-50"
          valueClass="text-red-700"
        />

        <StatCard
          title="Cancelled"
          value={summary.cancelled}
          icon={
            <Users className="h-5 w-5" />
          }
          className="bg-slate-100"
          valueClass="text-slate-700"
        />
      </div>

      {/* Search / Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee, employee ID, leave type..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (value) => !value
              )
            }
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
              showFilters || hasFilters
                ? "border-[#FE0000] bg-[#FE0000] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters

            {hasFilters && (
              <span className="rounded-full bg-white px-1.5 py-0.5 text-xs text-slate-900">
                Active
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Status"
              value={status}
              onChange={(value) =>
                setStatus(
                  value as
                    | LeaveStatus
                    | ""
                )
              }
              options={STATUS_OPTIONS}
            />

            <FilterSelect
              label="Department"
              value={department}
              onChange={setDepartment}
              options={[
                {
                  value: "",
                  label: "All Departments",
                },
                ...departments.map(
                  (item) => ({
                    value: item._id,
                    label: item.name,
                  })
                ),
              ]}
            />

            <FilterSelect
              label="Leave Type"
              value={leaveType}
              onChange={setLeaveType}
              options={[
                {
                  value: "",
                  label: "All Leave Types",
                },
                ...leaveTypes.map(
                  (item) => ({
                    value: item._id,
                    label: item.name,
                  })
                ),
              ]}
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Month
              </label>

              <input
                type="month"
                value={month}
                onChange={(event) =>
                  setMonth(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FE0000]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Leave Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Leave Requests
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Showing{" "}
              {filteredLeaves.length}{" "}
              request
              {filteredLeaves.length !==
              1
                ? "s"
                : ""}
            </p>
          </div>

          {summary.pending > 0 && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              {summary.pending} pending
              approval
              {summary.pending !== 1
                ? "s"
                : ""}
            </span>
          )}
        </div>

        {paginatedLeaves.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Leave Type
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Duration
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applied
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
                  {paginatedLeaves.map(
                    (leave) => (
                      <LeaveTableRow
                        key={leave._id}
                        leave={leave}
                        processingId={
                          processingId
                        }
                        onView={() =>
                          setSelectedLeave(
                            leave
                          )
                        }
                        onApprove={() =>
                          openApprove(
                            leave
                          )
                        }
                        onReject={() =>
                          openReject(
                            leave
                          )
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedLeaves.map(
                (leave) => (
                  <LeaveMobileCard
                    key={leave._id}
                    leave={leave}
                    processingId={
                      processingId
                    }
                    onView={() =>
                      setSelectedLeave(
                        leave
                      )
                    }
                    onApprove={() =>
                      openApprove(
                        leave
                      )
                    }
                    onReject={() =>
                      openReject(
                        leave
                      )
                    }
                  />
                )
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredLeaves.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of{" "}
              {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((value) =>
                    Math.max(
                      1,
                      value - 1
                    )
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage((value) =>
                    Math.min(
                      totalPages,
                      value + 1
                    )
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={() =>
            setSelectedLeave(null)
          }
          onApprove={() => {
            setSelectedLeave(null);
            openApprove(
              selectedLeave
            );
          }}
          onReject={() => {
            setSelectedLeave(null);
            openReject(
              selectedLeave
            );
          }}
        />
      )}

      {/* Review Modal */}
      {reviewLeave && (
        <ReviewModal
          leave={reviewLeave}
          status={reviewStatus}
          remark={reviewRemark}
          processing={
            processingId ===
            reviewLeave._id
          }
          onStatusChange={
            setReviewStatus
          }
          onRemarkChange={
            setReviewRemark
          }
          onClose={() =>
            setReviewLeave(null)
          }
          onSubmit={submitReview}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  className = "",
  valueClass = "text-slate-900",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-white p-2.5 text-slate-600 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter Select                                                              */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FE0000]"
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop Table Row                                                          */
/* -------------------------------------------------------------------------- */

function LeaveTableRow({
  leave,
  processingId,
  onView,
  onApprove,
  onReject,
}: {
  leave: Leave;
  processingId: string | null;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const departmentName =
    getDepartmentName(
      leave.employee
    );

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={getEmployeeName(
              leave.employee
            )}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {getEmployeeName(
                leave.employee
              )}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {getEmployeeId(
                leave.employee
              ) ||
                getEmployeeEmail(
                  leave.employee
                ) ||
                departmentName ||
                "Employee"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-800">
          {getLeaveTypeName(
            leave.leaveType
          )}
        </p>

        {leave.reason && (
          <p className="mt-1 max-w-55 truncate text-xs text-slate-500">
            {leave.reason}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-800">
          {formatDate(
            leave.startDate
          )}
        </p>

        <p className="text-xs text-slate-500">
          to{" "}
          {formatDate(
            leave.endDate
          )}
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-600">
          {leave.totalDays ??
            calculateDays(
              leave.startDate,
              leave.endDate
            )}{" "}
          day
          {(leave.totalDays ??
            calculateDays(
              leave.startDate,
              leave.endDate
            )) !== 1
            ? "s"
            : ""}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-slate-700">
          {formatDate(
            leave.appliedAt ||
              leave.createdAt
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
            leave.status
          )}`}
        >
          {statusLabel(
            leave.status
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <IconButton
            title="View details"
            onClick={onView}
          >
            <Eye className="h-4 w-4" />
          </IconButton>

          {leave.status ===
            "pending" && (
            <>
              <button
                type="button"
                onClick={onApprove}
                disabled={
                  processingId ===
                  leave._id
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={
                  processingId ===
                  leave._id
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Card                                                                */
/* -------------------------------------------------------------------------- */

function LeaveMobileCard({
  leave,
  processingId,
  onView,
  onApprove,
  onReject,
}: {
  leave: Leave;
  processingId: string | null;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const days =
    leave.totalDays ??
    calculateDays(
      leave.startDate,
      leave.endDate
    );

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={getEmployeeName(
              leave.employee
            )}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {getEmployeeName(
                leave.employee
              )}
            </p>

            <p className="text-xs text-slate-500">
              {getEmployeeId(
                leave.employee
              ) || "Employee"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
            leave.status
          )}`}
        >
          {statusLabel(
            leave.status
          )}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <InfoItem
          label="Leave Type"
          value={getLeaveTypeName(
            leave.leaveType
          )}
        />

        <InfoItem
          label="Days"
          value={`${days} day${
            days !== 1 ? "s" : ""
          }`}
        />

        <InfoItem
          label="From"
          value={formatDate(
            leave.startDate
          )}
        />

        <InfoItem
          label="To"
          value={formatDate(
            leave.endDate
          )}
        />
      </div>

      {leave.reason && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {leave.reason}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Details
        </button>

        {leave.status ===
          "pending" && (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={
                processingId ===
                leave._id
              }
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              onClick={onReject}
              disabled={
                processingId ===
                leave._id
              }
              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/* -------------------------------------------------------------------------- */

function Avatar({
  name,
}: {
  name: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase()
    )
    .join("");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
      {initials || "U"}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icon Button                                                                */
/* -------------------------------------------------------------------------- */

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Info Item                                                                  */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <CalendarDays className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No leave requests found
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No leave requests match your current filters."
          : "There are no leave requests available yet."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg bg-[#FE0000] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Details Modal                                                              */
/* -------------------------------------------------------------------------- */

function LeaveDetailsModal({
  leave,
  onClose,
  onApprove,
  onReject,
}: {
  leave: Leave;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const departmentName =
    getDepartmentName(
      leave.employee
    ) || "-";

  const designationName =
    getDesignationName(
      leave.employee
    ) || "-";

  const employeeEmail =
    getEmployeeEmail(
      leave.employee
    );

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Leave Request
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Review complete leave request
              details
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                name={getEmployeeName(
                  leave.employee
                )}
              />

              <div>
                <h3 className="font-semibold text-slate-900">
                  {getEmployeeName(
                    leave.employee
                  )}
                </h3>

                <p className="text-xs text-slate-500">
                  {getEmployeeId(
                    leave.employee
                  ) ||
                    employeeEmail ||
                    "Employee"}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses(
                leave.status
              )}`}
            >
              {statusLabel(
                leave.status
              )}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailBox
              label="Leave Type"
              value={getLeaveTypeName(
                leave.leaveType
              )}
            />

            <DetailBox
              label="Total Days"
              value={`${
                leave.totalDays ??
                calculateDays(
                  leave.startDate,
                  leave.endDate
                )
              } days`}
            />

            <DetailBox
              label="Start Date"
              value={formatDate(
                leave.startDate
              )}
            />

            <DetailBox
              label="End Date"
              value={formatDate(
                leave.endDate
              )}
            />

            <DetailBox
              label="Department"
              value={departmentName}
            />

            <DetailBox
              label="Designation"
              value={designationName}
            />

            <DetailBox
              label="Employee Email"
              value={
                employeeEmail || "-"
              }
            />

            <DetailBox
              label="Applied On"
              value={formatDateTime(
                leave.appliedAt ||
                  leave.createdAt
              )}
            />

            <DetailBox
              label="Reviewed On"
              value={formatDateTime(
                leave.reviewedAt
              )}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reason
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {leave.reason ||
                "No reason provided."}
            </div>
          </div>

          {(leave.reviewRemark ||
            leave.remarks) && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                HR Remarks
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {leave.reviewRemark ||
                  leave.remarks}
              </div>
            </div>
          )}
        </div>

        {leave.status ===
          "pending" && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onReject}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Reject
            </button>

            <button
              type="button"
              onClick={onApprove}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Approve Leave
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail Box                                                                 */
/* -------------------------------------------------------------------------- */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Review Modal                                                               */
/* -------------------------------------------------------------------------- */

function ReviewModal({
  leave,
  status,
  remark,
  processing,
  onStatusChange,
  onRemarkChange,
  onClose,
  onSubmit,
}: {
  leave: Leave;
  status: "approved" | "rejected";
  remark: string;
  processing: boolean;
  onStatusChange: (
    value: "approved" | "rejected"
  ) => void;
  onRemarkChange: (
    value: string
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isReject =
    status === "rejected";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isReject
                ? "Reject Leave"
                : "Approve Leave"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {getEmployeeName(
                leave.employee
              )}{" "}
              ·{" "}
              {getLeaveTypeName(
                leave.leaveType
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <DetailBox
              label="From"
              value={formatDate(
                leave.startDate
              )}
            />

            <DetailBox
              label="To"
              value={formatDate(
                leave.endDate
              )}
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Decision
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onStatusChange(
                    "approved"
                  )
                }
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  status === "approved"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Check className="mx-auto mb-1 h-5 w-5" />
                Approve
              </button>

              <button
                type="button"
                onClick={() =>
                  onStatusChange(
                    "rejected"
                  )
                }
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  status === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <XCircle className="mx-auto mb-1 h-5 w-5" />
                Reject
              </button>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              HR Remark
              {isReject && (
                <span className="ml-1 text-red-500">
                  *
                </span>
              )}
            </label>

            <textarea
              value={remark}
              onChange={(event) =>
                onRemarkChange(
                  event.target.value
                )
              }
              rows={4}
              placeholder={
                isReject
                  ? "Enter the reason for rejecting this leave request..."
                  : "Optional approval remark..."
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#FE0000]"
            />

            {isReject &&
              !remark.trim() && (
                <p className="mt-1.5 text-xs text-red-500">
                  A rejection reason is
                  required.
                </p>
              )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              processing ||
              (isReject &&
                !remark.trim())
            }
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {processing && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {processing
              ? "Processing..."
              : isReject
              ? "Reject Leave"
              : "Approve Leave"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Overlay                                                              */
/* -------------------------------------------------------------------------- */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}
