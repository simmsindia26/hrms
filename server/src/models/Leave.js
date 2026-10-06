import mongoose from "mongoose";

/* =========================================================
   LEAVE TYPE
========================================================= */

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Number of leave days available per year
    annualQuota: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Alias used by the frontend
    daysPerYear: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional maximum leave allowed
    maxDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPaid: {
      type: Boolean,
      default: true,
    },

    // Alias for frontend compatibility
    paid: {
      type: Boolean,
      default: true,
    },

    carryForward: {
      type: Boolean,
      default: false,
    },

    maxCarryForwardDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    requiresApproval: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveType =
  mongoose.models.LeaveType ||
  mongoose.model(
    "LeaveType",
    leaveTypeSchema
  );


/* =========================================================
   LEAVE APPLICATION
========================================================= */

const leaveApplicationSchema =
  new mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },

      leaveType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveType",
        required: true,
      },

      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },

      days: {
        type: Number,
        required: true,
        min: 0.5,
      },

      reason: {
        type: String,
        trim: true,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
          "cancelled",
        ],
        default: "pending",
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: {
        type: Date,
      },

      reviewComment: {
        type: String,
        trim: true,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

export const LeaveApplication =
  mongoose.models.LeaveApplication ||
  mongoose.model(
    "LeaveApplication",
    leaveApplicationSchema
  );