import express from "express";

import {
  departments,
  designations,
  jobs,
  candidates,
  interviews,
  employees,
  attendance,
  leaveTypes,
  notices,
  salaryStructures,

  listEmployees,
  updateEmployee,
  applyLeave,
  reviewLeave,
  listLeaves,

  createCandidate,
  createInterview,
  createAttendance,
  createNotice,
  updateCandidateStatus,

  createPayroll,
  listPayroll,
  approvePayroll,
  updatePayroll,
  payPayroll,

  dashboard,
  notifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  markNotificationUnread,
  deleteNotification,
  emailLogs,
  auditLogs,
  getUsers,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  acknowledgeNotice,
} from "../controllers/crud.controller.js";

import {
  listDocuments,
  uploadDocument,
  generateOffer,
  generateAppointment,
  generateEmployeePayslip,
  acknowledgeDocument,
  downloadDocument,
} from "../controllers/document.controller.js";

import {
  listApplications,
  getApplication,
  convertApplicationToCandidate,
} from "../controllers/career-application.controller.js";

import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

/* DASHBOARD */
router.get("/dashboard", authorize("hr", "super_admin"), dashboard);

/* DEPARTMENTS */
router.get("/departments", departments.list);
router.get("/departments/:id", departments.get);
router.post("/departments", authorize("hr", "super_admin"), departments.create);
router.put("/departments/:id", authorize("hr", "super_admin"), departments.update);
router.delete("/departments/:id", authorize("super_admin"), departments.remove);

/* DESIGNATIONS */
router.get("/designations", designations.list);
router.get("/designations/:id", designations.get);
router.post("/designations", authorize("hr", "super_admin"), designations.create);
router.put("/designations/:id", authorize("hr", "super_admin"), designations.update);
router.delete("/designations/:id", authorize("super_admin"), designations.remove);

/* JOB OPENINGS */
router.get("/jobs", jobs.list);
router.get("/jobs/:id", jobs.get);
router.post("/jobs", authorize("hr", "super_admin"), jobs.create);
router.put("/jobs/:id", authorize("hr", "super_admin"), jobs.update);
router.delete("/jobs/:id", authorize("super_admin"), jobs.remove);

/* CAREER APPLICATIONS */
router.get("/applications", authorize("hr", "super_admin"), listApplications);
router.get("/applications/:id", authorize("hr", "super_admin"), getApplication);
router.post("/applications/:id/convert", authorize("hr", "super_admin"), convertApplicationToCandidate);

/* CANDIDATES */
router.get("/candidates", candidates.list);
router.get("/candidates/:id", candidates.get);
router.post("/candidates", authorize("hr", "super_admin"), createCandidate);
router.put("/candidates/:id", authorize("hr", "super_admin"), candidates.update);

router.patch("/candidates/:id/offer", authorize("hr", "super_admin"), candidates.offer);
router.patch("/candidates/:id/offer/accept", authorize("hr", "super_admin"), candidates.acceptOffer);
router.patch("/candidates/:id/join", authorize("hr", "super_admin"), candidates.join);
router.patch("/candidates/:id/reject", authorize("hr", "super_admin"), candidates.reject);
router.patch(
  "/candidates/:id/status",
  updateCandidateStatus
);
router.delete("/candidates/:id", authorize("hr", "super_admin"), candidates.remove);

/* INTERVIEWS */
router.get("/interviews", interviews.list);
router.get("/interviews/:id", interviews.get);
router.post("/interviews", authorize("hr", "super_admin"), createInterview);
router.put("/interviews/:id", authorize("hr", "super_admin"), interviews.update);
router.patch("/interviews/:id", authorize("hr", "super_admin"), interviews.update);
router.delete("/interviews/:id", authorize("super_admin"), interviews.remove);

/* EMPLOYEES */
router.get("/employees", listEmployees);
router.get("/employees/:id", employees.get);
router.post("/employees", authorize("hr", "super_admin"), employees.create);
router.put("/employees/:id", authorize("hr", "super_admin"), employees.update);
router.delete("/employees/:id", authorize("super_admin"), employees.remove);
router.patch("/employees/:id", updateEmployee);

