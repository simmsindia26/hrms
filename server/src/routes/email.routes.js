import express from "express";

import {
  // ==========================================
  // SENT EMAIL / EMAIL LOGS
  // ==========================================
  getEmailLogs,
  getEmailLogById,
  sendEmail,
  resendEmail,
  deleteEmailLog,

  // ==========================================
  // EMAIL TEMPLATES
  // ==========================================
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,

  // ==========================================
  // RECEIVED EMAIL / INBOX
  // ==========================================
  getInbox,
  getInboxEmail,
  markInboxEmailRead,
  markInboxEmailUnread,
  syncReceivedMail,
} from "../controllers/email.controller.js";

import {
  protect,
  authorize,
} from "../middleware/auth.js";

import emailUpload from "../middleware/emailUpload.js";

const router = express.Router();

/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(protect);

/* =========================================================
   RECEIVED MAIL / INBOX
========================================================= */

/**
 * GET
 * /api/v1/email/inbox
 *
 * Employee:
 *   Only own emails
 *
 * HR:
 *   Complete mailbox
 *
 * Super Admin:
 *   Complete mailbox
 */
router.get(
  "/inbox",
  authorize(
    "employee",
    "hr",
    "super_admin",
  ),
  getInbox,
);

/**
 * GET
 * /api/v1/email/inbox/:id
 *
 * Employee:
 *   Can only open an email that belongs
 *   to their mailbox.
 *
 * HR/Super Admin:
 *   Can open any email.
 */
router.get(
  "/inbox/:id",
  authorize(
    "employee",
    "hr",
    "super_admin",
  ),
  getInboxEmail,
);

/**
 * PATCH
 * /api/v1/email/inbox/:id/read
 */
router.patch(
  "/inbox/:id/read",
  authorize(
    "employee",
    "hr",
    "super_admin",
  ),
  markInboxEmailRead,
);

/**
 * PATCH
 * /api/v1/email/inbox/:id/unread
 */
router.patch(
  "/inbox/:id/unread",
  authorize(
    "employee",
    "hr",
    "super_admin",
  ),
  markInboxEmailUnread,
);

/**
 * POST
 * /api/v1/email/inbox/sync
 *
 * IMPORTANT:
 * Only HR and Super Admin can
 * synchronize the Hostinger mailbox.
 *
 * Employees must NOT trigger the
 * global mailbox synchronization.
 */
router.post(
  "/inbox/sync",
  authorize(
    "hr",
    "super_admin",
  ),
  syncReceivedMail,
);

/* =========================================================
   SENT EMAIL / EMAIL LOGS
========================================================= */

/**
 * GET
 * /api/v1/email/logs
 */
router.get(
  "/logs",
  authorize(
    "hr",
    "super_admin",
  ),
  getEmailLogs,
);

/**
 * GET
 * /api/v1/email/logs/:id
 */
router.get(
  "/logs/:id",
  authorize(
    "hr",
    "super_admin",
  ),
  getEmailLogById,
);

/**
 * POST
 * /api/v1/email/logs/:id/resend
 */
router.post(
  "/logs/:id/resend",
  authorize(
    "hr",
    "super_admin",
  ),
  resendEmail,
);

/**
 * DELETE
 * /api/v1/email/logs/:id
 */
router.delete(
  "/logs/:id",
  authorize(
    "hr",
    "super_admin",
  ),
  deleteEmailLog,
);

/* =========================================================
   SEND EMAIL
========================================================= */

/**
 * POST
 * /api/v1/email/send
 *
 * HR / Super Admin only.
 */
router.post(
  "/send",
  authorize(
    "hr",
    "super_admin",
  ),
  emailUpload.array(
    "attachments",
    10,
  ),
  sendEmail,
);

/* =========================================================
   EMAIL TEMPLATES
========================================================= */

/**
 * GET
 * /api/v1/email/templates
 */
router.get(
  "/templates",
  authorize(
    "hr",
    "super_admin",
  ),
  getEmailTemplates,
);

/**
 * GET
 * /api/v1/email/templates/:id
 */
router.get(
  "/templates/:id",
  authorize(
    "hr",
    "super_admin",
  ),
  getEmailTemplateById,
);

/**
 * POST
 * /api/v1/email/templates
 */
router.post(
  "/templates",
  authorize(
    "hr",
    "super_admin",
  ),
  createEmailTemplate,
);

/**
 * PATCH
 * /api/v1/email/templates/:id
 */
router.patch(
  "/templates/:id",
  authorize(
    "hr",
    "super_admin",
  ),
  updateEmailTemplate,
);

/**
 * DELETE
 * /api/v1/email/templates/:id
 */
router.delete(
  "/templates/:id",
  authorize(
    "hr",
    "super_admin",
  ),
  deleteEmailTemplate,
);

export default router;