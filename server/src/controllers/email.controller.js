import EmailLog from "../models/EmailLog.js";
import EmailTemplate from "../models/EmailTemplate.js";
import ReceivedEmail from "../models/ReceivedEmail.js";
import { syncInbox } from "../services/inbox.service.js";

import {
  sendEmail as sendEmailService,
} from "../services/email.service.js";

// ==========================================
// HELPERS
// ==========================================

const getPagination = (page, limit) => {
  const currentPage = Math.max(
    Number.parseInt(page, 10) || 1,
    1,
  );

  const perPage = Math.min(
    Math.max(
      Number.parseInt(limit, 10) || 10,
      1,
    ),
    100,
  );

  return {
    page: currentPage,
    limit: perPage,
    skip: (currentPage - 1) * perPage,
  };
};

const normalizeEmailList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          item &&
          typeof item === "object"
        ) {
          return (
            item.email ||
            item.address ||
            ""
          );
        }

        return String(item);
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeEmail = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
};

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
};

const parseMetadata = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// ==========================================
// INBOX ACCESS
// ==========================================

/**
 * HR / Super Admin:
 * Can see all received emails.
 *
 * Employee:
 * Can only see emails addressed to
 * their authenticated email address.
 */
const getInboxAccessFilter = (req) => {
  const role = req.user?.role;

  // HR and Super Admin can see
  // the complete company mailbox.
  if (
    role === "hr" ||
    role === "super_admin"
  ) {
    return {};
  }

  // Employee can only see emails
  // addressed to their login email.
  if (role === "employee") {
    const employeeEmail = String(
      req.user?.email || "",
    )
      .trim()
      .toLowerCase();

    // Never expose the mailbox if
    // employee email is unavailable.
    if (!employeeEmail) {
      return {
        _id: {
          $exists: false,
        },
      };
    }

    return {
      "to.email": employeeEmail,
    };
  }

  // Unknown role = no emails.
  return {
    _id: {
      $exists: false,
    },
  };
};

// ==========================================
// EMAIL LOGS
// ==========================================

