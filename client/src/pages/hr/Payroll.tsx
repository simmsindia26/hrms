import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import api from "../../lib/axios";

type PayrollStatus =
  | "draft"
  | "processed"
  | "approved"
  | "paid"
  | "cancelled";

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;

  department?:
    | {
        _id?: string;
        name?: string;
      }
    | string;

  designation?:
    | {
        _id?: string;
        name?: string;
      }
    | string;
}

interface Payroll {
  _id: string;

  employee: Employee | string;

  month: number;
  year: number;

  monthlySalary?: number;

  payrollBasisDays?: number;
  payableDays?: number;
  unpaidDays?: number;

  perDaySalary?: number;

  additions?: number;
  deductions?: number;

  grossPay?: number;
  netPay?: number;

  status: PayrollStatus;

  approvedBy?: string;
  approvedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface SalaryStructure {
  _id: string;

  employee?: Employee | string;

  monthlySalary?: number;
  basic?: number;
  hra?: number;
  allowances?: number;
  deductions?: number;

  effectiveFrom?: string;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

interface PayrollForm {
  employee: string;

  month: number;
  year: number;

  workingDays: number;
  paidDays: number;

  presentDays: number;
  leaveDays: number;
  absentDays: number;
  halfDays: number;
  lopDays: number;

  overtimeHours: number;

  additions: number;

  advanceDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
}

const PAGE_SIZE = 10;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_OPTIONS: PayrollStatus[] = [
  "draft",
  "processed",
  "approved",
  "paid",
  "cancelled",
];

const emptyForm: PayrollForm = {
  employee: "",

  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),

  workingDays: 26,
  paidDays: 26,

  presentDays: 26,
  leaveDays: 0,
  absentDays: 0,
  halfDays: 0,
  lopDays: 0,

  overtimeHours: 0,

  additions: 0,

  advanceDeduction: 0,
  loanDeduction: 0,
  otherDeductions: 0,
};

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getEmployeeName(
  employee?: Employee | string | null,
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

  return (
    `${employee.firstName || ""} ${
      employee.lastName || ""
    }`.trim() || "Unknown Employee"
  );
}

function getEmployeeId(
  employee?: Employee | string | null,
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.employeeId || "";
}

function getDepartmentName(
  employee?: Employee | string | null,
): string {
  if (
    !employee ||
    typeof employee === "string" ||
    !employee.department
  ) {
    return "—";
  }

  if (typeof employee.department === "string") {
    return employee.department;
  }

  return employee.department.name || "—";
}

function formatCurrency(value?: number): string {
  const amount = toNumber(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string): string {
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

function getStatusClasses(status: PayrollStatus): string {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700";

    case "processed":
      return "bg-blue-100 text-blue-700";

    case "approved":
      return "bg-emerald-100 text-emerald-700";

    case "paid":
      return "bg-violet-100 text-violet-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: PayrollStatus): string {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function getSalaryStructureEmployeeId(
  structure: SalaryStructure,
): string {
  if (!structure.employee) {
    return "";
  }

  if (typeof structure.employee === "string") {
    return structure.employee;
  }

  return structure.employee._id || "";
}

function isSalaryStructureActive(
  structure: SalaryStructure,
): boolean {
  return structure.isActive !== false;
}

function getStructureMonthlySalary(
  structure?: SalaryStructure | null,
): number {
  return toNumber(structure?.monthlySalary);
}

function getStructureBasic(
  structure?: SalaryStructure | null,
): number {
  return toNumber(structure?.basic);
}

function getStructureHra(
  structure?: SalaryStructure | null,
): number {
  return toNumber(structure?.hra);
}

function getStructureAllowances(
  structure?: SalaryStructure | null,
): number {
  return toNumber(structure?.allowances);
}

function getStructureDeductions(
  structure?: SalaryStructure | null,
): number {
  return toNumber(structure?.deductions);
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
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
  children: ReactNode;
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

function Modal({
  title,
  children,
  onClose,
  width = "max-w-4xl",
}: {
  title: string;
  children: ReactNode;
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

        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  disabled = false,
  max,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type="number"
        min="0"
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            Number(event.target.value || 0),
          )
        }
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) =>
            onChange(
              Number(event.target.value || 0),
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 pl-7 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span
        className={`text-sm ${
          strong
            ? "font-bold text-slate-900"
            : "text-slate-600"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          strong
            ? "font-bold text-slate-900"
            : "font-medium text-slate-700"
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function CalculationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DateBox({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {formatDate(value)}
      </p>
    </div>
  );
}

function SalaryStructurePreview({
  structure,
}: {
  structure: SalaryStructure;
}) {
  const monthlySalary =
    getStructureMonthlySalary(structure);

  const basic = getStructureBasic(structure);
  const hra = getStructureHra(structure);
  const allowances =
    getStructureAllowances(structure);
  const deductions =
    getStructureDeductions(structure);

  const calculatedGross =
    monthlySalary + allowances;

  const calculatedNet =
    monthlySalary - deductions;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CircleDollarSign size={18} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Active Salary Structure
              </h3>

              <p className="text-xs text-slate-500">
                Values are loaded from the employee's
                active salary structure.
              </p>
            </div>
          </div>
        </div>

        <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Active
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <MoneyRow
          label="Monthly Salary"
          value={monthlySalary}
          strong
        />

        <MoneyRow
          label="Basic"
          value={basic}
        />

        <MoneyRow
          label="HRA"
          value={hra}
        />

        <MoneyRow
          label="Allowances"
          value={allowances}
        />

        <MoneyRow
          label="Deductions"
          value={deductions}
        />

        <MoneyRow
          label="Estimated Gross"
          value={calculatedGross}
          strong
        />
      </div>

      <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300">
              Structure Net
            </p>

            <p className="mt-1 text-xl font-bold">
              {formatCurrency(calculatedNet)}
            </p>
          </div>

          <Banknote
            size={25}
            className="text-slate-300"
          />
        </div>
      </div>

      {structure.effectiveFrom && (
        <p className="mt-3 text-xs text-slate-500">
          Effective from{" "}
          <strong>
            {formatDate(
              structure.effectiveFrom,
            )}
          </strong>
        </p>
      )}
    </div>
  );
}

export default function Payroll() {
  const [payrolls, setPayrolls] = useState<
    Payroll[]
  >([]);

  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [
    salaryStructures,
    setSalaryStructures,
  ] = useState<SalaryStructure[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [monthFilter, setMonthFilter] =
    useState(new Date().getMonth() + 1);

  const [yearFilter, setYearFilter] =
    useState(new Date().getFullYear());

  const [statusFilter, setStatusFilter] =
    useState<PayrollStatus | "all">("all");

  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingPayroll, setEditingPayroll] =
    useState<Payroll | null>(null);

  const [viewingPayroll, setViewingPayroll] =
    useState<Payroll | null>(null);

  const [form, setForm] =
    useState<PayrollForm>(emptyForm);

  async function loadData(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [
        payrollResponse,
        employeeResponse,
        salaryResponse,
      ] = await Promise.all([
        api.get("/hr/payroll"),
        api.get("/hr/employees"),
        api.get("/hr/salary-structures"),
      ]);

      const payrollData =
        payrollResponse.data?.data?.items ??
        payrollResponse.data?.data ??
        payrollResponse.data?.payrolls ??
        [];

      const employeeData =
        employeeResponse.data?.data?.items ??
        employeeResponse.data?.data ??
        employeeResponse.data?.employees ??
        [];

      const salaryData =
        salaryResponse.data?.data?.items ??
        salaryResponse.data?.data ??
        salaryResponse.data?.salaryStructures ??
        salaryResponse.data?.structures ??
        [];

      setPayrolls(
        Array.isArray(payrollData)
          ? payrollData
          : [],
      );

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : [],
      );

      setSalaryStructures(
        Array.isArray(salaryData)
          ? salaryData
          : [],
      );
    } catch (error: any) {
      console.error(
        "Failed to load payroll data:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to load payroll data.",
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
    monthFilter,
    yearFilter,
    statusFilter,
  ]);

  const filteredPayrolls = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payrolls.filter((payroll) => {
      const employeeName = getEmployeeName(
        payroll.employee,
      );

      const employeeId = getEmployeeId(
        payroll.employee,
      );

      const department = getDepartmentName(
        payroll.employee,
      );

      const matchesSearch =
        !query ||
        employeeName
          .toLowerCase()
          .includes(query) ||
        employeeId
          .toLowerCase()
          .includes(query) ||
        department
          .toLowerCase()
          .includes(query);

      const matchesMonth =
        !monthFilter ||
        payroll.month === monthFilter;

      const matchesYear =
        !yearFilter ||
        payroll.year === yearFilter;

      const matchesStatus =
        statusFilter === "all" ||
        payroll.status === statusFilter;

      return (
        matchesSearch &&
        matchesMonth &&
        matchesYear &&
        matchesStatus
      );
    });
  }, [
    payrolls,
    search,
    monthFilter,
    yearFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPayrolls.length / PAGE_SIZE,
    ),
  );

  const paginatedPayrolls = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredPayrolls.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [filteredPayrolls, page]);

  const stats = useMemo(() => {
    const currentPayrolls = payrolls.filter(
      (payroll) =>
        payroll.month === monthFilter &&
        payroll.year === yearFilter,
    );

    const gross = currentPayrolls.reduce(
      (sum, payroll) =>
        sum + toNumber(payroll.grossPay),
      0,
    );

    const net = currentPayrolls.reduce(
      (sum, payroll) =>
        sum + toNumber(payroll.netPay),
      0,
    );

    const deductions =
      currentPayrolls.reduce(
        (sum, payroll) =>
          sum + toNumber(payroll.deductions),
        0,
      );

    return {
      employees: currentPayrolls.length,
      gross,
      deductions,
      net,

      approved: currentPayrolls.filter(
        (item) =>
          item.status === "approved",
      ).length,

      paid: currentPayrolls.filter(
        (item) => item.status === "paid",
      ).length,
    };
  }, [
    payrolls,
    monthFilter,
    yearFilter,
  ]);

  const selectedSalaryStructure =
    useMemo(() => {
      if (!form.employee) {
        return null;
      }

      const matching =
        salaryStructures.filter(
          (structure) =>
            getSalaryStructureEmployeeId(
              structure,
            ) === form.employee &&
            isSalaryStructureActive(
              structure,
            ),
        );

      if (matching.length === 0) {
        return null;
      }

      return [...matching].sort(
        (a, b) => {
          const dateA = new Date(
            a.effectiveFrom ||
              a.createdAt ||
              0,
          ).getTime();

          const dateB = new Date(
            b.effectiveFrom ||
              b.createdAt ||
              0,
          ).getTime();

          return dateB - dateA;
        },
      )[0];
    }, [
      form.employee,
      salaryStructures,
    ]);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee._id === form.employee,
      ) || null,
    [employees, form.employee],
  );

  function updateForm(
    key: keyof PayrollForm,
    value: string | number,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function openCreateModal() {
    setEditingPayroll(null);

    setForm({
      ...emptyForm,
      month: monthFilter,
      year: yearFilter,
      workingDays: 26,
      paidDays: 26,
      presentDays: 26,
    });

    setShowCreateModal(true);
  }

  function openEditModal(
    payroll: Payroll,
  ) {
    const employeeId =
      typeof payroll.employee === "string"
        ? payroll.employee
        : payroll.employee?._id || "";

    setEditingPayroll(payroll);

    setForm({
      employee: employeeId,

      month: payroll.month,
      year: payroll.year,

      workingDays:
        payroll.payrollBasisDays || 26,

      paidDays:
        payroll.payableDays ?? 0,

      presentDays:
        payroll.payableDays ?? 0,

      leaveDays: 0,
      absentDays:
        payroll.unpaidDays ?? 0,
      halfDays: 0,
      lopDays:
        payroll.unpaidDays ?? 0,

      overtimeHours: 0,

      additions:
        payroll.additions ?? 0,

      advanceDeduction: 0,
      loanDeduction: 0,
      otherDeductions:
        payroll.deductions ?? 0,
    });

    setShowCreateModal(true);
  }

  async function handleSave(
    status: "draft" | "processed",
  ) {
    if (!form.employee) {
      alert("Please select an employee.");
      return;
    }

    if (!selectedSalaryStructure) {
      alert(
        "Active salary structure not found for this employee. Please create or activate a salary structure first.",
      );
      return;
    }

    if (form.workingDays <= 0) {
      alert(
        "Working days must be greater than 0.",
      );
      return;
    }

    if (
      form.paidDays < 0 ||
      form.paidDays > form.workingDays
    ) {
      alert(
        "Paid days cannot be greater than working days.",
      );
      return;
    }

    if (
      form.presentDays < 0 ||
      form.leaveDays < 0 ||
      form.absentDays < 0 ||
      form.halfDays < 0 ||
      form.lopDays < 0
    ) {
      alert(
        "Attendance values cannot be negative.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        employee: form.employee,

        month: Number(form.month),
        year: Number(form.year),

        workingDays: Number(
          form.workingDays,
        ),

        paidDays: Number(form.paidDays),

        presentDays: Number(
          form.presentDays,
        ),

        leaveDays: Number(form.leaveDays),

        absentDays: Number(
          form.absentDays,
        ),

        halfDays: Number(form.halfDays),

        lopDays: Number(form.lopDays),

        overtimeHours: Number(
          form.overtimeHours,
        ),

        additions: Number(
          form.additions,
        ),

        advanceDeduction: Number(
          form.advanceDeduction,
        ),

        loanDeduction: Number(
          form.loanDeduction,
        ),

        otherDeductions: Number(
          form.otherDeductions,
        ),

        status,
      };

      if (editingPayroll) {
        await api.patch(
          `/hr/payroll/${editingPayroll._id}`,
          payload,
        );
      } else {
        await api.post(
          "/hr/payroll",
          payload,
        );
      }

      setShowCreateModal(false);
      setEditingPayroll(null);
      setForm(emptyForm);

      await loadData(false);
    } catch (error: any) {
      console.error(
        "Failed to save payroll:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save payroll.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function processPayroll(
    payroll: Payroll,
  ) {
    if (
      !window.confirm(
        `Process payroll for ${getEmployeeName(
          payroll.employee,
        )}?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(payroll._id);

      await api.patch(
        `/hr/payroll/${payroll._id}/process`,
        {
          status: "processed",
        },
      );

      await loadData(false);
    } catch (error: any) {
      console.error(
        "Failed to process payroll:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to process payroll.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function approvePayroll(
    payroll: Payroll,
  ) {
    if (
      !window.confirm(
        `Approve payroll for ${getEmployeeName(
          payroll.employee,
        )}?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(payroll._id);

      await api.patch(
        `/hr/payroll/${payroll._id}/approve`,
        {
          status: "approved",
        },
      );

      await loadData(false);
    } catch (error: any) {
      console.error(
        "Failed to approve payroll:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to approve payroll.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function markPaid(
    payroll: Payroll,
  ) {
    if (
      !window.confirm(
        `Mark payroll as paid for ${getEmployeeName(
          payroll.employee,
        )}?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(payroll._id);

      await api.patch(
        `/hr/payroll/${payroll._id}/pay`,
        {
          status: "paid",
        },
      );

      await loadData(false);
    } catch (error: any) {
      console.error(
        "Failed to mark payroll paid:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to mark payroll as paid.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelPayroll(
    payroll: Payroll,
  ) {
    if (
      !window.confirm(
        `Cancel payroll for ${getEmployeeName(
          payroll.employee,
        )}?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(payroll._id);

      await api.patch(
        `/hr/payroll/${payroll._id}`,
        {
          status: "cancelled",
        },
      );

      await loadData(false);
    } catch (error: any) {
      console.error(
        "Failed to cancel payroll:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to cancel payroll.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function downloadPayslip(
    payroll: Payroll,
  ) {
    try {
      const response = await api.get(
        `/documents/payslip/${payroll._id}`,
        {
          responseType: "blob",
        },
      );

      const blobUrl =
        window.URL.createObjectURL(
          response.data,
        );

      const link =
        window.document.createElement(
          "a",
        );

      link.href = blobUrl;

      link.download = `Payslip-${getEmployeeName(
        payroll.employee,
      )}-${MONTHS[
        payroll.month - 1
      ]}-${payroll.year}.pdf`;

      window.document.body.appendChild(
        link,
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error(
        "Failed to download payslip:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to download payslip.",
      );
    }
  }

  function resetFilters() {
    setSearch("");

    setMonthFilter(
      new Date().getMonth() + 1,
    );

    setYearFilter(
      new Date().getFullYear(),
    );

    setStatusFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Banknote size={16} />

            <span>HR Management</span>

            <span>/</span>

            <span>Payroll</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Payroll Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Process monthly salaries, attendance,
            deductions, approvals and employee
            payslips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              loadData(false)
            }
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
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
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={17} />

            Create Payroll
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Employees"
          value={stats.employees}
          description="Current payroll"
          icon={<Users size={20} />}
        />

        <StatCard
          label="Gross Payroll"
          value={formatCurrency(
            stats.gross,
          )}
          description="Before deductions"
          icon={
            <CircleDollarSign size={20} />
          }
        />

        <StatCard
          label="Deductions"
          value={formatCurrency(
            stats.deductions,
          )}
          description="Total deductions"
          icon={<Banknote size={20} />}
        />

        <StatCard
          label="Net Payroll"
          value={formatCurrency(stats.net)}
          description="Payable to employees"
          icon={<Banknote size={20} />}
        />

        <StatCard
          label="Paid"
          value={stats.paid}
          description={`${stats.approved} approved`}
          icon={<Check size={20} />}
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search employee..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={monthFilter}
            onChange={(event) =>
              setMonthFilter(
                Number(event.target.value),
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
          >
            {MONTHS.map(
              (month, index) => (
                <option
                  key={month}
                  value={index + 1}
                >
                  {month}
                </option>
              ),
            )}
          </select>

          <select
            value={yearFilter}
            onChange={(event) =>
              setYearFilter(
                Number(event.target.value),
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
          >
            {Array.from(
              { length: 5 },
              (_, index) =>
                new Date().getFullYear() -
                2 +
                index,
            ).map((year) => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | PayrollStatus
                  | "all",
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">
              All Status
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {getStatusLabel(status)}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter size={14} />

            {filteredPayrolls.length} payroll
            records found
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Loading payroll...
            </div>
          </div>
        ) : paginatedPayrolls.length ===
          0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Banknote size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No payroll records
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              No payroll records match the selected
              month, year or filters.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Create Payroll
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Attendance
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Gross
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Deductions
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Net Salary
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
                  {paginatedPayrolls.map(
                    (payroll) => (
                      <PayrollRow
                        key={payroll._id}
                        payroll={payroll}
                        actionLoading={
                          actionLoading
                        }
                        onView={() => {
                          setViewingPayroll(
                            payroll,
                          );
                          setShowViewModal(
                            true,
                          );
                        }}
                        onEdit={() =>
                          openEditModal(
                            payroll,
                          )
                        }
                        onProcess={() =>
                          processPayroll(
                            payroll,
                          )
                        }
                        onApprove={() =>
                          approvePayroll(
                            payroll,
                          )
                        }
                        onPaid={() =>
                          markPaid(payroll)
                        }
                        onCancel={() =>
                          cancelPayroll(
                            payroll,
                          )
                        }
                        onDownload={() =>
                          downloadPayslip(
                            payroll,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedPayrolls.map(
                (payroll) => (
                  <PayrollMobileCard
                    key={payroll._id}
                    payroll={payroll}
                    actionLoading={
                      actionLoading
                    }
                    onView={() => {
                      setViewingPayroll(
                        payroll,
                      );
                      setShowViewModal(true);
                    }}
                    onEdit={() =>
                      openEditModal(
                        payroll,
                      )
                    }
                    onProcess={() =>
                      processPayroll(
                        payroll,
                      )
                    }
                    onApprove={() =>
                      approvePayroll(
                        payroll,
                      )
                    }
                    onPaid={() =>
                      markPaid(payroll)
                    }
                    onCancel={() =>
                      cancelPayroll(
                        payroll,
                      )
                    }
                    onDownload={() =>
                      downloadPayslip(
                        payroll,
                      )
                    }
                  />
                ),
              )}
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredPayrolls.length ===
                  0
                    ? 0
                    : (page - 1) *
                        PAGE_SIZE +
                      1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    page * PAGE_SIZE,
                    filteredPayrolls.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredPayrolls.length}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
                  Page {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1,
                      ),
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showCreateModal && (
        <Modal
          title={
            editingPayroll
              ? "Edit Payroll"
              : "Create Payroll"
          }
          onClose={() => {
            setShowCreateModal(false);
            setEditingPayroll(null);
          }}
          width="max-w-5xl"
        >
          <div className="space-y-6 p-6">
            {/* PERIOD */}
            <section>
              <h3 className="text-sm font-bold text-slate-900">
                Payroll Period
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Employee *
                  </label>

                  <select
                    value={form.employee}
                    disabled={
                      !!editingPayroll
                    }
                    onChange={(event) =>
                      updateForm(
                        "employee",
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">
                      Select Employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee._id}
                          value={
                            employee._id
                          }
                        >
                          {getEmployeeName(
                            employee,
                          )}

                          {employee.employeeId
                            ? ` (${employee.employeeId})`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Month
                  </label>

                  <select
                    value={form.month}
                    disabled={
                      !!editingPayroll
                    }
                    onChange={(event) =>
                      updateForm(
                        "month",
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                  >
                    {MONTHS.map(
                      (month, index) => (
                        <option
                          key={month}
                          value={
                            index + 1
                          }
                        >
                          {month}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Year
                  </label>

                  <input
                    type="number"
                    value={form.year}
                    disabled={
                      !!editingPayroll
                    }
                    onChange={(event) =>
                      updateForm(
                        "year",
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {selectedEmployee && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                    <span>
                      Employee:{" "}
                      <strong className="text-slate-900">
                        {getEmployeeName(
                          selectedEmployee,
                        )}
                      </strong>
                    </span>

                    <span>
                      ID:{" "}
                      <strong className="text-slate-900">
                        {getEmployeeId(
                          selectedEmployee,
                        ) || "—"}
                      </strong>
                    </span>

                    <span>
                      Department:{" "}
                      <strong className="text-slate-900">
                        {getDepartmentName(
                          selectedEmployee,
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* SALARY STRUCTURE */}
            {form.employee &&
              selectedSalaryStructure && (
                <SalaryStructurePreview
                  structure={
                    selectedSalaryStructure
                  }
                />
              )}

            {form.employee &&
              !selectedSalaryStructure && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <CircleDollarSign
                        size={18}
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-amber-900">
                        No Active Salary
                        Structure
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        This employee does not have
                        an active salary structure.
                        Payroll cannot be created
                        until a salary structure is
                        created or activated.
                      </p>

                      <p className="mt-2 text-xs text-amber-700">
                        Go to{" "}
                        <strong>
                          Salary Structures
                        </strong>{" "}
                        in HR Management and create
                        or activate the employee's
                        salary structure.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* ATTENDANCE */}
            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Attendance & Working Days
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Attendance is used by the backend
                    to calculate payable salary.
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  Default: 26 Working Days
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
                <NumberInput
                  label="Working Days"
                  value={
                    form.workingDays
                  }
                  onChange={(value) =>
                    updateForm(
                      "workingDays",
                      value,
                    )
                  }
                  step={1}
                />

                <NumberInput
                  label="Paid Days"
                  value={form.paidDays}
                  max={form.workingDays}
                  onChange={(value) =>
                    updateForm(
                      "paidDays",
                      value,
                    )
                  }
                  step={0.5}
                />

                <NumberInput
                  label="Present"
                  value={
                    form.presentDays
                  }
                  onChange={(value) =>
                    updateForm(
                      "presentDays",
                      value,
                    )
                  }
                />

                <NumberInput
                  label="Leave"
                  value={form.leaveDays}
                  onChange={(value) =>
                    updateForm(
                      "leaveDays",
                      value,
                    )
                  }
                />

                <NumberInput
                  label="Absent"
                  value={
                    form.absentDays
                  }
                  onChange={(value) =>
                    updateForm(
                      "absentDays",
                      value,
                    )
                  }
                />

                <NumberInput
                  label="Half Days"
                  value={
                    form.halfDays
                  }
                  onChange={(value) =>
                    updateForm(
                      "halfDays",
                      value,
                    )
                  }
                />

                <NumberInput
                  label="LOP Days"
                  value={form.lopDays}
                  max={form.workingDays}
                  onChange={(value) =>
                    updateForm(
                      "lopDays",
                      value,
                    )
                  }
                />
              </div>
            </section>

            {/* ADDITIONS */}
            <section>
              <h3 className="text-sm font-bold text-slate-900">
                Salary Additions
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Additional earnings added to the calculated
                payable salary.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MoneyField
                  label="Additional Earnings"
                  value={form.additions}
                  onChange={(value) =>
                    updateForm(
                      "additions",
                      value,
                    )
                  }
                />
              </div>
            </section>

            {/* OVERTIME */}
            <section>
              <h3 className="text-sm font-bold text-slate-900">
                Overtime
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <NumberInput
                  label="Overtime Hours"
                  value={
                    form.overtimeHours
                  }
                  onChange={(value) =>
                    updateForm(
                      "overtimeHours",
                      value,
                    )
                  }
                />

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">
                    Overtime
                  </p>

                  <p className="mt-1 text-sm leading-5 text-blue-800">
                    Overtime hours are sent to the
                    backend. Your current SalaryStructure
                    does not contain an overtime rate, so
                    overtime is not independently monetized
                    by this frontend.
                  </p>
                </div>
              </div>
            </section>

            {/* DEDUCTIONS */}
            <section>
              <h3 className="text-sm font-bold text-slate-900">
                Additional Deductions
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                These deductions are added to the
                deductions already configured in the
                salary structure.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MoneyField
                  label="Advance Deduction"
                  value={
                    form.advanceDeduction
                  }
                  onChange={(value) =>
                    updateForm(
                      "advanceDeduction",
                      value,
                    )
                  }
                />

                <MoneyField
                  label="Loan Deduction"
                  value={
                    form.loanDeduction
                  }
                  onChange={(value) =>
                    updateForm(
                      "loanDeduction",
                      value,
                    )
                  }
                />

                <MoneyField
                  label="Other Deductions"
                  value={
                    form.otherDeductions
                  }
                  onChange={(value) =>
                    updateForm(
                      "otherDeductions",
                      value,
                    )
                  }
                />
              </div>
            </section>

            {/* CALCULATION */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                  <CircleDollarSign
                    size={19}
                  />
                </div>

                <div className="w-full">
                  <h3 className="text-sm font-bold text-slate-900">
                    Payroll Calculation
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Final payroll values are calculated by
                    the backend using the active salary
                    structure and attendance.
                  </p>

                  {selectedSalaryStructure && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <CalculationCard
                        label="Monthly Salary"
                        value={formatCurrency(
                          getStructureMonthlySalary(
                            selectedSalaryStructure,
                          ),
                        )}
                      />

                      <CalculationCard
                        label="Basic"
                        value={formatCurrency(
                          getStructureBasic(
                            selectedSalaryStructure,
                          ),
                        )}
                      />

                      <CalculationCard
                        label="HRA"
                        value={formatCurrency(
                          getStructureHra(
                            selectedSalaryStructure,
                          ),
                        )}
                      />

                      <CalculationCard
                        label="Allowances"
                        value={formatCurrency(
                          getStructureAllowances(
                            selectedSalaryStructure,
                          ),
                        )}
                      />

                      <CalculationCard
                        label="Structure Deductions"
                        value={formatCurrency(
                          getStructureDeductions(
                            selectedSalaryStructure,
                          ),
                        )}
                      />

                      <CalculationCard
                        label="Per-Day Salary"
                        value={formatCurrency(
                          getStructureMonthlySalary(
                            selectedSalaryStructure,
                          ) /
                            Math.max(
                              form.workingDays,
                              1,
                            ),
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPayroll(null);
                }}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  !selectedSalaryStructure
                }
                onClick={() =>
                  handleSave("draft")
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                disabled={
                  saving ||
                  !selectedSalaryStructure
                }
                onClick={() =>
                  handleSave("processed")
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={16} />
                )}

                Process Payroll
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {showViewModal &&
        viewingPayroll && (
          <Modal
            title="Payroll Details"
            onClose={() =>
              setShowViewModal(false)
            }
            width="max-w-4xl"
          >
            <div className="p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <User size={20} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {getEmployeeName(
                          viewingPayroll.employee,
                        )}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {getEmployeeId(
                          viewingPayroll.employee,
                        ) ||
                          "Employee"}{" "}
                        •{" "}
                        {
                          MONTHS[
                            viewingPayroll.month -
                              1
                          ]
                        }{" "}
                        {viewingPayroll.year}
                      </p>
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                    viewingPayroll.status,
                  )}`}
                >
                  {getStatusLabel(
                    viewingPayroll.status,
                  )}
                </span>
              </div>

              {/* ATTENDANCE */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-900">
                  Attendance
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  <SummaryBox
                    label="Basis Days"
                    value={
                      viewingPayroll.payrollBasisDays ??
                      26
                    }
                  />

                  <SummaryBox
                    label="Payable Days"
                    value={
                      viewingPayroll.payableDays ??
                      0
                    }
                  />

                  <SummaryBox
                    label="Unpaid Days"
                    value={
                      viewingPayroll.unpaidDays ??
                      0
                    }
                  />

                  <SummaryBox
                    label="Month"
                    value={viewingPayroll.month}
                  />
                </div>
              </div>

              {/* SALARY */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-900">
                  Salary
                </h3>

                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  <MoneyRow
                    label="Monthly Salary"
                    value={
                      viewingPayroll.monthlySalary
                    }
                  />

                  <MoneyRow
                    label="Per-Day Salary"
                    value={
                      viewingPayroll.perDaySalary
                    }
                  />

                  <MoneyRow
                    label="Additional Earnings"
                    value={
                      viewingPayroll.additions
                    }
                  />

                  <MoneyRow
                    label="Gross Pay"
                    value={
                      viewingPayroll.grossPay
                    }
                    strong
                  />
                </div>
              </div>

              {/* DEDUCTIONS */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-900">
                  Deductions
                </h3>

                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  <MoneyRow
                    label="Total Deductions"
                    value={
                      viewingPayroll.deductions
                    }
                    strong
                  />
                </div>
              </div>

              {/* NET */}
              <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">
                      Net Pay
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      {formatCurrency(
                        viewingPayroll.netPay,
                      )}
                    </p>
                  </div>

                  <Banknote
                    size={32}
                    className="text-slate-300"
                  />
                </div>
              </div>

              {/* DATES */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateBox
                  label="Approved"
                  value={
                    viewingPayroll.approvedAt
                  }
                />

                <DateBox
                  label="Updated"
                  value={
                    viewingPayroll.updatedAt
                  }
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
                {(viewingPayroll.status ===
                  "approved" ||
                  viewingPayroll.status ===
                    "paid") && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadPayslip(
                        viewingPayroll,
                      )
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download size={16} />
                    Payslip
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(false)
                  }
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

function PayrollRow({
  payroll,
  actionLoading,
  onView,
  onEdit,
  onProcess,
  onApprove,
  onPaid,
  onCancel,
  onDownload,
}: {
  payroll: Payroll;
  actionLoading: string | null;
  onView: () => void;
  onEdit: () => void;
  onProcess: () => void;
  onApprove: () => void;
  onPaid: () => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  const loading =
    actionLoading === payroll._id;

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User size={15} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {getEmployeeName(
                payroll.employee,
              )}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {getEmployeeId(
                payroll.employee,
              ) ||
                getDepartmentName(
                  payroll.employee,
                )}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="text-xs text-slate-600">
          <p>
            Paid:{" "}
            <strong>
              {payroll.payableDays ?? 0}
            </strong>{" "}
            /{" "}
            {payroll.payrollBasisDays ??
              26}
          </p>

          <p className="mt-1 text-slate-400">
            Unpaid:{" "}
            {payroll.unpaidDays ?? 0}
          </p>
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-semibold text-slate-800">
          {formatCurrency(
            payroll.grossPay,
          )}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm text-slate-600">
          {formatCurrency(
            payroll.deductions,
          )}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-bold text-slate-900">
          {formatCurrency(
            payroll.netPay,
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            payroll.status,
          )}`}
        >
          {getStatusLabel(
            payroll.status,
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1.5">
          <IconButton
            title="View payroll"
            onClick={onView}
          >
            <Eye size={16} />
          </IconButton>

          {payroll.status ===
            "draft" && (
            <>
              <IconButton
                title="Edit payroll"
                onClick={onEdit}
              >
                <FileText size={16} />
              </IconButton>

              <IconButton
                title="Process payroll"
                onClick={onProcess}
                disabled={loading}
              >
                {loading ? (
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

          {payroll.status ===
            "processed" && (
            <IconButton
              title="Approve payroll"
              onClick={onApprove}
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Check size={16} />
              )}
            </IconButton>
          )}

          {payroll.status ===
            "approved" && (
            <IconButton
              title="Mark as paid"
              onClick={onPaid}
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Banknote size={16} />
              )}
            </IconButton>
          )}

          {(payroll.status ===
            "approved" ||
            payroll.status === "paid") && (
            <IconButton
              title="Download payslip"
              onClick={onDownload}
            >
              <Download size={16} />
            </IconButton>
          )}

          {payroll.status !==
            "cancelled" &&
            payroll.status !== "paid" && (
              <IconButton
                title="Cancel payroll"
                onClick={onCancel}
                disabled={loading}
              >
                <XCircle size={16} />
              </IconButton>
            )}
        </div>
      </td>
    </tr>
  );
}

function PayrollMobileCard({
  payroll,
  actionLoading,
  onView,
  onEdit,
  onProcess,
  onApprove,
  onPaid,
  onCancel,
  onDownload,
}: {
  payroll: Payroll;
  actionLoading: string | null;
  onView: () => void;
  onEdit: () => void;
  onProcess: () => void;
  onApprove: () => void;
  onPaid: () => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  const loading =
    actionLoading === payroll._id;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User size={16} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {getEmployeeName(
                payroll.employee,
              )}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {
                MONTHS[
                  payroll.month - 1
                ]
              }{" "}
              {payroll.year}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            payroll.status,
          )}`}
        >
          {getStatusLabel(
            payroll.status,
          )}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Gross
          </p>

          <p className="mt-1 text-xs font-bold text-slate-800">
            {formatCurrency(
              payroll.grossPay,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Deduction
          </p>

          <p className="mt-1 text-xs font-bold text-slate-800">
            {formatCurrency(
              payroll.deductions,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Net
          </p>

          <p className="mt-1 text-xs font-bold text-white">
            {formatCurrency(
              payroll.netPay,
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          Paid:{" "}
          <strong>
            {payroll.payableDays ?? 0}
          </strong>{" "}
          /{" "}
          {payroll.payrollBasisDays ??
            26}
        </span>

        <span>
          Unpaid:{" "}
          {payroll.unpaidDays ?? 0}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
        >
          <Eye size={14} />
          View
        </button>

        {payroll.status ===
          "draft" && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <FileText size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={onProcess}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Send size={14} />
              )}

              Process
            </button>
          </>
        )}

        {payroll.status ===
          "processed" && (
          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Check size={14} />
            )}

            Approve
          </button>
        )}

        {payroll.status ===
          "approved" && (
          <button
            type="button"
            onClick={onPaid}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Banknote size={14} />
            )}

            Mark Paid
          </button>
        )}

        {(payroll.status ===
          "approved" ||
          payroll.status === "paid") && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
          >
            <Download size={14} />

            Payslip
          </button>
        )}

        {payroll.status !==
          "cancelled" &&
          payroll.status !== "paid" && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
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