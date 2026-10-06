import { useEffect, useMemo, useState } from "react";
import api  from "../../lib/axios";

interface Employee {
  _id: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;

  department?: {
    _id?: string;
    name?: string;
  } | string;

  [key: string]: any;
}

interface SalaryStructure {
  _id: string;

  employee:
    | string
    | Employee
    | {
        _id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        employeeId?: string;
      };

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

  deductions?: number;
  netSalary?: number;
  monthlySalary?: number;
  ctc?: number;

  effectiveFrom?: string;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

interface FormData {
  employee: string;
  effectiveFrom: string;

  basic: string;
  hra: string;
  conveyance: string;
  specialAllowance: string;
  otherAllowances: string;

  pf: string;
  esi: string;
  professionalTax: string;
  tds: string;
  otherDeductions: string;

  ctc: string;
}

const getToday = () =>
  new Date().toISOString().split("T")[0];

const emptyForm: FormData = {
  employee: "",
  effectiveFrom: getToday(),

  basic: "",
  hra: "",
  conveyance: "",
  specialAllowance: "",
  otherAllowances: "",

  pf: "",
  esi: "",
  professionalTax: "",
  tds: "",
  otherDeductions: "",

  ctc: "",
};

const toNumber = (
  value: string | number | null | undefined
) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const getEmployeeName = (
  employee?: Employee | null
) => {
  if (!employee) return "Unknown Employee";

  if (employee.name) {
    return employee.name;
  }

  const fullName = [
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || employee.email || "Unnamed Employee";
};

const getEmployeeId = (
  employee?: Employee | null
) => {
  if (!employee) return "";

  return (
    employee.employeeId ||
    employee.empId ||
    employee.employeeCode ||
    ""
  );
};

/**
 * Extract array from different backend response structures.
 *
 * Supports:
 *
 * []
 * { data: [] }
 * { employees: [] }
 * { data: { employees: [] } }
 * { data: { data: [] } }
 * { results: [] }
 */
const extractArray = (
 response: any,
  possibleKeys: string[] = []
): any[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  for (const key of possibleKeys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (response.data) {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (
      typeof response.data === "object"
    ) {
      for (const key of possibleKeys) {
        if (
          Array.isArray(response.data[key])
        ) {
          return response.data[key];
        }
      }

      if (
        Array.isArray(response.data.data)
      ) {
        return response.data.data;
      }

      if (
        Array.isArray(response.data.results)
      ) {
        return response.data.results;
      }
    }
  }

  if (Array.isArray(response.results)) {
    return response.results;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  return [];
};

export default function SalaryStructures() {
  const [employees, setEmployees] = useState<Employee[]>(
    []
  );

  const [salaryStructures, setSalaryStructures] =
    useState<SalaryStructure[]>([]);

  const [form, setForm] =
    useState<FormData>(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [employeeSearch, setEmployeeSearch] =
    useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // LOAD EMPLOYEES + SALARY STRUCTURES
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeeResponse,
        salaryResponse,
      ] = await Promise.all([
        api.get("/hr/employees"),
        api.get("/hr/salary-structures"),
      ]);

      console.log(
        "EMPLOYEE API:",
        employeeResponse.data
      );

      console.log(
        "SALARY STRUCTURE API:",
        salaryResponse.data
      );

      const employeeData = extractArray(
        employeeResponse.data,
        [
          "employees",
          "data",
          "results",
          "items",
        ]
      );

      const salaryData = extractArray(
        salaryResponse.data,
        [
          "salaryStructures",
          "structures",
          "data",
          "results",
          "items",
        ]
      );

      console.log(
        "EXTRACTED EMPLOYEES:",
        employeeData
      );

      console.log(
        "EXTRACTED SALARY STRUCTURES:",
        salaryData
      );

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : []
      );

      setSalaryStructures(
        Array.isArray(salaryData)
          ? salaryData
          : []
      );

      if (employeeData.length === 0) {
        console.warn(
          "No employees were returned by /hr/employees"
        );
      }
    } catch (err: any) {
      console.error(
        "Salary structure load error:",
        err
      );

      console.error(
        "API error:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load employees and salary structures."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const calculations = useMemo(() => {
    const basic = toNumber(form.basic);

    const hra = toNumber(form.hra);

    const conveyance =
      toNumber(form.conveyance);

    const specialAllowance =
      toNumber(form.specialAllowance);

    const otherAllowances =
      toNumber(form.otherAllowances);

    const pf = toNumber(form.pf);

    const esi = toNumber(form.esi);

    const professionalTax =
      toNumber(form.professionalTax);

    const tds = toNumber(form.tds);

    const otherDeductions =
      toNumber(form.otherDeductions);

    const gross =
      basic +
      hra +
      conveyance +
      specialAllowance +
      otherAllowances;

    const totalDeductions =
      pf +
      esi +
      professionalTax +
      tds +
      otherDeductions;

    const netSalary =
      gross - totalDeductions;

    const ctc = toNumber(form.ctc);

    return {
      basic,
      hra,
      conveyance,
      specialAllowance,
      otherAllowances,

      gross,
      totalDeductions,
      netSalary,

      pf,
      esi,
      professionalTax,
      tds,
      otherDeductions,

      ctc,
    };
  }, [form]);

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const currency = (
    value: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  };

  // =========================================================
  // UPDATE FORM
  // =========================================================

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // CREATE FORM
  // =========================================================

  const openCreate = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      effectiveFrom: getToday(),
    });

    setSelectedEmployee(null);

    setEmployeeSearch("");

    setError("");

    setSuccess("");

    setShowForm(true);
  };

  // =========================================================
  // EDIT
  // =========================================================

  const openEdit = (
    salary: SalaryStructure
  ) => {
    const employeeId =
      typeof salary.employee === "string"
        ? salary.employee
        : salary.employee?._id || "";

    const employee =
      employees.find(
        (item) =>
          item._id === employeeId
      ) ||
      (typeof salary.employee ===
      "object"
        ? salary.employee
        : null);

    setEditingId(salary._id);

    setSelectedEmployee(
      employee as Employee | null
    );

    setEmployeeSearch(
      employee
        ? getEmployeeName(
            employee as Employee
          )
        : ""
    );

    setForm({
      employee: employeeId,

      effectiveFrom:
        salary.effectiveFrom
          ? new Date(
              salary.effectiveFrom
            )
              .toISOString()
              .split("T")[0]
          : getToday(),

      basic: String(
        salary.basic || ""
      ),

      hra: String(
        salary.hra || ""
      ),

      conveyance: String(
        salary.conveyance || ""
      ),

      specialAllowance: String(
        salary.specialAllowance ||
          ""
      ),

      otherAllowances: String(
        salary.otherAllowances ||
          ""
      ),

      pf: String(
        salary.pf || ""
      ),

      esi: String(
        salary.esi || ""
      ),

      professionalTax: String(
        salary.professionalTax ||
          ""
      ),

      tds: String(
        salary.tds || ""
      ),

      otherDeductions: String(
        salary.otherDeductions ||
          ""
      ),

      ctc: String(
        salary.ctc || ""
      ),
    });

    setError("");

    setSuccess("");

    setShowForm(true);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    if (!form.employee) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (!form.effectiveFrom) {
      setError(
        "Please select the effective date."
      );
      return;
    }

    if (calculations.gross <= 0) {
      setError(
        "Gross salary must be greater than ₹0."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        employee: form.employee,

        effectiveFrom:
          form.effectiveFrom,

        basic:
          calculations.basic,

        hra:
          calculations.hra,

        conveyance:
          calculations.conveyance,

        specialAllowance:
          calculations.specialAllowance,

        otherAllowances:
          calculations.otherAllowances,

        gross:
          calculations.gross,

        monthlySalary:
          calculations.gross,

        pf:
          calculations.pf,

        esi:
          calculations.esi,

        professionalTax:
          calculations.professionalTax,

        tds:
          calculations.tds,

        otherDeductions:
          calculations.otherDeductions,

        deductions:
          calculations.totalDeductions,

        netSalary:
          calculations.netSalary,

        ctc:
          calculations.ctc,

        isActive: true,
      };

      console.log(
        "SALARY STRUCTURE PAYLOAD:",
        payload
      );

      if (editingId) {
        await api.put(
          `/hr/salary-structures/${editingId}`,
          payload
        );

        setSuccess(
          "Salary structure updated successfully."
        );
      } else {
        await api.post(
          "/hr/salary-structures",
          payload
        );

        setSuccess(
          "Salary structure created successfully."
        );
      }

      await loadData();

      setShowForm(false);

      setEditingId(null);

      setForm({
        ...emptyForm,
        effectiveFrom: getToday(),
      });

      setSelectedEmployee(null);
    } catch (err: any) {
      console.error(
        "Save salary structure error:",
        err
      );

      console.error(
        "Server response:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save salary structure."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this salary structure?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/hr/salary-structures/${id}`
      );

      setSuccess(
        "Salary structure deleted successfully."
      );

      await loadData();
    } catch (err: any) {
      console.error(
        "Delete salary structure error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to delete salary structure."
      );
    }
  };

  // =========================================================
  // FILTER SALARY STRUCTURES
  // =========================================================

  const filteredStructures =
    salaryStructures.filter(
      (salary) => {
        let employee:
          | Employee
          | undefined;

        if (
          salary.employee &&
          typeof salary.employee ===
            "object"
        ) {
          employee =
            salary.employee as Employee;
        } else {
          employee =
            employees.find(
              (item) =>
                item._id ===
                salary.employee
            );
        }

        const name =
          getEmployeeName(employee);

        const employeeCode =
          getEmployeeId(employee);

        const query =
          search.toLowerCase().trim();

        if (!query) {
          return true;
        }

        return (
          name
            .toLowerCase()
            .includes(query) ||
          employeeCode
            .toLowerCase()
            .includes(query)
        );
      }
    );

  // =========================================================
  // EMPLOYEE SEARCH
  // =========================================================

  const filteredEmployees =
    employees.filter(
      (employee) => {
        const query =
          employeeSearch
            .toLowerCase()
            .trim();

        if (!query) {
          return true;
        }

        const name =
          getEmployeeName(employee)
            .toLowerCase();

        const employeeId =
          getEmployeeId(employee)
            .toLowerCase();

        const email =
          String(
            employee.email || ""
          ).toLowerCase();

        return (
          name.includes(query) ||
          employeeId.includes(query) ||
          email.includes(query)
        );
      }
    );

  // =========================================================
  // GET EMPLOYEE FROM SALARY
  // =========================================================

  const findEmployee = (
    salary: SalaryStructure
  ) => {
    if (
      salary.employee &&
      typeof salary.employee ===
        "object"
    ) {
      return salary.employee as Employee;
    }

    return employees.find(
      (employee) =>
        employee._id ===
        salary.employee
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-9 w-auto object-contain"
              />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Salary Structures
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure employee salary,
              allowances, deductions and CTC.
            </p>

          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-[#FE0000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            + Add Salary Structure
          </button>

        </div>

        {/* ==================================================
            ALERTS
        ================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold"
            >
              ×
            </button>

          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="font-bold"
            >
              ×
            </button>

          </div>
        )}

        {/* ==================================================
            STATS
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <StatCard
            title="Total Structures"
            value={
              salaryStructures.length
            }
          />

          <StatCard
            title="Active Structures"
            value={
              salaryStructures.filter(
                (item) =>
                  item.isActive !== false
              ).length
            }
          />

          <StatCard
            title="Employees"
            value={
              employees.length
            }
          />

        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee or employee ID..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            />

          </div>

        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#FE0000]" />

              <p className="text-sm text-slate-500">
                Loading employees and salary
                structures...
              </p>

            </div>
          ) : filteredStructures.length ===
            0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
                ₹
              </div>

              <h3 className="font-semibold text-slate-900">
                No salary structures found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a salary structure for
                an employee to start payroll.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                + Add Salary Structure
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <TableHeader>
                      Employee
                    </TableHeader>

                    <TableHeader align="right">
                      Monthly Salary
                    </TableHeader>

                    <TableHeader align="right">
                      Gross
                    </TableHeader>

                    <TableHeader align="right">
                      Deductions
                    </TableHeader>

                    <TableHeader align="right">
                      Net Salary
                    </TableHeader>

                    <TableHeader>
                      Effective From
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader align="right">
                      Actions
                    </TableHeader>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStructures.map(
                    (salary) => {
                      const employee =
                        findEmployee(
                          salary
                        );

                      return (
                        <tr
                          key={
                            salary._id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          <td className="px-5 py-4">

                            <div className="font-semibold text-slate-900">
                              {getEmployeeName(
                                employee
                              )}
                            </div>

                            {getEmployeeId(
                              employee
                            ) && (
                              <div className="mt-1 text-xs text-slate-500">
                                {
                                  getEmployeeId(
                                    employee
                                  )
                                }
                              </div>
                            )}

                          </td>

                          <td className="px-5 py-4 text-right font-medium text-slate-900">
                            {currency(
                              toNumber(
                                salary.monthlySalary ||
                                  salary.gross
                              )
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-slate-700">
                            {currency(
                              toNumber(
                                salary.gross
                              )
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-red-600">
                            {currency(
                              toNumber(
                                salary.deductions
                              )
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-green-600">
                            {currency(
                              toNumber(
                                salary.netSalary
                              )
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {salary.effectiveFrom
                              ? new Date(
                                  salary.effectiveFrom
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "-"}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                salary.isActive ===
                                false
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {salary.isActive ===
                              false
                                ? "Inactive"
                                : "Active"}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    salary
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    salary._id
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* ====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 md:p-6">

          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-6">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingId
                    ? "Edit Salary Structure"
                    : "Add Salary Structure"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set salary components for the
                  employee.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            {/* Modal Body */}

            <div className="overflow-y-auto">

              <form
                onSubmit={handleSubmit}
                className="p-5 md:p-6"
              >

                {/* ==================================================
                    EMPLOYEE
                ================================================== */}

                <SectionTitle>
                  Employee Information
                </SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div className="relative">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Employee *
                    </label>

                    {/* Selected employee */}

                    {selectedEmployee ? (
                      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FE0000] text-sm font-bold text-white">
                          {getEmployeeName(
                            selectedEmployee
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-semibold text-red-900">
                            {getEmployeeName(
                              selectedEmployee
                            )}
                          </p>

                          <p className="truncate text-xs text-[#FE0000]">
                            {getEmployeeId(
                              selectedEmployee
                            ) ||
                              selectedEmployee.email ||
                              "Employee"}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(
                              null
                            );

                            setForm(
                              (previous) => ({
                                ...previous,
                                employee:
                                  "",
                              })
                            );

                            setEmployeeSearch(
                              ""
                            );
                          }}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Change
                        </button>

                      </div>
                    ) : (
                      <>
                        <div className="relative">

                          <input
                            type="text"
                            value={
                              employeeSearch
                            }
                            onChange={(
                              event
                            ) =>
                              setEmployeeSearch(
                                event.target
                                  .value
                              )
                            }
                            placeholder="Search employee..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                          />

                        </div>

                        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">

                          {employees.length ===
                          0 ? (
                            <div className="p-4 text-center">

                              <p className="text-sm font-medium text-red-600">
                                No employees
                                loaded
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Check the
                                employee API
                                connection.
                              </p>

                              <button
                                type="button"
                                onClick={
                                  loadData
                                }
                                className="mt-3 rounded-lg bg-[#FE0000] px-3 py-2 text-xs font-semibold text-white"
                              >
                                Reload
                              </button>

                            </div>
                          ) : filteredEmployees.length ===
                            0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                              No matching
                              employees.
                            </div>
                          ) : (
                            filteredEmployees.map(
                              (
                                employee
                              ) => (
                                <button
                                  type="button"
                                  key={
                                    employee._id
                                  }
                                  onClick={() => {
                                    setSelectedEmployee(
                                      employee
                                    );

                                    setForm(
                                      (
                                        previous
                                      ) => ({
                                        ...previous,
                                        employee:
                                          employee._id,
                                      })
                                    );

                                    setEmployeeSearch(
                                      getEmployeeName(
                                        employee
                                      )
                                    );
                                  }}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-red-50"
                                >

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                    {getEmployeeName(
                                      employee
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {getEmployeeName(
                                        employee
                                      )}
                                    </p>

                                    <p className="truncate text-xs text-slate-500">
                                      {getEmployeeId(
                                        employee
                                      ) ||
                                        employee.email ||
                                        "Employee"}
                                    </p>

                                  </div>

                                </button>
                              )
                            )
                          )}

                        </div>
                      </>
                    )}

                    {/* Hidden required field */}

                    <input
                      type="hidden"
                      value={
                        form.employee
                      }
                      required
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Effective From *
                    </label>

                    <input
                      type="date"
                      value={
                        form.effectiveFrom
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "effectiveFrom",
                          event.target
                            .value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                    />

                  </div>

                </div>

                {/* ==================================================
                    EARNINGS
                ================================================== */}

                <div className="mt-8">

                  <SectionTitle>
                    Earnings & Allowances
                  </SectionTitle>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    <SalaryInput
                      label="Basic Salary"
                      value={
                        form.basic
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "basic",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="HRA"
                      value={
                        form.hra
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "hra",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="Conveyance"
                      value={
                        form.conveyance
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "conveyance",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="Special Allowance"
                      value={
                        form.specialAllowance
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "specialAllowance",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="Other Allowances"
                      value={
                        form.otherAllowances
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "otherAllowances",
                          value
                        )
                      }
                    />

                  </div>

                </div>

                {/* ==================================================
                    DEDUCTIONS
                ================================================== */}

                <div className="mt-8">

                  <SectionTitle>
                    Deductions
                  </SectionTitle>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    <SalaryInput
                      label="PF"
                      value={
                        form.pf
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "pf",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="ESI"
                      value={
                        form.esi
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "esi",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="Professional Tax"
                      value={
                        form.professionalTax
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "professionalTax",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="TDS"
                      value={
                        form.tds
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "tds",
                          value
                        )
                      }
                    />

                    <SalaryInput
                      label="Other Deductions"
                      value={
                        form.otherDeductions
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "otherDeductions",
                          value
                        )
                      }
                    />

                  </div>

                </div>

                {/* ==================================================
                    CTC
                ================================================== */}

                <div className="mt-8">

                  <SectionTitle>
                    Annual CTC
                  </SectionTitle>

                  <div className="max-w-md">

                    <SalaryInput
                      label="Annual CTC"
                      value={
                        form.ctc
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "ctc",
                          value
                        )
                      }
                    />

                  </div>

                </div>

                {/* ==================================================
                    SUMMARY
                ================================================== */}

                <div className="mt-8">

                  <SectionTitle>
                    Salary Summary
                  </SectionTitle>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <SummaryCard
                      title="Gross Salary"
                      value={currency(
                        calculations.gross
                      )}
                    />

                    <SummaryCard
                      title="Total Deductions"
                      value={currency(
                        calculations.totalDeductions
                      )}
                    />

                    <SummaryCard
                      title="Net Salary"
                      value={currency(
                        calculations.netSalary
                      )}
                      green
                    />

                    <SummaryCard
                      title="Annual CTC"
                      value={currency(
                        calculations.ctc
                      )}
                      indigo
                    />

                  </div>

                </div>

                {/* ==================================================
                    BREAKDOWN
                ================================================== */}

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                  <div className="grid grid-cols-2 gap-5 md:grid-cols-4">

                    <Breakdown
                      title="Basic"
                      value={
                        calculations.basic
                      }
                    />

                    <Breakdown
                      title="Allowances"
                      value={
                        calculations.gross -
                        calculations.basic
                      }
                    />

                    <Breakdown
                      title="Deductions"
                      value={
                        calculations.totalDeductions
                      }
                      negative
                    />

                    <Breakdown
                      title="Take Home"
                      value={
                        calculations.netSalary
                      }
                      positive
                    />

                  </div>

                </div>

                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() =>
                      setShowForm(false)
                    }
                    className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !form.employee
                    }
                    className="rounded-xl bg-[#FE0000] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Salary Structure"
                      : "Create Salary Structure"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-4 text-${align} text-xs font-semibold uppercase tracking-wider text-slate-500`}
    >
      {children}
    </th>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
      {children}
    </h3>
  );
}

// ============================================================
// SALARY INPUT
// ============================================================

function SalaryInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">

        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="0"
          className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
        />

      </div>

    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  green = false,
  indigo = false,
}: {
  title: string;
  value: string;
  green?: boolean;
  indigo?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        green
          ? "border-green-200 bg-green-50"
          : indigo
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >

      <p
        className={`text-xs font-semibold uppercase tracking-wider ${
          green
            ? "text-green-600"
            : indigo
            ? "text-[#FE0000]"
            : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          green
            ? "text-green-700"
            : indigo
            ? "text-red-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

// ============================================================
// BREAKDOWN
// ============================================================

function Breakdown({
  title,
  value,
  negative = false,
  positive = false,
}: {
  title: string;
  value: number;
  negative?: boolean;
  positive?: boolean;
}) {
  return (
    <div>

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p
        className={`mt-1 font-semibold ${
          negative
            ? "text-red-600"
            : positive
            ? "text-green-600"
            : "text-slate-800"
        }`}
      >
        ₹
        {Math.round(
          value || 0
        ).toLocaleString("en-IN")}
      </p>

    </div>
  );
}