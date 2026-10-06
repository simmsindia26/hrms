import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
  User,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios";

type TabKey =
  | "overview"
  | "personal"
  | "employment"
  | "salary"
  | "payroll"
  | "leaves"
  | "attendance"
  | "documents"
  | "recruitment"
  | "notices"
  | "assets";

type Department = { _id: string; name?: string } | string | null;
type Designation = { _id: string; name?: string } | string | null;

interface Employee {
  _id: string;
  employeeId?: string;

  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;

  email?: string;
  phone?: string;
  alternatePhone?: string;
  personalEmail?: string;

  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;

  fatherName?: string;
  motherName?: string;

  department?: Department;
  designation?: Designation;

  reportingManager?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string | null;

  joiningDate?: string;
  confirmationDate?: string;
  probationPeriod?: number;

  employmentType?: string;
  employmentStatus?: string;
  status?: string;

  workLocation?: string;
  branch?: string;
  grade?: string;

  profilePhoto?: string;

  currentAddress?: string;
  permanentAddress?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  bankName?: string;
  bankAccountNumber?: string;
  accountNumber?: string;

  ifsc?: string;
  bankIfsc?: string;

  pan?: string;
  aadhaar?: string;

  salary?: Record<string, number>;
  salaryStructure?: Record<string, unknown> | string | null;

  user?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  } | string | null;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
}

interface LeaveRecord {
  _id: string;
  leaveType?: {
    _id?: string;
    name?: string;
    annualQuota?: number;
    isPaid?: boolean;
  } | string | null;
  startDate?: string;
  endDate?: string;
  days?: number;
  reason?: string;
  status?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt?: string;
}

interface AttendanceRecord {
  _id: string;
  date?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
  overtimeMinutes?: number;
  workHours?: number;
  remarks?: string;
  createdAt?: string;
}

interface PayrollRecord {
  _id: string;
  month?: number;
  year?: number;
  status?: string;

  basic?: number;
  hra?: number;
  allowances?: number;

  gross?: number;
  grossSalary?: number;

  additions?: number;
  deductions?: number;
  totalDeductions?: number;

  netSalary?: number;
  netPay?: number;

  unpaidDays?: number;
  createdAt?: string;
  approvedAt?: string;

  employee?: Employee | string | null;

  [key: string]: unknown;
}

interface DocumentRecord {
  _id: string;
  type?: string;
  title?: string;
  fileName?: string;
  originalFileName?: string;
  fileUrl?: string;
  mimeType?: string;
  fileSize?: number;
  issuedAt?: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
  createdAt?: string;
}

interface CandidateRecord {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  offerStatus?: string;
  joiningDate?: string;
  jobOpening?: { title?: string } | string | null;
  createdAt?: string;
}

interface NoticeRecord {
  _id: string;
  title?: string;
  type?: string;
  message?: string;
  status?: string;
  createdAt?: string;
}

interface SalaryRecord {
  _id: string;
  basic?: number;
  hra?: number;
  conveyance?: number;
  specialAllowance?: number;
  otherAllowances?: number;
  gross?: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  tds?: number;
  otherDeductions?: number;
  netSalary?: number;
  ctc?: number;
  effectiveFrom?: string;
  createdAt?: string;

  [key: string]: unknown;
}

const TABS: {
  key: TabKey;
  label: string;
  icon: typeof User;
}[] = [
  {
    key: "overview",
    label: "Overview",
    icon: User,
  },
  {
    key: "personal",
    label: "Personal",
    icon: Users,
  },
  {
    key: "employment",
    label: "Employment",
    icon: BriefcaseBusiness,
  },
  {
    key: "salary",
    label: "Salary",
    icon: IndianRupee,
  },
  {
    key: "payroll",
    label: "Payroll",
    icon: WalletCards,
  },
  {
    key: "leaves",
    label: "Leaves",
    icon: CalendarDays,
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: Clock3,
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
  },
  {
    key: "recruitment",
    label: "Recruitment",
    icon: ShieldCheck,
  },
  {
    key: "notices",
    label: "Notices",
    icon: FileCheck2,
  },
  {
    key: "assets",
    label: "Assets",
    icon: BriefcaseBusiness,
  },
];

