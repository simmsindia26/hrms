import mongoose from "mongoose";
export const Designation = mongoose.model("Designation", new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true }));
