import express from "express";

import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "../controllers/settings.controller.js";

import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All settings routes require authentication
router.use(protect);

// Organization settings
router.get(
  "/organization",
  authorize("hr", "super_admin"),
  getOrganizationSettings
);

router.patch(
  "/organization",
  authorize("hr", "super_admin"),
  updateOrganizationSettings
);

export default router;