export const getEmailLogs = async (
  req,
  res,
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      category,
    } = req.query;

    const {
      page: currentPage,
      limit: perPage,
      skip,
    } = getPagination(
      page,
      limit,
    );

    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (
      String(search).trim()
    ) {
      const regex = new RegExp(
        escapeRegex(
          String(search).trim(),
        ),
        "i",
      );

      query.$or = [
        { subject: regex },
        { to: regex },
        { cc: regex },
        { bcc: regex },
        { messageId: regex },
        { error: regex },
      ];
    }

    const [logs, total] =
      await Promise.all([
        EmailLog.find(query)
          .populate(
            "sentBy",
            "name email employeeId",
          )
          .populate(
            "relatedEmployee",
            "name email employeeId",
          )
          .populate(
            "relatedCandidate",
            "name email phone",
          )
          .populate(
            "template",
            "name subject category",
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(perPage)
          .lean(),

        EmailLog.countDocuments(query),
      ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages: Math.ceil(
          total / perPage,
        ),
        totalPages: Math.ceil(
          total / perPage,
        ),
      },
    });
  } catch (error) {
    console.error(
      "getEmailLogs error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch email logs.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// SINGLE EMAIL LOG
// ==========================================

export const getEmailLogById = async (
  req,
  res,
) => {
  try {
    const log =
      await EmailLog.findById(
        req.params.id,
      )
        .populate(
          "sentBy",
          "name email employeeId",
        )
        .populate(
          "relatedEmployee",
          "name email employeeId",
        )
        .populate(
          "relatedCandidate",
          "name email phone",
        )
        .populate(
          "template",
          "name subject category",
        );

    if (!log) {
      return res.status(404).json({
        success: false,
        message:
          "Email log not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error(
      "getEmailLogById error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch email log.",
    });
  }
};

// ==========================================
// SEND EMAIL
// ==========================================

export const sendEmail = async (
  req,
  res,
) => {
  try {
    const body = req.body || {};

    const {
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      category = "general",
      relatedEmployee,
      relatedCandidate,
      template,
      metadata,
    } = body;

    const recipients =
      normalizeEmailList(to);

    if (!recipients.length) {
      return res.status(400).json({
        success: false,
        message:
          "At least one recipient is required.",
      });
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Email subject is required.",
      });
    }

    if (!html && !text) {
      return res.status(400).json({
        success: false,
        message:
          "Email content is required.",
      });
    }

    const attachments =
      Array.isArray(req.files)
        ? req.files.map((file) => ({
            filename:
              file.originalname,
            path: file.path,
            contentType:
              file.mimetype,
          }))
        : [];

    const result =
      await sendEmailService({
        to: recipients,
        cc: normalizeEmailList(cc),
        bcc: normalizeEmailList(bcc),
        subject: subject.trim(),
        html: html || "",
        text: text || "",
        category,
        sentBy:
          req.user?._id || null,
        relatedEmployee:
          relatedEmployee || null,
        relatedCandidate:
          relatedCandidate || null,
        template:
          template || null,
        metadata:
          parseMetadata(metadata),
        attachments,
      });

    return res.status(200).json({
      success: true,
      message:
        "Email sent successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "sendEmail controller error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send email.",
    });
  }
};

// ==========================================
// RESEND EMAIL
// ==========================================

export const resendEmail = async (
  req,
  res,
) => {
  try {
    const log =
      await EmailLog.findById(
        req.params.id,
      );

    if (!log) {
      return res.status(404).json({
        success: false,
        message:
          "Email log not found.",
      });
    }

    const attachments =
      Array.isArray(
        log.attachments,
      )
        ? log.attachments
            .filter(
              (item) => item.path,
            )
            .map((item) => ({
              filename:
                item.filename,
              path: item.path,
              contentType:
                item.contentType,
            }))
        : [];

    const result =
      await sendEmailService({
        to: normalizeEmailList(
          log.to,
        ),
        cc: normalizeEmailList(
          log.cc,
        ),
        bcc: normalizeEmailList(
          log.bcc,
        ),
        subject:
          log.subject || "",
        html:
          log.html || "",
        text:
          log.text || "",
        category:
          log.category ||
          "general",
        sentBy:
          req.user?._id || null,
        relatedEmployee:
          log.relatedEmployee ||
          null,
        relatedCandidate:
          log.relatedCandidate ||
          null,
        template:
          log.template || null,
        attachments,
        metadata: {
          resentFrom:
            log._id,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Email resent successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "resendEmail error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to resend email.",
    });
  }
};

// ==========================================
// DELETE EMAIL LOG
// ==========================================

export const deleteEmailLog =
  async (req, res) => {
    try {
      const log =
        await EmailLog.findByIdAndDelete(
          req.params.id,
        );

      if (!log) {
        return res.status(404).json({
          success: false,
          message:
            "Email log not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Email log deleted successfully.",
      });
    } catch (error) {
      console.error(
        "deleteEmailLog error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete email log.",
      });
    }
  };

// ==========================================
// EMAIL TEMPLATES
// ==========================================

export const getEmailTemplates =
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 100,
        search = "",
        category,
      } = req.query;

      const {
        page: currentPage,
        limit: perPage,
        skip,
      } = getPagination(
        page,
        limit,
      );

      const query = {};

      if (category) {
        query.category = category;
      }

      if (
        String(search).trim()
      ) {
        const regex = new RegExp(
          escapeRegex(
            String(search).trim(),
          ),
          "i",
        );

        query.$or = [
          {
            name: regex,
          },
          {
            subject: regex,
          },
          {
            html: regex,
          },
        ];
      }

      const [
        templates,
        total,
      ] = await Promise.all([
        EmailTemplate.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(perPage)
          .lean(),

        EmailTemplate.countDocuments(
          query,
        ),
      ]);

      return res.status(200).json({
        success: true,
        data: templates,
        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          pages: Math.ceil(
            total / perPage,
          ),
          totalPages: Math.ceil(
            total / perPage,
          ),
        },
      });
    } catch (error) {
      console.error(
        "getEmailTemplates error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch email templates.",
      });
    }
  };

// ==========================================
// SINGLE TEMPLATE
// ==========================================

export const getEmailTemplateById =
  async (req, res) => {
    try {
      const template =
        await EmailTemplate.findById(
          req.params.id,
        );

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Email template not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error(
        "getEmailTemplateById error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch email template.",
      });
    }
  };

// ==========================================
// CREATE TEMPLATE
// ==========================================

export const createEmailTemplate =
  async (req, res) => {
    try {
      const {
        name,
        subject,
        html,
        category = "general",
        enabled = true,
        variables = [],
      } = req.body || {};

      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Template name is required.",
        });
      }

      if (!subject?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Template subject is required.",
        });
      }

      if (!html?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Template HTML is required.",
        });
      }

      const template =
        await EmailTemplate.create({
          name: name.trim(),
          subject: subject.trim(),
          html,
          category,
          enabled:
            enabled === true ||
            enabled === "true",
          variables:
            Array.isArray(
              variables,
            )
              ? variables
              : [],
        });

      return res.status(201).json({
        success: true,
        message:
          "Email template created successfully.",
        data: template,
      });
    } catch (error) {
      console.error(
        "createEmailTemplate error:",
        error,
      );

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A template with this name already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create email template.",
        error: error.message,
      });
    }
  };

// ==========================================
// UPDATE TEMPLATE
// ==========================================

export const updateEmailTemplate =
  async (req, res) => {
    try {
      const allowedFields = [
        "name",
        "subject",
        "html",
        "category",
        "enabled",
        "variables",
      ];

      const updates = {};

      for (
        const field of allowedFields
      ) {
        if (
          req.body?.[field] !==
          undefined
        ) {
          updates[field] =
            req.body[field];
        }
      }

      if (
        updates.enabled !==
        undefined
      ) {
        updates.enabled =
          updates.enabled === true ||
          updates.enabled === "true";
      }

      const template =
        await EmailTemplate.findByIdAndUpdate(
          req.params.id,
          updates,
          {
            new: true,
            runValidators: true,
          },
        );

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Email template not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Email template updated successfully.",
        data: template,
      });
    } catch (error) {
      console.error(
        "updateEmailTemplate error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update email template.",
      });
    }
  };

// ==========================================
// DELETE TEMPLATE
// ==========================================

export const deleteEmailTemplate =
  async (req, res) => {
    try {
      const template =
        await EmailTemplate.findByIdAndDelete(
          req.params.id,
        );

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Email template not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Email template deleted successfully.",
      });
    } catch (error) {
      console.error(
        "deleteEmailTemplate error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete email template.",
      });
    }
  };

// ==========================================
// GET INBOX
// ==========================================

