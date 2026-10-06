import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },

    path: {
      type: String,
      default: null,
    },

    contentType: {
      type: String,
      default: null,
    },

    size: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const emailLogSchema = new mongoose.Schema(
  {
    to: {
      type: [String],
      required: true,
    },

    cc: {
      type: [String],
      default: [],
    },

    bcc: {
      type: [String],
      default: [],
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    html: {
      type: String,
      default: "",
    },

    text: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "general",
        "recruitment",
        "leave",
        "attendance",
        "payroll",
        "notice",
        "document",
        "system",
      ],
      default: "general",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "queued",
        "sent",
        "failed",
      ],
      default: "queued",
      index: true,
    },

    messageId: {
      type: String,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    relatedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    relatedCandidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },

    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
      default: null,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

emailLogSchema.index({
  createdAt: -1,
});

emailLogSchema.index({
  status: 1,
  createdAt: -1,
});

emailLogSchema.index({
  category: 1,
  createdAt: -1,
});

emailLogSchema.index({
  to: 1,
});

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

const EmailLog =
  mongoose.models.EmailLog ||
  mongoose.model(
    "EmailLog",
    emailLogSchema,
  );

export default EmailLog;