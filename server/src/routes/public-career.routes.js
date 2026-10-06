import express from "express";

import {
  getPublicJobs,
  getPublicJob,
  applyForJob,
} from "../controllers/public-career.controller.js";

import {
  uploadApplicationDocument,
} from "../controllers/public-career-document.controller.js";

import {
  careerUpload,
} from "../middleware/career-upload.middleware.js";

const router =
  express.Router();

/* =========================================================
   PUBLIC CAREER
========================================================= */

router.get(
  "/jobs",
  getPublicJobs
);

router.get(
  "/jobs/:slug",
  getPublicJob
);

router.post(
  "/jobs/:slug/apply",
  applyForJob
);

/* =========================================================
   APPLICATION DOCUMENTS
========================================================= */

router.post(
  "/applications/:applicationId/documents",
  careerUpload.single("file"),
  uploadApplicationDocument
);

export default router;