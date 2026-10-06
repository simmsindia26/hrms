import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Save,
  Settings2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import api from "../../lib/axios";

interface OrganizationSettings {
  company?: {
    name?: string;
    legalName?: string;
    registrationNumber?: string;
    gstNumber?: string;
    panNumber?: string;
    tanNumber?: string;
    logoUrl?: string;
    website?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };

  payroll?: {
    workingDaysBasis?: number;
    payrollMonthStartDay?: number;
    payrollMonthEndDay?: number;
    salaryPeriod?: "monthly" | "daily";
    currency?: string;
    overtimeEnabled?: boolean;
    overtimeMultiplier?: number;
    halfDayMultiplier?: number;
    lossOfPayEnabled?: boolean;
    roundingRule?: "none" | "nearest" | "floor" | "ceil";
  };

  attendance?: {
    workingDays?: string[];
    officeStartTime?: string;
    officeEndTime?: string;
    lateMarkAfterMinutes?: number;
    halfDayAfterHours?: number;
    absentAfterHours?: number;
    gracePeriodMinutes?: number;
    requireCheckIn?: boolean;
    requireCheckOut?: boolean;
    allowManualAttendance?: boolean;
  };

  leave?: {
    annualLeaveDays?: number;
    sickLeaveDays?: number;
    casualLeaveDays?: number;
    paidLeaveEnabled?: boolean;
    carryForwardEnabled?: boolean;
    maximumCarryForwardDays?: number;
    requireApproval?: boolean;
    minimumNoticeDays?: number;
  };

  employee?: {
    probationPeriodDays?: number;
    defaultNoticePeriodDays?: number;
    confirmationAfterProbation?: boolean;
    employeeIdPrefix?: string;
  };

  email?: {
    hrEmail?: string;
    recruitmentEmail?: string;
    payrollEmail?: string;
    sendAttendanceEmails?: boolean;
    sendLeaveEmails?: boolean;
    sendRecruitmentEmails?: boolean;
    sendPayrollEmails?: boolean;
  };

  policies?: {
    workingHoursPerDay?: number;
    workingDaysPerWeek?: number;
    minimumAge?: number;
    retirementAge?: number;
    enableEmployeeDocuments?: boolean;
    enableEmployeeNotifications?: boolean;
  };

  financialYear?: {
    startMonth?: number;
    startDay?: number;
  };
}

interface FormState {
  companyName: string;
  legalName: string;
  registrationNumber: string;
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  website: string;
  email: string;
  phone: string;
  alternatePhone: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  workingDaysBasis: string;
  payrollMonthStartDay: string;
  payrollMonthEndDay: string;
  salaryPeriod: "monthly" | "daily";
  currency: string;
  overtimeEnabled: boolean;
  overtimeMultiplier: string;
  halfDayMultiplier: string;
  lossOfPayEnabled: boolean;
  roundingRule: "none" | "nearest" | "floor" | "ceil";

  workingDays: string[];
  officeStartTime: string;
  officeEndTime: string;
  lateMarkAfterMinutes: string;
  halfDayAfterHours: string;
  absentAfterHours: string;
  gracePeriodMinutes: string;
  requireCheckIn: boolean;
  requireCheckOut: boolean;
  allowManualAttendance: boolean;

  annualLeaveDays: string;
  sickLeaveDays: string;
  casualLeaveDays: string;
  paidLeaveEnabled: boolean;
  carryForwardEnabled: boolean;
  maximumCarryForwardDays: string;
  requireApproval: boolean;
  minimumNoticeDays: string;

  probationPeriodDays: string;
  defaultNoticePeriodDays: string;
  confirmationAfterProbation: boolean;
  employeeIdPrefix: string;

  hrEmail: string;
  recruitmentEmail: string;
  payrollEmail: string;
  sendAttendanceEmails: boolean;
  sendLeaveEmails: boolean;
  sendRecruitmentEmails: boolean;
  sendPayrollEmails: boolean;

  workingHoursPerDay: string;
  workingDaysPerWeek: string;
  minimumAge: string;
  retirementAge: string;
  enableEmployeeDocuments: boolean;
  enableEmployeeNotifications: boolean;

  financialYearStartMonth: string;
  financialYearStartDay: string;
}

