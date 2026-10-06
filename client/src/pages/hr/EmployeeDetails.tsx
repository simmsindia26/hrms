import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  FileText,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios";

/* =========================================================
   TYPES
========================================================= */

type TabKey =
  | "overview"
  | "documents"
  | "attendance"
  | "leave"
  | "payroll"
  | "notices";

interface Department {
  _id: string;
  name: string;
}

interface Designation {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;

  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;

  profilePhoto?: string;

  department?: Department | string | null;
  designation?: Designation | string | null;

  joiningDate?: string;
  confirmationDate?: string;
  employmentType?: string;
  workMode?: string;
  status?: string;

  reportingManager?: {
    _id?: string;
    name?: string;
    employeeId?: string;
  } | null;

  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };

  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    branchName?: string;
    ifscCode?: string;
  };

  salary?: {
    basic?: number;
    hra?: number;
    allowances?: number;
    deductions?: number;
    gross?: number;
    net?: number;
  };

  createdAt?: string;
  updatedAt?: string;
}

interface DocumentItem {
  _id: string;
  title?: string;
  type?: string;
  originalFileName?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  issuedAt?: string;
  acknowledged?: boolean;
  createdAt?: string;
}

interface AttendanceItem {
  _id: string;
  date?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  remarks?: string;
}

interface LeaveTypeValue {
  _id?: string;
  name?: string;
  code?: string;
  description?: string;
  annualQuota?: number;
  daysPerYear?: number;
  maxDays?: number;
  isPaid?: boolean;
  paid?: boolean;
  carryForward?: boolean;
  maxCarryForwardDays?: number;
  requiresApproval?: boolean;
  isActive?: boolean;
}

interface LeaveItem {
  _id: string;
  leaveType?: string | LeaveTypeValue | null;
  startDate?: string;
  endDate?: string;
  days?: number;
  status?: string;
  reason?: string;
}

interface PayrollItem {
  _id: string;
  month?: number;
  year?: number;
  basicSalary?: number;
  grossSalary?: number;
  totalDeductions?: number;
  netSalary?: number;
  status?: string;
  paidAt?: string;
}

interface NoticeItem {
  _id: string;
  title?: string;
  type?: string;
  status?: string;
  issuedAt?: string;
  description?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function getName(
  value?: Department | Designation | string | null
) {
  if (!value) return "—";

  if (typeof value === "string") {
    return value;
  }

  return value.name || "—";
}

function getLeaveTypeName(
  value?: LeaveItem["leaveType"]
): string {
  if (!value) return "—";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value.name === "string" && value.name.trim()) {
    return value.name.trim();
  }

  if (typeof value.code === "string" && value.code.trim()) {
    return value.code.trim();
  }

  return "—";
}

