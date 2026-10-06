import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";

type UserRole = "employee" | "hr" | "super_admin";

interface EmployeeRef {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: {
    _id?: string;
    name?: string;
  } | string;
  designation?: {
    _id?: string;
    name?: string;
  } | string;
}

interface User {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
  employee?: EmployeeRef | string | null;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: {
    _id?: string;
    name?: string;
  } | string;
  designation?: {
    _id?: string;
    name?: string;
  } | string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  totalPages?: number;
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  employee: string;
  isActive: boolean;
}

const initialForm: UserForm = {
  name: "",
  email: "",
  phone: "",
  role: "employee",
  password: "",
  employee: "",
  isActive: true,
};

const roleLabels: Record<UserRole, string> = {
  employee: "Employee",
  hr: "HR Admin",
  super_admin: "Super Admin",
};

const roleStyles: Record<UserRole, string> = {
  employee:
    "bg-slate-100 text-slate-700 border-slate-200",
  hr:
    "bg-blue-50 text-blue-700 border-blue-200",
  super_admin:
    "bg-purple-50 text-purple-700 border-purple-200",
};

function getEmployeeName(
  employee?: EmployeeRef | Employee | string | null
) {
  if (!employee) return "—";

  if (typeof employee === "string") {
    return employee;
  }

  if (employee.name?.trim()) {
    return employee.name.trim();
  }

  const fullName = [
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || employee.email || "Unnamed Employee";
}

function getEmployeeId(
  employee?: EmployeeRef | Employee | string | null
) {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.employeeId || "";
}

function getDepartmentName(
  employee?: EmployeeRef | Employee | string | null
) {
  if (!employee || typeof employee === "string") {
    return "—";
  }

  if (!employee.department) {
    return "—";
  }

  if (typeof employee.department === "string") {
    return employee.department;
  }

  return employee.department.name || "—";
}

function getDesignationName(
  employee?: EmployeeRef | Employee | string | null
) {
  if (!employee || typeof employee === "string") {
    return "—";
  }

  if (!employee.designation) {
    return "—";
  }

  if (typeof employee.designation === "string") {
    return employee.designation;
  }

  return employee.designation.name || "—";
}

function getInitials(name?: string) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "Never";

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

function formatDateTime(value?: string) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown) {
  const axiosError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return (
    axiosError.response?.data?.message ||
    axiosError.message ||
    "Something went wrong."
  );
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStyles[role]}`}
    >
      {roleLabels[role]}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Inactive
    </span>
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
  children: React.ReactNode;
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

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">(
      "all"
    );

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1,
      totalPages: 1,
    });

  const [showFilters, setShowFilters] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<UserForm>(initialForm);

  const [passwordForm, setPasswordForm] =
    useState({
      password: "",
      confirmPassword: "",
    });

  const [formError, setFormError] =
    useState("");

  const isEditing = Boolean(
    selectedUser?._id
  );

  // ==========================================
  // LOAD USERS
  // ==========================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<
        string,
        string | number
      > = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (roleFilter !== "all") {
        params.role = roleFilter;
      }

      if (statusFilter !== "all") {
        params.isActive =
          statusFilter === "active"
            ? "true"
            : "false";
      }

      const response = await api.get(
        "/hr/users",
        {
          params,
        }
      );

      const payload = response.data;

      setUsers(
        Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.users)
            ? payload.users
            : []
      );

      if (payload?.pagination) {
        setPagination({
          page:
            payload.pagination.page || page,
          limit:
            payload.pagination.limit || limit,
          total:
            payload.pagination.total || 0,
          pages:
            payload.pagination.pages ||
            payload.pagination.totalPages ||
            1,
          totalPages:
            payload.pagination.totalPages ||
            payload.pagination.pages ||
            1,
        });
      }
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD EMPLOYEES
  // ==========================================

  const loadEmployees = async () => {
    try {
      const response = await api.get(
        "/hr/employees",
        {
          params: {
            page: 1,
            limit: 500,
          },
        }
      );

      const payload = response.data;

      // The employees API may return any of these shapes:
      // { data: [] }
      // { data: { employees: [] } }
      // { data: { items: [] } }
      // { data: { docs: [] } }
      // { employees: [] }
      // { items: [] }
      // { docs: [] }
      const list =
        Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.employees)
            ? payload.data.employees
            : Array.isArray(payload?.data?.items)
              ? payload.data.items
              : Array.isArray(payload?.data?.docs)
                ? payload.data.docs
                : Array.isArray(payload?.employees)
                  ? payload.employees
                  : Array.isArray(payload?.items)
                    ? payload.items
                    : Array.isArray(payload?.docs)
                      ? payload.docs
                      : [];

      const normalizedEmployees: Employee[] =
        list.map((employee: Employee) => ({
          ...employee,
          name:
            employee.name?.trim() ||
            [
              employee.firstName,
              employee.lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            employee.email ||
            "Unnamed Employee",
        }));

      console.log(
        "User Management - employees loaded:",
        normalizedEmployees.length,
        normalizedEmployees
      );

      setEmployees(normalizedEmployees);
    } catch (err) {
      console.error(
        "Failed to load employees:",
        err
      );
    }
  };

  useEffect(() => {
    loadUsers();
  }, [
    page,
    limit,
    roleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    loadEmployees();
  }, []);

  // ==========================================
  // STATS
  // ==========================================

  const stats = useMemo(() => {
    const total =
      pagination.total ||
      users.length;

    const active = users.filter(
      (user) => user.isActive !== false
    ).length;

    const hrCount = users.filter(
      (user) => user.role === "hr"
    ).length;

    const superAdminCount =
      users.filter(
        (user) =>
          user.role === "super_admin"
      ).length;

    return {
      total,
      active,
      hr: hrCount,
      superAdmin: superAdminCount,
    };
  }, [users, pagination.total]);

  // ==========================================
  // FORM
  // ==========================================

  const openCreateModal = () => {
    setSelectedUser(null);

    setForm({
      ...initialForm,
      password: "",
    });

    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      password: "",
      employee:
        typeof user.employee === "string"
          ? user.employee
          : user.employee?._id || "",
      isActive:
        user.isActive !== false,
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedUser(null);
    setForm(initialForm);
    setFormError("");
  };

  const updateForm = <
    K extends keyof UserForm
  >(
    field: K,
    value: UserForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Name is required."
      );
      return;
    }

    if (!form.email.trim()) {
      setFormError(
        "Email address is required."
      );
      return;
    }

    if (!isEditing && !form.password) {
      setFormError(
        "Password is required when creating a user."
      );
      return;
    }

    if (
      !isEditing &&
      form.password.length < 8
    ) {
      setFormError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      form.role === "employee" &&
      !form.employee
    ) {
      setFormError(
        "Please link this user to an employee."
      );
      return;
    }

    try {
      setSaving(true);

      const payload: Record<
        string,
        unknown
      > = {
        name: form.name.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        isActive: form.isActive,
      };

      if (form.employee) {
        payload.employee =
          form.employee;
      }

      if (form.password) {
        payload.password =
          form.password;
      }

      if (isEditing && selectedUser) {
        await api.patch(
          `/hr/users/${selectedUser._id}`,
          payload
        );
      } else {
        await api.post(
          "/auth/users",
          payload
        );
      }

      closeModal();
      await loadUsers();
    } catch (err) {
      setFormError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE
  // ==========================================

  const toggleStatus = async (
    user: User
  ) => {
    const nextStatus =
      user.isActive === false;

    const action = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name || user.email}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(user._id);

      await api.patch(
        `/hr/users/${user._id}/status`,
        {
          isActive: nextStatus,
        }
      );

      await loadUsers();
    } catch (err) {
      window.alert(
        getErrorMessage(err)
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  const openPasswordModal = (
    user: User
  ) => {
    setSelectedUser(user);

    setPasswordForm({
      password: "",
      confirmPassword: "",
    });

    setFormError("");
    setShowPasswordModal(true);
  };

  const handlePasswordReset = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedUser) return;

    setFormError("");

    if (
      passwordForm.password.length < 8
    ) {
      setFormError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      passwordForm.password !==
      passwordForm.confirmPassword
    ) {
      setFormError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setSaving(true);

      await api.patch(
        `/hr/users/${selectedUser._id}/password`,
        {
          password:
            passwordForm.password,
        }
      );

      setShowPasswordModal(false);
      setSelectedUser(null);

      window.alert(
        "Password updated successfully."
      );
    } catch (err) {
      setFormError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DETAILS
  // ==========================================

  const openDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages =
    pagination.pages ||
    pagination.totalPages ||
    1;

  const goToPage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    setPage(nextPage);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Shield size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                User Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage HRMS users, roles and
                access permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadUsers();
              loadEmployees();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} />

            Add User
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* STATS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.total}
          icon={<Users size={20} />}
          description="Registered HRMS accounts"
        />

        <StatCard
          label="Active Users"
          value={stats.active}
          icon={<UserCheck size={20} />}
          description="Currently enabled accounts"
        />

        <StatCard
          label="HR Admins"
          value={stats.hr}
          icon={<Shield size={20} />}
          description="HR management accounts"
        />

        <StatCard
          label="Super Admins"
          value={stats.superAdmin}
          icon={<Shield size={20} />}
          description="Highest-level accounts"
        />
      </div>

      {/* ====================================== */}
      {/* ERROR */}
      {/* ====================================== */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>
            <p className="font-semibold">
              Unable to load users
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ====================================== */}
      {/* FILTER BAR */}
      {/* ====================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadUsers();
                }
              }}
              placeholder="Search by name, email or employee ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (current) => !current
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Filter size={16} />

            Filters
          </button>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadUsers();
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </label>

              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(
                    event.target.value as
                      | "all"
                      | UserRole
                  );
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="all">
                  All Roles
                </option>

                <option value="employee">
                  Employee
                </option>

                <option value="hr">
                  HR Admin
                </option>

                <option value="super_admin">
                  Super Admin
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "active"
                      | "inactive"
                  );
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* DESKTOP TABLE */}
      {/* ====================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  User
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Role
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Employee
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Last Login
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <Loader2
                      size={25}
                      className="mx-auto animate-spin text-slate-400"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading users...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <Users
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No users found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search
                      or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {getInitials(
                            user.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {user.name ||
                              "Unnamed User"}
                          </p>

                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail
                              size={12}
                            />

                            <span className="truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <RoleBadge
                        role={user.role}
                      />
                    </td>

                    <td className="px-5 py-4">
                      {user.employee ? (
                        <div>
                          <p className="font-medium text-slate-800">
                            {getEmployeeName(
                              user.employee
                            )}
                          </p>

                          {getEmployeeId(
                            user.employee
                          ) && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                getEmployeeId(
                                  user.employee
                                )
                              }
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Not linked
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        active={
                          user.isActive !== false
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {formatDateTime(
                          user.lastLogin
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <IconButton
                          title="View details"
                          onClick={() =>
                            openDetails(user)
                          }
                        >
                          <Eye size={16} />
                        </IconButton>

                        <IconButton
                          title="Edit user"
                          onClick={() =>
                            openEditModal(
                              user
                            )
                          }
                        >
                          <Edit3 size={16} />
                        </IconButton>

                        <IconButton
                          title="Reset password"
                          onClick={() =>
                            openPasswordModal(
                              user
                            )
                          }
                        >
                          <KeyRound
                            size={16}
                          />
                        </IconButton>

                        <IconButton
                          title={
                            user.isActive ===
                            false
                              ? "Activate user"
                              : "Deactivate user"
                          }
                          disabled={
                            actionLoading ===
                            user._id
                          }
                          onClick={() =>
                            toggleStatus(
                              user
                            )
                          }
                        >
                          {actionLoading ===
                          user._id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : user.isActive ===
                            false ? (
                            <UserCheck
                              size={16}
                            />
                          ) : (
                            <UserX
                              size={16}
                            />
                          )}
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

      {/* ====================================== */}
      {/* MOBILE CARDS */}
      {/* ====================================== */}

      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <Loader2
              size={25}
              className="mx-auto animate-spin text-slate-400"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading users...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <Users
              size={35}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              No users found
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {getInitials(
                      user.name
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {user.name ||
                        "Unnamed User"}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <StatusBadge
                  active={
                    user.isActive !== false
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <RoleBadge
                  role={user.role}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Employee
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {getEmployeeName(
                      user.employee
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Last Login
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(
                      user.lastLogin
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <IconButton
                  title="View details"
                  onClick={() =>
                    openDetails(user)
                  }
                >
                  <Eye size={16} />
                </IconButton>

                <IconButton
                  title="Edit user"
                  onClick={() =>
                    openEditModal(user)
                  }
                >
                  <Edit3 size={16} />
                </IconButton>

                <IconButton
                  title="Reset password"
                  onClick={() =>
                    openPasswordModal(
                      user
                    )
                  }
                >
                  <KeyRound size={16} />
                </IconButton>

                <IconButton
                  title={
                    user.isActive ===
                    false
                      ? "Activate user"
                      : "Deactivate user"
                  }
                  disabled={
                    actionLoading ===
                    user._id
                  }
                  onClick={() =>
                    toggleStatus(user)
                  }
                >
                  {actionLoading ===
                  user._id ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : user.isActive ===
                    false ? (
                    <UserCheck
                      size={16}
                    />
                  ) : (
                    <UserX size={16} />
                  )}
                </IconButton>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ====================================== */}
      {/* PAGINATION */}
      {/* ====================================== */}

      {pagination.total > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(
                (page - 1) * limit + 1,
                pagination.total
              )}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(
                page * limit,
                pagination.total
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {pagination.total}
            </span>{" "}
            users
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                goToPage(page - 1)
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from(
              {
                length: Math.min(
                  totalPages,
                  5
                ),
              },
              (_, index) => {
                let pageNumber =
                  index + 1;

                if (
                  totalPages > 5 &&
                  page > 3
                ) {
                  pageNumber =
                    Math.min(
                      page - 2 + index,
                      totalPages - 4 + index
                    );
                }

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() =>
                      goToPage(
                        pageNumber
                      )
                    }
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition ${
                      page === pageNumber
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}

            <button
              type="button"
              disabled={
                page >= totalPages
              }
              onClick={() =>
                goToPage(page + 1)
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditing
                    ? "Edit User"
                    : "Create User"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Configure account access and
                  role.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto"
            >
              <div className="space-y-5 p-5">
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {/* Name / Email */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Full Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Enter full name"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="name@company.com"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                {/* Phone / Role */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Phone
                    </label>

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateForm(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="Phone number"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Role{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      value={form.role}
                      onChange={(event) =>
                        updateForm(
                          "role",
                          event.target
                            .value as UserRole
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="employee">
                        Employee
                      </option>

                      <option value="hr">
                        HR Admin
                      </option>

                      <option value="super_admin">
                        Super Admin
                      </option>
                    </select>
                  </div>
                </div>

                {/* Employee */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Link Employee
                    {form.role ===
                      "employee" && (
                      <span className="text-red-500">
                        {" "}
                        *
                      </span>
                    )}
                  </label>

                  <select
                    value={form.employee}
                    onChange={(event) =>
                      updateForm(
                        "employee",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee._id}
                          value={
                            employee._id
                          }
                        >
                          {employee.employeeId
                            ? `${employee.employeeId} — `
                            : ""}
                          {getEmployeeName(employee)}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Link the login account to an
                    existing employee HR profile.
                  </p>
                </div>

                {/* Password */}
                {!isEditing && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Password{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateForm(
                          "password",
                          event.target.value
                        )
                      }
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                )}

                {/* Status */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      updateForm(
                        "isActive",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Active account
                    </p>

                    <p className="text-xs text-slate-500">
                      Allow this user to log in to
                      the HRMS.
                    </p>
                  </div>
                </label>

                {/* Role info */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-900">
                    {roleLabels[form.role]}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    {form.role ===
                      "employee" &&
                      "Employee accounts can access their own HR profile, attendance, leave, documents, notices and payslips."}

                    {form.role === "hr" &&
                      "HR Admin accounts can manage recruitment, employees, attendance, leave, documents, payroll, notices and mail."}

                    {form.role ===
                      "super_admin" &&
                      "Super Admin accounts have full HRMS administration access, including users, organization settings and audit logs."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {isEditing
                    ? "Save Changes"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* DETAILS MODAL */}
      {/* ====================================== */}

      {showDetails &&
        selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {getInitials(
                        selectedUser.name
                      )}
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        {selectedUser.name ||
                          "Unnamed User"}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowDetails(false)
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="flex flex-wrap gap-2">
                  <RoleBadge
                    role={
                      selectedUser.role
                    }
                  />

                  <StatusBadge
                    active={
                      selectedUser.isActive !==
                      false
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {selectedUser.phone ||
                        "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatDate(
                        selectedUser.createdAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Last Login
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatDateTime(
                        selectedUser.lastLogin
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Employee ID
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {getEmployeeId(
                        selectedUser.employee
                      ) || "Not linked"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Linked Employee
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {getEmployeeName(
                      selectedUser.employee
                    )}
                  </p>

                  {selectedUser.employee && (
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p>
                        Department:{" "}
                        {getDepartmentName(
                          selectedUser.employee
                        )}
                      </p>

                      <p>
                        Designation:{" "}
                        {getDesignationName(
                          selectedUser.employee
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetails(
                        false
                      );
                      openEditModal(
                        selectedUser
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetails(
                        false
                      );
                      openPasswordModal(
                        selectedUser
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <KeyRound size={15} />
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ====================================== */}
      {/* PASSWORD MODAL */}
      {/* ====================================== */}

      {showPasswordModal &&
        selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Reset Password
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedUser.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordModal(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={
                  handlePasswordReset
                }
              >
                <div className="space-y-4 p-5">
                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      New Password
                    </label>

                    <input
                      type="password"
                      value={
                        passwordForm.password
                      }
                      onChange={(event) =>
                        setPasswordForm(
                          (current) => ({
                            ...current,
                            password:
                              event.target
                                .value,
                          })
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      value={
                        passwordForm.confirmPassword
                      }
                      onChange={(event) =>
                        setPasswordForm(
                          (current) => ({
                            ...current,
                            confirmPassword:
                              event.target
                                .value,
                          })
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordModal(
                        false
                      )
                    }
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}