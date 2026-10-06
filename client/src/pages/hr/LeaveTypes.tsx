import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";
import {
  CalendarDays,
  Check,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface LeaveType {
  _id: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LeaveTypeForm {
  name: string;
  annualQuota: number;
  isPaid: boolean;
  isActive: boolean;
}

const initialForm: LeaveTypeForm = {
  name: "",
  annualQuota: 12,
  isPaid: true,
  isActive: true,
};

const LeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] =
    useState<LeaveTypeForm>(initialForm);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  /* =====================================================
     LOAD LEAVE TYPES
  ===================================================== */

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/hr/leave-types"
      );

      const data = response.data?.data;

      if (Array.isArray(data)) {
        setLeaveTypes(data);
      } else if (Array.isArray(data?.items)) {
        setLeaveTypes(data.items);
      } else if (
        Array.isArray(response.data?.items)
      ) {
        setLeaveTypes(response.data.items);
      } else {
        setLeaveTypes([]);
      }
    } catch (err: any) {
      console.error(
        "Failed to load leave types:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load leave types."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredLeaveTypes = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return leaveTypes.filter((leaveType) => {
      const matchesSearch =
        !keyword ||
        leaveType.name
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          leaveType.isActive) ||
        (statusFilter === "inactive" &&
          !leaveType.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    leaveTypes,
    search,
    statusFilter,
  ]);

  /* =====================================================
     STATS
  ===================================================== */

  const totalCount =
    leaveTypes.length;

  const activeCount =
    leaveTypes.filter(
      (item) => item.isActive
    ).length;

  const inactiveCount =
    leaveTypes.filter(
      (item) => !item.isActive
    ).length;

  const paidCount =
    leaveTypes.filter(
      (item) => item.isPaid
    ).length;

  /* =====================================================
     OPEN CREATE
  ===================================================== */

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEdit = (
    leaveType: LeaveType
  ) => {
    setEditingId(leaveType._id);

    setForm({
      name: leaveType.name || "",
      annualQuota:
        Number(
          leaveType.annualQuota
        ) || 0,
      isPaid:
        Boolean(
          leaveType.isPaid
        ),
      isActive:
        Boolean(
          leaveType.isActive
        ),
    });

    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Leave type name is required."
      );
      return;
    }

    if (
      Number(form.annualQuota) < 0
    ) {
      setError(
        "Annual quota cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name,
        annualQuota:
          Number(form.annualQuota),
        isPaid:
          Boolean(form.isPaid),
        isActive:
          Boolean(form.isActive),
      };

      if (editingId) {
        await api.put(
          `/hr/leave-types/${editingId}`,
          payload
        );

        setSuccessMessage(
          "Leave type updated successfully."
        );
      } else {
        await api.post(
          "/hr/leave-types",
          payload
        );

        setSuccessMessage(
          "Leave type created successfully."
        );
      }

      await loadLeaveTypes();

      setShowModal(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (err: any) {
      console.error(
        "Save leave type error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save leave type."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (
    leaveType: LeaveType
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${leaveType.name}"?`
      );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/hr/leave-types/${leaveType._id}`
      );

      setSuccessMessage(
        "Leave type deleted successfully."
      );

      await loadLeaveTypes();
    } catch (err: any) {
      console.error(
        "Delete leave type error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to delete leave type."
      );
    }
  };

  /* =====================================================
     TOGGLE STATUS
  ===================================================== */

  const toggleStatus = async (
    leaveType: LeaveType
  ) => {
    try {
      setError("");

      await api.put(
        `/hr/leave-types/${leaveType._id}`,
        {
          isActive:
            !leaveType.isActive,
        }
      );

      setSuccessMessage(
        leaveType.isActive
          ? "Leave type deactivated."
          : "Leave type activated."
      );

      await loadLeaveTypes();
    } catch (err: any) {
      console.error(
        "Toggle leave type error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update status."
      );
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <CalendarDays size={23} />
              </div>

              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-10 w-auto object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Leave Types
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage employee leave categories and annual quotas.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <Plus size={18} />
            Add Leave Type
          </button>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <Check size={17} />
              {successMessage}
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && !showModal && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Types
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-500">
              {inactiveCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Paid Leave
            </p>

            <p className="mt-2 text-2xl font-bold text-[#FE0000]">
              {paidCount}
            </p>
          </div>

        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search leave types..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "all"
                    | "active"
                    | "inactive"
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#FE0000]"
            >
              <option value="all">
                All Status
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

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#FE0000]" />
            </div>
          ) : filteredLeaveTypes.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CalendarDays size={26} />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No leave types found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Add your first leave type such as Casual Leave,
                Sick Leave or Earned Leave.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Plus size={17} />
                Add Leave Type
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Leave Type
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Annual Quota
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Paid
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredLeaveTypes.map(
                    (leaveType) => (
                      <tr
                        key={
                          leaveType._id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 font-semibold text-[#FE0000]">
                              {leaveType.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {leaveType.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                Leave category
                              </p>
                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {
                              leaveType.annualQuota
                            }
                          </span>

                          <span className="ml-1 text-sm text-slate-500">
                            days/year
                          </span>
                        </td>

                        <td className="px-6 py-4">

                          {leaveType.isPaid ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Unpaid
                            </span>
                          )}

                        </td>

                        <td className="px-6 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                leaveType
                              )
                            }
                            className={
                              leaveType.isActive
                                ? "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                : "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                            }
                          >
                            {leaveType.isActive
                              ? "Active"
                              : "Inactive"}
                          </button>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  leaveType
                                )
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
                              title="Edit"
                            >
                              <Edit
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  leaveType
                                )
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? "Edit Leave Type"
                    : "Add Leave Type"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure the leave category for employees.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL BODY */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Leave Type Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Casual Leave"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  required
                />
              </div>

              {/* QUOTA */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Annual Quota
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={
                    form.annualQuota
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      annualQuota:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                  required
                />

                <p className="mt-1 text-xs text-slate-500">
                  Number of leave days available per year.
                </p>
              </div>

              {/* PAID */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Paid Leave
                  </p>

                  <p className="text-xs text-slate-500">
                    Employee receives salary during this leave.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      isPaid:
                        !form.isPaid,
                    })
                  }
                  className={
                    form.isPaid
                      ? "relative h-6 w-11 rounded-full bg-[#FE0000] transition"
                      : "relative h-6 w-11 rounded-full bg-slate-300 transition"
                  }
                >
                  <span
                    className={
                      form.isPaid
                        ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow"
                        : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow"
                    }
                  />
                </button>

              </div>

              {/* ACTIVE */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Active
                  </p>

                  <p className="text-xs text-slate-500">
                    Employees can select this leave type.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      isActive:
                        !form.isActive,
                    })
                  }
                  className={
                    form.isActive
                      ? "relative h-6 w-11 rounded-full bg-emerald-600 transition"
                      : "relative h-6 w-11 rounded-full bg-slate-300 transition"
                  }
                >
                  <span
                    className={
                      form.isActive
                        ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow"
                        : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow"
                    }
                  />
                </button>

              </div>

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Leave Type"
                    : "Create Leave Type"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTypes;