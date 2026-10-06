import nodemailer from "nodemailer";

import { env } from "../config/env.js";

import EmailLog from "../models/EmailLog.js";

/* =========================================================
   SMTP TRANSPORTER
========================================================= */

let transporter = null;

function getTransporter() {
  if (!env.smtp.user || !env.smtp.pass) {
    throw new Error(
      "SMTP_USER and SMTP_PASS are required for email sending."
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: Number(env.smtp.port || 465),
      secure: Boolean(env.smtp.secure),

      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },

      logger: false,
      debug: false,
    });
  }

  return transporter;
}

/* =========================================================
   VERIFY SMTP
========================================================= */

export async function verifyEmailTransport() {
  try {
    const transport = getTransporter();

    await transport.verify();

    console.log("=================================");
    console.log("✅ SMTP SERVER READY");
    console.log("SMTP Host:", env.smtp.host);
    console.log("SMTP Port:", env.smtp.port);
    console.log("SMTP User:", env.smtp.user);
    console.log("=================================");

    return true;
  } catch (error) {
    console.error("=================================");
    console.error("❌ SMTP CONNECTION FAILED");
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("Message:", error.message);
    console.error("=================================");

    throw error;
  }
}

/* =========================================================
   NORMALIZE RECIPIENTS
========================================================= */

function normalizeRecipients(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
   REMOVE DUPLICATE EMAILS
========================================================= */

function uniqueRecipients(values = []) {
  const seen = new Set();

  return values.filter((email) => {
    const normalized = String(email)
      .trim()
      .toLowerCase();

    if (!normalized) {
      return false;
    }

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);

    return true;
  });
}

/* =========================================================
   PERMANENT CC
========================================================= */

function getPermanentCcRecipients() {
  /*
   * Reads:
   *
   * PERMANENT_EMAIL_CC=hr@example.com,admin@example.com
   *
   * from .env
   */

  if (!env.permanentEmailCc) {
    return [];
  }

  return uniqueRecipients(
    normalizeRecipients(env.permanentEmailCc)
  );
}

/* =========================================================
   NORMALIZE ATTACHMENTS
========================================================= */

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(Boolean)
    .map((attachment) => {
      if (typeof attachment === "string") {
        return {
          path: attachment,
        };
      }

      return {
        filename: attachment.filename,
        path: attachment.path,
        content: attachment.content,
        contentType: attachment.contentType,
        encoding: attachment.encoding,
      };
    });
}

/* =========================================================
   SEND EMAIL
========================================================= */

