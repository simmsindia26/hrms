import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    _id: false,
  },
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      default: "attachment",
    },

    contentType: {
      type: String,
      default: "application/octet-stream",
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

const receivedEmailSchema = new mongoose.Schema(
  {
    // ==========================================
    // EMAIL IDENTIFICATION
    // ==========================================

    messageId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // ==========================================
    // SENDER
    // ==========================================

    from: {
      type: addressSchema,
      default: () => ({
        name: "",
        email: "",
      }),
    },

    // ==========================================
    // RECIPIENTS
    // ==========================================

    to: {
      type: [addressSchema],
      default: [],
    },

    cc: {
      type: [addressSchema],
      default: [],
    },

    // ==========================================
    // CONTENT
    // ==========================================

    subject: {
      type: String,
      default: "(No Subject)",
      trim: true,
    },

    text: {
      type: String,
      default: "",
    },

    html: {
      type: String,
      default: "",
    },

    // ==========================================
    // DATES
    // ==========================================

    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // ==========================================
    // READ STATUS
    // ==========================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ==========================================
    // ATTACHMENTS
    // ==========================================

    hasAttachments: {
      type: Boolean,
      default: false,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    // ==========================================
    // MAILBOX
    // ==========================================

    folder: {
      type: String,
      default: "INBOX",
      uppercase: true,
      trim: true,
      index: true,
    },

    // ==========================================
    // IMAP UID
    // ==========================================

    uid: {
      type: Number,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
|
| The important index for employee inbox filtering:
|
| to.email
|
| This allows queries such as:
|
| ReceivedEmail.find({
|   "to.email": "employee@sellopedia.in"
| })
|
*/

receivedEmailSchema.index({
  "to.email": 1,
  receivedAt: -1,
});

receivedEmailSchema.index({
  "from.email": 1,
  receivedAt: -1,
});

receivedEmailSchema.index({
  isRead: 1,
  receivedAt: -1,
});

receivedEmailSchema.index({
  folder: 1,
  receivedAt: -1,
});

const ReceivedEmail =
  mongoose.models.ReceivedEmail ||
  mongoose.model(
    "ReceivedEmail",
    receivedEmailSchema,
  );

export default ReceivedEmail;