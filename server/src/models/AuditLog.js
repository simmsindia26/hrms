import mongoose from "mongoose";
export const AuditLog = mongoose.model("AuditLog", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  module: String,
  description: String,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true }));