function unwrap<T = any>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function arrayData<T = any>(response: any): T[] {
  const value = unwrap<any>(response);

  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function getText(
  value: unknown,
  fallback = "—",
): string {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    const v = value as Record<string, unknown>;

    return String(
      v.name ??
        v.title ??
        v.email ??
        v._id ??
        fallback,
    );
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| SAFE EMPLOYEE NAME
|--------------------------------------------------------------------------
|
| This is the important fix.
|
| Previously EmployeeAvatar / initials logic could receive undefined
| and call:
|
|     undefined.split(...)
|
| Now every employee always gets a safe string.
|
*/
function employeeName(
  employee?: Employee | null,
): string {
  if (!employee) {
    return "Employee";
  }

  const nameParts = [
    employee.firstName,
    employee.middleName,
    employee.lastName,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const fullName = nameParts.join(" ").trim();

  if (fullName) {
    return fullName;
  }

  const fallbackName = String(
    employee.name ?? "",
  ).trim();

  return fallbackName || "Employee";
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value?: number | null) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "₹—";
  }

  return `₹${Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  )}`;
}

function statusClass(status?: string) {
  const s = String(status || "").toLowerCase();

  if (
    [
      "active",
      "approved",
      "paid",
      "accepted",
      "present",
      "completed",
    ].includes(s)
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    [
      "pending",
      "on_leave",
      "processing",
      "scheduled",
      "sent",
    ].includes(s)
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (
    [
      "rejected",
      "inactive",
      "terminated",
      "absent",
      "declined",
    ].includes(s)
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}

function pretty(value?: string) {
  return String(value || "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase(),
    );
}

function getFileName(doc: DocumentRecord) {
  return (
    doc.originalFileName ||
    doc.fileName ||
    doc.title ||
    "Document"
  );
}

function getFileSize(bytes?: number) {
  if (!bytes) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">
          {title}
        </h2>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {getText(value)}
      </p>
    </div>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-12 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export default function AdminEmployeeProfile() {
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [leaves, setLeaves] =
    useState<LeaveRecord[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  const [payroll, setPayroll] =
    useState<PayrollRecord[]>([]);

  const [documents, setDocuments] =
    useState<DocumentRecord[]>([]);

  const [candidates, setCandidates] =
    useState<CandidateRecord[]>([]);

  const [notices, setNotices] =
    useState<NoticeRecord[]>([]);

  const [salary, setSalary] =
    useState<SalaryRecord[]>([]);

  const [activeTab, setActiveTab] =
    useState<TabKey>("overview");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showUpload, setShowUpload] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [uploadTitle, setUploadTitle] =
    useState("");

  const [uploadType, setUploadType] =
    useState("other");

  const [uploadFile, setUploadFile] =
    useState<File | null>(null);

  const loadEmployee =
    useCallback(async () => {
      if (!id) {
        return;
      }

      const response = await api.get(
        `/hr/employees/${id}`,
      );

      const data =
        unwrap<Employee>(response);

      setEmployee(data || null);
    }, [id]);

  const loadRelated =
    useCallback(async () => {
      if (!id) {
        return;
      }

      const requests =
        await Promise.allSettled([
          api.get(
            `/hr/leaves?employee=${id}&limit=100`,
          ),

          api.get(
            `/hr/attendance?employee=${id}&limit=100`,
          ),

          api.get(
            `/hr/payroll?employee=${id}&limit=100`,
          ),

          api.get(
            `/hr/documents?employee=${id}`,
          ),

          api.get(
            `/hr/candidates?employee=${id}&limit=100`,
          ),

          api.get(
            `/hr/notices?employee=${id}&limit=100`,
          ),

          api.get(
            `/hr/salary-structures?employee=${id}&limit=100`,
          ),
        ]);

      const [
        leave,
        att,
        pay,
        docs,
        cand,
        noticesResponse,
        salaryResponse,
      ] = requests;

      if (leave.status === "fulfilled") {
        setLeaves(
          arrayData<LeaveRecord>(
            leave.value,
          ),
        );
      }

      if (att.status === "fulfilled") {
        setAttendance(
          arrayData<AttendanceRecord>(
            att.value,
          ),
        );
      }

      if (pay.status === "fulfilled") {
        setPayroll(
          arrayData<PayrollRecord>(
            pay.value,
          ),
        );
      }

      if (docs.status === "fulfilled") {
        setDocuments(
          arrayData<DocumentRecord>(
            docs.value,
          ),
        );
      }

      if (cand.status === "fulfilled") {
        setCandidates(
          arrayData<CandidateRecord>(
            cand.value,
          ),
        );
      }

      if (
        noticesResponse.status ===
        "fulfilled"
      ) {
        setNotices(
          arrayData<NoticeRecord>(
            noticesResponse.value,
          ),
        );
      }

      if (
        salaryResponse.status ===
        "fulfilled"
      ) {
        setSalary(
          arrayData<SalaryRecord>(
            salaryResponse.value,
          ),
        );
      }
    }, [id]);

  const load = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        await Promise.all([
          loadEmployee(),
          loadRelated(),
        ]);
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            "Failed to load employee profile.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadEmployee, loadRelated],
  );

  useEffect(() => {
    load();
  }, [load]);

  const latestSalary = salary[0];

  const latestPayroll = payroll[0];

  const approvedLeaves =
    leaves.filter(
      (x) => x.status === "approved",
    );

  const leaveDays =
    approvedLeaves.reduce(
      (sum, x) =>
        sum + Number(x.days || 0),
      0,
    );

  const presentDays =
    attendance.filter(
      (x) =>
        String(x.status).toLowerCase() ===
        "present",
    ).length;

  const absentDays =
    attendance.filter(
      (x) =>
        String(x.status).toLowerCase() ===
        "absent",
    ).length;

  /*
  |--------------------------------------------------------------------------
  | SAFE INITIALS
  |--------------------------------------------------------------------------
  */

  const profileInitials = useMemo(() => {
    const safeName =
      employeeName(employee);

    return (
      safeName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) =>
          part.charAt(0).toUpperCase(),
        )
        .join("") || "E"
    );
  }, [employee]);

  async function uploadDocument() {
    if (!id || !uploadFile) {
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append(
        "employee",
        id,
      );

      formData.append(
        "type",
        uploadType,
      );

      formData.append(
        "title",
        uploadTitle.trim() ||
          uploadFile.name,
      );

      formData.append(
        "file",
        uploadFile,
      );

      const response =
        await api.post(
          "/hr/documents",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          },
        );

      const createdDocument =
        unwrap<DocumentRecord>(
          response,
        );

      if (createdDocument?._id) {
        setDocuments(
          (current) => [
            createdDocument,
            ...current,
          ],
        );
      } else {
        await loadRelated();
      }

      setShowUpload(false);
      setUploadTitle("");
      setUploadType("other");
      setUploadFile(null);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to upload document.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function generatePayslip(
    item: PayrollRecord,
  ) {
    try {
      const response =
        await api.post(
          `/hr/documents/payslip/${item._id}`,
        );

      const doc =
        unwrap<any>(response);

      if (doc?.fileUrl) {
        window.open(
          doc.fileUrl,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        await loadRelated();
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to generate payslip.",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" />

        Loading employee profile...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <button
          onClick={() =>
            navigate("/hr/employees")
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />

          Back to Employees
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error ||
            "Employee not found."}
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric
          title="Leave Days"
          value={leaveDays}
          icon={
            <CalendarDays size={19} />
          }
        />

        <Metric
          title="Present"
          value={presentDays}
          icon={
            <CheckCircle2 size={19} />
          }
        />

        <Metric
          title="Absent"
          value={absentDays}
          icon={
            <Clock3 size={19} />
          }
        />

        <Metric
          title="Net Salary"
          value={money(
            latestPayroll?.netSalary ??
              latestPayroll?.netPay ??
              latestSalary?.netSalary,
          )}
          icon={
            <WalletCards size={19} />
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Personal Information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full Name"
              value={employeeName(employee)}
            />

            <Field
              label="Date of Birth"
              value={formatDate(
                employee.dateOfBirth,
              )}
            />

            <Field
              label="Gender"
              value={employee.gender}
            />

            <Field
              label="Blood Group"
              value={employee.bloodGroup}
            />

            <Field
              label="Personal Email"
              value={
                employee.personalEmail ||
                employee.email
              }
            />

            <Field
              label="Phone"
              value={employee.phone}
            />

            <Field
              label="Marital Status"
              value={employee.maritalStatus}
            />

            <Field
              label="Emergency Contact"
              value={
                employee.emergencyContactName
                  ? `${employee.emergencyContactName} (${
                      employee.emergencyContactRelation ||
                      "Contact"
                    })`
                  : undefined
              }
            />
          </div>
        </Card>

        <Card title="Employment Information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Employee ID"
              value={employee.employeeId}
            />

            <Field
              label="Department"
              value={employee.department}
            />

            <Field
              label="Designation"
              value={employee.designation}
            />

            <Field
              label="Joining Date"
              value={formatDate(
                employee.joiningDate,
              )}
            />

            <Field
              label="Employment Type"
              value={pretty(
                employee.employmentType,
              )}
            />

            <Field
              label="Status"
              value={pretty(
                employee.status ||
                  employee.employmentStatus,
              )}
            />

            <Field
              label="Location"
              value={
                employee.workLocation ||
                employee.branch
              }
            />

            <Field
              label="Reporting Manager"
              value={
                employee.reportingManager
              }
            />
          </div>
        </Card>
      </div>

      <Card title="Latest Payroll">
        {latestPayroll ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Period"
              value={`${latestPayroll.month || "—"}/${latestPayroll.year || "—"}`}
            />

            <Field
              label="Gross"
              value={money(
                latestPayroll.gross ??
                  latestPayroll.grossSalary,
              )}
            />

            <Field
              label="Deductions"
              value={money(
                latestPayroll.deductions ??
                  latestPayroll.totalDeductions,
              )}
            />

            <Field
              label="Net Pay"
              value={money(
                latestPayroll.netSalary ??
                  latestPayroll.netPay,
              )}
            />
          </div>
        ) : (
          <Empty text="No payroll records found for this employee." />
        )}
      </Card>
    </div>
  );

  const renderPersonal = () => (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Personal Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="First Name"
            value={employee.firstName}
          />

          <Field
            label="Middle Name"
            value={employee.middleName}
          />

          <Field
            label="Last Name"
            value={employee.lastName}
          />

          <Field
            label="Email"
            value={employee.email}
          />

          <Field
            label="Phone"
            value={employee.phone}
          />

          <Field
            label="Alternate Phone"
            value={employee.alternatePhone}
          />

          <Field
            label="Date of Birth"
            value={formatDate(
              employee.dateOfBirth,
            )}
          />

          <Field
            label="Gender"
            value={employee.gender}
          />

          <Field
            label="Blood Group"
            value={employee.bloodGroup}
          />

          <Field
            label="Marital Status"
            value={employee.maritalStatus}
          />

          <Field
            label="Father's Name"
            value={employee.fatherName}
          />

          <Field
            label="Mother's Name"
            value={employee.motherName}
          />
        </div>
      </Card>

      <Card title="Address & Emergency Contact">
        <div className="space-y-5">
          <Field
            label="Current Address"
            value={employee.currentAddress}
          />

          <Field
            label="Permanent Address"
            value={employee.permanentAddress}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Emergency Contact"
              value={
                employee.emergencyContactName
              }
            />

            <Field
              label="Relationship"
              value={
                employee.emergencyContactRelation
              }
            />

            <Field
              label="Emergency Phone"
              value={
                employee.emergencyContactPhone
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderEmployment = () => (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Employment Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Employee ID"
            value={employee.employeeId}
          />

          <Field
            label="Department"
            value={employee.department}
          />

          <Field
            label="Designation"
            value={employee.designation}
          />

          <Field
            label="Employment Type"
            value={pretty(
              employee.employmentType,
            )}
          />

          <Field
            label="Employment Status"
            value={pretty(
              employee.employmentStatus ||
                employee.status,
            )}
          />

          <Field
            label="Joining Date"
            value={formatDate(
              employee.joiningDate,
            )}
          />

          <Field
            label="Confirmation Date"
            value={formatDate(
              employee.confirmationDate,
            )}
          />

          <Field
            label="Probation Period"
            value={
              employee.probationPeriod
                ? `${employee.probationPeriod} months`
                : undefined
            }
          />

          <Field
            label="Grade"
            value={employee.grade}
          />

          <Field
            label="Branch"
            value={employee.branch}
          />

          <Field
            label="Work Location"
            value={employee.workLocation}
          />

          <Field
            label="Reporting Manager"
            value={
              employee.reportingManager
            }
          />
        </div>
      </Card>

      <Card title="Bank & Statutory Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Bank Name"
            value={employee.bankName}
          />

          <Field
            label="Account Number"
            value={
              employee.bankAccountNumber ||
              employee.accountNumber
            }
          />

          <Field
            label="IFSC"
            value={
              employee.ifsc ||
              employee.bankIfsc
            }
          />

          <Field
            label="PAN"
            value={employee.pan}
          />

          <Field
            label="Aadhaar"
            value={employee.aadhaar}
          />
        </div>
      </Card>
    </div>
  );

  const renderSalary = () => {
    const s =
      latestSalary ||
      (employee.salary as
        | SalaryRecord
        | undefined);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric
            title="Basic"
            value={money(s?.basic)}
            icon={
              <IndianRupee size={19} />
            }
          />

          <Metric
            title="Gross"
            value={money(
              s?.gross ??
                (employee.salary as any)?.gross,
            )}
            icon={
              <WalletCards size={19} />
            }
          />

          <Metric
            title="Net"
            value={money(s?.netSalary)}
            icon={
              <CheckCircle2 size={19} />
            }
          />

          <Metric
            title="CTC"
            value={money(s?.ctc)}
            icon={
              <BriefcaseBusiness size={19} />
            }
          />
        </div>

        <Card title="Current Salary Structure">
          {s ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Basic"
                value={money(s.basic)}
              />

              <Field
                label="HRA"
                value={money(s.hra)}
              />

              <Field
                label="Conveyance"
                value={money(
                  s.conveyance,
                )}
              />

              <Field
                label="Special Allowance"
                value={money(
                  s.specialAllowance,
                )}
              />

              <Field
                label="Other Allowances"
                value={money(
                  s.otherAllowances,
                )}
              />

              <Field
                label="Gross"
                value={money(s.gross)}
              />

              <Field
                label="PF"
                value={money(s.pf)}
              />

              <Field
                label="ESI"
                value={money(s.esi)}
              />

              <Field
                label="Professional Tax"
                value={money(
                  s.professionalTax,
                )}
              />

              <Field
                label="TDS"
                value={money(s.tds)}
              />

              <Field
                label="Other Deductions"
                value={money(
                  s.otherDeductions,
                )}
              />

              <Field
                label="Net Salary"
                value={money(
                  s.netSalary,
                )}
              />

              <Field
                label="CTC"
                value={money(s.ctc)}
              />

              <Field
                label="Effective From"
                value={formatDate(
                  s.effectiveFrom,
                )}
              />
            </div>
          ) : (
            <Empty text="No salary structure found for this employee." />
          )}
        </Card>

        {salary.length > 0 && (
          <Card title="Salary Structure History">
            <Table
              headers={[
                "Effective From",
                "Basic",
                "Gross",
                "Net",
                "CTC",
              ]}
            >
              {salary.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3">
                    {formatDate(
                      item.effectiveFrom ||
                        item.createdAt,
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {money(item.basic)}
                  </td>

                  <td className="px-4 py-3">
                    {money(item.gross)}
                  </td>

                  <td className="px-4 py-3">
                    {money(item.netSalary)}
                  </td>

                  <td className="px-4 py-3">
                    {money(item.ctc)}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
      </div>
    );
  };

  const renderPayroll = () => (
    <Card
      title="Payroll History"
      action={
        <span className="text-xs text-slate-400">
          {payroll.length} records
        </span>
      }
    >
      {payroll.length === 0 ? (
        <Empty text="No payroll records found." />
      ) : (
        <Table
          headers={[
            "Period",
            "Gross",
            "Deductions",
            "Net Pay",
            "Status",
            "Payslip",
          ]}
        >
          {payroll.map((item) => (
            <tr
              key={item._id}
              className="border-t border-slate-100 hover:bg-slate-50"
            >
              <td className="px-4 py-3 font-medium text-slate-800">
                {item.month || "—"}/
                {item.year || "—"}
              </td>

              <td className="px-4 py-3">
                {money(
                  item.gross ??
                    item.grossSalary,
                )}
              </td>

              <td className="px-4 py-3">
                {money(
                  item.deductions ??
                    item.totalDeductions,
                )}
              </td>

              <td className="px-4 py-3 font-semibold">
                {money(
                  item.netSalary ??
                    item.netPay,
                )}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                >
                  {pretty(item.status)}
                </span>
              </td>

              <td className="px-4 py-3">
                <button
                  onClick={() =>
                    generatePayslip(item)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                >
                  <Download size={14} />

                  Generate
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );

  const renderLeaves = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          title="Applications"
          value={leaves.length}
          icon={
            <CalendarDays size={19} />
          }
        />

        <Metric
          title="Approved Days"
          value={leaveDays}
          icon={
            <CheckCircle2 size={19} />
          }
        />

        <Metric
          title="Pending"
          value={
            leaves.filter(
              (x) => x.status === "pending",
            ).length
          }
          icon={<Clock3 size={19} />}
        />

        <Metric
          title="Rejected"
          value={
            leaves.filter(
              (x) =>
                x.status === "rejected",
            ).length
          }
          icon={<X size={19} />}
        />
      </div>

      <Card title="Leave History">
        {leaves.length === 0 ? (
          <Empty text="No leave records found." />
        ) : (
          <Table
            headers={[
              "Type",
              "From",
              "To",
              "Days",
              "Reason",
              "Status",
            ]}
          >
            {leaves.map((item) => (
              <tr
                key={item._id}
                className="border-t border-slate-100"
              >
                <td className="px-4 py-3 font-medium">
                  {getText(item.leaveType)}
                </td>

                <td className="px-4 py-3">
                  {formatDate(
                    item.startDate,
                  )}
                </td>

                <td className="px-4 py-3">
                  {formatDate(
                    item.endDate,
                  )}
                </td>

                <td className="px-4 py-3">
                  {item.days || 0}
                </td>

                <td className="max-w-[280px] px-4 py-3 text-slate-500">
                  {item.reason || "—"}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                  >
                    {pretty(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );

  const renderAttendance = () => (
    <Card title="Attendance History">
      {attendance.length === 0 ? (
        <Empty text="No attendance records found." />
      ) : (
        <Table
          headers={[
            "Date",
            "Status",
            "Check In",
            "Check Out",
            "Late",
            "Overtime",
            "Hours",
          ]}
        >
          {attendance.map((item) => (
            <tr
              key={item._id}
              className="border-t border-slate-100"
            >
              <td className="px-4 py-3 font-medium">
                {formatDate(item.date)}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                >
                  {pretty(item.status)}
                </span>
              </td>

              <td className="px-4 py-3">
                {item.checkIn || "—"}
              </td>

              <td className="px-4 py-3">
                {item.checkOut || "—"}
              </td>

              <td className="px-4 py-3">
                {item.lateMinutes
                  ? `${item.lateMinutes} min`
                  : "—"}
              </td>

              <td className="px-4 py-3">
                {item.overtimeMinutes
                  ? `${item.overtimeMinutes} min`
                  : "—"}
              </td>

              <td className="px-4 py-3">
                {item.workHours ?? "—"}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );

  const renderDocuments = () => (
    <Card
      title="Employee Documents"
      action={
        <button
          onClick={() =>
            setShowUpload(true)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <Upload size={14} />

          Upload
        </button>
      }
    >
      {documents.length === 0 ? (
        <Empty text="No documents uploaded for this employee." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="rounded-xl border border-slate-200 p-4 hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {doc.title ||
                        getFileName(doc)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {pretty(doc.type)}
                    </p>
                  </div>
                </div>

                {doc.acknowledged && (
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-emerald-600"
                  />
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {getFileSize(
                    doc.fileSize,
                  )}
                </span>

                <span>
                  {formatDate(
                    doc.createdAt ||
                      doc.issuedAt,
                  )}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {doc.fileUrl && (
                  <button
                    onClick={() =>
                      window.open(
                        doc.fileUrl,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Eye size={14} />

                    View
                  </button>
                )}

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    download
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Download size={14} />

                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  const renderRecruitment = () => (
    <Card title="Recruitment History">
      {candidates.length === 0 ? (
        <Empty text="No recruitment record linked to this employee." />
      ) : (
        <Table
          headers={[
            "Position",
            "Applied",
            "Status",
            "Offer",
            "Joining",
          ]}
        >
          {candidates.map((item) => (
            <tr
              key={item._id}
              className="border-t border-slate-100"
            >
              <td className="px-4 py-3 font-semibold">
                {getText(
                  item.jobOpening,
                )}
              </td>

              <td className="px-4 py-3">
                {formatDate(
                  item.createdAt,
                )}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                >
                  {pretty(item.status)}
                </span>
              </td>

              <td className="px-4 py-3">
                {pretty(
                  item.offerStatus,
                )}
              </td>

              <td className="px-4 py-3">
                {formatDate(
                  item.joiningDate,
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );

  const renderNotices = () => (
    <Card title="HR Notices & Disciplinary Records">
      {notices.length === 0 ? (
        <Empty text="No notices or disciplinary records found." />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">
                  {notice.title ||
                    pretty(notice.type)}
                </h3>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(notice.status)}`}
                >
                  {pretty(notice.status)}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {notice.message || "—"}
              </p>

              <p className="mt-3 text-xs text-slate-400">
                {formatDateTime(
                  notice.createdAt,
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  const renderAssets = () => (
    <Card title="Company Assets">
      <Empty text="Asset assignment is not exposed by the current HR backend yet. The tab is ready for the Asset module once its API/model is added." />
    </Card>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonal();

      case "employment":
        return renderEmployment();

      case "salary":
        return renderSalary();

      case "payroll":
        return renderPayroll();

      case "leaves":
        return renderLeaves();

      case "attendance":
        return renderAttendance();

      case "documents":
        return renderDocuments();

      case "recruitment":
        return renderRecruitment();

      case "notices":
        return renderNotices();

      case "assets":
        return renderAssets();

      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() =>
            navigate("/hr/employees")
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />

          Employees
        </button>

        <div className="flex gap-2">
          <button
            onClick={() =>
              load(true)
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            onClick={() =>
              navigate(
                "/hr/employees",
                {
                  state: {
                    editEmployeeId:
                      employee._id,
                  },
                },
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Edit3 size={16} />

            Edit
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EMPLOYEE HEADER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {employee.profilePhoto ? (
                <img
                  src={employee.profilePhoto}
                  alt={employeeName(employee)}
                  className="h-20 w-20 rounded-2xl object-cover"
                  onError={(event) => {
                    /*
                     * Prevent broken image from showing.
                     * Replace it visually with initials.
                     */
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-black text-indigo-600">
                  {profileInitials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">
                    {employeeName(employee)}
                  </h1>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                      employee.status ||
                        employee.employmentStatus,
                    )}`}
                  >
                    {pretty(
                      employee.status ||
                        employee.employmentStatus ||
                        "active",
                    )}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {getText(
                    employee.designation,
                  )}{" "}
                  ·{" "}
                  {getText(
                    employee.department,
                  )}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {employee.employeeId ||
                      "—"}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <Mail size={13} />

                    {employee.email ||
                      "—"}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <Phone size={13} />

                    {employee.phone ||
                      "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[470px]">
              <HeaderStat
                label="Joining"
                value={formatDate(
                  employee.joiningDate,
                )}
              />

              <HeaderStat
                label="Employment"
                value={pretty(
                  employee.employmentType,
                )}
              />

              <HeaderStat
                label="Net Salary"
                value={money(
                  latestPayroll?.netSalary ??
                    latestPayroll?.netPay ??
                    latestSalary?.netSalary,
                )}
              />

              <HeaderStat
                label="Documents"
                value={String(
                  documents.length,
                )}
              />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="overflow-x-auto border-t border-slate-100">
          <div className="flex min-w-max px-3 sm:px-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() =>
                    setActiveTab(tab.key)
                  }
                  className={`inline-flex items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon size={15} />

                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {renderTab()}

      {/* DOCUMENT UPLOAD MODAL */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={() =>
            !uploading &&
            setShowUpload(false)
          }
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Upload Employee Document
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  The document will be linked
                  directly to{" "}
                  {employeeName(employee)}.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowUpload(false)
                }
                disabled={uploading}
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Document Type
                </span>

                <select
                  value={uploadType}
                  onChange={(e) =>
                    setUploadType(
                      e.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="offer_letter">
                    Offer Letter
                  </option>

                  <option value="appointment_letter">
                    Appointment Letter
                  </option>

                  <option value="payslip">
                    Payslip
                  </option>

                  <option value="aadhaar">
                    Aadhaar
                  </option>

                  <option value="pan">
                    PAN Card
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

                  <option value="warning_notice">
                    Warning Notice
                  </option>

                  <option value="disciplinary_notice">
                    Disciplinary Notice
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Document Title
                </span>

                <input
                  value={uploadTitle}
                  onChange={(e) =>
                    setUploadTitle(
                      e.target.value,
                    )
                  }
                  placeholder="e.g. PAN Card - Rahul Kumar"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  File
                </span>

                <input
                  type="file"
                  onChange={(e) =>
                    setUploadFile(
                      e.target.files?.[0] ||
                        null,
                    )
                  }
                  className="block w-full rounded-xl border border-slate-200 p-2 text-sm"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() =>
                    setShowUpload(false)
                  }
                  disabled={uploading}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  onClick={uploadDocument}
                  disabled={
                    !uploadFile ||
                    uploading
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload size={16} />
                  )}

                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function HeaderStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
}
