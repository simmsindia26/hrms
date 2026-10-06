import express from "express";

import {
  createJob,
  getJobById,
  updateJob,
  getPublicJob,
  publishJob,
  unpublishJob,
  closeJob,
  shareJob,
} from "../controllers/job.controller.js";

import {
  protect,
  authorize,
} from "../middleware/auth.js";

const router =
  express.Router();

/* =========================================================
   PUBLIC
========================================================= */

router.get(
  "/public/:slug",
  getPublicJob
);

/* =========================================================
   PROTECTED
========================================================= */

router.use(protect);

router.get(
  "/:id",
  authorize(
    "hr",
    "super_admin"
  ),
  getJobById
);

router.post(
  "/",
  authorize(
    "hr",
    "super_admin"
  ),
  createJob
);

router.patch(
  "/:id",
  authorize(
    "hr",
    "super_admin"
  ),
  updateJob
);

router.patch(
  "/:id/publish",
  authorize(
    "hr",
    "super_admin"
  ),
  publishJob
);

router.patch(
  "/:id/unpublish",
  authorize(
    "hr",
    "super_admin"
  ),
  unpublishJob
);

router.patch(
  "/:id/close",
  authorize(
    "hr",
    "super_admin"
  ),
  closeJob
);

router.post(
  "/:id/share",
  authorize(
    "hr",
    "super_admin"
  ),
  shareJob
);

export default router;