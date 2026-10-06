import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "offer_letter",
        "appointment_letter",
        "payslip",
        "aadhaar",
        "pan",
        "bank_document",
        "education_certificate",
        "experience_certificate",
        "resume",
        "warning_notice",
        "disciplinary_notice",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: String,

    fileUrl: String,

    mimeType: String,

    fileSize: Number,

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    acknowledged: {
      type: Boolean,
      default: false,
    },

    acknowledgedAt: Date,

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.model("Document", documentSchema);