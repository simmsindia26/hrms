import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "present",
        "absent",
        "half_day",
        "leave",
        "holiday",
        "weekoff",
      ],
      default: "present",
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * Attendance Terminal information
     *
     * These fields are optional so existing HR/manual
     * attendance records continue working.
     */
    attendanceMethod: {
      type: String,
      enum: [
        "manual",
        "face_pin",
        "admin",
        "import",
      ],
      default: "manual",
    },

    terminalId: {
      type: String,
      trim: true,
      default: null,
    },

    checkInVerified: {
      type: Boolean,
      default: false,
    },

    checkOutVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * One attendance record per employee per day.
 */
attendanceSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

/*
 * Useful for monthly attendance queries.
 */
attendanceSchema.index({
  date: 1,
  status: 1,
});

attendanceSchema.index({
  employee: 1,
  date: -1,
});

export const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

export default Attendance;