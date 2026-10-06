import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    resumeUrl: { type: String, default: "" },

    jobOpening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOpening",
      default: null,
    },

    source: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: [
        "applied",
        "screening",
        "interview",
        "selected",
        "rejected",
        "joined",
        "withdrawn",
      ],
      default: "applied",
    },

    notes: { type: String, default: "" },

    offerStatus: {
      type: String,
      enum: ["not_generated", "sent", "accepted", "declined"],
      default: "not_generated",
    },

    offerSentAt: { type: Date, default: null },
    offerAcceptedAt: { type: Date, default: null },
    offerDeclinedAt: { type: Date, default: null },

    offerAcceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    joiningDate: { type: Date, default: null },
    joinedAt: { type: Date, default: null },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

candidateSchema.index({ email: 1 });
candidateSchema.index({ phone: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ offerStatus: 1 });
candidateSchema.index({ jobOpening: 1 });
candidateSchema.index({ employee: 1 });

export const Candidate = mongoose.model("Candidate", candidateSchema);