export const getInbox = async (
  req,
  res,
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 10,
        1,
      ),
      100,
    );

    const search = String(
      req.query.search || "",
    ).trim();

    const status = String(
      req.query.status || "",
    ).trim();

    const accessFilter =
      getInboxAccessFilter(req);

    const filter = {
      ...accessFilter,
    };

    // ----------------------------------------
    // READ / UNREAD
    // ----------------------------------------

    if (status === "unread") {
      filter.isRead = false;
    }

    if (status === "read") {
      filter.isRead = true;
    }

    // ----------------------------------------
    // SEARCH
    // ----------------------------------------

    if (search) {
      const regex = new RegExp(
        escapeRegex(search),
        "i",
      );

      const searchCondition = {
        $or: [
          {
            subject: regex,
          },
          {
            "from.name": regex,
          },
          {
            "from.email": regex,
          },
          {
            text: regex,
          },
          {
            html: regex,
          },
        ],
      };

      if (filter.$or) {
        filter.$and = [
          {
            $or: filter.$or,
          },
          searchCondition,
        ];

        delete filter.$or;
      } else {
        filter.$or =
          searchCondition.$or;
      }
    }

    const skip =
      (page - 1) * limit;

    const unreadFilter = {
      ...accessFilter,
      isRead: false,
    };

    const [
      emails,
      total,
      unread,
    ] = await Promise.all([
      ReceivedEmail.find(filter)
        .sort({
          receivedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      ReceivedEmail.countDocuments(
        filter,
      ),

      ReceivedEmail.countDocuments(
        unreadFilter,
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: emails,
      unread,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(
          1,
          Math.ceil(
            total / limit,
          ),
        ),
        totalPages: Math.max(
          1,
          Math.ceil(
            total / limit,
          ),
        ),
      },
    });
  } catch (error) {
    console.error(
      "getInbox error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch inbox.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// GET SINGLE INBOX EMAIL
// ==========================================

export const getInboxEmail =
  async (req, res) => {
    try {
      const accessFilter =
        getInboxAccessFilter(req);

      if (
        accessFilter._id?.$exists ===
        false
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Email not found.",
        });
      }

      const query = {
        _id: req.params.id,
      };

      if (accessFilter.$or) {
        query.$and = [
          {
            $or: accessFilter.$or,
          },
        ];
      }

      const email =
        await ReceivedEmail.findOne(
          query,
        ).lean();

      if (!email) {
        return res.status(404).json({
          success: false,
          message:
            "Email not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: email,
      });
    } catch (error) {
      console.error(
        "getInboxEmail error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch email.",
      });
    }
  };

// ==========================================
// MARK EMAIL READ
// ==========================================

export const markInboxEmailRead =
  async (req, res) => {
    try {
      const accessFilter =
        getInboxAccessFilter(req);

      if (
        accessFilter._id?.$exists ===
        false
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Email not found.",
        });
      }

      const query = {
        _id: req.params.id,
      };

      if (accessFilter.$or) {
        query.$and = [
          {
            $or: accessFilter.$or,
          },
        ];
      }

      const email =
        await ReceivedEmail.findOneAndUpdate(
          query,
          {
            $set: {
              isRead: true,
            },
          },
          {
            new: true,
          },
        ).lean();

      if (!email) {
        return res.status(404).json({
          success: false,
          message:
            "Email not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Email marked as read.",
        data: email,
      });
    } catch (error) {
      console.error(
        "markInboxEmailRead error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark email as read.",
      });
    }
  };

// ==========================================
// MARK EMAIL UNREAD
// ==========================================

export const markInboxEmailUnread =
  async (req, res) => {
    try {
      const accessFilter =
        getInboxAccessFilter(req);

      if (
        accessFilter._id?.$exists ===
        false
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Email not found.",
        });
      }

      const query = {
        _id: req.params.id,
      };

      if (accessFilter.$or) {
        query.$and = [
          {
            $or: accessFilter.$or,
          },
        ];
      }

      const email =
        await ReceivedEmail.findOneAndUpdate(
          query,
          {
            $set: {
              isRead: false,
            },
          },
          {
            new: true,
          },
        ).lean();

      if (!email) {
        return res.status(404).json({
          success: false,
          message:
            "Email not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Email marked as unread.",
        data: email,
      });
    } catch (error) {
      console.error(
        "markInboxEmailUnread error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark email as unread.",
      });
    }
  };

// ==========================================
// SYNC RECEIVED MAIL
// ==========================================

export const syncReceivedMail =
  async (req, res) => {
    try {
      const result =
        await syncInbox();

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "syncReceivedMail error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to synchronize inbox.",
      });
    }
  };