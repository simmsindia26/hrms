import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/axios";

type EmployeeStatus =
  | "active"
  | "inactive"
  | "on_leave"
  | "terminated";

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
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;

  department?: Department | string | null;
  designation?: Designation | string | null;

  joiningDate?: string;
  employmentType?: string;
  status?: EmployeeStatus;

  profilePhoto?: string;

  salary?: {
    basic?: number;
    gross?: number;
  };

  createdAt?: string;
  updatedAt?: string;
}

interface RecruitmentCandidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status?:
    | "applied"
    | "screening"
    | "interview"
    | "selected"
    | "rejected"
    | "joined"
    | "withdrawn";
  offerStatus?:
    | "not_generated"
    | "sent"
    | "accepted"
    | "declined";
  joiningDate?: string;
  employee?: string | { _id: string } | null;
  jobOpening?: {
    _id?: string;
    title?: string;
    department?: Department | string | null;
    designation?: Designation | string | null;
  } | null;
}

interface EmployeeForm {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  employmentType: string;
  status: EmployeeStatus;
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

function getEmployeeName(employee: Employee) {
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Unnamed Employee";
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

function formatStatus(status?: EmployeeStatus) {
  if (!status) return "Active";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClasses(status?: EmployeeStatus) {
  switch (status) {
    case "inactive":
      return "bg-gray-100 text-gray-700";

    case "on_leave":
      return "bg-amber-50 text-amber-700";

    case "terminated":
      return "bg-red-50 text-red-700";

    case "active":
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Employees() {
  const navigate = useNavigate();
  const location = useLocation();

  const recruitmentCandidate =
    (
      location.state as {
        candidate?: RecruitmentCandidate;
      } | null
    )?.candidate || null;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [saving, setSaving] = useState(false);

  /*
   * Candidate coming from Recruitment.
   * This candidate is displayed directly inside
   * the Add Employee form.
   */
  const [conversionCandidate, setConversionCandidate] =
    useState<RecruitmentCandidate | null>(
      recruitmentCandidate
    );

  const [form, setForm] = useState<EmployeeForm>({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    joiningDate: "",
    employmentType: "full_time",
    status: "active",
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    loadEmployees();
    loadMasterData();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/hr/employees");

      const data = response.data?.data;

      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (Array.isArray(data?.items)) {
        setEmployees(data.items);
      } else if (Array.isArray(response.data?.employees)) {
        setEmployees(response.data.employees);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);

      setError(
        "Unable to load employees. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMasterData() {
    try {
      const [departmentResponse, designationResponse] =
        await Promise.all([
          api.get("/hr/departments"),
          api.get("/hr/designations"),
        ]);

      const departmentData =
        departmentResponse.data?.data;

      const designationData =
        designationResponse.data?.data;

      setDepartments(
        Array.isArray(departmentData)
          ? departmentData
          : Array.isArray(departmentData?.items)
            ? departmentData.items
            : []
      );

      setDesignations(
        Array.isArray(designationData)
          ? designationData
          : Array.isArray(designationData?.items)
            ? designationData.items
            : []
      );
    } catch (err) {
      console.error(
        "Failed to load departments/designations:",
        err
      );
    }
  }

  /*
   * Resolve a department/designation coming from Recruitment
   * into the master-data ID expected by the employee API.
   */
  function resolveMasterId(
    value:
      | Department
      | Designation
      | string
      | null
      | undefined,
    items: Array<Department | Designation>
  ) {
    if (!value) {
      return "";
    }

    if (typeof value !== "string") {
      return value._id || "";
    }

    const exact = items.find(
      (item) => item._id === value
    );

    if (exact) {
      return exact._id;
    }

    const byName = items.find(
      (item) =>
        item.name?.toLowerCase() ===
        value.toLowerCase()
    );

    return byName?._id || "";
  }

  function prefillFromCandidate(
    candidate: RecruitmentCandidate
  ) {
    const parts = candidate.name
      .trim()
      .split(/\\s+/)
      .filter(Boolean);

    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");

    setEditingEmployee(null);
    setConversionCandidate(candidate);

    setForm({
      employeeId: "",
      firstName,
      lastName,
      email: candidate.email || "",
      phone: candidate.phone || "",
      department: resolveMasterId(
        candidate.jobOpening?.department,
        departments
      ),
      designation: resolveMasterId(
        candidate.jobOpening?.designation,
        designations
      ),
      joiningDate: candidate.joiningDate
        ? candidate.joiningDate.substring(0, 10)
        : new Date().toISOString().substring(0, 10),
      employmentType: "full_time",
      status: "active",
    });

    setShowForm(true);
  }

  /*
   * Recruitment navigates here with:
   * navigate("/hr/employees", { state: { candidate } })
   */
  useEffect(() => {
    if (!recruitmentCandidate) {
      return;
    }

    /*
     * If the candidate is already linked to an employee,
     * don't create a duplicate employee.
     */
    const existingEmployeeId =
      typeof recruitmentCandidate.employee === "string"
        ? recruitmentCandidate.employee
        : recruitmentCandidate.employee?._id;

    if (existingEmployeeId) {
      setError(
        "This recruitment candidate is already linked to an employee."
      );
      return;
    }

    if (
      departments.length === 0 &&
      designations.length === 0
    ) {
      return;
    }

    prefillFromCandidate(recruitmentCandidate);
  }, [
    recruitmentCandidate,
    departments,
    designations,
  ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {

      const matchesSearch =
        !query ||
        getEmployeeName(employee)
          .toLowerCase()
          .includes(query) ||
        employee.employeeId
          ?.toLowerCase()
          .includes(query) ||
        employee.email
          ?.toLowerCase()
          .includes(query) ||
        employee.phone
          ?.toLowerCase()
          .includes(query);

      const matchesDepartment =
        !departmentFilter ||
        getId(employee.department) ===
          departmentFilter;

      const matchesDesignation =
        !designationFilter ||
        getId(employee.designation) ===
          designationFilter;

      const matchesStatus =
        !statusFilter ||
        employee.status === statusFilter;

      const matchesEmployment =
        !employmentFilter ||
        employee.employmentType ===
          employmentFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesStatus &&
        matchesEmployment
      );
    });
  }, [
    employees,
    search,
    departmentFilter,
    designationFilter,
    statusFilter,
    employmentFilter,
  ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEmployees.length / pageSize
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedEmployees =
    filteredEmployees.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    departmentFilter,
    designationFilter,
    statusFilter,
    employmentFilter,
  ]);

  /* =======================================================
     FORM
  ======================================================= */

  function resetForm() {
    setForm({
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      joiningDate: "",
      employmentType: "full_time",
      status: "active",
    });

    setEditingEmployee(null);
  }

  function openCreate() {
    setConversionCandidate(null);
    resetForm();
    setShowForm(true);
  }

  function openEdit(employee: Employee) {
    setConversionCandidate(null);
    setEditingEmployee(employee);

    setForm({
      employeeId: employee.employeeId || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: getId(employee.department),
      designation: getId(employee.designation),
      joiningDate: employee.joiningDate
        ? employee.joiningDate.substring(0, 10)
        : "",
      employmentType:
        employee.employmentType || "full_time",
      status: employee.status || "active",
    });

    setShowForm(true);
  }

  function updateForm<K extends keyof EmployeeForm>(
    key: K,
    value: EmployeeForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveEmployee(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Employee email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (
        conversionCandidate &&
        conversionCandidate.offerStatus !== "accepted"
      ) {
        setError(
          "The candidate must have an accepted offer before being converted into an employee."
        );
        return;
      }

      // Employee ID is generated by the backend.
      // Never send employeeId while creating an employee.
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        department:
          form.department || undefined,
        designation:
          form.designation || undefined,
        joiningDate:
          form.joiningDate || undefined,
        employmentType:
          form.employmentType,
        status: form.status,
      };

      let createdEmployee: Employee | null = null;

      if (editingEmployee) {
        await api.patch(
          `/hr/employees/${editingEmployee._id}`,
          payload
        );
      } else {
        const response = await api.post(
          "/hr/employees",
          payload
        );

        createdEmployee =
          response.data?.data?.employee ||
          response.data?.data ||
          response.data?.employee ||
          response.data;

        /*
         * Link the newly-created employee back to the
         * recruitment candidate and mark the candidate
         * as joined.
         */
        if (
          conversionCandidate &&
          createdEmployee?._id
        ) {
          await api.patch(
            `/hr/candidates/${conversionCandidate._id}/join`,
            {
              employeeId: createdEmployee._id,
            }
          );
        }
      }

      setShowForm(false);
      setConversionCandidate(null);
      resetForm();

      /*
       * Clear the navigation state so refreshing Employees
       * does not reopen the same candidate.
       */
      if (recruitmentCandidate) {
        navigate("/hr/employees", {
          replace: true,
          state: {},
        });
      }

      await loadEmployees();
    } catch (err: any) {
      console.error(
        "Failed to save employee:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save employee."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     STATUS CHANGE
  ======================================================= */

  async function toggleStatus(
    employee: Employee
  ) {
    const nextStatus =
      employee.status === "active"
        ? "inactive"
        : "active";

    const confirmed = window.confirm(
      `Are you sure you want to mark ${getEmployeeName(employee)} as ${nextStatus}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/hr/employees/${employee._id}`,
        {
          status: nextStatus,
        }
      );

      await loadEmployees();
    } catch (err: any) {
      console.error(
        "Failed to update employee status:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update employee status."
      );
    }
  }

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  function clearFilters() {
    setSearch("");
    setDepartmentFilter("");
    setDesignationFilter("");
    setStatusFilter("");
    setEmploymentFilter("");
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(departmentFilter) ||
    Boolean(designationFilter) ||
    Boolean(statusFilter) ||
    Boolean(employmentFilter);

  /* =======================================================
     STATS
  ======================================================= */

  const totalEmployees =
    employees.length;

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.status === "active"
    ).length;

  const inactiveEmployees =
    employees.filter(
      (employee) =>
        employee.status === "inactive"
    ).length;

  const employeesOnLeave =
    employees.filter(
      (employee) =>
        employee.status === "on_leave"
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 p-2">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Employees
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage employee records, departments,
                designations and employment status.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={<Users size={20} />}
          iconClass="bg-red-50 text-[#FE0000]"
        />

        <StatCard
          title="Active"
          value={activeEmployees}
          icon={<UserCheck size={20} />}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inactive"
          value={inactiveEmployees}
          icon={<UserX size={20} />}
          iconClass="bg-gray-100 text-gray-600"
        />

        <StatCard
          title="On Leave"
          value={employeesOnLeave}
          icon={<BriefcaseBusiness size={20} />}
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ===================================================
          SEARCH / FILTERS
      =================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, employee ID, email or phone..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (previous) => !previous
              )
            }
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
              showFilters || hasFilters
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter size={17} />
            Filters

            {hasFilters && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FE0000] px-1.5 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departments.map(
                (department) => ({
                  value:
                    department._id,
                  label:
                    department.name,
                })
              )}
            />

            <FilterSelect
              label="Designation"
              value={designationFilter}
              onChange={setDesignationFilter}
              options={designations.map(
                (designation) => ({
                  value:
                    designation._id,
                  label:
                    designation.name,
                })
              )}
            />

            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                },
                {
                  value: "on_leave",
                  label: "On Leave",
                },
                {
                  value: "terminated",
                  label: "Terminated",
                },
              ]}
            />

            <FilterSelect
              label="Employment Type"
              value={employmentFilter}
              onChange={setEmploymentFilter}
              options={[
                {
                  value: "full_time",
                  label: "Full Time",
                },
                {
                  value: "part_time",
                  label: "Part Time",
                },
                {
                  value: "contract",
                  label: "Contract",
                },
                {
                  value: "internship",
                  label: "Internship",
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">
              Employee Directory
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {filteredEmployees.length} employee
              {filteredEmployees.length !== 1
                ? "s"
                : ""}
              found
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingTable />
        ) : paginatedEmployees.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onAdd={openCreate}
            onClear={clearFilters}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <TableHeader>
                      Employee
                    </TableHeader>

                    <TableHeader>
                      Department
                    </TableHeader>

                    <TableHeader>
                      Designation
                    </TableHeader>

                    <TableHeader>
                      Joining Date
                    </TableHeader>

                    <TableHeader>
                      Employment
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader align="right">
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {paginatedEmployees.map(
                    (employee) => (
                      <EmployeeRow
                        key={
                          employee._id
                        }
                        employee={
                          employee
                        }
                        onView={() =>
                          setSelectedEmployee(
                            employee
                          )
                        }
                        onEdit={() =>
                          openEdit(
                            employee
                          )
                        }
                        onToggleStatus={() =>
                          toggleStatus(
                            employee
                          )
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}

            <div className="divide-y divide-gray-100 lg:hidden">
              {paginatedEmployees.map(
                (employee) => (
                  <MobileEmployeeCard
                    key={
                      employee._id
                    }
                    employee={
                      employee
                    }
                    onView={() =>
                      setSelectedEmployee(
                        employee
                      )
                    }
                    onEdit={() =>
                      openEdit(
                        employee
                      )
                    }
                    onToggleStatus={() =>
                      toggleStatus(
                        employee
                      )
                    }
                  />
                )
              )}
            </div>

            {/* PAGINATION */}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={
                filteredEmployees.length
              }
              pageSize={pageSize}
              onPrevious={() =>
                setPage(
                  (previous) =>
                    Math.max(
                      1,
                      previous - 1
                    )
                )
              }
              onNext={() =>
                setPage(
                  (previous) =>
                    Math.min(
                      totalPages,
                      previous + 1
                    )
                )
              }
            />
          </>
        )}
      </div>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showForm && (
        <EmployeeFormModal
          form={form}
          editing={Boolean(
            editingEmployee
          )}
          departments={
            departments
          }
          designations={
            designations
          }
          saving={saving}
          candidate={conversionCandidate}
          onChange={updateForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
            setConversionCandidate(null);

            if (recruitmentCandidate) {
              navigate("/hr/employees", {
                replace: true,
                state: {},
              });
            }
          }}
          onSubmit={saveEmployee}
        />
      )}

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={
            selectedEmployee
          }
          onClose={() =>
            setSelectedEmployee(
              null
            )
          }
          onEdit={() => {
            setSelectedEmployee(
              null
            );

            openEdit(
              selectedEmployee
            );
          }}
          onOpenDetails={() => {
            navigate(
              `/hr/employees/${selectedEmployee._id}`
            );
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* =========================================================
   EMPLOYEE ROW
========================================================= */

function EmployeeRow({
  employee,
  onView,
  onEdit,
  onToggleStatus,
}: {
  employee: Employee;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar employee={employee} />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">
              {getEmployeeName(employee)}
            </p>

            <p className="mt-0.5 truncate text-xs text-gray-500">
              {employee.employeeId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">
          {getName(
            employee.department
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">
          {getName(
            employee.designation
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">
          {formatDate(
            employee.joiningDate
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-gray-700">
          {formatStatus(
            employee.employmentType as EmployeeStatus
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(
            employee.status
          )}`}
        >
          {formatStatus(
            employee.status
          )}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <ActionButton
            title="View"
            onClick={onView}
          >
            <Eye size={16} />
          </ActionButton>

          <ActionButton
            title="Edit"
            onClick={onEdit}
          >
            <Pencil size={16} />
          </ActionButton>

          <ActionButton
            title={
              employee.status ===
              "active"
                ? "Deactivate"
                : "Activate"
            }
            onClick={
              onToggleStatus
            }
          >
            {employee.status ===
            "active" ? (
              <UserX size={16} />
            ) : (
              <UserCheck size={16} />
            )}
          </ActionButton>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
========================================================= */

function MobileEmployeeCard({
  employee,
  onView,
  onEdit,
  onToggleStatus,
}: {
  employee: Employee;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar employee={employee} />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-gray-900">
              {getEmployeeName(employee)}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {employee.employeeId}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(
            employee.status
          )}`}
        >
          {formatStatus(
            employee.status
          )}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniInfo
          label="Department"
          value={getName(
            employee.department
          )}
        />

        <MiniInfo
          label="Designation"
          value={getName(
            employee.designation
          )}
        />

        <MiniInfo
          label="Joining Date"
          value={formatDate(
            employee.joiningDate
          )}
        />

        <MiniInfo
          label="Employment"
          value={formatStatus(
            employee.employmentType as EmployeeStatus
          )}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
        >
          <Eye size={16} />
          View
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={onToggleStatus}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600"
        >
          {employee.status ===
          "active" ? (
            <UserX size={16} />
          ) : (
            <UserCheck size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  employee,
}: {
  employee: Employee;
}) {
  const initials = getEmployeeName(employee)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (employee.profilePhoto) {
    return (
      <img
        src={employee.profilePhoto}
        alt={getEmployeeName(employee)}
        className="h-10 w-10 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-red-700">
      {initials}
    </div>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-gray-700">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
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
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#FE0000]"
    >
      {children}
    </button>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
      >
        <option value="">
          All
        </option>

        {options.map(
          (option) => (
            <option
              key={option.value}
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

/* =========================================================
   FORM MODAL
========================================================= */

function EmployeeFormModal({
  form,
  editing,
  departments,
  designations,
  saving,
  candidate,
  onChange,
  onClose,
  onSubmit,
}: {
  form: EmployeeForm;
  editing: boolean;
  departments: Department[];
  designations: Designation[];
  saving: boolean;
  candidate: RecruitmentCandidate | null;
  onChange: <
    K extends keyof EmployeeForm
  >(
    key: K,
    value: EmployeeForm[K]
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent
  ) => void;
}) {
  const candidateName =
    candidate?.name?.trim() ||
    "Selected Candidate";

  const candidateDepartment =
    getName(
      candidate?.jobOpening?.department
    );

  const candidateDesignation =
    candidate?.jobOpening?.designation
      ? getName(
          candidate.jobOpening.designation
        )
      : candidate?.jobOpening?.title || "—";

  const candidateStatus =
    candidate?.offerStatus === "accepted"
      ? "Offer Accepted"
      : candidate?.status
        ? candidate.status
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) =>
              char.toUpperCase()
            )
        : "Selected";

  return (
    <ModalShell
      title={
        editing
          ? "Edit Employee"
          : candidate
            ? "Convert Candidate to Employee"
            : "Add Employee"
      }
      subtitle={
        editing
          ? "Update the employee HR record."
          : candidate
            ? "Review the selected recruitment candidate and create the employee HR profile."
            : "Create a new employee HR record."
      }
      onClose={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {/* =====================================================
            SELECTED RECRUITMENT CANDIDATE
        ====================================================== */}

        {candidate && !editing && (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FE0000] text-white">
                  <UserCheck size={20} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#FE0000]">
                    Recruitment Candidate
                  </p>

                  <h3 className="text-lg font-bold text-gray-900">
                    {candidateName}
                  </h3>
                </div>
              </div>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {candidateStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CandidateInfo
                label="Email"
                value={candidate.email || "—"}
              />

              <CandidateInfo
                label="Phone"
                value={candidate.phone || "—"}
              />

              <CandidateInfo
                label="Department"
                value={candidateDepartment}
              />

              <CandidateInfo
                label="Position"
                value={candidateDesignation}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CandidateInfo
                label="Candidate ID"
                value={candidate._id}
              />

              <CandidateInfo
                label="Joining Date"
                value={
                  candidate.joiningDate
                    ? formatDate(
                        candidate.joiningDate
                      )
                    : "—"
                }
              />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-red-700">
              <CheckCircle2 size={16} />

              <span>
                Employee information below has been
                pre-filled from this recruitment candidate.
              </span>
            </div>
          </div>
        )}

        {/* =====================================================
            EMPLOYEE INFORMATION
        ====================================================== */}

        <div>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">
              Employee Information
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {candidate && !editing
                ? "Review the candidate information and complete the employee HR profile."
                : "Enter the employee's HR information."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {editing ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                  Employee ID
                </label>

                <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-700">
                  {form.employeeId || "—"}
                </div>

                <p className="mt-1 text-[11px] text-gray-400">
                  Employee ID cannot be changed.
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                  Employee ID
                </label>

                <div className="flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FE0000] text-[10px] text-white">
                    #
                  </span>
                  Auto-generated
                </div>

                <p className="mt-1 text-[11px] text-gray-400">
                  Employee ID will be generated automatically when the employee is created.
                </p>
              </div>
            )}

            <Input
              label="First Name"
              value={form.firstName}
              onChange={(value) =>
                onChange(
                  "firstName",
                  value
                )
              }
              placeholder="First name"
              required
            />

            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(value) =>
                onChange(
                  "lastName",
                  value
                )
              }
              placeholder="Last name"
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                onChange(
                  "email",
                  value
                )
              }
              placeholder="employee@example.com"
              required
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                onChange(
                  "phone",
                  value
                )
              }
              placeholder="+91 XXXXX XXXXX"
            />

            <Select
              label="Department"
              value={form.department}
              onChange={(value) =>
                onChange(
                  "department",
                  value
                )
              }
              options={departments.map(
                (department) => ({
                  value:
                    department._id,
                  label:
                    department.name,
                })
              )}
            />

            <Select
              label="Designation"
              value={form.designation}
              onChange={(value) =>
                onChange(
                  "designation",
                  value
                )
              }
              options={designations.map(
                (designation) => ({
                  value:
                    designation._id,
                  label:
                    designation.name,
                })
              )}
            />

            <Input
              label="Joining Date"
              type="date"
              value={form.joiningDate}
              onChange={(value) =>
                onChange(
                  "joiningDate",
                  value
                )
              }
            />

            <Select
              label="Employment Type"
              value={form.employmentType}
              onChange={(value) =>
                onChange(
                  "employmentType",
                  value
                )
              }
              options={[
                {
                  value: "full_time",
                  label: "Full Time",
                },
                {
                  value: "part_time",
                  label: "Part Time",
                },
                {
                  value: "contract",
                  label: "Contract",
                },
                {
                  value: "internship",
                  label: "Internship",
                },
              ]}
            />

            <Select
              label="Status"
              value={form.status}
              onChange={(value) =>
                onChange(
                  "status",
                  value as EmployeeStatus
                )
              }
              options={[
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                },
                {
                  value: "on_leave",
                  label: "On Leave",
                },
                {
                  value: "terminated",
                  label: "Terminated",
                },
              ]}
            />
          </div>
        </div>

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              "Saving..."
            ) : candidate && !editing ? (
              <>
                <UserCheck size={16} />
                Convert to Employee
              </>
            ) : editing ? (
              <>
                <Pencil size={16} />
                Update Employee
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Employee
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function CandidateInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-red-100 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPLOYEE DETAILS MODAL
========================================================= */

function EmployeeDetailsModal({
  employee,
  onClose,
  onEdit,
  onOpenDetails,
}: {
  employee: Employee;
  onClose: () => void;
  onEdit: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <ModalShell
      title="Employee Details"
      subtitle="Quick overview of the employee HR record."
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-center">
          <Avatar
            employee={employee}
          />

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              {getEmployeeName(employee)}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {employee.employeeId}
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(
                employee.status
              )}`}
            >
              {formatStatus(
                employee.status
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailItem
            icon={
              <Mail size={17} />
            }
            label="Email"
            value={
              employee.email
            }
          />

          <DetailItem
            icon={
              <Phone size={17} />
            }
            label="Phone"
            value={
              employee.phone ||
              "—"
            }
          />

          <DetailItem
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

          <DetailItem
            icon={
              <Users size={17} />
            }
            label="Designation"
            value={getName(
              employee.designation
            )}
          />

          <DetailItem
            label="Joining Date"
            value={formatDate(
              employee.joiningDate
            )}
          />

          <DetailItem
            label="Employment Type"
            value={formatStatus(
              employee.employmentType as EmployeeStatus
            )}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            type="button"
            onClick={onOpenDetails}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            <Eye size={16} />
            Full Profile
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-[#FE0000]">
            {icon}
          </span>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-600">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}

/* =========================================================
   SELECT
========================================================= */

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
      >
        <option value="">
          Select {label}
        </option>

        {options.map(
          (option) => (
            <option
              key={option.value}
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

/* =========================================================
   MODAL SHELL
========================================================= */

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-90px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const start =
    totalItems === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const end = Math.min(
    page * pageSize,
    totalItems
  );

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">
        Showing{" "}
        <span className="font-semibold text-gray-700">
          {start}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-gray-700">
          {end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-gray-700">
          {totalItems}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrevious}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft
            size={16}
          />
        </button>

        <span className="px-2 text-xs font-semibold text-gray-600">
          Page {page} of{" "}
          {totalPages}
        </span>

        <button
          type="button"
          disabled={
            page >= totalPages
          }
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight
            size={16}
          />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingTable() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 7,
      }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-gray-100"
        />
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  hasFilters,
  onAdd,
  onClear,
}: {
  hasFilters: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Users size={25} />
      </div>

      <h3 className="mt-4 text-base font-bold text-gray-900">
        No employees found
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {hasFilters
          ? "Try changing your search or filters."
          : "There are no employees in the system yet."}
      </p>

      <div className="mt-5 flex gap-2">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
          >
            Clear Filters
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus size={16} />
            Add Employee
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ID HELPER
========================================================= */

function getId(
  value?: Department | Designation | string | null
) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value._id || "";
}