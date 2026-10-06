import mongoose from "mongoose";

const attendanceSecuritySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
      index: true,
    },

    pinHash: {
      type: String,
      default: null,
      select: false,
    },

    faceEmbedding: {
      type: [Number],
      default: undefined,
      select: false,
    },

    faceRegisteredAt: {
      type: Date,
      default: null,
    },

    faceUpdatedAt: {
      type: Date,
      default: null,
    },

    pinUpdatedAt: {
      type: Date,
      default: null,
    },

    failedPinAttempts: {
      type: Number,
      default: 0,
    },

    pinLockedUntil: {
      type: Date,
      default: null,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
    },

    lastVerifiedTerminal: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceSecurity", attendanceSecuritySchema);
