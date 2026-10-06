import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  WalletCards,
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

interface PayrollRecord {
  _id: string;
  employee?: string | EmployeeReference | null;
  employeeId?: string;

  month?: number;
  year?: number;
  salaryMonth?: string;
  monthName?: string;
  period?: string;

  basicSalary?: number;
  basic?: number;
  hra?: number;
  allowances?: number;
  totalAllowances?: number;
  deductions?: number;
  totalDeductions?: number;
  grossSalary?: number;
  gross?: number;
  netSalary?: number;
  netPay?: number;
  payableSalary?: number;

  workingDays?: number;
  presentDays?: number;
  paidDays?: number;
  leaveDays?: number;
  absentDays?: number;

  status?: string;
  paymentStatus?: string;
  paidAt?: string;
  paymentDate?: string;

  createdAt?: string;
  updatedAt?: string;
}


interface PayslipDetails {
  payroll: PayrollRecord;
  employeeName: string;
  employeeId: string;
}

const getEmployeeId = (
  employee:
    | string
    | EmployeeReference
    | null
    | undefined,
): string => {
  if (!employee) return "";

  if (typeof employee === "string") {
    return employee;
  }

  return (
    employee.employeeId ||
    employee._id ||
    employee.id ||
    ""
  );
};

const getEmployeeName = (
  employee:
    | string
    | EmployeeReference
    | null
    | undefined,
): string => {
  if (!employee) return "";

  if (typeof employee === "string") {
    return "";
  }

  if (employee.name?.trim()) {
    return employee.name.trim();
  }

  return `${employee.firstName || ""} ${
    employee.lastName || ""
  }`.trim();
};

const formatCurrency = (
  value: number | undefined | null,
) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

const getMonthName = (
  month?: number,
) => {
  if (
    !month ||
    month < 1 ||
    month > 12
  ) {
    return "";
  }

  return new Date(
    2000,
    month - 1,
    1,
  ).toLocaleString("en-IN", {
    month: "long",
  });
};