/* ATTENDANCE */
router.get("/attendance", attendance.list);
router.get("/attendance/:id", attendance.get);
router.post("/attendance", authorize("hr", "super_admin"), createAttendance);
router.put("/attendance/:id", authorize("hr", "super_admin"), attendance.update);
router.delete("/attendance/:id", authorize("super_admin"), attendance.remove);

/* LEAVE TYPES */
router.get("/leave-types", leaveTypes.list);
router.get("/leave-types/:id", leaveTypes.get);
router.post("/leave-types", authorize("hr", "super_admin"), leaveTypes.create);
router.put("/leave-types/:id", authorize("hr", "super_admin"), leaveTypes.update);
router.delete("/leave-types/:id", authorize("super_admin"), leaveTypes.remove);

/* LEAVES */
router.get("/leaves", listLeaves);
router.post("/leaves", authorize("employee", "hr", "super_admin"), applyLeave);
router.patch("/leaves/:id/review", authorize("hr", "super_admin"), reviewLeave);

/* NOTICES */
router.get("/notices", notices.list);
router.get("/notices/:id", notices.get);
router.post("/notices", authorize("hr", "super_admin"), createNotice);
router.put("/notices/:id", authorize("hr", "super_admin"), notices.update);
router.delete("/notices/:id", authorize("hr", "super_admin"), notices.remove);
router.patch("/notices/:id/acknowledge", authorize("employee", "hr", "super_admin"), acknowledgeNotice);

/* SALARY STRUCTURES */
router.get("/salary-structures", salaryStructures.list);
router.get("/salary-structures/:id", salaryStructures.get);
router.post("/salary-structures", authorize("hr", "super_admin"), salaryStructures.create);
router.put("/salary-structures/:id", authorize("hr", "super_admin"), salaryStructures.update);
router.delete("/salary-structures/:id", authorize("super_admin"), salaryStructures.remove);

/* PAYROLL */
router.get("/payroll", listPayroll);
router.post("/payroll", authorize("hr", "super_admin"), createPayroll);
router.patch("/payroll/:id/approve", authorize("hr", "super_admin"), approvePayroll);
router.patch("/payroll/:id",authorize("hr", "super_admin"), updatePayroll);
router.patch("/payroll/:id/pay",authorize("hr", "super_admin"), payPayroll);
router.get("/payroll/:id/pay",authorize("hr", "super_admin"), payPayroll);

/* DOCUMENTS */
router.get("/documents", authorize("employee", "hr", "super_admin"), listDocuments);
router.post("/documents", authorize("employee", "hr", "super_admin"), upload.single("file"), uploadDocument);
router.patch("/documents/:id/acknowledge", authorize("employee", "hr", "super_admin"), acknowledgeDocument);
router.post("/documents/offer/:candidateId", authorize("hr", "super_admin"), generateOffer);
router.post("/documents/appointment/:employeeId", authorize("hr", "super_admin"), generateAppointment);
router.post("/documents/payslip/:id", authorize("hr", "super_admin"), generateEmployeePayslip);
router.get("/documents/:id/download", authorize("employee", "hr", "super_admin"), downloadDocument);

/* NOTIFICATIONS */

/* =========================================================
   NOTIFICATIONS
========================================================= */

/* =========================================================
   NOTIFICATIONS
========================================================= */

router.get(
  "/notifications",
  notifications
);

router.post(
  "/notifications",
  authorize(
    "hr",
    "super_admin"
  ),
  createNotification
);

router.patch(
  "/notifications/:id/read",
  markNotificationRead
);

router.patch(
  "/notifications/:id/unread",
  markNotificationUnread
);

router.patch(
  "/notifications/read-all",
  markAllNotificationsRead
);

router.delete(
  "/notifications/:id",
  deleteNotification
);

/* LOGS */
router.get("/email-logs", authorize("hr", "super_admin"), emailLogs);
router.get("/audit-logs", authorize("super_admin"), auditLogs);

/* USER MANAGEMENT */
router.get("/users", authorize("hr", "super_admin"), getUsers);
router.patch("/users/:id", authorize("hr", "super_admin"), updateUser);
router.patch("/users/:id/status", authorize("hr", "super_admin"), updateUserStatus);
router.patch("/users/:id/password", authorize("hr", "super_admin"), resetUserPassword);

export default router;