const defaultForm: FormState = {
  companyName: "Sellopedia",
  legalName: "",
  registrationNumber: "",
  gstNumber: "",
  panNumber: "",
  tanNumber: "",
  website: "",
  email: "",
  phone: "",
  alternatePhone: "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",

  workingDaysBasis: "26",
  payrollMonthStartDay: "1",
  payrollMonthEndDay: "31",
  salaryPeriod: "monthly",
  currency: "INR",
  overtimeEnabled: false,
  overtimeMultiplier: "1.5",
  halfDayMultiplier: "0.5",
  lossOfPayEnabled: true,
  roundingRule: "none",

  workingDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  officeStartTime: "09:30",
  officeEndTime: "18:30",
  lateMarkAfterMinutes: "15",
  halfDayAfterHours: "4",
  absentAfterHours: "2",
  gracePeriodMinutes: "10",
  requireCheckIn: true,
  requireCheckOut: true,
  allowManualAttendance: true,

  annualLeaveDays: "12",
  sickLeaveDays: "12",
  casualLeaveDays: "12",
  paidLeaveEnabled: true,
  carryForwardEnabled: false,
  maximumCarryForwardDays: "0",
  requireApproval: true,
  minimumNoticeDays: "1",

  probationPeriodDays: "180",
  defaultNoticePeriodDays: "30",
  confirmationAfterProbation: true,
  employeeIdPrefix: "EMP",

  hrEmail: "",
  recruitmentEmail: "",
  payrollEmail: "",
  sendAttendanceEmails: true,
  sendLeaveEmails: true,
  sendRecruitmentEmails: true,
  sendPayrollEmails: true,

  workingHoursPerDay: "8",
  workingDaysPerWeek: "6",
  minimumAge: "18",
  retirementAge: "60",
  enableEmployeeDocuments: true,
  enableEmployeeNotifications: true,

  financialYearStartMonth: "4",
  financialYearStartDay: "1",
};

const tabs = [
  {
    id: "company",
    label: "Company",
    icon: Building2,
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: WalletCards,
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: Clock3,
  },
  {
    id: "leave",
    label: "Leave",
    icon: CalendarDays,
  },
  {
    id: "employee",
    label: "Employee",
    icon: ShieldCheck,
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
  },
  {
    id: "policies",
    label: "Policies",
    icon: FileText,
  },
];

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

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

const numberValue = (value: string) => {
  if (value === "") return 0;
  return Number(value);
};

