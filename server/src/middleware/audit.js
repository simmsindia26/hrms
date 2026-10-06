import { AuditLog } from "../models/AuditLog.js";

export async function audit(req, action, module, description, metadata = {}) {
  try {
    await AuditLog.create({
      user: req.user?._id,
      action,
      module,
      description,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}
