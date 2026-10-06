import mongoose from "mongoose";
export const SalaryStructure = mongoose.model("SalaryStructure", new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  monthlySalary: { type: Number, required: true, min: 0 },
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  effectiveFrom: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true }));
