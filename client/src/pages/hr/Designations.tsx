import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
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

interface Department {
  _id: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

interface EmployeeRef {
  _id?: string;
  employeeId?: string;
  name?: string;
  email?: string;
}

interface Designation {
  _id: string;
  name: string;
  code?: string;
  department?: Department | string | null;
  level?: string;
  grade?: string;
  description?: string;
  salaryRange?: {
    minimum?: number;
    maximum?: number;
    currency?: string;
  };
  employeeCount?: number;
  employees?: EmployeeRef[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DesignationForm {
  name: string;
  code: string;
  department: string;
  level: string;
  grade: string;
  description: string;
  minimumSalary: string;
  maximumSalary: string;
  currency: string;
  isActive: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  totalPages?: number;
}

const emptyForm: DesignationForm = {
  name: "",
  code: "",
  department: "",
  level: "",
  grade: "",
  description: "",
  minimumSalary: "",
  maximumSalary: "",
  currency: "INR",
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const getErrorMessage = (
  error: any,
  fallback = "Something went wrong.",
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
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

const formatCurrency = (
  amount?: number,
  currency = "INR",
) => {
  if (amount === undefined || amount === null) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getDepartmentName = (
  department?: Department | string | null,
) => {
  if (!department) return "No department";

  if (typeof department === "string") return department;

  return department.name || department.code || "No department";
};

const Designations = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
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
  const [editingDesignation, setEditingDesignation] =
    useState<Designation | null>(null);

  const [showDetails, setShowDetails] =
    useState<Designation | null>(null);

  const [form, setForm] = useState<DesignationForm>(emptyForm);

  const loadDesignations = async () => {
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

      if (departmentFilter) {
        params.department = departmentFilter;
      }

      if (statusFilter !== "all") {
        params.isActive =
          statusFilter === "active" ? "true" : "false";
      }

      const response = await api.get("/hr/designations", {
        params,
      });

      const responseData = response.data;
      const data = responseData?.data;

      // Support all common backend response shapes.
      let designationList: Designation[] = [];

      if (Array.isArray(data)) {
        designationList = data;
      } else if (Array.isArray(data?.designations)) {
        designationList = data.designations;
      } else if (Array.isArray(data?.items)) {
        designationList = data.items;
      } else if (Array.isArray(data?.docs)) {
        designationList = data.docs;
      } else if (Array.isArray(responseData?.designations)) {
        designationList = responseData.designations;
      } else if (Array.isArray(responseData?.items)) {
        designationList = responseData.items;
      } else if (Array.isArray(responseData?.docs)) {
        designationList = responseData.docs;
      }

      setDesignations(designationList);

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
            designationList.length,
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
      setDesignations([]);
      setError(
        getErrorMessage(
          err,
          "Unable to load designations.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get("/hr/departments", {
        params: {
          page: 1,
          limit: 500,
          isActive: true,
        },
      });

      const responseData = response.data;
      const data = responseData?.data;

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
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    loadDesignations();
  }, [
    page,
    search,
    departmentFilter,
    statusFilter,
  ]);

  useEffect(() => {
    loadDepartments();
  }, []);

  const stats = useMemo(() => {
    const total =
      pagination.total || designations.length;

    const active = designations.filter(
      (designation) =>
        designation.isActive !== false,
    ).length;

    const inactive = designations.filter(
      (designation) =>
        designation.isActive === false,
    ).length;

    const employees = designations.reduce(
      (sum, designation) =>
        sum +
        Number(designation.employeeCount || 0),
      0,
    );

    return {
      total,
      active,
      inactive,
      employees,
    };
  }, [designations, pagination.total]);

  const openCreateModal = () => {
    setEditingDesignation(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (
    designation: Designation,
  ) => {
    setEditingDesignation(designation);

    const salaryRange =
      designation.salaryRange || {};

    setForm({
      name: designation.name || "",
      code: designation.code || "",
      department:
        typeof designation.department === "string"
          ? designation.department
          : designation.department?._id || "",
      level: designation.level || "",
      grade: designation.grade || "",
      description:
        designation.description || "",
      minimumSalary:
        salaryRange.minimum !== undefined
          ? String(salaryRange.minimum)
          : "",
      maximumSalary:
        salaryRange.maximum !== undefined
          ? String(salaryRange.maximum)
          : "",
      currency:
        salaryRange.currency || "INR",
      isActive:
        designation.isActive !== false,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingDesignation(null);
    setForm(emptyForm);
  };

  const updateForm = (
    field: keyof DesignationForm,
    value: string | boolean,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Designation name is required.",
      );
      return;
    }

    if (
      form.minimumSalary &&
      form.maximumSalary &&
      Number(form.minimumSalary) >
        Number(form.maximumSalary)
    ) {
      setError(
        "Minimum salary cannot be greater than maximum salary.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        code: form.code
          .trim()
          .toUpperCase(),
        department:
          form.department || null,
        level: form.level.trim(),
        grade: form.grade.trim(),
        description:
          form.description.trim(),
        salaryRange: {
          minimum: form.minimumSalary
            ? Number(form.minimumSalary)
            : 0,
          maximum: form.maximumSalary
            ? Number(form.maximumSalary)
            : 0,
          currency:
            form.currency || "INR",
        },
        isActive: form.isActive,
      };

      if (editingDesignation) {
        await api.put(
          `/hr/designations/${editingDesignation._id}`,
          payload,
        );
      } else {
        await api.post(
          "/hr/designations",
          payload,
        );
      }

      closeModal();
      await loadDesignations();
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to save designation.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (
    designation: Designation,
  ) => {
    const nextStatus =
      designation.isActive === false;

    try {
      setActionLoading(designation._id);
      setError("");

      await api.put(
        `/hr/designations/${designation._id}`,
        {
          isActive: nextStatus,
        },
      );

      await loadDesignations();
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to update designation status.",
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDesignation = async (
    designation: Designation,
  ) => {
    if (
      Number(designation.employeeCount || 0) > 0
    ) {
      setError(
        "This designation has employees assigned to it. Reassign those employees before deleting the designation.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${designation.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(designation._id);
      setError("");

      await api.delete(
        `/hr/designations/${designation._id}`,
      );

      if (
        designations.length === 1 &&
        page > 1
      ) {
        setPage((previous) =>
          Math.max(1, previous - 1),
        );
      } else {
        await loadDesignations();
      }
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete designation.",
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages =
    pagination.totalPages ||
    pagination.pages ||
    Math.max(
      1,
      Math.ceil(
        pagination.total / limit,
      ),
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Designations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage job designations, grades,
              levels and salary ranges.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Designation
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="wrap-break-word">
            {error}
          </span>

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
          icon={
            <BriefcaseBusiness size={20} />
          }
          label="Total Designations"
          value={stats.total}
          iconClass="bg-violet-50 text-violet-600"
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
          value={stats.employees}
          iconClass="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
          <div className="relative">
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
                setPage(1);
              }}
              placeholder="Search designation or code..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(
                event.target.value,
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department._id}
                  value={department._id}
                >
                  {department.name}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as
                  | "all"
                  | "active"
                  | "inactive",
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">
              All Status
            </option>
            <option value="active">
              Active Only
            </option>
            <option value="inactive">
              Inactive Only
            </option>
          </select>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-275">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Designation
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Level / Grade
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Salary Range
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Employees
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <Loader2
                      size={26}
                      className="mx-auto animate-spin text-indigo-600"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading designations...
                    </p>
                  </td>
                </tr>
              ) : designations.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <BriefcaseBusiness
                      size={32}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No designations found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Create your first designation to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                designations.map(
                  (designation) => (
                    <tr
                      key={
                        designation._id
                      }
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <BriefcaseBusiness
                              size={18}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {
                                designation.name
                              }
                            </p>

                            {designation.code && (
                              <p className="mt-0.5 text-xs font-medium text-slate-400">
                                {
                                  designation.code
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {getDepartmentName(
                            designation.department,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {designation.level && (
                            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              {
                                designation.level
                              }
                            </span>
                          )}

                          {designation.grade && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              {
                                designation.grade
                              }
                            </span>
                          )}

                          {!designation.level &&
                            !designation.grade && (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {designation.salaryRange
                            ?.minimum ||
                          designation.salaryRange
                            ?.maximum
                            ? `${formatCurrency(
                                designation
                                  .salaryRange
                                  ?.minimum,
                                designation
                                  .salaryRange
                                  ?.currency,
                              )} - ${formatCurrency(
                                designation
                                  .salaryRange
                                  ?.maximum,
                                designation
                                  .salaryRange
                                  ?.currency,
                              )}`
                            : "Not specified"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <Users size={13} />
                          {
                            designation.employeeCount ||
                            0
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge
                          active={
                            designation.isActive !==
                            false
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            title="View"
                            onClick={() =>
                              setShowDetails(
                                designation,
                              )
                            }
                          >
                            <Eye
                              size={16}
                            />
                          </IconButton>

                          <IconButton
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                designation,
                              )
                            }
                          >
                            <Edit3
                              size={16}
                            />
                          </IconButton>

                          <IconButton
                            title={
                              designation.isActive ===
                              false
                                ? "Activate"
                                : "Deactivate"
                            }
                            onClick={() =>
                              toggleStatus(
                                designation,
                              )
                            }
                            disabled={
                              actionLoading ===
                              designation._id
                            }
                          >
                            {actionLoading ===
                            designation._id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Power
                                size={16}
                              />
                            )}
                          </IconButton>

                          <IconButton
                            title="Delete"
                            danger
                            onClick={() =>
                              deleteDesignation(
                                designation,
                              )
                            }
                            disabled={
                              actionLoading ===
                              designation._id
                            }
                          >
                            <Trash2
                              size={16}
                            />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
            <Loader2
              size={26}
              className="mx-auto animate-spin text-indigo-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading designations...
            </p>
          </div>
        ) : designations.length ===
          0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
            <BriefcaseBusiness
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-600">
              No designations found
            </p>
          </div>
        ) : (
          designations.map(
            (designation) => (
              <div
                key={designation._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <BriefcaseBusiness
                        size={18}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {
                          designation.name
                        }
                      </h3>

                      {designation.code && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {
                            designation.code
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <StatusBadge
                    active={
                      designation.isActive !==
                      false
                    }
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <DetailItem
                    label="Department"
                    value={getDepartmentName(
                      designation.department,
                    )}
                  />

                  <DetailItem
                    label="Employees"
                    value={String(
                      designation.employeeCount ||
                        0,
                    )}
                  />

                  <DetailItem
                    label="Level"
                    value={
                      designation.level ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Grade"
                    value={
                      designation.grade ||
                      "—"
                    }
                  />
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Salary Range
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {designation.salaryRange
                      ?.minimum ||
                    designation.salaryRange
                      ?.maximum
                      ? `${formatCurrency(
                          designation
                            .salaryRange
                            ?.minimum,
                          designation
                            .salaryRange
                            ?.currency,
                        )} - ${formatCurrency(
                          designation
                            .salaryRange
                            ?.maximum,
                          designation
                            .salaryRange
                            ?.currency,
                        )}`
                      : "Not specified"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Created{" "}
                    {formatDate(
                      designation.createdAt,
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    <IconButton
                      title="View"
                      onClick={() =>
                        setShowDetails(
                          designation,
                        )
                      }
                    >
                      <Eye size={16} />
                    </IconButton>

                    <IconButton
                      title="Edit"
                      onClick={() =>
                        openEditModal(
                          designation,
                        )
                      }
                    >
                      <Edit3 size={16} />
                    </IconButton>

                    <IconButton
                      title="Toggle status"
                      onClick={() =>
                        toggleStatus(
                          designation,
                        )
                      }
                      disabled={
                        actionLoading ===
                        designation._id
                      }
                    >
                      {actionLoading ===
                      designation._id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Power size={16} />
                      )}
                    </IconButton>

                    <IconButton
                      title="Delete"
                      danger
                      onClick={() =>
                        deleteDesignation(
                          designation,
                        )
                      }
                      disabled={
                        actionLoading ===
                        designation._id
                      }
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>
              </div>
            ),
          )
        )}
      </div>

      {/* Pagination */}
      {!loading &&
        pagination.total > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  (page - 1) * limit + 1,
                  pagination.total,
                )}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  page * limit,
                  pagination.total,
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {pagination.total}
              </span>{" "}
              designations
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((previous) =>
                    Math.max(
                      1,
                      previous - 1,
                    ),
                  )
                }
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
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage((previous) =>
                    Math.min(
                      totalPages,
                      previous + 1,
                    ),
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight
                  size={16}
                />
              </button>
            </div>
          </div>
        )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={
            editingDesignation
              ? "Edit Designation"
              : "Add Designation"
          }
          onClose={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Designation Name"
                required
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Senior Software Developer"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="Designation Code">
                <input
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    updateForm(
                      "code",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. SSD"
                  className={inputClass}
                  maxLength={20}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Department">
                <select
                  value={form.department}
                  onChange={(event) =>
                    updateForm(
                      "department",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={
                          department._id
                        }
                        value={
                          department._id
                        }
                      >
                        {department.name}
                      </option>
                    ),
                  )}
                </select>
              </FormField>

              <FormField label="Level">
                <select
                  value={form.level}
                  onChange={(event) =>
                    updateForm(
                      "level",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select Level
                  </option>
                  <option value="Intern">
                    Intern
                  </option>
                  <option value="Junior">
                    Junior
                  </option>
                  <option value="Mid">
                    Mid
                  </option>
                  <option value="Senior">
                    Senior
                  </option>
                  <option value="Lead">
                    Lead
                  </option>
                  <option value="Manager">
                    Manager
                  </option>
                  <option value="Senior Manager">
                    Senior Manager
                  </option>
                  <option value="Head">
                    Head
                  </option>
                  <option value="Director">
                    Director
                  </option>
                  <option value="Executive">
                    Executive
                  </option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Grade">
                <input
                  type="text"
                  value={form.grade}
                  onChange={(event) =>
                    updateForm(
                      "grade",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. G5 / L3"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Currency">
                <select
                  value={form.currency}
                  onChange={(event) =>
                    updateForm(
                      "currency",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="INR">
                    INR - Indian Rupee
                  </option>
                  <option value="USD">
                    USD - US Dollar
                  </option>
                  <option value="EUR">
                    EUR - Euro
                  </option>
                  <option value="GBP">
                    GBP - Pound
                  </option>
                </select>
              </FormField>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Salary Range
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Minimum Salary">
                  <input
                    type="number"
                    min="0"
                    value={
                      form.minimumSalary
                    }
                    onChange={(event) =>
                      updateForm(
                        "minimumSalary",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 25000"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Maximum Salary">
                  <input
                    type="number"
                    min="0"
                    value={
                      form.maximumSalary
                    }
                    onChange={(event) =>
                      updateForm(
                        "maximumSalary",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 75000"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Describe the responsibilities and purpose of this designation..."
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </FormField>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateForm(
                    "isActive",
                    event.target.checked,
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Active Designation
                </p>

                <p className="text-xs text-slate-500">
                  Active designations can be assigned to employees and job openings.
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
                {saving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {editingDesignation
                  ? "Update Designation"
                  : "Create Designation"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details Modal */}
      {showDetails && (
        <Modal
          title="Designation Details"
          onClose={() =>
            setShowDetails(null)
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <BriefcaseBusiness
                  size={25}
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {showDetails.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {showDetails.code && (
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                      {
                        showDetails.code
                      }
                    </span>
                  )}

                  <StatusBadge
                    active={
                      showDetails.isActive !==
                      false
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Department"
                value={getDepartmentName(
                  showDetails.department,
                )}
              />

              <DetailItem
                label="Employees"
                value={String(
                  showDetails.employeeCount ||
                    0,
                )}
              />

              <DetailItem
                label="Level"
                value={
                  showDetails.level ||
                  "—"
                }
              />

              <DetailItem
                label="Grade"
                value={
                  showDetails.grade ||
                  "—"
                }
              />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Salary Range
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {showDetails.salaryRange
                  ?.minimum ||
                showDetails.salaryRange
                  ?.maximum
                  ? `${formatCurrency(
                      showDetails
                        .salaryRange
                        ?.minimum,
                      showDetails
                        .salaryRange
                        ?.currency,
                    )} - ${formatCurrency(
                      showDetails
                        .salaryRange
                        ?.maximum,
                      showDetails
                        .salaryRange
                        ?.currency,
                    )}`
                  : "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </p>

              <p className="mt-2 wrap-break-word whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {showDetails.description ||
                  "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Created"
                value={formatDate(
                  showDetails.createdAt,
                )}
              />

              <DetailItem
                label="Last Updated"
                value={formatDate(
                  showDetails.updatedAt,
                )}
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() =>
                  setShowDetails(null)
                }
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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

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

const StatusBadge = ({
  active,
}: {
  active: boolean;
}) => {
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
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
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
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
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
      <p className="text-xs text-slate-400">
        {label}
      </p>

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
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Designations;