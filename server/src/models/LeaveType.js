import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

    daysPerYear: {
      type: Number,
      required: true,
      min: 0,
      default: 12,
    },

    maxDays: {
      type: Number,
      default: 12,
      min: 0,
    },

    paid: {
      type: Boolean,
      default: true,
    },

    isPaid: {
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

/*
 * Prevent duplicate leave codes.
 * Empty codes are allowed.
 */
leaveTypeSchema.index(
  { code: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const LeaveType =
  mongoose.models.LeaveType ||
  mongoose.model(
    "LeaveType",
    leaveTypeSchema
  );

export default LeaveType;