import OrganizationSettings from "../models/OrganizationSettings.js";

/*
|--------------------------------------------------------------------------
| Default Organization Settings
|--------------------------------------------------------------------------
*/

const DEFAULT_SETTINGS = {
  company: {
    name: "Sellopedia",
    legalName: "",
    registrationNumber: "",
    gstNumber: "",
    panNumber: "",
    tanNumber: "",
    logoUrl: "",
    website: "",
    email: "",
    phone: "",
    alternatePhone: "",

    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
    },
  },

  payroll: {
    // Sellopedia HRD uses 26 working days
    workingDaysBasis: 26,

    payrollMonthStartDay: 1,
    payrollMonthEndDay: 31,

    salaryPeriod: "monthly",
    currency: "INR",

    overtimeEnabled: false,
    overtimeMultiplier: 1.5,

    halfDayMultiplier: 0.5,

    lossOfPayEnabled: true,

    roundingRule: "none",
  },

  attendance: {
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

    lateMarkAfterMinutes: 15,
    halfDayAfterHours: 4,
    absentAfterHours: 2,

    gracePeriodMinutes: 10,

    requireCheckIn: true,
    requireCheckOut: true,

    allowManualAttendance: true,
  },

  leave: {
    annualLeaveDays: 12,
    sickLeaveDays: 12,
    casualLeaveDays: 12,

    paidLeaveEnabled: true,

    carryForwardEnabled: false,
    maximumCarryForwardDays: 0,

    requireApproval: true,

    minimumNoticeDays: 1,
  },

  employee: {
    probationPeriodDays: 180,

    defaultNoticePeriodDays: 30,

    confirmationAfterProbation: true,

    employeeIdPrefix: "EMP",
  },

  email: {
    hrEmail: "",
    recruitmentEmail: "",
    payrollEmail: "",

    sendAttendanceEmails: true,
    sendLeaveEmails: true,
    sendRecruitmentEmails: true,
    sendPayrollEmails: true,
  },

  policies: {
    workingHoursPerDay: 8,
    workingDaysPerWeek: 6,

    minimumAge: 18,
    retirementAge: 60,

    enableEmployeeDocuments: true,
    enableEmployeeNotifications: true,
  },

  financialYear: {
    // April 1
    startMonth: 4,
    startDay: 1,
  },
};

/*
|--------------------------------------------------------------------------
| Deep Merge Helper
|--------------------------------------------------------------------------
*/

const deepMerge = (target, source) => {
  const output = {
    ...target,
  };

  if (!source || typeof source !== "object") {
    return output;
  }

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue)
    ) {
      output[key] = deepMerge(
        output[key] || {},
        sourceValue
      );
    } else if (sourceValue !== undefined) {
      output[key] = sourceValue;
    }
  });

  return output;
};

/*
|--------------------------------------------------------------------------
| GET Organization Settings
|--------------------------------------------------------------------------
| GET /api/v1/settings/organization
|--------------------------------------------------------------------------
*/

export const getOrganizationSettings = async (
  req,
  res,
  next
) => {
  try {
    let settings =
      await OrganizationSettings.findOne().lean();

    /*
     * If no settings document exists,
     * create one with the default configuration.
     */

    if (!settings) {
      settings =
        await OrganizationSettings.create(
          DEFAULT_SETTINGS
        );

      settings =
        settings.toObject();
    }

    const response = deepMerge(
      DEFAULT_SETTINGS,
      settings
    );

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE Organization Settings
|--------------------------------------------------------------------------
| PATCH /api/v1/settings/organization
|--------------------------------------------------------------------------
*/

export const updateOrganizationSettings = async (
  req,
  res,
  next
) => {
  try {
    const incoming = req.body || {};

    let settings =
      await OrganizationSettings.findOne();

    /*
     * Create the settings document if it
     * doesn't already exist.
     */

    if (!settings) {
      settings =
        new OrganizationSettings(
          DEFAULT_SETTINGS
        );
    }

    /*
     * Merge incoming settings into existing
     * settings instead of replacing the entire
     * document.
     */

    const merged = deepMerge(
      settings.toObject(),
      incoming
    );

    /*
     * Remove MongoDB fields before assigning
     * the merged object back.
     */

    delete merged._id;
    delete merged.__v;
    delete merged.createdAt;
    delete merged.updatedAt;

    Object.assign(
      settings,
      merged
    );

    await settings.save();

    return res.status(200).json({
      success: true,
      message:
        "Organization settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};