export async function sendEmail({
  to,
  cc = [],
  bcc = [],
  subject,
  html = "",
  text = "",
  category = "general",
  sentBy = null,
  relatedEmployee = null,
  relatedCandidate = null,
  template = null,
  metadata = {},
  attachments = [],
}) {
  /* -------------------------------------------------------
     NORMALIZE RECIPIENTS
  ------------------------------------------------------- */

  const recipients = uniqueRecipients(
    normalizeRecipients(to)
  );

  /*
   * CC supplied by the individual email
   */
  const normalCcRecipients = normalizeRecipients(cc);

  /*
   * Permanent CC from .env
   */
  const permanentCcRecipients =
    getPermanentCcRecipients();

  /*
   * FINAL CC
   *
   * Combines:
   *
   * 1. CC passed by caller
   * 2. Permanent CC from .env
   *
   * Duplicate addresses are removed.
   */
  const ccRecipients = uniqueRecipients([
    ...normalCcRecipients,
    ...permanentCcRecipients,
  ]);

  const bccRecipients = uniqueRecipients(
    normalizeRecipients(bcc)
  );

  const normalizedAttachments =
    normalizeAttachments(attachments);

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  if (!recipients.length) {
    throw new Error(
      "At least one recipient email address is required."
    );
  }

  if (!subject || !String(subject).trim()) {
    throw new Error("Email subject is required.");
  }

  /* -------------------------------------------------------
     FROM ADDRESS
  ------------------------------------------------------- */

  const fromName =
    env.smtp.fromName || "Sellopedia HRMS";

  const fromEmail =
    env.smtp.fromEmail || env.smtp.user;

  if (!fromEmail) {
    throw new Error(
      "SMTP_FROM or SMTP_USER is required."
    );
  }

  const from = `"${fromName}" <${fromEmail}>`;

  /* -------------------------------------------------------
     LOG
  ------------------------------------------------------- */

  console.log("=================================");
  console.log("📧 SENDING EMAIL");
  console.log("From:", from);
  console.log("To:", recipients);
  console.log("CC:", ccRecipients);
  console.log(
    "Permanent CC:",
    permanentCcRecipients
  );
  console.log("BCC:", bccRecipients);
  console.log("Subject:", subject);

  console.log(
    "Attachments:",
    normalizedAttachments.map(
      (attachment) =>
        attachment.filename ||
        attachment.path ||
        "attachment"
    )
  );

  console.log("=================================");

  /* -------------------------------------------------------
     CREATE EMAIL LOG
  ------------------------------------------------------- */

  const log = await EmailLog.create({
    to: recipients,

    /*
     * IMPORTANT:
     * Save the FINAL CC, not only the manually supplied CC.
     */
    cc: ccRecipients,

    bcc: bccRecipients,

    from,

    subject: String(subject).trim(),

    html,

    text,

    category,

    status: "queued",

    sentBy,

    relatedEmployee,

    relatedCandidate,

    template,

    metadata: {
      ...metadata,

      permanentCcApplied:
        permanentCcRecipients.length > 0,

      permanentCcRecipients,
    },

    attachments: normalizedAttachments.map(
      (attachment) => ({
        filename:
          attachment.filename ||
          "attachment",

        path:
          attachment.path || null,

        contentType:
          attachment.contentType || null,

        size: 0,
      })
    ),
  });

  /* -------------------------------------------------------
     SEND EMAIL
  ------------------------------------------------------- */

  try {
    const mailOptions = {
      from,

      to: recipients.join(", "),

      /*
       * FINAL CC IS SENT HERE
       */
      cc: ccRecipients.length
        ? ccRecipients.join(", ")
        : undefined,

      bcc: bccRecipients.length
        ? bccRecipients.join(", ")
        : undefined,

      subject: String(subject).trim(),

      html,

      text,

      /*
       * PDF/document attachments
       */
      attachments: normalizedAttachments,
    };

    const info = await getTransporter().sendMail(
      mailOptions
    );

    /* -----------------------------------------------------
       UPDATE EMAIL LOG
    ----------------------------------------------------- */

    log.status = "sent";

    log.messageId = info.messageId;

    log.sentAt = new Date();

    await log.save();

    /* -----------------------------------------------------
       SUCCESS LOG
    ----------------------------------------------------- */

    console.log("=================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("To:", recipients);
    console.log("CC:", ccRecipients);
    console.log(
      "Permanent CC:",
      permanentCcRecipients
    );
    console.log(
      "Attachments:",
      normalizedAttachments.length
    );
    console.log("=================================");

    return log;
  } catch (error) {
    /* -----------------------------------------------------
       UPDATE FAILED LOG
    ----------------------------------------------------- */

    log.status = "failed";

    log.error = error.message;

    await log.save();

    /* -----------------------------------------------------
       ERROR LOG
    ----------------------------------------------------- */

    console.error("=================================");
    console.error("❌ EMAIL SEND FAILED");
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error(
      "Response Code:",
      error.responseCode
    );
    console.error("Message:", error.message);
    console.error("=================================");

    throw error;
  }
}

/* =========================================================
   TEMPLATE VARIABLE RENDERER
========================================================= */

export function renderTemplate(
  value,
  variables = {}
) {
  return String(value || "").replace(
    /\{\{\s*([\w.]+)\s*\}\}/g,
    (_, key) => {
      const parts = key.split(".");

      let current = variables;

      for (const part of parts) {
        current = current?.[part];
      }

      return current ?? "";
    }
  );
}