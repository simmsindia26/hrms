import mongoose from "mongoose";
export const Payroll = mongoose.model("Payroll", new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  monthlySalary: { type: Number, required: true },
  payrollBasisDays: { type: Number, default: 26 },
  payableDays: { type: Number, default: 26 },
  unpaidDays: { type: Number, default: 0 },
  perDaySalary: { type: Number, default: 0 },
  additions: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  grossPay: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
status: {
  type: String,
  enum: [
    "draft",
    "processed",
    "approved",
    "paid",
    "cancelled",
  ],
  default: "draft",
},
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: Date
}, { timestamps: true }));
Payroll.schema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
