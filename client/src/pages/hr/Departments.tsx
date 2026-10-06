import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Loader2,
  Plus,
  Power,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../../lib/axios";

interface EmployeeRef {
  _id?: string;
  employeeId?: string;
  name?: string;
  email?: string;
}

interface Department {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  departmentHead?: EmployeeRef | string | null;
  employeeCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  email?: string;
  department?: string | { _id?: string; name?: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  totalPages?: number;
}

interface DepartmentForm {
  name: string;
  code: string;
  description: string;
  departmentHead: string;
  isActive: boolean;
}

const emptyForm: DepartmentForm = {
  name: "",
  code: "",
  description: "",
  departmentHead: "",
  isActive: true,
};

const getErrorMessage = (error: any, fallback = "Something went wrong.") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const getEmployeeName = (
  employee: EmployeeRef | string | null | undefined,
): string => {
  if (!employee) return "Not assigned";
  if (typeof employee === "string") return employee;
  return employee.name || employee.employeeId || employee.email || "Not assigned";
};

const formatDate = (date?: string) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    totalPages: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);

  const [showDetails, setShowDetails] = useState<Department | null>(null);

  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== "all") {
        params.isActive = statusFilter === "active" ? "true" : "false";
      }

      const response = await api.get("/hr/departments", {
        params,
      });

      const responseData = response.data;
      const data = responseData?.data;

      // Support common backend response shapes.
      let departmentList: Department[] = [];

      if (Array.isArray(data)) {
        departmentList = data;
      } else if (Array.isArray(data?.departments)) {
        departmentList = data.departments;
      } else if (Array.isArray(data?.items)) {
        departmentList = data.items;
      } else if (Array.isArray(data?.docs)) {
        departmentList = data.docs;
      } else if (Array.isArray(responseData?.departments)) {
        departmentList = responseData.departments;
      } else if (Array.isArray(responseData?.items)) {
        departmentList = responseData.items;
      } else if (Array.isArray(responseData?.docs)) {
        departmentList = responseData.docs;
      }

      setDepartments(departmentList);

      const responsePagination =
        responseData?.pagination ||
        data?.pagination ||
        data?.meta ||
        responseData?.meta ||
        {};

      const total =
        Number(
          responsePagination.total ??
            responsePagination.totalCount ??
            departmentList.length,
        ) || 0;

      const totalPages =
        Number(
          responsePagination.totalPages ||
            responsePagination.pages ||
            Math.ceil(total / limit),
        ) || 1;

      setPagination({
        page: Number(responsePagination.page || page),
        limit: Number(responsePagination.limit || limit),
        total,
        pages: totalPages,
        totalPages,
      });
    } catch (err: any) {
      setDepartments([]);
      setError(getErrorMessage(err, "Unable to load departments."));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get("/hr/employees", {
        params: {
          page: 1,
          limit: 500,
          isActive: true,
        },
      });

      const data = response.data?.data;

      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (Array.isArray(data?.employees)) {
        setEmployees(data.employees);
      } else if (Array.isArray(response.data?.employees)) {
        setEmployees(response.data.employees);
      }
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const stats = useMemo(() => {
    const total = pagination.total || departments.length;

    const active = departments.filter(
      (department) => department.isActive !== false,
    ).length;

    const inactive = departments.filter(
      (department) => department.isActive === false,
    ).length;

    const employeeCount = departments.reduce(
      (sum, department) => sum + Number(department.employeeCount || 0),
      0,
    );

    return {
      total,
      active,
      inactive,
      employeeCount,
    };
  }, [departments, pagination.total]);

  const openCreateModal = () => {
    setEditingDepartment(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (department: Department) => {
    setEditingDepartment(department);

    setForm({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      departmentHead:
        typeof department.departmentHead === "string"
          ? department.departmentHead
          : department.departmentHead?._id || "",
      isActive: department.isActive !== false,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingDepartment(null);
    setForm(emptyForm);
  };

  const handleFormChange = (
    field: keyof DepartmentForm,
    value: string | boolean,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        departmentHead: form.departmentHead || null,
        isActive: form.isActive,
      };

      if (editingDepartment) {
        await api.put(
          `/hr/departments/${editingDepartment._id}`,
          payload,
        );
      } else {
        await api.post("/hr/departments", payload);
      }

      closeModal();
      await loadDepartments();
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to save department."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (department: Department) => {
    const nextStatus = department.isActive === false;

    try {
      setActionLoading(department._id);
      setError("");

      await api.put(`/hr/departments/${department._id}`, {
        isActive: nextStatus,
      });

      await loadDepartments();
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to update department status."));
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDepartment = async (department: Department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(department._id);
      setError("");

      await api.delete(`/hr/departments/${department._id}`);

      if (departments.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await loadDepartments();
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to delete department."));
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages =
    pagination.totalPages || pagination.pages || Math.max(1, Math.ceil(pagination.total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Departments
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage company departments and department heads.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 text-red-500 hover:text-red-700"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Building2 size={20} />}
          label="Total Departments"
          value={stats.total}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          icon={<Check size={20} />}
          label="Active"
          value={stats.active}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          icon={<Power size={20} />}
          label="Inactive"
          value={stats.inactive}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          icon={<Users size={20} />}
          label="Employees"
          value={stats.employeeCount}
          iconClass="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                setPage(1);
              }}
              placeholder="Search department name or code..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as "all" | "active" | "inactive",
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department Head
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Employees
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Created
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2
                      size={26}
                      className="mx-auto animate-spin text-indigo-600"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading departments...
                    </p>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Building2
                      size={32}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No departments found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Create your first department to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr
                    key={department._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Building2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {department.name}
                          </p>

                          {department.code && (
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                              {department.code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {getEmployeeName(department.departmentHead)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <Users size={13} />
                        {department.employeeCount || 0}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge active={department.isActive !== false} />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(department.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          title="View"
                          onClick={() => setShowDetails(department)}
                        >
                          <Eye size={16} />
                        </IconButton>

                        <IconButton
                          title="Edit"
                          onClick={() => openEditModal(department)}
                        >
                          <Edit3 size={16} />
                        </IconButton>

                        <IconButton
                          title={
                            department.isActive === false
                              ? "Activate"
                              : "Deactivate"
                          }
                          onClick={() => toggleStatus(department)}
                          disabled={actionLoading === department._id}
                        >
                          {actionLoading === department._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Power size={16} />
                          )}
                        </IconButton>

                        <IconButton
                          title="Delete"
                          danger
                          onClick={() => deleteDepartment(department)}
                          disabled={actionLoading === department._id}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
            <Loader2
              size={26}
              className="mx-auto animate-spin text-indigo-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading departments...
            </p>
          </div>
        ) : departments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
            <Building2 size={32} className="mx-auto text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-600">
              No departments found
            </p>
          </div>
        ) : (
          departments.map((department) => (
            <div
              key={department._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={18} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {department.name}
                    </h3>

                    {department.code && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {department.code}
                      </p>
                    )}
                  </div>
                </div>

                <StatusBadge active={department.isActive !== false} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400">Department Head</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {getEmployeeName(department.departmentHead)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Employees</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {department.employeeCount || 0}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">
                  Created {formatDate(department.createdAt)}
                </span>

                <div className="flex items-center gap-1">
                  <IconButton
                    title="View"
                    onClick={() => setShowDetails(department)}
                  >
                    <Eye size={16} />
                  </IconButton>

                  <IconButton
                    title="Edit"
                    onClick={() => openEditModal(department)}
                  >
                    <Edit3 size={16} />
                  </IconButton>

                  <IconButton
                    title="Toggle status"
                    onClick={() => toggleStatus(department)}
                    disabled={actionLoading === department._id}
                  >
                    {actionLoading === department._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} />
                    )}
                  </IconButton>

                  <IconButton
                    title="Delete"
                    danger
                    onClick={() => deleteDepartment(department)}
                    disabled={actionLoading === department._id}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {Math.min((page - 1) * limit + 1, pagination.total)}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(page * limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {pagination.total}
            </span>{" "}
            departments
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="px-2 text-sm font-medium text-slate-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((previous) => Math.min(totalPages, previous + 1))
              }
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editingDepartment ? "Edit Department" : "Add Department"}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Department Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange("name", event.target.value)
                  }
                  placeholder="e.g. Human Resources"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="Department Code">
                <input
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    handleFormChange("code", event.target.value)
                  }
                  placeholder="e.g. HR"
                  className={inputClass}
                  maxLength={20}
                />
              </FormField>
            </div>

            <FormField label="Department Head">
              <select
                value={form.departmentHead}
                onChange={(event) =>
                  handleFormChange("departmentHead", event.target.value)
                }
                className={inputClass}
              >
                <option value="">No department head</option>

                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name ||
                      employee.employeeId ||
                      employee.email ||
                      employee._id}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleFormChange("description", event.target.value)
                }
                placeholder="Describe the department..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </FormField>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  handleFormChange("isActive", event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Active Department
                </p>

                <p className="text-xs text-slate-500">
                  Employees can be assigned to active departments.
                </p>
              </div>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={17} className="animate-spin" />}
                {editingDepartment ? "Update Department" : "Create Department"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details Modal */}
      {showDetails && (
        <Modal
          title="Department Details"
          onClose={() => setShowDetails(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Building2 size={25} />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {showDetails.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {showDetails.code && (
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                      {showDetails.code}
                    </span>
                  )}

                  <StatusBadge active={showDetails.isActive !== false} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Department Head"
                value={getEmployeeName(showDetails.departmentHead)}
              />

              <DetailItem
                label="Employees"
                value={String(showDetails.employeeCount || 0)}
              />

              <DetailItem
                label="Created"
                value={formatDate(showDetails.createdAt)}
              />

              <DetailItem
                label="Last Updated"
                value={formatDate(showDetails.updatedAt)}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </p>

              <p className="mt-2 wrap-break-word whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {showDetails.description || "No description provided."}
              </p>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setShowDetails(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* -------------------------------- Helpers -------------------------------- */

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const StatCard = ({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value.toLocaleString("en-IN")}
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
};

const StatusBadge = ({ active }: { active: boolean }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
};

const IconButton = ({
  children,
  title,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-red-500 hover:bg-red-50 hover:text-red-600"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
};

const FormField = ({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
};

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

export default Departments;