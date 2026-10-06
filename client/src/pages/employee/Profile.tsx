import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  BadgeCheck,
  Edit3,
  Save,
  X,
  Loader2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Department {
  _id?: string;
  name?: string;
}

interface Designation {
  _id?: string;
  name?: string;
}

interface Employee {
  _id: string;

  employeeId?: string;

  firstName?: string;
  lastName?: string;
  name?: string;

  email?: string;
  phone?: string;
  mobile?: string;

  gender?: string;
  dateOfBirth?: string;

  joiningDate?: string;
  dateOfJoining?: string;

  department?: Department | string | null;
  designation?: Designation | string | null;

  employmentType?: string;
  status?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  profilePhoto?: string;
  avatar?: string;
  photo?: string;

  panNumber?: string;
  aadhaarNumber?: string;

  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;

  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isEmployee(
  value: unknown
): value is Employee {
  if (!isObject(value)) {
    return false;
  }

  return typeof value._id === "string";
}

function extractEmployee(
  payload: unknown
): Employee | null {
  if (isEmployee(payload)) {
    return payload;
  }

  if (!isObject(payload)) {
    return null;
  }

  const directEmployee = payload.employee;

  if (isEmployee(directEmployee)) {
    return directEmployee;
  }

  const employees = payload.employees;

  if (Array.isArray(employees)) {
    const first = employees[0];

    if (isEmployee(first)) {
      return first;
    }
  }

  const data = payload.data;

  if (isEmployee(data)) {
    return data;
  }

  if (isObject(data)) {
    const nestedEmployee = data.employee;

    if (isEmployee(nestedEmployee)) {
      return nestedEmployee;
    }

    const nestedEmployees = data.employees;

    if (Array.isArray(nestedEmployees)) {
      const first = nestedEmployees[0];

      if (isEmployee(first)) {
        return first;
      }
    }
  }

  return null;
}

function getName(
  employee: Employee | null
): string {
  if (!employee) {
    return "Employee";
  }

  if (
    typeof employee.name === "string" &&
    employee.name.trim()
  ) {
    return employee.name.trim();
  }

  const firstName =
    typeof employee.firstName === "string"
      ? employee.firstName.trim()
      : "";

  const lastName =
    typeof employee.lastName === "string"
      ? employee.lastName.trim()
      : "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  return fullName || "Employee";
}

function getDepartment(
  employee: Employee | null
): string {
  if (!employee?.department) {
    return "Not assigned";
  }

  if (
    typeof employee.department === "string"
  ) {
    return employee.department;
  }

  return (
    employee.department.name ||
    "Not assigned"
  );
}

function getDesignation(
  employee: Employee | null
): string {
  if (!employee?.designation) {
    return "Not assigned";
  }

  if (
    typeof employee.designation === "string"
  ) {
    return employee.designation;
  }

  return (
    employee.designation.name ||
    "Not assigned"
  );
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getInitials(
  name: string
): string {
  const words = name
    .split(" ")
    .filter(
      (word: string) => word.trim()
    );

  return words
    .slice(0, 2)
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase()
    )
    .join("");
}

function getStatusClass(
  status?: string
): string {
  const normalized =
    status?.toLowerCase();

  if (
    normalized === "inactive" ||
    normalized === "terminated"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalized === "on_leave" ||
    normalized === "on leave"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getErrorMessage(
  error: unknown
): string {
  if (!isObject(error)) {
    return "Something went wrong.";
  }

  const response =
    error.response;

  if (isObject(response)) {
    const data =
      response.data;

    if (
      isObject(data) &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  }

  if (
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong.";
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function EmployeeProfile() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const [editing, setEditing] =
    useState<boolean>(false);

  const [form, setForm] = useState({
    phone: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Linked employee ID                                                       */
  /* ------------------------------------------------------------------------ */

  const employeeId =
    useMemo<string>(() => {
      if (!user?.employee) {
        return "";
      }

      if (
        typeof user.employee ===
        "string"
      ) {
        return user.employee;
      }

      return (
        user.employee._id ||
        user.employee.id ||
        ""
      );
    }, [user]);

  /* ------------------------------------------------------------------------ */
  /* Load profile                                                             */
  /* ------------------------------------------------------------------------ */

  const loadProfile =
    async () => {
      try {
        setLoading(true);
        setError("");

        let response;

        if (employeeId) {
          response =
            await api.get(
              `/hr/employees/${employeeId}`
            );
        } else {
          response =
            await api.get(
              "/employee/profile"
            );
        }

        const foundEmployee =
          extractEmployee(
            response.data
          );

        if (!foundEmployee) {
          throw new Error(
            "Employee profile was not found."
          );
        }

        setEmployee(
          foundEmployee
        );

        setForm({
          phone:
            typeof foundEmployee.phone ===
            "string"
              ? foundEmployee.phone
              : "",

          mobile:
            typeof foundEmployee.mobile ===
            "string"
              ? foundEmployee.mobile
              : "",

          address:
            typeof foundEmployee.address ===
            "string"
              ? foundEmployee.address
              : "",

          city:
            typeof foundEmployee.city ===
            "string"
              ? foundEmployee.city
              : "",

          state:
            typeof foundEmployee.state ===
            "string"
              ? foundEmployee.state
              : "",

          pincode:
            typeof foundEmployee.pincode ===
            "string"
              ? foundEmployee.pincode
              : "",

          emergencyContactName:
            typeof foundEmployee.emergencyContactName ===
            "string"
              ? foundEmployee.emergencyContactName
              : "",

          emergencyContactPhone:
            typeof foundEmployee.emergencyContactPhone ===
            "string"
              ? foundEmployee.emergencyContactPhone
              : "",
        });
      } catch (
        err: unknown
      ) {
        console.error(
          "Failed to load employee profile:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadProfile();
  }, [employeeId]);

  /* ------------------------------------------------------------------------ */
  /* Form                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Save                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleSave =
    async () => {
      if (!employee?._id) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        const response =
          await api.put(
            `/hr/employees/${employee._id}`,
            {
              phone:
                form.phone.trim(),

              mobile:
                form.mobile.trim(),

              address:
                form.address.trim(),

              city:
                form.city.trim(),

              state:
                form.state.trim(),

              pincode:
                form.pincode.trim(),

              emergencyContactName:
                form.emergencyContactName.trim(),

              emergencyContactPhone:
                form.emergencyContactPhone.trim(),
            }
          );

        const updatedEmployee =
          extractEmployee(
            response.data
          );

        if (updatedEmployee) {
          setEmployee(
            updatedEmployee
          );

          setForm({
            phone:
              typeof updatedEmployee.phone ===
              "string"
                ? updatedEmployee.phone
                : "",

            mobile:
              typeof updatedEmployee.mobile ===
              "string"
                ? updatedEmployee.mobile
                : "",

            address:
              typeof updatedEmployee.address ===
              "string"
                ? updatedEmployee.address
                : "",

            city:
              typeof updatedEmployee.city ===
              "string"
                ? updatedEmployee.city
                : "",

            state:
              typeof updatedEmployee.state ===
              "string"
                ? updatedEmployee.state
                : "",

            pincode:
              typeof updatedEmployee.pincode ===
              "string"
                ? updatedEmployee.pincode
                : "",

            emergencyContactName:
              typeof updatedEmployee.emergencyContactName ===
              "string"
                ? updatedEmployee.emergencyContactName
                : "",

            emergencyContactPhone:
              typeof updatedEmployee.emergencyContactPhone ===
              "string"
                ? updatedEmployee.emergencyContactPhone
                : "",
          });
        } else {
          await loadProfile();
        }

        setEditing(false);
      } catch (
        err: unknown
      ) {
        console.error(
          "Failed to update employee profile:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setSaving(false);
      }
    };

  /* ------------------------------------------------------------------------ */
  /* Cancel                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleCancel =
    () => {
      if (!employee) {
        return;
      }

      setForm({
        phone:
          typeof employee.phone ===
          "string"
            ? employee.phone
            : "",

        mobile:
          typeof employee.mobile ===
          "string"
            ? employee.mobile
            : "",

        address:
          typeof employee.address ===
          "string"
            ? employee.address
            : "",

        city:
          typeof employee.city ===
          "string"
            ? employee.city
            : "",

        state:
          typeof employee.state ===
          "string"
            ? employee.state
            : "",

        pincode:
          typeof employee.pincode ===
          "string"
            ? employee.pincode
            : "",

        emergencyContactName:
          typeof employee.emergencyContactName ===
          "string"
            ? employee.emergencyContactName
            : "",

        emergencyContactPhone:
          typeof employee.emergencyContactPhone ===
          "string"
            ? employee.emergencyContactPhone
            : "",
      });

      setEditing(false);
      setError("");
    };

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#FE0000]" />

          <p className="text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Empty                                                                    */
  /* ------------------------------------------------------------------------ */

  if (!employee) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <User className="h-5 w-5 text-red-600" />
            </div>

            <div>
              <h2 className="font-semibold text-red-800">
                Profile unavailable
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error ||
                  "Your employee profile could not be loaded."}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadProfile()
                }
                className="mt-4 rounded-lg bg-[#FE0000] px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Values                                                                   */
  /* ------------------------------------------------------------------------ */

  const name =
    getName(employee);

  const department =
    getDepartment(employee);

  const designation =
    getDesignation(employee);

  const photo =
    employee.profilePhoto ||
    employee.avatar ||
    employee.photo ||
    "";

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ================================================================ */}
        {/* PAGE HEADER                                                       */}
        {/* ================================================================ */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FE0000]">
                Sellopedia
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                My Profile
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your employee information.
              </p>
            </div>

          </div>

          {!editing ? (
            <button
              type="button"
              onClick={() =>
                setEditing(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">

              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSave()
                }
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* ERROR                                                             */}
        {/* ================================================================ */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* PROFILE HERO                                                      */}
        {/* ================================================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="h-32 bg-linear-to-r from-[#FE0000] via-red-600 to-red-700" />

          <div className="px-5 pb-6 sm:px-8">

            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">

                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-red-50 text-2xl font-bold text-[#FE0000] shadow-lg">
                    {getInitials(name)}
                  </div>
                )}

                <div className="pb-1">

                  <h2 className="text-2xl font-bold text-slate-900">
                    {name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {designation}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {employee.employeeId && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        <CreditCard className="h-3.5 w-3.5" />
                        {employee.employeeId}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                        employee.status
                      )}`}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {employee.status ||
                        "Active"}
                    </span>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* EMPLOYMENT INFORMATION                                            */}
        {/* ================================================================ */}

        <ProfileSection
          icon={
            <Briefcase className="h-5 w-5 text-[#FE0000]" />
          }
          iconBackground="bg-red-50"
          title="Employment Information"
          description="Your organization and job details"
        >

          <InfoItem
            icon={
              <CreditCard className="h-4 w-4" />
            }
            label="Employee ID"
            value={
              employee.employeeId ||
              "Not assigned"
            }
          />

          <InfoItem
            icon={
              <Building2 className="h-4 w-4" />
            }
            label="Department"
            value={department}
          />

          <InfoItem
            icon={
              <Briefcase className="h-4 w-4" />
            }
            label="Designation"
            value={designation}
          />

          <InfoItem
            icon={
              <Calendar className="h-4 w-4" />
            }
            label="Joining Date"
            value={formatDate(
              employee.joiningDate ||
                employee.dateOfJoining
            )}
          />

          <InfoItem
            icon={
              <Briefcase className="h-4 w-4" />
            }
            label="Employment Type"
            value={
              employee.employmentType ||
              "Not specified"
            }
          />

          <InfoItem
            icon={
              <ShieldCheck className="h-4 w-4" />
            }
            label="Employment Status"
            value={
              employee.status ||
              "Active"
            }
          />

        </ProfileSection>

        {/* ================================================================ */}
        {/* PERSONAL INFORMATION                                              */}
        {/* ================================================================ */}

        <ProfileSection
          icon={
            <User className="h-5 w-5 text-[#FE0000]" />
          }
          iconBackground="bg-red-50"
          title="Personal Information"
          description="Basic personal and contact details"
        >

          <InfoItem
            icon={
              <User className="h-4 w-4" />
            }
            label="Full Name"
            value={name}
          />

          <InfoItem
            icon={
              <Mail className="h-4 w-4" />
            }
            label="Email"
            value={
              employee.email ||
              user?.email ||
              "Not available"
            }
          />

          <EditableInfoItem
            icon={
              <Phone className="h-4 w-4" />
            }
            label="Phone"
            value={form.phone}
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "phone",
                value
              )
            }
            type="tel"
          />

          <EditableInfoItem
            icon={
              <Phone className="h-4 w-4" />
            }
            label="Mobile"
            value={form.mobile}
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "mobile",
                value
              )
            }
            type="tel"
          />

          <InfoItem
            icon={
              <User className="h-4 w-4" />
            }
            label="Gender"
            value={
              employee.gender ||
              "Not specified"
            }
          />

          <InfoItem
            icon={
              <Calendar className="h-4 w-4" />
            }
            label="Date of Birth"
            value={formatDate(
              employee.dateOfBirth
            )}
          />

        </ProfileSection>

        {/* ================================================================ */}
        {/* ADDRESS                                                           */}
        {/* ================================================================ */}

        <ProfileSection
          icon={
            <MapPin className="h-5 w-5 text-[#FE0000]" />
          }
          iconBackground="bg-red-50"
          title="Address"
          description="Residential address information"
        >

          <div className="sm:col-span-2 lg:col-span-4">

            <EditableInfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Address"
              value={form.address}
              editing={editing}
              onChange={(value: string) =>
                handleChange(
                  "address",
                  value
                )
              }
              textarea
            />

          </div>

          <EditableInfoItem
            icon={
              <MapPin className="h-4 w-4" />
            }
            label="City"
            value={form.city}
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "city",
                value
              )
            }
          />

          <EditableInfoItem
            icon={
              <MapPin className="h-4 w-4" />
            }
            label="State"
            value={form.state}
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "state",
                value
              )
            }
          />

          <EditableInfoItem
            icon={
              <MapPin className="h-4 w-4" />
            }
            label="PIN Code"
            value={form.pincode}
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "pincode",
                value
              )
            }
          />

        </ProfileSection>

        {/* ================================================================ */}
        {/* EMERGENCY CONTACT                                                 */}
        {/* ================================================================ */}

        <ProfileSection
          icon={
            <Phone className="h-5 w-5 text-red-600" />
          }
          iconBackground="bg-red-50"
          title="Emergency Contact"
          description="Person to contact in case of emergency"
        >

          <EditableInfoItem
            icon={
              <User className="h-4 w-4" />
            }
            label="Contact Name"
            value={
              form.emergencyContactName
            }
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "emergencyContactName",
                value
              )
            }
          />

          <EditableInfoItem
            icon={
              <Phone className="h-4 w-4" />
            }
            label="Contact Phone"
            value={
              form.emergencyContactPhone
            }
            editing={editing}
            onChange={(value: string) =>
              handleChange(
                "emergencyContactPhone",
                value
              )
            }
            type="tel"
          />

        </ProfileSection>

        {/* ================================================================ */}
        {/* ATTENDANCE SECURITY                                               */}
        {/* ================================================================ */}

        <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">

          {/* Header */}
          <div className="border-b border-red-50 px-5 py-4 sm:px-6">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-red-50 p-2">
                <ShieldCheck className="h-5 w-5 text-[#FE0000]" />
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Attendance Security
                </h2>

                <p className="text-xs text-slate-500">
                  Manage your attendance PIN and
                  face recognition registration.
                </p>

              </div>

            </div>

          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              {/* Information */}
              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <ShieldCheck className="h-6 w-6 text-[#FE0000]" />
                </div>

                <div>

                  <h3 className="font-semibold text-slate-900">
                    Face & PIN Attendance
                  </h3>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Register your face and create
                    an attendance PIN for secure
                    attendance verification at the
                    office attendance terminal.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure Verification
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      Face + PIN
                    </span>

                  </div>

                </div>

              </div>

              {/* Action */}
              <div className="shrink-0">

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/employee/attendance-security"
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 lg:w-auto"
                >
                  <ShieldCheck className="h-4 w-4" />

                  Manage Attendance Security
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================================ */}
        {/* SECURITY INFORMATION                                              */}
        {/* ================================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">

          <div className="flex items-start gap-3">

            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#FE0000]" />

            <p>
              Employee ID, Department,
              Designation, Joining Date and
              other HR-controlled information
              can only be changed by HR or
              Super Admin.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile Section                                                            */
/* -------------------------------------------------------------------------- */

interface ProfileSectionProps {
  icon: ReactNode;
  iconBackground: string;
  title: string;
  description: string;
  children: ReactNode;
}

function ProfileSection({
  icon,
  iconBackground,
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

        <div className="flex items-center gap-3">

          <div
            className={`rounded-lg p-2 ${iconBackground}`}
          >
            {icon}
          </div>

          <div>

            <h2 className="font-semibold text-slate-900">
              {title}
            </h2>

            <p className="text-xs text-slate-500">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {children}
      </div>

    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Info Item                                                                  */
/* -------------------------------------------------------------------------- */

interface InfoItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function InfoItem({
  icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="min-w-0">

      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">

        {icon}

        <span>
          {label}
        </span>

      </div>

      <p className="wrap-break-word text-sm font-semibold text-slate-800">
        {value ||
          "Not available"}
      </p>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Editable Info Item                                                         */
/* -------------------------------------------------------------------------- */

interface EditableInfoItemProps {
  icon: ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onChange: (
    value: string
  ) => void;
  type?: string;
  textarea?: boolean;
}

function EditableInfoItem({
  icon,
  label,
  value,
  editing,
  onChange,
  type = "text",
  textarea = false,
}: EditableInfoItemProps) {
  return (
    <div className="min-w-0">

      <label className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">

        {icon}

        <span>
          {label}
        </span>

      </label>

      {editing ? (
        textarea ? (
          <textarea
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
          />
        )
      ) : (
        <p className="wrap-break-word text-sm font-semibold text-slate-800">
          {value ||
            "Not available"}
        </p>
      )}

    </div>
  );
}