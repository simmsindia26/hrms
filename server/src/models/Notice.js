import mongoose from "mongoose";
export const Notice = mongoose.model("Notice", new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["official", "warning", "late_attendance", "disciplinary", "show_cause", "policy"], default: "official" },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: Date,
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true }));
