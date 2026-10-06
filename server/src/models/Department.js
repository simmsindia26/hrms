import mongoose from "mongoose";
export const Department = mongoose.model("Department", new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true }));
