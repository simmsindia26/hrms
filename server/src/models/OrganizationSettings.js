import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    addressLine1: {
      type: String,
      default: "",
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    postalCode: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Sellopedia",
      trim: true,
    },

    legalName: {
      type: String,
      default: "",
      trim: true,
    },

    registrationNumber: {
      type: String,
      default: "",
      trim: true,
    },

    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },

    panNumber: {
      type: String,
      default: "",
      trim: true,
    },

    tanNumber: {
      type: String,
      default: "",
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    address: {
      type: addressSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  }
);

const payrollSchema = new mongoose.Schema(
  {
    workingDaysBasis: {
      type: Number,
      default: 26,
      min: 1,
      max: 31,
    },

    payrollMonthStartDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },

    payrollMonthEndDay: {
      type: Number,
      default: 31,
      min: 1,
      max: 31,
    },

    salaryPeriod: {
      type: String,
      enum: ["monthly", "daily"],
      default: "monthly",
    },

    currency: {
      type: String,
      default: "INR",
    },

    overtimeEnabled: {
      type: Boolean,
      default: false,
    },

    overtimeMultiplier: {
      type: Number,
      default: 1.5,
      min: 0,
    },

    halfDayMultiplier: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },

    lossOfPayEnabled: {
      type: Boolean,
      default: true,
    },

    roundingRule: {
      type: String,
      enum: [
        "none",
        "nearest",
        "floor",
        "ceil",
      ],
      default: "none",
    },
  },
  {
    _id: false,
  }
);

const attendanceSchema = new mongoose.Schema(
  {
    workingDays: {
      type: [String],
      default: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },

    officeStartTime: {
      type: String,
      default: "09:30",
    },

    officeEndTime: {
      type: String,
      default: "18:30",
    },

    lateMarkAfterMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },

    halfDayAfterHours: {
      type: Number,
      default: 4,
      min: 0,
    },

    absentAfterHours: {
      type: Number,
      default: 2,
      min: 0,
    },

    gracePeriodMinutes: {
      type: Number,
      default: 10,
      min: 0,
    },

    requireCheckIn: {
      type: Boolean,
      default: true,
    },

    requireCheckOut: {
      type: Boolean,
      default: true,
    },

    allowManualAttendance: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const leaveSchema = new mongoose.Schema(
  {
    annualLeaveDays: {
      type: Number,
      default: 12,
      min: 0,
    },

    sickLeaveDays: {
      type: Number,
      default: 12,
      min: 0,
    },

    casualLeaveDays: {
      type: Number,
      default: 12,
      min: 0,
    },

    paidLeaveEnabled: {
      type: Boolean,
      default: true,
    },

    carryForwardEnabled: {
      type: Boolean,
      default: false,
    },

    maximumCarryForwardDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    requireApproval: {
      type: Boolean,
      default: true,
    },

    minimumNoticeDays: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const employeeSchema = new mongoose.Schema(
  {
    probationPeriodDays: {
      type: Number,
      default: 180,
      min: 0,
    },

    defaultNoticePeriodDays: {
      type: Number,
      default: 30,
      min: 0,
    },

    confirmationAfterProbation: {
      type: Boolean,
      default: true,
    },

    employeeIdPrefix: {
      type: String,
      default: "EMP",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const emailSchema = new mongoose.Schema(
  {
    hrEmail: {
      type: String,
      default: "",
      trim: true,
    },

    recruitmentEmail: {
      type: String,
      default: "",
      trim: true,
    },

    payrollEmail: {
      type: String,
      default: "",
      trim: true,
    },

    sendAttendanceEmails: {
      type: Boolean,
      default: true,
    },

    sendLeaveEmails: {
      type: Boolean,
      default: true,
    },

    sendRecruitmentEmails: {
      type: Boolean,
      default: true,
    },

    sendPayrollEmails: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const policiesSchema = new mongoose.Schema(
  {
    workingHoursPerDay: {
      type: Number,
      default: 8,
      min: 0,
    },

    workingDaysPerWeek: {
      type: Number,
      default: 6,
      min: 1,
      max: 7,
    },

    minimumAge: {
      type: Number,
      default: 18,
      min: 0,
    },

    retirementAge: {
      type: Number,
      default: 60,
      min: 0,
    },

    enableEmployeeDocuments: {
      type: Boolean,
      default: true,
    },

    enableEmployeeNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const financialYearSchema =
  new mongoose.Schema(
    {
      startMonth: {
        type: Number,
        default: 4,
        min: 1,
        max: 12,
      },

      startDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 31,
      },
    },
    {
      _id: false,
    }
  );

const organizationSettingsSchema =
  new mongoose.Schema(
    {
      company: {
        type: companySchema,
        default: () => ({}),
      },

      payroll: {
        type: payrollSchema,
        default: () => ({}),
      },

      attendance: {
        type: attendanceSchema,
        default: () => ({}),
      },

      leave: {
        type: leaveSchema,
        default: () => ({}),
      },

      employee: {
        type: employeeSchema,
        default: () => ({}),
      },

      email: {
        type: emailSchema,
        default: () => ({}),
      },

      policies: {
        type: policiesSchema,
        default: () => ({}),
      },

      financialYear: {
        type: financialYearSchema,
        default: () => ({}),
      },
    },
    {
      timestamps: true,
    }
  );

const OrganizationSettings =
  mongoose.models.OrganizationSettings ||
  mongoose.model(
    "OrganizationSettings",
    organizationSettingsSchema
  );

export default OrganizationSettings;