const Organization = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [form, setForm] = useState<FormState>(defaultForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/settings/organization");

      const settings: OrganizationSettings =
        response.data?.data || response.data?.settings || {};

      const company = settings.company || {};
      const address = company.address || {};
      const payroll = settings.payroll || {};
      const attendance = settings.attendance || {};
      const leave = settings.leave || {};
      const employee = settings.employee || {};
      const email = settings.email || {};
      const policies = settings.policies || {};
      const financialYear = settings.financialYear || {};

      setForm({
        ...defaultForm,

        companyName:
          company.name ?? defaultForm.companyName,
        legalName:
          company.legalName ?? defaultForm.legalName,
        registrationNumber:
          company.registrationNumber ??
          defaultForm.registrationNumber,
        gstNumber:
          company.gstNumber ?? defaultForm.gstNumber,
        panNumber:
          company.panNumber ?? defaultForm.panNumber,
        tanNumber:
          company.tanNumber ?? defaultForm.tanNumber,
        website:
          company.website ?? defaultForm.website,
        email:
          company.email ?? defaultForm.email,
        phone:
          company.phone ?? defaultForm.phone,
        alternatePhone:
          company.alternatePhone ??
          defaultForm.alternatePhone,

        addressLine1:
          address.addressLine1 ??
          defaultForm.addressLine1,
        addressLine2:
          address.addressLine2 ??
          defaultForm.addressLine2,
        city:
          address.city ?? defaultForm.city,
        state:
          address.state ?? defaultForm.state,
        country:
          address.country ?? defaultForm.country,
        postalCode:
          address.postalCode ??
          defaultForm.postalCode,

        workingDaysBasis: String(
          payroll.workingDaysBasis ??
            defaultForm.workingDaysBasis,
        ),
        payrollMonthStartDay: String(
          payroll.payrollMonthStartDay ??
            defaultForm.payrollMonthStartDay,
        ),
        payrollMonthEndDay: String(
          payroll.payrollMonthEndDay ??
            defaultForm.payrollMonthEndDay,
        ),
        salaryPeriod:
          payroll.salaryPeriod ??
          defaultForm.salaryPeriod,
        currency:
          payroll.currency ??
          defaultForm.currency,
        overtimeEnabled:
          payroll.overtimeEnabled ??
          defaultForm.overtimeEnabled,
        overtimeMultiplier: String(
          payroll.overtimeMultiplier ??
            defaultForm.overtimeMultiplier,
        ),
        halfDayMultiplier: String(
          payroll.halfDayMultiplier ??
            defaultForm.halfDayMultiplier,
        ),
        lossOfPayEnabled:
          payroll.lossOfPayEnabled ??
          defaultForm.lossOfPayEnabled,
        roundingRule:
          payroll.roundingRule ??
          defaultForm.roundingRule,

        workingDays:
          attendance.workingDays ??
          defaultForm.workingDays,
        officeStartTime:
          attendance.officeStartTime ??
          defaultForm.officeStartTime,
        officeEndTime:
          attendance.officeEndTime ??
          defaultForm.officeEndTime,
        lateMarkAfterMinutes: String(
          attendance.lateMarkAfterMinutes ??
            defaultForm.lateMarkAfterMinutes,
        ),
        halfDayAfterHours: String(
          attendance.halfDayAfterHours ??
            defaultForm.halfDayAfterHours,
        ),
        absentAfterHours: String(
          attendance.absentAfterHours ??
            defaultForm.absentAfterHours,
        ),
        gracePeriodMinutes: String(
          attendance.gracePeriodMinutes ??
            defaultForm.gracePeriodMinutes,
        ),
        requireCheckIn:
          attendance.requireCheckIn ??
          defaultForm.requireCheckIn,
        requireCheckOut:
          attendance.requireCheckOut ??
          defaultForm.requireCheckOut,
        allowManualAttendance:
          attendance.allowManualAttendance ??
          defaultForm.allowManualAttendance,

        annualLeaveDays: String(
          leave.annualLeaveDays ??
            defaultForm.annualLeaveDays,
        ),
        sickLeaveDays: String(
          leave.sickLeaveDays ??
            defaultForm.sickLeaveDays,
        ),
        casualLeaveDays: String(
          leave.casualLeaveDays ??
            defaultForm.casualLeaveDays,
        ),
        paidLeaveEnabled:
          leave.paidLeaveEnabled ??
          defaultForm.paidLeaveEnabled,
        carryForwardEnabled:
          leave.carryForwardEnabled ??
          defaultForm.carryForwardEnabled,
        maximumCarryForwardDays: String(
          leave.maximumCarryForwardDays ??
            defaultForm.maximumCarryForwardDays,
        ),
        requireApproval:
          leave.requireApproval ??
          defaultForm.requireApproval,
        minimumNoticeDays: String(
          leave.minimumNoticeDays ??
            defaultForm.minimumNoticeDays,
        ),

        probationPeriodDays: String(
          employee.probationPeriodDays ??
            defaultForm.probationPeriodDays,
        ),
        defaultNoticePeriodDays: String(
          employee.defaultNoticePeriodDays ??
            defaultForm.defaultNoticePeriodDays,
        ),
        confirmationAfterProbation:
          employee.confirmationAfterProbation ??
          defaultForm.confirmationAfterProbation,
        employeeIdPrefix:
          employee.employeeIdPrefix ??
          defaultForm.employeeIdPrefix,

        hrEmail:
          email.hrEmail ?? defaultForm.hrEmail,
        recruitmentEmail:
          email.recruitmentEmail ??
          defaultForm.recruitmentEmail,
        payrollEmail:
          email.payrollEmail ??
          defaultForm.payrollEmail,
        sendAttendanceEmails:
          email.sendAttendanceEmails ??
          defaultForm.sendAttendanceEmails,
        sendLeaveEmails:
          email.sendLeaveEmails ??
          defaultForm.sendLeaveEmails,
        sendRecruitmentEmails:
          email.sendRecruitmentEmails ??
          defaultForm.sendRecruitmentEmails,
        sendPayrollEmails:
          email.sendPayrollEmails ??
          defaultForm.sendPayrollEmails,

        workingHoursPerDay: String(
          policies.workingHoursPerDay ??
            defaultForm.workingHoursPerDay,
        ),
        workingDaysPerWeek: String(
          policies.workingDaysPerWeek ??
            defaultForm.workingDaysPerWeek,
        ),
        minimumAge: String(
          policies.minimumAge ??
            defaultForm.minimumAge,
        ),
        retirementAge: String(
          policies.retirementAge ??
            defaultForm.retirementAge,
        ),
        enableEmployeeDocuments:
          policies.enableEmployeeDocuments ??
          defaultForm.enableEmployeeDocuments,
        enableEmployeeNotifications:
          policies.enableEmployeeNotifications ??
          defaultForm.enableEmployeeNotifications,

        financialYearStartMonth: String(
          financialYear.startMonth ??
            defaultForm.financialYearStartMonth,
        ),
        financialYearStartDay: String(
          financialYear.startDay ??
            defaultForm.financialYearStartDay,
        ),
      });
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to load organization settings.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const buildPayload = (): OrganizationSettings => {
    return {
      company: {
        name: form.companyName.trim(),
        legalName: form.legalName.trim(),
        registrationNumber:
          form.registrationNumber.trim(),
        gstNumber: form.gstNumber.trim(),
        panNumber: form.panNumber.trim(),
        tanNumber: form.tanNumber.trim(),
        website: form.website.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        alternatePhone:
          form.alternatePhone.trim(),
        address: {
          addressLine1:
            form.addressLine1.trim(),
          addressLine2:
            form.addressLine2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim(),
          postalCode:
            form.postalCode.trim(),
        },
      },

      payroll: {
        workingDaysBasis:
          numberValue(form.workingDaysBasis),
        payrollMonthStartDay:
          numberValue(
            form.payrollMonthStartDay,
          ),
        payrollMonthEndDay:
          numberValue(
            form.payrollMonthEndDay,
          ),
        salaryPeriod: form.salaryPeriod,
        currency: form.currency,
        overtimeEnabled:
          form.overtimeEnabled,
        overtimeMultiplier:
          numberValue(
            form.overtimeMultiplier,
          ),
        halfDayMultiplier:
          numberValue(
            form.halfDayMultiplier,
          ),
        lossOfPayEnabled:
          form.lossOfPayEnabled,
        roundingRule: form.roundingRule,
      },

      attendance: {
        workingDays: form.workingDays,
        officeStartTime:
          form.officeStartTime,
        officeEndTime:
          form.officeEndTime,
        lateMarkAfterMinutes:
          numberValue(
            form.lateMarkAfterMinutes,
          ),
        halfDayAfterHours:
          numberValue(
            form.halfDayAfterHours,
          ),
        absentAfterHours:
          numberValue(
            form.absentAfterHours,
          ),
        gracePeriodMinutes:
          numberValue(
            form.gracePeriodMinutes,
          ),
        requireCheckIn:
          form.requireCheckIn,
        requireCheckOut:
          form.requireCheckOut,
        allowManualAttendance:
          form.allowManualAttendance,
      },

      leave: {
        annualLeaveDays:
          numberValue(
            form.annualLeaveDays,
          ),
        sickLeaveDays:
          numberValue(
            form.sickLeaveDays,
          ),
        casualLeaveDays:
          numberValue(
            form.casualLeaveDays,
          ),
        paidLeaveEnabled:
          form.paidLeaveEnabled,
        carryForwardEnabled:
          form.carryForwardEnabled,
        maximumCarryForwardDays:
          numberValue(
            form.maximumCarryForwardDays,
          ),
        requireApproval:
          form.requireApproval,
        minimumNoticeDays:
          numberValue(
            form.minimumNoticeDays,
          ),
      },

      employee: {
        probationPeriodDays:
          numberValue(
            form.probationPeriodDays,
          ),
        defaultNoticePeriodDays:
          numberValue(
            form.defaultNoticePeriodDays,
          ),
        confirmationAfterProbation:
          form.confirmationAfterProbation,
        employeeIdPrefix:
          form.employeeIdPrefix.trim(),
      },

      email: {
        hrEmail: form.hrEmail.trim(),
        recruitmentEmail:
          form.recruitmentEmail.trim(),
        payrollEmail:
          form.payrollEmail.trim(),
        sendAttendanceEmails:
          form.sendAttendanceEmails,
        sendLeaveEmails:
          form.sendLeaveEmails,
        sendRecruitmentEmails:
          form.sendRecruitmentEmails,
        sendPayrollEmails:
          form.sendPayrollEmails,
      },

      policies: {
        workingHoursPerDay:
          numberValue(
            form.workingHoursPerDay,
          ),
        workingDaysPerWeek:
          numberValue(
            form.workingDaysPerWeek,
          ),
        minimumAge:
          numberValue(form.minimumAge),
        retirementAge:
          numberValue(
            form.retirementAge,
          ),
        enableEmployeeDocuments:
          form.enableEmployeeDocuments,
        enableEmployeeNotifications:
          form.enableEmployeeNotifications,
      },

      financialYear: {
        startMonth:
          numberValue(
            form.financialYearStartMonth,
          ),
        startDay:
          numberValue(
            form.financialYearStartDay,
          ),
      },
    };
  };

  const handleSave = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await api.patch(
        "/settings/organization",
        buildPayload(),
      );

      setMessage(
        "Organization settings saved successfully.",
      );

      await loadSettings();
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to save organization settings.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (
    day: string,
  ) => {
    setForm((previous) => {
      const exists =
        previous.workingDays.includes(day);

      return {
        ...previous,
        workingDays: exists
          ? previous.workingDays.filter(
              (item) => item !== day,
            )
          : [
              ...previous.workingDays,
              day,
            ],
      };
    });

    setMessage("");
    setError("");
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading organization settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Settings2 size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Organization Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure company, payroll, attendance,
              leave and HR policies.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const formElement =
              document.getElementById(
                "organization-settings-form",
              ) as HTMLFormElement | null;

            formElement?.requestSubmit();
          }}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        id="organization-settings-form"
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[250px_1fr]">
          {/* Tabs */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active =
                  activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {activeTab === "company" && (
              <CompanySection
                form={form}
                updateField={updateField}
              />
            )}

            {activeTab === "payroll" && (
              <PayrollSection
                form={form}
                updateField={updateField}
              />
            )}

            {activeTab === "attendance" && (
              <AttendanceSection
                form={form}
                updateField={updateField}
                toggleWorkingDay={
                  toggleWorkingDay
                }
              />
            )}

            {activeTab === "leave" && (
              <LeaveSection
                form={form}
                updateField={updateField}
              />
            )}

            {activeTab === "employee" && (
              <EmployeeSection
                form={form}
                updateField={updateField}
              />
            )}

            {activeTab === "email" && (
              <EmailSection
                form={form}
                updateField={updateField}
              />
            )}

            {activeTab === "policies" && (
              <PoliciesSection
                form={form}
                updateField={updateField}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Company                                                                    */
/* -------------------------------------------------------------------------- */

const CompanySection = ({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
}) => {
  return (
    <SectionCard
      icon={<Building2 size={20} />}
      title="Company Information"
      description="Basic legal and contact information for your organization."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          label="Company Name"
          required
        >
          <Input
            value={form.companyName}
            onChange={(value) =>
              updateField(
                "companyName",
                value,
              )
            }
            placeholder="Sellopedia"
          />
        </Field>

        <Field label="Legal Name">
          <Input
            value={form.legalName}
            onChange={(value) =>
              updateField(
                "legalName",
                value,
              )
            }
            placeholder="Legal registered company name"
          />
        </Field>

        <Field label="Registration Number">
          <Input
            value={form.registrationNumber}
            onChange={(value) =>
              updateField(
                "registrationNumber",
                value,
              )
            }
            placeholder="Company registration number"
          />
        </Field>

        <Field label="GST Number">
          <Input
            value={form.gstNumber}
            onChange={(value) =>
              updateField(
                "gstNumber",
                value,
              )
            }
            placeholder="GSTIN"
          />
        </Field>

        <Field label="PAN Number">
          <Input
            value={form.panNumber}
            onChange={(value) =>
              updateField(
                "panNumber",
                value,
              )
            }
            placeholder="PAN"
          />
        </Field>

        <Field label="TAN Number">
          <Input
            value={form.tanNumber}
            onChange={(value) =>
              updateField(
                "tanNumber",
                value,
              )
            }
            placeholder="TAN"
          />
        </Field>

        <Field label="Website">
          <Input
            value={form.website}
            onChange={(value) =>
              updateField(
                "website",
                value,
              )
            }
            placeholder="https://example.com"
          />
        </Field>

        <Field label="Company Email">
          <Input
            type="email"
            value={form.email}
            onChange={(value) =>
              updateField(
                "email",
                value,
              )
            }
            placeholder="info@example.com"
          />
        </Field>

        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(value) =>
              updateField(
                "phone",
                value,
              )
            }
            placeholder="+91 XXXXX XXXXX"
          />
        </Field>

        <Field label="Alternate Phone">
          <Input
            value={form.alternatePhone}
            onChange={(value) =>
              updateField(
                "alternatePhone",
                value,
              )
            }
            placeholder="+91 XXXXX XXXXX"
          />
        </Field>
      </div>

      <Divider />

      <div className="mb-5 flex items-center gap-2">
        <MapPin
          size={18}
          className="text-blue-600"
        />

        <h3 className="font-semibold text-slate-800">
          Registered Address
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          label="Address Line 1"
          className="md:col-span-2"
        >
          <Input
            value={form.addressLine1}
            onChange={(value) =>
              updateField(
                "addressLine1",
                value,
              )
            }
            placeholder="Building / street / area"
          />
        </Field>

        <Field
          label="Address Line 2"
          className="md:col-span-2"
        >
          <Input
            value={form.addressLine2}
            onChange={(value) =>
              updateField(
                "addressLine2",
                value,
              )
            }
            placeholder="Landmark / locality"
          />
        </Field>

        <Field label="City">
          <Input
            value={form.city}
            onChange={(value) =>
              updateField("city", value)
            }
            placeholder="City"
          />
        </Field>

        <Field label="State">
          <Input
            value={form.state}
            onChange={(value) =>
              updateField(
                "state",
                value,
              )
            }
            placeholder="State"
          />
        </Field>

        <Field label="Country">
          <Input
            value={form.country}
            onChange={(value) =>
              updateField(
                "country",
                value,
              )
            }
            placeholder="Country"
          />
        </Field>

        <Field label="Postal Code">
          <Input
            value={form.postalCode}
            onChange={(value) =>
              updateField(
                "postalCode",
                value,
              )
            }
            placeholder="Postal code"
          />
        </Field>
      </div>
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Payroll                                                                    */
/* -------------------------------------------------------------------------- */

const PayrollSection = ({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
}) => {
  return (
    <SectionCard
      icon={<WalletCards size={20} />}
      title="Payroll Settings"
      description="Configure the rules used by the payroll calculation engine."
    >
      <InfoBox>
        The default payroll basis is configured to{" "}
        <strong>26 working days</strong>. This value is
        used by the salary calculation service for daily
        salary and loss-of-pay calculations.
      </InfoBox>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          label="Working Days Basis"
          hint="Default: 26 days"
        >
          <NumberInput
            value={form.workingDaysBasis}
            onChange={(value) =>
              updateField(
                "workingDaysBasis",
                value,
              )
            }
            min={1}
            max={31}
          />
        </Field>

        <Field label="Salary Period">
          <Select
            value={form.salaryPeriod}
            onChange={(value) =>
              updateField(
                "salaryPeriod",
                value as FormState["salaryPeriod"],
              )
            }
            options={[
              {
                value: "monthly",
                label: "Monthly",
              },
              {
                value: "daily",
                label: "Daily",
              },
            ]}
          />
        </Field>

        <Field label="Payroll Start Day">
          <NumberInput
            value={
              form.payrollMonthStartDay
            }
            onChange={(value) =>
              updateField(
                "payrollMonthStartDay",
                value,
              )
            }
            min={1}
            max={31}
          />
        </Field>

        <Field label="Payroll End Day">
          <NumberInput
            value={
              form.payrollMonthEndDay
            }
            onChange={(value) =>
              updateField(
                "payrollMonthEndDay",
                value,
              )
            }
            min={1}
            max={31}
          />
        </Field>

        <Field label="Currency">
          <Select
            value={form.currency}
            onChange={(value) =>
              updateField(
                "currency",
                value,
              )
            }
            options={[
              {
                value: "INR",
                label: "INR - Indian Rupee",
              },
              {
                value: "USD",
                label: "USD - US Dollar",
              },
              {
                value: "EUR",
                label: "EUR - Euro",
              },
              {
                value: "GBP",
                label: "GBP - Pound Sterling",
              },
            ]}
          />
        </Field>

        <Field label="Salary Rounding">
          <Select
            value={form.roundingRule}
            onChange={(value) =>
              updateField(
                "roundingRule",
                value as FormState["roundingRule"],
              )
            }
            options={[
              {
                value: "none",
                label: "No rounding",
              },
              {
                value: "nearest",
                label: "Nearest rupee",
              },
              {
                value: "floor",
                label: "Round down",
              },
              {
                value: "ceil",
                label: "Round up",
              },
            ]}
          />
        </Field>
      </div>

      <Divider />

      <Toggle
        label="Enable Overtime"
        description="Allow payroll to calculate overtime payments."
        checked={form.overtimeEnabled}
        onChange={(value) =>
          updateField(
            "overtimeEnabled",
            value,
          )
        }
      />

      {form.overtimeEnabled && (
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Overtime Multiplier">
            <NumberInput
              value={
                form.overtimeMultiplier
              }
              onChange={(value) =>
                updateField(
                  "overtimeMultiplier",
                  value,
                )
              }
              step="0.1"
              min={1}
            />
          </Field>

          <Field label="Half-Day Salary Multiplier">
            <NumberInput
              value={
                form.halfDayMultiplier
              }
              onChange={(value) =>
                updateField(
                  "halfDayMultiplier",
                  value,
                )
              }
              step="0.1"
              min={0}
              max={1}
            />
          </Field>
        </div>
      )}

      <Divider />

      <Toggle
        label="Loss of Pay"
        description="Deduct salary for unpaid absence / LOP days."
        checked={form.lossOfPayEnabled}
        onChange={(value) =>
          updateField(
            "lossOfPayEnabled",
            value,
          )
        }
      />
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Attendance                                                                 */
/* -------------------------------------------------------------------------- */

const AttendanceSection = ({
  form,
  updateField,
  toggleWorkingDay,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  toggleWorkingDay: (day: string) => void;
}) => {
  return (
    <SectionCard
      icon={<Clock3 size={20} />}
      title="Attendance Settings"
      description="Configure office timings, attendance rules and working days."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Office Start Time">
          <Input
            type="time"
            value={form.officeStartTime}
            onChange={(value) =>
              updateField(
                "officeStartTime",
                value,
              )
            }
          />
        </Field>

        <Field label="Office End Time">
          <Input
            type="time"
            value={form.officeEndTime}
            onChange={(value) =>
              updateField(
                "officeEndTime",
                value,
              )
            }
          />
        </Field>

        <Field label="Late Mark After">
          <NumberInput
            value={
              form.lateMarkAfterMinutes
            }
            onChange={(value) =>
              updateField(
                "lateMarkAfterMinutes",
                value,
              )
            }
            min={0}
          />
          <p className="mt-1 text-xs text-slate-400">
            Minutes after scheduled start time.
          </p>
        </Field>

        <Field label="Grace Period">
          <NumberInput
            value={
              form.gracePeriodMinutes
            }
            onChange={(value) =>
              updateField(
                "gracePeriodMinutes",
                value,
              )
            }
            min={0}
          />
          <p className="mt-1 text-xs text-slate-400">
            Grace period before late marking.
          </p>
        </Field>

        <Field label="Half-Day After Hours">
          <NumberInput
            value={
              form.halfDayAfterHours
            }
            onChange={(value) =>
              updateField(
                "halfDayAfterHours",
                value,
              )
            }
            min={0}
            step="0.5"
          />
        </Field>

        <Field label="Absent After Hours">
          <NumberInput
            value={
              form.absentAfterHours
            }
            onChange={(value) =>
              updateField(
                "absentAfterHours",
                value,
              )
            }
            min={0}
            step="0.5"
          />
        </Field>
      </div>

      <Divider />

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Working Days
        </p>

        <div className="flex flex-wrap gap-2">
          {weekDays.map((day) => {
            const selected =
              form.workingDays.includes(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() =>
                  toggleWorkingDay(day)
                }
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {selected && (
                  <Check
                    size={14}
                    className="mr-1 inline"
                  />
                )}

                {day}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />

      <Toggle
        label="Require Check-In"
        description="Employees must record their check-in time."
        checked={form.requireCheckIn}
        onChange={(value) =>
          updateField(
            "requireCheckIn",
            value,
          )
        }
      />

      <Toggle
        label="Require Check-Out"
        description="Employees must record their check-out time."
        checked={form.requireCheckOut}
        onChange={(value) =>
          updateField(
            "requireCheckOut",
            value,
          )
        }
      />

      <Toggle
        label="Allow Manual Attendance"
        description="HR can manually create or correct attendance records."
        checked={form.allowManualAttendance}
        onChange={(value) =>
          updateField(
            "allowManualAttendance",
            value,
          )
        }
      />
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Leave                                                                      */
/* -------------------------------------------------------------------------- */

const LeaveSection = ({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
}) => {
  return (
    <SectionCard
      icon={<CalendarDays size={20} />}
      title="Leave Settings"
      description="Configure default leave allowances and approval rules."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Annual Leave Days">
          <NumberInput
            value={form.annualLeaveDays}
            onChange={(value) =>
              updateField(
                "annualLeaveDays",
                value,
              )
            }
            min={0}
          />
        </Field>

        <Field label="Sick Leave Days">
          <NumberInput
            value={form.sickLeaveDays}
            onChange={(value) =>
              updateField(
                "sickLeaveDays",
                value,
              )
            }
            min={0}
          />
        </Field>

        <Field label="Casual Leave Days">
          <NumberInput
            value={form.casualLeaveDays}
            onChange={(value) =>
              updateField(
                "casualLeaveDays",
                value,
              )
            }
            min={0}
          />
        </Field>
      </div>

      <Divider />

      <Toggle
        label="Paid Leave"
        description="Leave approved under configured paid leave types is paid."
        checked={form.paidLeaveEnabled}
        onChange={(value) =>
          updateField(
            "paidLeaveEnabled",
            value,
          )
        }
      />

      <Toggle
        label="Carry Forward"
        description="Allow unused leave to be carried into the next leave year."
        checked={form.carryForwardEnabled}
        onChange={(value) =>
          updateField(
            "carryForwardEnabled",
            value,
          )
        }
      />

      {form.carryForwardEnabled && (
        <div className="mt-4 max-w-sm">
          <Field label="Maximum Carry Forward Days">
            <NumberInput
              value={
                form.maximumCarryForwardDays
              }
              onChange={(value) =>
                updateField(
                  "maximumCarryForwardDays",
                  value,
                )
              }
              min={0}
            />
          </Field>
        </div>
      )}

      <Divider />

      <Toggle
        label="Leave Approval Required"
        description="Leave applications must be reviewed by HR or an authorized approver."
        checked={form.requireApproval}
        onChange={(value) =>
          updateField(
            "requireApproval",
            value,
          )
        }
      />

      <div className="mt-4 max-w-sm">
        <Field label="Minimum Notice Days">
          <NumberInput
            value={
              form.minimumNoticeDays
            }
            onChange={(value) =>
              updateField(
                "minimumNoticeDays",
                value,
              )
            }
            min={0}
          />
        </Field>
      </div>
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Employee                                                                   */
/* -------------------------------------------------------------------------- */

const EmployeeSection = ({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
}) => {
  return (
    <SectionCard
      icon={<ShieldCheck size={20} />}
      title="Employee Settings"
      description="Configure employee onboarding and employment defaults."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Employee ID Prefix">
          <Input
            value={form.employeeIdPrefix}
            onChange={(value) =>
              updateField(
                "employeeIdPrefix",
                value.toUpperCase(),
              )
            }
            placeholder="EMP"
          />
        </Field>

        <Field label="Probation Period">
          <NumberInput
            value={
              form.probationPeriodDays
            }
            onChange={(value) =>
              updateField(
                "probationPeriodDays",
                value,
              )
            }
            min={0}
          />
          <p className="mt-1 text-xs text-slate-400">
            Number of days.
          </p>
        </Field>

        <Field label="Default Notice Period">
          <NumberInput
            value={
              form.defaultNoticePeriodDays
            }
            onChange={(value) =>
              updateField(
                "defaultNoticePeriodDays",
                value,
              )
            }
            min={0}
          />
          <p className="mt-1 text-xs text-slate-400">
            Number of days.
          </p>
        </Field>
      </div>

      <Divider />

      <Toggle
        label="Auto Confirmation After Probation"
        description="Automatically mark an employee as confirmed after the configured probation period."
        checked={
          form.confirmationAfterProbation
        }
        onChange={(value) =>
          updateField(
            "confirmationAfterProbation",
            value,
          )
        }
      />
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

const EmailSection = ({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
}) => {
  return (
    <SectionCard
      icon={<Mail size={20} />}
      title="HR Email Settings"
      description="Configure recipient addresses used by automated HR emails."
    >
      <InfoBox>
        SMTP connection details remain on the server
        environment. These fields control the HR addresses
        used by the application.
      </InfoBox>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="HR Email">
          <Input
            type="email"
            value={form.hrEmail}
            onChange={(value) =>
              updateField(
                "hrEmail",
                value,
              )
            }
            placeholder="hr@example.com"
          />
        </Field>

        <Field label="Recruitment Email">
          <Input
            type="email"
            value={
              form.recruitmentEmail
            }
            onChange={(value) =>
              updateField(
                "recruitmentEmail",
                value,
              )
            }
            placeholder="careers@example.com"
          />
        </Field>

        <Field label="Payroll Email">
          <Input
            type="email"
            value={form.payrollEmail}
            onChange={(value) =>
              updateField(
                "payrollEmail",
                value,
              )
            }
            placeholder="payroll@example.com"
          />
        </Field>
      </div>

      <Divider />

      <Toggle
        label="Attendance Emails"
        description="Send configured attendance notifications."
        checked={
          form.sendAttendanceEmails
        }
        onChange={(value) =>
          updateField(
            "sendAttendanceEmails",
            value,
          )
        }
      />

      <Toggle
        label="Leave Emails"
        description="Send leave submission and approval notifications."
        checked={
          form.sendLeaveEmails
        }
        onChange={(value) =>
          updateField(
            "sendLeaveEmails",
            value,
          )
        }
      />

      <Toggle
        label="Recruitment Emails"
        description="Send interview, selection and recruitment notifications."
        checked={
          form.sendRecruitmentEmails
        }
        onChange={(value) =>
          updateField(
            "sendRecruitmentEmails",
            value,
          )
        }
      />

      <Toggle
        label="Payroll Emails"
        description="Allow payroll-related automated emails and payslip notifications."
        checked={
          form.sendPayrollEmails
        }
        onChange={(value) =>
          updateField(
            "sendPayrollEmails",
            value,
          )
        }
      />
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Policies                                                                   */
/* -------------------------------------------------------------------------- */

const PoliciesSection = ({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
}) => {
  return (
    <SectionCard
      icon={<FileText size={20} />}
      title="HR Policies"
      description="Configure general workforce policies and financial year."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Working Hours Per Day">
          <NumberInput
            value={
              form.workingHoursPerDay
            }
            onChange={(value) =>
              updateField(
                "workingHoursPerDay",
                value,
              )
            }
            min={1}
            max={24}
            step="0.5"
          />
        </Field>

        <Field label="Working Days Per Week">
          <NumberInput
            value={
              form.workingDaysPerWeek
            }
            onChange={(value) =>
              updateField(
                "workingDaysPerWeek",
                value,
              )
            }
            min={1}
            max={7}
          />
        </Field>

        <Field label="Minimum Employee Age">
          <NumberInput
            value={form.minimumAge}
            onChange={(value) =>
              updateField(
                "minimumAge",
                value,
              )
            }
            min={14}
            max={100}
          />
        </Field>

        <Field label="Retirement Age">
          <NumberInput
            value={form.retirementAge}
            onChange={(value) =>
              updateField(
                "retirementAge",
                value,
              )
            }
            min={40}
            max={100}
          />
        </Field>
      </div>

      <Divider />

      <div className="mb-4 flex items-center gap-2">
        <CalendarDays
          size={18}
          className="text-blue-600"
        />

        <h3 className="font-semibold text-slate-800">
          Financial Year
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Financial Year Start Month">
          <Select
            value={
              form.financialYearStartMonth
            }
            onChange={(value) =>
              updateField(
                "financialYearStartMonth",
                value,
              )
            }
            options={months}
          />
        </Field>

        <Field label="Financial Year Start Day">
          <NumberInput
            value={
              form.financialYearStartDay
            }
            onChange={(value) =>
              updateField(
                "financialYearStartDay",
                value,
              )
            }
            min={1}
            max={31}
          />
        </Field>
      </div>

      <Divider />

      <Toggle
        label="Employee Documents"
        description="Allow employees to access their permitted HR documents."
        checked={
          form.enableEmployeeDocuments
        }
        onChange={(value) =>
          updateField(
            "enableEmployeeDocuments",
            value,
          )
        }
      />

      <Toggle
        label="Employee Notifications"
        description="Enable system notifications for employees."
        checked={
          form.enableEmployeeNotifications
        }
        onChange={(value) =>
          updateField(
            "enableEmployeeNotifications",
            value,
          )
        }
      />
    </SectionCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

const SectionCard = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

const Field = ({
  label,
  hint,
  required = false,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
};

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    />
  );
};

const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = "1",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
}) => {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    />
  );
};

const Select = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) => {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

const Divider = () => (
  <div className="border-t border-slate-100" />
);

const InfoBox = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
      {children}
    </div>
  );
};

export default Organization;