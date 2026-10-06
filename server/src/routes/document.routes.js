import { Router } from "express";

import {
  listDocuments,
  uploadDocument,
  generateOffer,
  generateAppointment,
  generateEmployeePayslip,
  acknowledgeDocument,
  getPayslip,
} from "../controllers/document.controller.js";

import {
  protect,
  authorize,
} from "../middleware/auth.js";

import upload from "../middleware/upload.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Documents
|--------------------------------------------------------------------------
*/

// List documents
router.get(
  "/",
  listDocuments
);

// Upload document
router.post(
  "/upload",
  authorize("hr", "super_admin"),
  upload.single("file"),
  uploadDocument
);

/*
|--------------------------------------------------------------------------
| Offer Letter
|--------------------------------------------------------------------------
*/

router.post(
  "/offer-letter/:candidateId",
  authorize("hr", "super_admin"),
  generateOffer
);

/*
|--------------------------------------------------------------------------
| Appointment Letter
|--------------------------------------------------------------------------
*/

router.post(
  "/appointment-letter/:employeeId",
  authorize("hr", "super_admin"),
  generateAppointment
);

/*
|--------------------------------------------------------------------------
| Payslip
|--------------------------------------------------------------------------
*/

// Generate payslip document
router.post(
  "/payslip/:payrollId",
  authorize("hr", "super_admin"),
  generateEmployeePayslip
);

// Get payslip
router.get(
  "/payslip/:payrollId",
  getPayslip
);

/*
|--------------------------------------------------------------------------
| Document Acknowledgement
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/acknowledge",
  acknowledgeDocument
);

export default router;