function formatDate(value?: string) {
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


function formatMoney(value?: number) {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  return `₹${new Intl.NumberFormat(
    "en-IN"
  ).format(value)}`;
}

function formatStatus(value?: string) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function statusClass(value?: string) {
  const status =
    value?.toLowerCase();

  if (
    status === "active" ||
    status === "approved" ||
    status === "paid" ||
    status === "present" ||
    status === "completed"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "pending" ||
    status === "on_leave" ||
    status === "half_day" ||
    status === "processing"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    status === "rejected" ||
    status === "declined" ||
    status === "absent" ||
    status === "cancelled"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

function monthName(month?: number) {
  if (!month) return "—";

  return new Date(
    2000,
    month - 1,
    1
  ).toLocaleString("en-IN", {
    month: "long",
  });
}

/* =========================================================
   PAGE
========================================================= */

export default function EmployeeDetails() {
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [documents, setDocuments] =
    useState<DocumentItem[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceItem[]>([]);

  const [leave, setLeave] =
    useState<LeaveItem[]>([]);

  const [payroll, setPayroll] =
    useState<PayrollItem[]>([]);

  const [notices, setNotices] =
    useState<NoticeItem[]>([]);

  const [activeTab, setActiveTab] =
    useState<TabKey>("overview");

  const [loading, setLoading] =
    useState(true);

  const [tabLoading, setTabLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [editOpen, setEditOpen] =
    useState(false);

  /* =======================================================
     LOAD EMPLOYEE
  ======================================================= */

  useEffect(() => {
    if (!id) {
      setError(
        "Employee ID is missing."
      );
      setLoading(false);
      return;
    }

    loadEmployee();
  }, [id]);

  async function loadEmployee() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/hr/employees/${id}`
        );

      const data =
        response.data?.data;

      if (!data) {
        throw new Error(
          "Employee not found."
        );
      }

      setEmployee(data);
    } catch (err: any) {
      console.error(
        "Failed to load employee:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load employee profile."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD TAB DATA
  ======================================================= */

  useEffect(() => {
    if (!id) return;

    if (activeTab === "documents") {
      loadDocuments();
    }

    if (activeTab === "attendance") {
      loadAttendance();
    }

    if (activeTab === "leave") {
      loadLeave();
    }

    if (activeTab === "payroll") {
      loadPayroll();
    }

    if (activeTab === "notices") {
      loadNotices();
    }
  }, [activeTab, id]);

  async function loadDocuments() {
    try {
      setTabLoading(true);

      const response =
        await api.get(
          `/documents?employee=${id}`
        );

      const data =
        response.data?.data;

      setDocuments(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []
      );
    } catch (err) {
      console.error(
        "Failed to load documents:",
        err
      );

      setDocuments([]);
    } finally {
      setTabLoading(false);
    }
  }

  async function loadAttendance() {
    try {
      setTabLoading(true);

      const response =
        await api.get(
          `/hr/attendance?employee=${id}`
        );

      const data =
        response.data?.data;

      setAttendance(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []
      );
    } catch (err) {
      console.error(
        "Failed to load attendance:",
        err
      );

      setAttendance([]);
    } finally {
      setTabLoading(false);
    }
  }

  async function loadLeave() {
    try {
      setTabLoading(true);

      const response =
        await api.get(
          `/hr/leaves?employee=${id}`
        );

      const data =
        response.data?.data;

      setLeave(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []
      );
    } catch (err) {
      console.error(
        "Failed to load leave:",
        err
      );

      setLeave([]);
    } finally {
      setTabLoading(false);
    }
  }

  async function loadPayroll() {
    try {
      setTabLoading(true);

      const response =
        await api.get(
          `/hr/payroll?employee=${id}`
        );

      const data =
        response.data?.data;

      setPayroll(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []
      );
    } catch (err) {
      console.error(
        "Failed to load payroll:",
        err
      );

      setPayroll([]);
    } finally {
      setTabLoading(false);
    }
  }

  async function loadNotices() {
    try {
      setTabLoading(true);

      const response =
        await api.get(
          `/hr/notices?employee=${id}`
        );

      const data =
        response.data?.data;

      setNotices(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []
      );
    } catch (err) {
      console.error(
        "Failed to load notices:",
        err
      );

      setNotices([]);
    } finally {
      setTabLoading(false);
    }
  }

  /* =======================================================
     TAB COUNTS
  ======================================================= */

  const tabCounts = useMemo(
    () => ({
      documents: documents.length,
      attendance: attendance.length,
      leave: leave.length,
      payroll: payroll.length,
      notices: notices.length,
    }),
    [
      documents,
      attendance,
      leave,
      payroll,
      notices,
    ]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-48 animate-pulse rounded-2xl bg-white" />

        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !employee) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <UserRound size={25} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Employee Not Found
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error ||
              "The employee profile could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/hr/employees"
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/hr/employees"
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Employee Profile
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {employee.name}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setEditOpen(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* ===================================================
          PROFILE HEADER
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500" />

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
            <EmployeeAvatar
              employee={employee}
              large
            />

            <div className="flex-1 pb-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {employee.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {employee.employeeId}{" "}
                    •{" "}
                    {getName(
                      employee.designation
                    )}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(
                    employee.status
                  )}`}
                >
                  {formatStatus(
                    employee.status
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileMeta
              icon={
                <Mail size={17} />
              }
              label="Email"
              value={
                employee.email
              }
            />

            <ProfileMeta
              icon={
                <Phone size={17} />
              }
              label="Phone"
              value={
                employee.phone ||
                "—"
              }
            />

            <ProfileMeta
              icon={
                <BriefcaseBusiness
                  size={17}
                />
              }
              label="Department"
              value={getName(
                employee.department
              )}
            />

            <ProfileMeta
              icon={
                <CalendarDays
                  size={17}
                />
              }
              label="Joined"
              value={formatDate(
                employee.joiningDate
              )}
            />
          </div>
        </div>
      </div>

      {/* ===================================================
          TABS
      =================================================== */}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-w-max">
          <TabButton
            active={
              activeTab === "overview"
            }
            onClick={() =>
              setActiveTab(
                "overview"
              )
            }
            icon={<User size={16} />}
            label="Overview"
          />

          <TabButton
            active={
              activeTab === "documents"
            }
            onClick={() =>
              setActiveTab(
                "documents"
              )
            }
            icon={
              <FileText size={16} />
            }
            label="Documents"
            count={
              tabCounts.documents
            }
          />

          <TabButton
            active={
              activeTab === "attendance"
            }
            onClick={() =>
              setActiveTab(
                "attendance"
              )
            }
            icon={
              <Clock3 size={16} />
            }
            label="Attendance"
            count={
              tabCounts.attendance
            }
          />

          <TabButton
            active={
              activeTab === "leave"
            }
            onClick={() =>
              setActiveTab("leave")
            }
            icon={
              <CalendarDays
                size={16}
              />
            }
            label="Leave"
            count={
              tabCounts.leave
            }
          />

          <TabButton
            active={
              activeTab === "payroll"
            }
            onClick={() =>
              setActiveTab(
                "payroll"
              )
            }
            icon={
              <WalletCards size={16} />
            }
            label="Payroll"
            count={
              tabCounts.payroll
            }
          />

          <TabButton
            active={
              activeTab === "notices"
            }
            onClick={() =>
              setActiveTab(
                "notices"
              )
            }
            icon={
              <ShieldCheck size={16} />
            }
            label="Notices"
            count={
              tabCounts.notices
            }
          />
        </div>
      </div>

      {/* ===================================================
          TAB CONTENT
      =================================================== */}

      {activeTab === "overview" && (
        <OverviewTab
          employee={employee}
        />
      )}

      {activeTab === "documents" && (
        <DocumentsTab
          documents={documents}
          loading={tabLoading}
          employeeId={employee._id}
          onRefresh={loadDocuments}
        />
      )}

      {activeTab === "attendance" && (
        <AttendanceTab
          attendance={attendance}
          loading={tabLoading}
        />
      )}

      {activeTab === "leave" && (
        <LeaveTab
          leave={leave}
          loading={tabLoading}
        />
      )}

      {activeTab === "payroll" && (
        <PayrollTab
          payroll={payroll}
          loading={tabLoading}
        />
      )}

      {activeTab === "notices" && (
        <NoticesTab
          notices={notices}
          loading={tabLoading}
        />
      )}

      {/* ===================================================
          EDIT MODAL
      =================================================== */}

      {editOpen && (
        <EditEmployeeModal
          employee={employee}
          onClose={() =>
            setEditOpen(false)
          }
          onSaved={async () => {
            setEditOpen(false);
            await loadEmployee();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   EMPLOYEE AVATAR
========================================================= */

function EmployeeAvatar({
  employee,
  large = false,
}: {
  employee?: Employee | null;
  large?: boolean;
}) {
  // Never call .split() on an undefined employee name.
  const safeName =
    typeof employee?.name === "string" &&
    employee.name.trim()
      ? employee.name.trim()
      : "Employee";

  const initials =
    safeName
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "E";

  const size = large
    ? "h-24 w-24 text-2xl rounded-2xl"
    : "h-12 w-12 text-sm rounded-xl";

  if (employee?.profilePhoto) {
    return (
      <img
        src={employee.profilePhoto}
        alt={safeName}
        className={`${size} border-4 border-white object-cover shadow-md`}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`flex ${size} items-center justify-center border-4 border-white bg-indigo-50 font-bold text-indigo-700 shadow-md`}
      aria-label={safeName}
      title={safeName}
    >
      {initials}
    </div>
  );
}

/* =========================================================
   PROFILE META
========================================================= */

function ProfileMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TAB BUTTON
========================================================= */

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition ${
        active
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {icon}

      {label}

      {count !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            active
              ? "bg-indigo-50 text-indigo-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* =========================================================
   OVERVIEW TAB
========================================================= */

function OverviewTab({
  employee,
}: {
  employee: Employee;
}) {
  const address = employee.address;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* PERSONAL */}

      <SectionCard
        title="Personal Information"
        icon={<User size={18} />}
      >
        <InfoGrid>
          <InfoItem
            label="Full Name"
            value={employee.name}
          />

          <InfoItem
            label="Employee ID"
            value={
              employee.employeeId
            }
          />

          <InfoItem
            label="Date of Birth"
            value={formatDate(
              employee.dateOfBirth
            )}
          />

          <InfoItem
            label="Gender"
            value={formatStatus(
              employee.gender
            )}
          />

          <InfoItem
            label="Marital Status"
            value={formatStatus(
              employee.maritalStatus
            )}
          />

          <InfoItem
            label="Phone"
            value={
              employee.phone ||
              "—"
            }
          />

          <InfoItem
            label="Email"
            value={employee.email}
          />
        </InfoGrid>
      </SectionCard>

      {/* EMPLOYMENT */}

      <SectionCard
        title="Employment Information"
        icon={
          <BriefcaseBusiness
            size={18}
          />
        }
      >
        <InfoGrid>
          <InfoItem
            label="Department"
            value={getName(
              employee.department
            )}
          />

          <InfoItem
            label="Designation"
            value={getName(
              employee.designation
            )}
          />

          <InfoItem
            label="Employment Type"
            value={formatStatus(
              employee.employmentType
            )}
          />

          <InfoItem
            label="Work Mode"
            value={formatStatus(
              employee.workMode
            )}
          />

          <InfoItem
            label="Joining Date"
            value={formatDate(
              employee.joiningDate
            )}
          />

          <InfoItem
            label="Confirmation Date"
            value={formatDate(
              employee.confirmationDate
            )}
          />

          <InfoItem
            label="Status"
            value={formatStatus(
              employee.status
            )}
          />

          <InfoItem
            label="Reporting Manager"
            value={
              employee
                .reportingManager
                ?.name ||
              "—"
            }
          />
        </InfoGrid>
      </SectionCard>

      {/* ADDRESS */}

      <SectionCard
        title="Address"
        icon={
          <MapPin size={18} />
        }
      >
        {address ? (
          <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {address.addressLine1 && (
              <p>
                {address.addressLine1}
              </p>
            )}

            {address.addressLine2 && (
              <p>
                {address.addressLine2}
              </p>
            )}

            <p>
              {[
                address.city,
                address.state,
                address.postalCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>

            {address.country && (
              <p>
                {address.country}
              </p>
            )}
          </div>
        ) : (
          <EmptyInline text="No address information available." />
        )}
      </SectionCard>

      {/* EMERGENCY */}

      <SectionCard
        title="Emergency Contact"
        icon={
          <Phone size={18} />
        }
      >
        {employee.emergencyContact ? (
          <InfoGrid>
            <InfoItem
              label="Name"
              value={
                employee
                  .emergencyContact
                  .name ||
                "—"
              }
            />

            <InfoItem
              label="Relationship"
              value={
                employee
                  .emergencyContact
                  .relationship ||
                "—"
              }
            />

            <InfoItem
              label="Phone"
              value={
                employee
                  .emergencyContact
                  .phone ||
                "—"
              }
            />
          </InfoGrid>
        ) : (
          <EmptyInline text="No emergency contact information available." />
        )}
      </SectionCard>

      {/* BANK */}

      <SectionCard
        title="Bank Information"
        icon={
          <CreditCard size={18} />
        }
      >
        {employee.bankDetails ? (
          <InfoGrid>
            <InfoItem
              label="Account Holder"
              value={
                employee
                  .bankDetails
                  .accountHolderName ||
                "—"
              }
            />

            <InfoItem
              label="Bank"
              value={
                employee
                  .bankDetails
                  .bankName ||
                "—"
              }
            />

            <InfoItem
              label="Branch"
              value={
                employee
                  .bankDetails
                  .branchName ||
                "—"
              }
            />

            <InfoItem
              label="Account Number"
              value={maskAccountNumber(
                employee
                  .bankDetails
                  .accountNumber
              )}
            />

            <InfoItem
              label="IFSC"
              value={
                employee
                  .bankDetails
                  .ifscCode ||
                "—"
              }
            />
          </InfoGrid>
        ) : (
          <EmptyInline text="Bank details have not been added." />
        )}
      </SectionCard>

      {/* SALARY */}

      <SectionCard
        title="Current Salary Structure"
        icon={
          <IndianRupee size={18} />
        }
      >
        {employee.salary ? (
          <InfoGrid>
            <InfoItem
              label="Basic"
              value={formatMoney(
                employee.salary.basic
              )}
            />

            <InfoItem
              label="HRA"
              value={formatMoney(
                employee.salary.hra
              )}
            />

            <InfoItem
              label="Allowances"
              value={formatMoney(
                employee.salary
                  .allowances
              )}
            />

            <InfoItem
              label="Deductions"
              value={formatMoney(
                employee.salary
                  .deductions
              )}
            />

            <InfoItem
              label="Gross Salary"
              value={formatMoney(
                employee.salary
                  .gross
              )}
            />

            <InfoItem
              label="Net Salary"
              value={formatMoney(
                employee.salary
                  .net
              )}
            />
          </InfoGrid>
        ) : (
          <EmptyInline text="Salary structure has not been configured." />
        )}
      </SectionCard>
    </div>
  );
}

/* =========================================================
   DOCUMENTS TAB
========================================================= */

function DocumentsTab({
  documents,
  loading,
  employeeId,
  onRefresh,
}: {
  documents: DocumentItem[];
  loading: boolean;
  employeeId: string;
  onRefresh: () => Promise<void>;
}) {
  const [showUpload, setShowUpload] =
    useState(false);

  if (loading) {
    return <TabLoader />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-gray-900">
            Employee Documents
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Secure HR documents associated with this employee.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowUpload(true)
          }
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        <EmptyTab
          icon={<FileText size={24} />}
          title="No documents"
          text="No documents have been uploaded for this employee."
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {documents.map(
            (document) => (
              <DocumentRow
                key={document._id}
                document={document}
              />
            )
          )}
        </div>
      )}

      {showUpload && (
        <UploadDocumentModal
          employeeId={employeeId}
          onClose={() =>
            setShowUpload(false)
          }
          onUploaded={async () => {
            setShowUpload(false);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   DOCUMENT ROW
========================================================= */

function DocumentRow({
  document: documentItem,
}: {
  document: DocumentItem;
}) {
  async function downloadDocument() {
    try {
      const response = await api.get(
        `/documents/${documentItem._id}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);

      const anchor = window.document.createElement("a");

      anchor.href = url;

      anchor.download =
        documentItem.originalFileName ||
        documentItem.fileName ||
        "document";

      window.document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Failed to download document:",
        err
      );

      alert(
        "Unable to download this document."
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <FileText size={18} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {documentItem.title ||
              documentItem.originalFileName ||
              "Document"}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>
              {formatStatus(
                documentItem.type
              )}
            </span>

            <span>
              {formatDate(
                documentItem.createdAt
              )}
            </span>

            {documentItem.acknowledged && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={12} />
                Acknowledged
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={downloadDocument}
        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Download
      </button>
    </div>
  );
}

/* =========================================================
   ATTENDANCE TAB
========================================================= */

function AttendanceTab({
  attendance,
  loading,
}: {
  attendance: AttendanceItem[];
  loading: boolean;
}) {
  if (loading) {
    return <TabLoader />;
  }

  const present =
    attendance.filter(
      (item) =>
        item.status ===
        "present"
    ).length;

  const absent =
    attendance.filter(
      (item) =>
        item.status ===
        "absent"
    ).length;

  const halfDay =
    attendance.filter(
      (item) =>
        item.status ===
        "half_day"
    ).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SmallStat
          label="Present"
          value={present}
          className="text-emerald-600"
        />

        <SmallStat
          label="Absent"
          value={absent}
          className="text-red-600"
        />

        <SmallStat
          label="Half Day"
          value={halfDay}
          className="text-amber-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">
            Attendance History
          </h2>
        </div>

        {attendance.length === 0 ? (
          <EmptyTab
            icon={<Clock3 size={24} />}
            title="No attendance records"
            text="Attendance records will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <TableHead>
                    Date
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Check In
                  </TableHead>

                  <TableHead>
                    Check Out
                  </TableHead>

                  <TableHead>
                    Working Hours
                  </TableHead>

                  <TableHead>
                    Remarks
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {attendance.map(
                  (item) => (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <TableCell>
                        {formatDate(
                          item.date
                        )}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          value={
                            item.status
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {item.checkIn ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        {item.checkOut ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        {item.workingHours !==
                        undefined
                          ? `${item.workingHours} hrs`
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {item.remarks ||
                          "—"}
                      </TableCell>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   LEAVE TAB
========================================================= */

function LeaveTab({
  leave,
  loading,
}: {
  leave: LeaveItem[];
  loading: boolean;
}) {
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] =
    useState<string>("all");

  const [selectedYear, setSelectedYear] =
    useState<string>("all");

  if (loading) {
    return <TabLoader />;
  }

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const availableYears = Array.from(
    new Set(
      leave
        .flatMap((item) => [
          item.startDate,
          item.endDate,
        ])
        .filter(Boolean)
        .map((value) => {
          const year = new Date(
            value as string
          ).getFullYear();

          return Number.isNaN(year)
            ? null
            : year;
        })
        .filter(
          (year): year is number =>
            year !== null
        )
    )
  ).sort((a, b) => b - a);

  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
  }

  const filteredLeave = leave.filter((item) => {
    if (!item.startDate && !item.endDate) {
      return selectedMonth === "all" &&
        selectedYear === "all";
    }

    const start = item.startDate
      ? new Date(item.startDate)
      : item.endDate
        ? new Date(item.endDate)
        : null;

    const end = item.endDate
      ? new Date(item.endDate)
      : item.startDate
        ? new Date(item.startDate)
        : null;

    if (!start || !end) return false;

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return false;
    }

    if (selectedYear !== "all") {
      const year = Number(selectedYear);
      const yearStart = new Date(
        year,
        0,
        1
      );
      const yearEnd = new Date(
        year,
        11,
        31,
        23,
        59,
        59,
        999
      );

      if (end < yearStart || start > yearEnd) {
        return false;
      }
    }

    if (selectedMonth !== "all") {
      const month = Number(selectedMonth) - 1;
      const filterYear =
        selectedYear !== "all"
          ? Number(selectedYear)
          : currentYear;

      const monthStart = new Date(
        filterYear,
        month,
        1
      );
      const monthEnd = new Date(
        filterYear,
        month + 1,
        0,
        23,
        59,
        59,
        999
      );

      if (end < monthStart || start > monthEnd) {
        return false;
      }
    }

    return true;
  });

  const filteredDays = filteredLeave.reduce(
    (sum, item) =>
      sum + (Number(item.days) || 0),
    0
  );

  function clearFilters() {
    setSelectedMonth("all");
    setSelectedYear("all");
  }

  return (
    <div className="space-y-5">
      {/* FILTER BAR */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-bold text-gray-900">
              Leave History
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Filter employee leave records month-wise and year-wise.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-[180px]">
              <span className="mb-1.5 block text-xs font-bold text-gray-600">
                Month
              </span>

              <select
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">
                  All Months
                </option>

                {monthOptions.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-[150px]">
              <span className="mb-1.5 block text-xs font-bold text-gray-600">
                Year
              </span>

              <select
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">
                  All Years
                </option>

                {availableYears.map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={
                selectedMonth === "all" &&
                selectedYear === "all"
              }
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-indigo-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              Leave Records
            </p>
            <p className="mt-1 text-xl font-bold text-indigo-700">
              {filteredLeave.length}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Leave Days
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {filteredDays}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Showing
            </p>
            <p className="mt-1 text-sm font-bold text-gray-700">
              {selectedMonth === "all"
                ? "All Months"
                : monthOptions.find(
                    (month) =>
                      month.value ===
                      selectedMonth
                  )?.label || "Month"}
              {" • "}
              {selectedYear === "all"
                ? "All Years"
                : selectedYear}
            </p>
          </div>
        </div>
      </div>

      {/* LEAVE TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {filteredLeave.length === 0 ? (
          <EmptyTab
            icon={
              <CalendarDays size={24} />
            }
            title="No leave records"
            text={
              leave.length === 0
                ? "Leave applications will appear here."
                : "No leave records match the selected month and year."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <TableHead>
                    Leave Type
                  </TableHead>

                  <TableHead>
                    Start Date
                  </TableHead>

                  <TableHead>
                    End Date
                  </TableHead>

                  <TableHead>
                    Days
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Reason
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {filteredLeave.map(
                  (item) => (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <TableCell>
                        {getLeaveTypeName(
                          item.leaveType
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          item.startDate
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          item.endDate
                        )}
                      </TableCell>

                      <TableCell>
                        {item.days ??
                          "—"}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          value={
                            item.status
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {item.reason ||
                          "—"}
                      </TableCell>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PAYROLL TAB
========================================================= */

function PayrollTab({
  payroll,
  loading,
}: {
  payroll: PayrollItem[];
  loading: boolean;
}) {
  if (loading) {
    return <TabLoader />;
  }

  const totalNet =
    payroll.reduce(
      (sum, item) =>
        sum +
        (item.netSalary || 0),
      0
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SmallStat
          label="Payroll Records"
          value={payroll.length}
          className="text-indigo-600"
        />

        <SmallStat
          label="Total Net Paid"
          value={formatMoney(
            totalNet
          )}
          className="text-emerald-600"
          isText
        />

        <SmallStat
          label="Paid Records"
          value={
            payroll.filter(
              (item) =>
                item.status ===
                "paid"
            ).length
          }
          className="text-violet-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">
            Payroll History
          </h2>
        </div>

        {payroll.length === 0 ? (
          <EmptyTab
            icon={
              <WalletCards
                size={24}
              />
            }
            title="No payroll records"
            text="Payroll records will appear here after salary processing."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <TableHead>
                    Period
                  </TableHead>

                  <TableHead>
                    Basic
                  </TableHead>

                  <TableHead>
                    Gross
                  </TableHead>

                  <TableHead>
                    Deductions
                  </TableHead>

                  <TableHead>
                    Net Salary
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Paid At
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {payroll.map(
                  (item) => (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <TableCell>
                        {monthName(
                          item.month
                        )}{" "}
                        {item.year ||
                          ""}
                      </TableCell>

                      <TableCell>
                        {formatMoney(
                          item.basicSalary
                        )}
                      </TableCell>

                      <TableCell>
                        {formatMoney(
                          item.grossSalary
                        )}
                      </TableCell>

                      <TableCell>
                        {formatMoney(
                          item.totalDeductions
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-gray-900">
                          {formatMoney(
                            item.netSalary
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          value={
                            item.status
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          item.paidAt
                        )}
                      </TableCell>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   NOTICES TAB
========================================================= */

function NoticesTab({
  notices,
  loading,
}: {
  notices: NoticeItem[];
  loading: boolean;
}) {
  if (loading) {
    return <TabLoader />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-bold text-gray-900">
          Notices & Disciplinary Records
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          HR notices associated with this employee.
        </p>
      </div>

      {notices.length === 0 ? (
        <EmptyTab
          icon={
            <ShieldCheck size={24} />
          }
          title="No notices"
          text="No notices or disciplinary records have been issued."
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {notices.map(
            (notice) => (
              <div
                key={notice._id}
                className="p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {notice.title ||
                        "HR Notice"}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>
                        {formatStatus(
                          notice.type
                        )}
                      </span>

                      <span>
                        •
                      </span>

                      <span>
                        {formatDate(
                          notice.issuedAt
                        )}
                      </span>
                    </div>
                  </div>

                  <StatusBadge
                    value={
                      notice.status
                    }
                  />
                </div>

                {notice.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {
                      notice.description
                    }
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <h2 className="font-bold text-gray-900">
          {title}
        </h2>
      </div>

      <div className="pt-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   INFO GRID
========================================================= */

function InfoGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      {children}
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY INLINE
========================================================= */

function EmptyInline({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
      {text}
    </div>
  );
}

/* =========================================================
   EMPTY TAB
========================================================= */

function EmptyTab({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   TAB LOADER
========================================================= */

function TabLoader() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="space-y-3">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   SMALL STAT
========================================================= */

function SmallStat({
  label,
  value,
  className,
  isText = false,
}: {
  label: string;
  value: number | string;
  className: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 font-bold ${className} ${
          isText
            ? "text-xl"
            : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE HEAD / CELL
========================================================= */

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-5 py-4 text-sm text-gray-700">
      {children}
    </td>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  value,
}: {
  value?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(
        value
      )}`}
    >
      {formatStatus(value)}
    </span>
  );
}

/* =========================================================
   UPLOAD DOCUMENT MODAL
========================================================= */

function UploadDocumentModal({
  employeeId,
  onClose,
  onUploaded,
}: {
  employeeId: string;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [title, setTitle] =
    useState("");

  const [type, setType] =
    useState("other");

  const [file, setFile] =
    useState<File | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function upload(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!file) {
      setError(
        "Please select a file."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "title",
        title || file.name
      );

      formData.append(
        "type",
        type
      );

      formData.append(
        "employee",
        employeeId
      );

      await api.post(
        "/documents/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      await onUploaded();
    } catch (err: any) {
      console.error(
        "Document upload failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to upload document."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="font-bold text-gray-900">
              Upload Document
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Upload a secure employee HR document.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={upload}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600">
              Document Title
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Aadhaar Card"
              className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600">
              Document Type
            </span>

            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="aadhaar">
                Aadhaar
              </option>

              <option value="pan">
                PAN
              </option>

              <option value="bank_document">
                Bank Document
              </option>

              <option value="education_certificate">
                Education Certificate
              </option>

              <option value="experience_certificate">
                Experience Certificate
              </option>

              <option value="resume">
                Resume
              </option>

              <option value="offer_letter">
                Offer Letter
              </option>

              <option value="appointment_letter">
                Appointment Letter
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600">
              File
            </span>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) =>
                setFile(
                  event.target
                    .files?.[0] ||
                    null
                )
              }
              className="block w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm"
            />

            <p className="mt-2 text-xs text-gray-400">
              PDF, JPG, PNG or WEBP. Maximum size depends on HRD configuration.
            </p>
          </label>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving || !file
              }
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "Uploading..."
                : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* =========================================================
   EDIT EMPLOYEE MODAL
========================================================= */

function EditEmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] =
    useState(employee.name);

  const [email, setEmail] =
    useState(employee.email);

  const [phone, setPhone] =
    useState(
      employee.phone || ""
    );

  const [status, setStatus] =
    useState(
      employee.status ||
        "active"
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function save(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.patch(
        `/hr/employees/${employee._id}`,
        {
          name,
          email,
          phone,
          status,
        }
      );

      await onSaved();
    } catch (err: any) {
      console.error(
        "Failed to update employee:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update employee."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="font-bold text-gray-900">
              Edit Employee
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Update basic employee information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={save}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <EditInput
            label="Full Name"
            value={name}
            onChange={setName}
          />

          <EditInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
          />

          <EditInput
            label="Phone"
            value={phone}
            onChange={setPhone}
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="on_leave">
                On Leave
              </option>

              <option value="terminated">
                Terminated
              </option>
            </select>
          </label>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* =========================================================
   EDIT INPUT
========================================================= */

function EditInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

/* =========================================================
   MODAL OVERLAY
========================================================= */

function ModalOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

/* =========================================================
   MASK ACCOUNT NUMBER
========================================================= */

function maskAccountNumber(
  accountNumber?: string
) {
  if (!accountNumber) {
    return "—";
  }

  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  return `${"*".repeat(
    Math.max(
      0,
      accountNumber.length - 4
    )
  )}${accountNumber.slice(-4)}`;
}