const getPayrollPeriod = (
  payroll: PayrollRecord,
) => {
  if (payroll.period) {
    return payroll.period;
  }

  if (payroll.salaryMonth) {
    return payroll.salaryMonth;
  }

  if (
    payroll.month &&
    payroll.year
  ) {
    return `${getMonthName(
      payroll.month,
    )} ${payroll.year}`;
  }

  if (payroll.year) {
    return String(payroll.year);
  }

  if (payroll.createdAt) {
    return new Date(
      payroll.createdAt,
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  return "Salary Slip";
};

const getGrossSalary = (
  payroll: PayrollRecord,
) => {
  if (
    payroll.grossSalary !==
    undefined
  ) {
    return payroll.grossSalary;
  }

  if (payroll.gross !== undefined) {
    return payroll.gross;
  }

  return (
    Number(
      payroll.basicSalary ||
        payroll.basic ||
        0,
    ) +
    Number(payroll.hra || 0) +
    Number(
      payroll.allowances ||
        payroll.totalAllowances ||
        0,
    )
  );
};

const getDeductions = (
  payroll: PayrollRecord,
) => {
  return Number(
    payroll.deductions ||
      payroll.totalDeductions ||
      0,
  );
};

const getNetSalary = (
  payroll: PayrollRecord,
) => {
  if (
    payroll.netSalary !== undefined
  ) {
    return payroll.netSalary;
  }

  if (payroll.netPay !== undefined) {
    return payroll.netPay;
  }

  if (
    payroll.payableSalary !==
    undefined
  ) {
    return payroll.payableSalary;
  }

  return Math.max(
    0,
    getGrossSalary(payroll) -
      getDeductions(payroll),
  );
};

const getStatus = (
  payroll: PayrollRecord,
) => {
  return (
    payroll.paymentStatus ||
    payroll.status ||
    "processed"
  ).toLowerCase();
};

const extractPayrolls = (
  payload: unknown,
): PayrollRecord[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload !== "object") {
    return [];
  }

  const root = payload as any;

  const candidates = [
    root?.data?.items,
    root?.data?.payrolls,
    root?.data?.records,
    root?.data?.docs,
    root?.items,
    root?.payrolls,
    root?.records,
    root?.docs,
    root?.data?.data?.items,
    root?.data?.data?.payrolls,
    root?.data?.data?.records,
    root?.data?.data?.docs,
    root?.data?.data,
    root?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const getStatusClasses = (
  status: string,
) => {
  switch (status.toLowerCase()) {
    case "paid":
    case "processed":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "failed":
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const EmployeePayslips = () => {
  const { user } = useAuth();

  const [payrolls, setPayrolls] =
    useState<PayrollRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [yearFilter, setYearFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    selectedPayslip,
    setSelectedPayslip,
  ] =
    useState<PayslipDetails | null>(
      null,
    );

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 10;

  const employeeId = useMemo(() => {
    return getEmployeeId(
      user?.employee,
    );
  }, [user?.employee]);

  const employeeName = useMemo(() => {
    const linkedName =
      getEmployeeName(
        user?.employee,
      );

    if (linkedName) {
      return linkedName;
    }

    if (user?.name) {
      return user.name;
    }

    const fullName =
      `${user?.firstName || ""} ${
        user?.lastName || ""
      }`.trim();

    if (fullName) {
      return fullName;
    }

    return (
      user?.email?.split("@")[0] ||
      "Employee"
    );
  }, [user]);

  const loadPayrolls =
    useCallback(
      async (showRefresh = false) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          /*
           * The backend already identifies the
           * logged-in employee through req.user.employee.
           *
           * Therefore we must NOT send the human-readable
           * employeeId as ?employee=.
           */
          const response =
            await api.get(
              "/hr/payroll",
              {
                params: {
                  page: 1,
                  limit: 500,
                },
              },
            );

          const list =
            extractPayrolls(
              response.data,
            );

          /*
           * Do not filter again on the frontend.
           * The API returns the authenticated employee's payroll.
           */
          setPayrolls(
            Array.isArray(list)
              ? list.filter(
                  (
                    item,
                  ): item is PayrollRecord =>
                    Boolean(
                      item &&
                        item._id,
                    ),
                )
              : [],
          );

          setCurrentPage(1);
        } catch (err: any) {
          console.error(
            "Failed to load payroll:",
            err,
          );

          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Unable to load salary records. Please try again.",
          );

          setPayrolls([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  const availableYears =
    useMemo(() => {
      const years = payrolls
        .map((item) => {
          if (item.year) {
            return item.year;
          }

          if (item.salaryMonth) {
            const date = new Date(
              item.salaryMonth,
            );

            if (
              !Number.isNaN(
                date.getTime(),
              )
            ) {
              return date.getFullYear();
            }
          }

          if (item.createdAt) {
            const date = new Date(
              item.createdAt,
            );

            if (
              !Number.isNaN(
                date.getTime(),
              )
            ) {
              return date.getFullYear();
            }
          }

          return null;
        })
        .filter(
          (
            year,
          ): year is number =>
            Boolean(year),
        );

      return [
        ...new Set(years),
      ].sort(
        (a, b) => b - a,
      );
    }, [payrolls]);

  const filteredPayrolls =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return payrolls.filter(
        (payroll) => {
          const period =
            getPayrollPeriod(
              payroll,
            ).toLowerCase();

          const status =
            getStatus(payroll);

          const matchesSearch =
            !query ||
            period.includes(query) ||
            status.includes(query) ||
            String(
              payroll.year || "",
            ).includes(query);

          const year =
            payroll.year ||
            (payroll.createdAt
              ? new Date(
                  payroll.createdAt,
                ).getFullYear()
              : undefined);

          const matchesYear =
            yearFilter === "all" ||
            String(year) ===
              yearFilter;

          const matchesStatus =
            statusFilter === "all" ||
            status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesYear &&
            matchesStatus
          );
        },
      );
    }, [
      payrolls,
      search,
      yearFilter,
      statusFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPayrolls.length /
        itemsPerPage,
    ),
  );

  const paginatedPayrolls =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        itemsPerPage;

      return filteredPayrolls.slice(
        start,
        start + itemsPerPage,
      );
    }, [
      filteredPayrolls,
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

  const summary = useMemo(() => {
    const totalPaid =
      payrolls.reduce(
        (sum, payroll) =>
          sum +
          Number(
            getNetSalary(
              payroll,
            ) || 0,
          ),
        0,
      );

    const current = payrolls[0];

    return {
      totalRecords:
        payrolls.length,

      totalPaid,

      latestSalary: current
        ? getNetSalary(current)
        : 0,

      latestPeriod: current
        ? getPayrollPeriod(current)
        : "-",
    };
  }, [payrolls]);

  const clearFilters = () => {
    setSearch("");
    setYearFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const openPayslip = (
    payroll: PayrollRecord,
  ) => {
    setSelectedPayslip({
      payroll,
      employeeName,
      employeeId,
    });
  };

  const downloadPayslip = (
    payroll: PayrollRecord,
  ) => {
    const gross =
      getGrossSalary(payroll);

    const deductions =
      getDeductions(payroll);

    const net =
      getNetSalary(payroll);

    const printWindow =
      window.open(
        "",
        "_blank",
      );

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${getPayrollPeriod(
          payroll,
        )}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #111827;
          }

          .header {
            border-bottom: 2px solid #FE0000;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }

          h1 {
            margin: 0 0 5px;
            color: #FE0000;
          }

          .muted {
            color: #6b7280;
          }

          .employee {
            margin-bottom: 25px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th,
          td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
          }

          th {
            background: #f3f4f6;
          }

          .net {
            font-size: 18px;
            font-weight: bold;
          }

          .footer {
            margin-top: 50px;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>

      <body>
        <div class="header">
          <h1>Sellopedia</h1>
          <div class="muted">
            Salary Payslip
          </div>
        </div>

        <div class="employee">
          <strong>Employee:</strong>
          ${employeeName}
          <br />

          <strong>Employee ID:</strong>
          ${employeeId || "-"}
          <br />

          <strong>Salary Period:</strong>
          ${getPayrollPeriod(payroll)}
        </div>

        <table>
          <tr>
            <th>Earnings</th>
            <th>Amount</th>
          </tr>

          <tr>
            <td>Basic Salary</td>
            <td>
              ${formatCurrency(
                payroll.basicSalary ??
                  payroll.basic,
              )}
            </td>
          </tr>

          <tr>
            <td>HRA</td>
            <td>
              ${formatCurrency(
                payroll.hra,
              )}
            </td>
          </tr>

          <tr>
            <td>Allowances</td>
            <td>
              ${formatCurrency(
                payroll.allowances ??
                  payroll.totalAllowances,
              )}
            </td>
          </tr>

          <tr>
            <td>Gross Salary</td>
            <td>
              ${formatCurrency(gross)}
            </td>
          </tr>
        </table>

        <table>
          <tr>
            <th>Deductions</th>
            <th>Amount</th>
          </tr>

          <tr>
            <td>Total Deductions</td>
            <td>
              ${formatCurrency(
                deductions,
              )}
            </td>
          </tr>

          <tr class="net">
            <td>Net Salary</td>
            <td>
              ${formatCurrency(net)}
            </td>
          </tr>
        </table>

        <div class="footer">
          Generated from Sellopedia HRMS.
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

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
              <WalletCards size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Payslips
              </h1>

              <p className="text-sm text-slate-500">
                View your salary history
                and payslips
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadPayrolls(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000] disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Salary Records */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-red-50 p-2.5 text-[#FE0000]">
                <FileText size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Salary Records
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.totalRecords}
            </p>
          </div>

          {/* Total Net Salary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <IndianRupee size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Total Net Salary
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(
                summary.totalPaid,
              )}
            </p>
          </div>

          {/* Latest Net Salary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <WalletCards size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Latest Net Salary
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(
                summary.latestSalary,
              )}
            </p>
          </div>

          {/* Latest Period */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-red-50 p-2.5 text-[#FE0000]">
                <CalendarDays size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Latest Period
            </p>

            <p className="mt-1 truncate text-lg font-bold text-slate-900">
              {summary.latestPeriod}
            </p>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

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
                  setSearch(
                    event.target.value,
                  );
                  setCurrentPage(1);
                }}
                placeholder="Search salary period..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(
                  event.target.value,
                );
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            >
              <option value="all">
                All Years
              </option>

              {availableYears.map(
                (year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ),
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value,
                );
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            >
              <option value="all">
                All Status
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="processed">
                Processed
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="processing">
                Processing
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>

            {(search ||
              yearFilter !==
                "all" ||
              statusFilter !==
                "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2
                className="animate-spin text-[#FE0000]"
                size={28}
              />

              <span className="text-sm">
                Loading salary records...
              </span>
            </div>
          </div>
        ) : paginatedPayrolls.length ===
          0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center">
            <div className="mb-4 rounded-2xl bg-red-50 p-4 text-[#FE0000]">
              <WalletCards size={32} />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              No payslips found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Your processed salary
              records will appear here
              once payroll has been
              generated.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Salary Period
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Working Days
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Gross
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Deductions
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Net Salary
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedPayrolls.map(
                      (payroll) => {
                        const status =
                          getStatus(
                            payroll,
                          );

                        return (
                          <tr
                            key={
                              payroll._id
                            }
                            className="transition hover:bg-red-50/30"
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">
                                {getPayrollPeriod(
                                  payroll,
                                )}
                              </div>

                              {payroll.paymentDate ||
                              payroll.paidAt ? (
                                <div className="mt-1 text-xs text-slate-500">
                                  Paid:{" "}
                                  {formatDate(
                                    payroll.paymentDate ||
                                      payroll.paidAt,
                                  )}
                                </div>
                              ) : null}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {payroll.workingDays ??
                                payroll.paidDays ??
                                "-"}
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-slate-700">
                              {formatCurrency(
                                getGrossSalary(
                                  payroll,
                                ),
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-red-600">
                              {formatCurrency(
                                getDeductions(
                                  payroll,
                                ),
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-emerald-700">
                              {formatCurrency(
                                getNetSalary(
                                  payroll,
                                ),
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                                  status,
                                )}`}
                              >
                                {status.replace(
                                  /_/g,
                                  " ",
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPayslip(
                                      payroll,
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
                                  title="View payslip"
                                >
                                  <FileText
                                    size={17}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadPayslip(
                                      payroll,
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
                                  title="Download payslip"
                                >
                                  <Download
                                    size={17}
                                  />
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
            </div>

            {/* =================================================
                MOBILE / TABLET CARDS
            ================================================= */}

            <div className="grid gap-4 lg:hidden">
              {paginatedPayrolls.map(
                (payroll) => {
                  const status =
                    getStatus(
                      payroll,
                    );

                  return (
                    <div
                      key={
                        payroll._id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-xl bg-red-50 p-2 text-[#FE0000]">
                              <WalletCards
                                size={18}
                              />
                            </div>

                            <h3 className="font-semibold text-slate-900">
                              {getPayrollPeriod(
                                payroll,
                              )}
                            </h3>
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {payroll.paymentDate ||
                            payroll.paidAt
                              ? `Paid on ${formatDate(
                                  payroll.paymentDate ||
                                    payroll.paidAt,
                                )}`
                              : "Salary record"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                            status,
                          )}`}
                        >
                          {status.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Gross
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {formatCurrency(
                              getGrossSalary(
                                payroll,
                              ),
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Deductions
                          </p>

                          <p className="mt-1 font-semibold text-red-600">
                            {formatCurrency(
                              getDeductions(
                                payroll,
                              ),
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-600">
                            Net Salary
                          </p>

                          <p className="mt-1 font-bold text-emerald-700">
                            {formatCurrency(
                              getNetSalary(
                                payroll,
                              ),
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Working Days
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {payroll.workingDays ??
                              payroll.paidDays ??
                              "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openPayslip(
                              payroll,
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
                        >
                          <FileText
                            size={16}
                          />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            downloadPayslip(
                              payroll,
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                        >
                          <Download
                            size={16}
                          />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {filteredPayrolls.length ===
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
                    filteredPayrolls.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {
                    filteredPayrolls.length
                  }
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    currentPage <= 1
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
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={18}
                  />
                </button>

                <span className="min-w-20 text-center text-sm font-medium text-slate-700">
                  Page{" "}
                  {currentPage} /{" "}
                  {totalPages}
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
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000] disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* =================================================
          PAYSLIP MODAL
      ================================================= */}

      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 p-1.5">
                  <img
                    src="/logo.png"
                    alt="Sellopedia"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Salary Payslip
                  </h2>

                  <p className="text-sm text-slate-500">
                    {getPayrollPeriod(
                      selectedPayslip.payroll,
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayslip(
                    null,
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">

              {/* Employee Information */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Employee
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedPayslip.employeeName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Employee ID
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedPayslip.employeeId ||
                        "-"
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Salary Period
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {getPayrollPeriod(
                        selectedPayslip.payroll,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Payment Status
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                        getStatus(
                          selectedPayslip.payroll,
                        ),
                      )}`}
                    >
                      {getStatus(
                        selectedPayslip.payroll,
                      ).replace(
                        /_/g,
                        " ",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Attendance Summary
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Working Days
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedPayslip
                          .payroll
                          .workingDays ??
                        "-"
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Present Days
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedPayslip
                          .payroll
                          .presentDays ??
                        "-"
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Paid Days
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedPayslip
                          .payroll
                          .paidDays ??
                        "-"
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Leave Days
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedPayslip
                          .payroll
                          .leaveDays ??
                        "-"
                      }
                    </p>
                  </div>

                </div>
              </div>

              {/* Salary Details */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Salary Details
                </h3>

                <div className="overflow-hidden rounded-xl border border-slate-200">

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm text-slate-600">
                      Basic Salary
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip
                          .payroll
                          .basicSalary ??
                          selectedPayslip
                            .payroll
                            .basic,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm text-slate-600">
                      HRA
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip
                          .payroll
                          .hra,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm text-slate-600">
                      Allowances
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip
                          .payroll
                          .allowances ??
                          selectedPayslip
                            .payroll
                            .totalAllowances,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Gross Salary
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatCurrency(
                        getGrossSalary(
                          selectedPayslip.payroll,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm text-slate-600">
                      Total Deductions
                    </span>

                    <span className="font-medium text-red-600">
                      -{" "}
                      {formatCurrency(
                        getDeductions(
                          selectedPayslip.payroll,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-red-50 px-4 py-4">
                    <span className="font-bold text-red-800">
                      Net Salary
                    </span>

                    <span className="text-xl font-bold text-[#FE0000]">
                      {formatCurrency(
                        getNetSalary(
                          selectedPayslip.payroll,
                        ),
                      )}
                    </span>
                  </div>

                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPayslip(
                      null,
                    )
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadPayslip(
                      selectedPayslip.payroll,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Download size={17} />
                  Download / Print
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayslips;