import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      enum: [
        "beginner",
        "intermediate",
        "advanced",
        "expert",
      ],
      default: "intermediate",
    },

    required: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const JobOpeningSchema = new mongoose.Schema(
  {
    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    jobCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    },

    /* =====================================================
       JOB DESCRIPTION
    ===================================================== */

    shortDescription: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    responsibilities: {
      type: [requirementSchema],
      default: [],
    },

    requirements: {
      type: [requirementSchema],
      default: [],
    },

    qualifications: {
      type: [requirementSchema],
      default: [],
    },

    preferredQualifications: {
      type: [requirementSchema],
      default: [],
    },

    /* =====================================================
       SKILLS
    ===================================================== */

    skills: {
      type: [skillSchema],
      default: [],
    },

    /* =====================================================
       EXPERIENCE
    ===================================================== */

    experience: {
      minimumYears: {
        type: Number,
        default: 0,
        min: 0,
      },

      maximumYears: {
        type: Number,
        default: null,
        min: 0,
      },

      description: {
        type: String,
        trim: true,
      },
    },

    /* =====================================================
       EDUCATION
    ===================================================== */

    education: {
      minimumQualification: {
        type: String,
        trim: true,
      },

      preferredQualification: {
        type: String,
        trim: true,
      },

      fields: {
        type: [String],
        default: [],
      },
    },

    /* =====================================================
       EMPLOYMENT DETAILS
    ===================================================== */

    employmentType: {
      type: String,
      enum: [
        "full_time",
        "part_time",
        "contract",
        "internship",
      ],
      default: "full_time",
    },

    workMode: {
      type: String,
      enum: [
        "office",
        "hybrid",
        "remote",
      ],
      default: "office",
    },

    location: {
      type: String,
      trim: true,
    },

    openings: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* =====================================================
       SALARY
    ===================================================== */

    salary: {
      isDisclosed: {
        type: Boolean,
        default: false,
      },

      minimum: {
        type: Number,
        default: null,
        min: 0,
      },

      maximum: {
        type: Number,
        default: null,
        min: 0,
      },

      currency: {
        type: String,
        default: "INR",
        trim: true,
      },

      period: {
        type: String,
        enum: [
          "hourly",
          "monthly",
          "yearly",
        ],
        default: "yearly",
      },

      description: {
        type: String,
        trim: true,
      },
    },

    /* =====================================================
       BENEFITS
    ===================================================== */

    benefits: {
      type: [String],
      default: [],
    },

    /* =====================================================
       HIRING PROCESS
    ===================================================== */

    hiringProcess: {
      type: [
        {
          title: {
            type: String,
            required: true,
          },

          description: {
            type: String,
          },

          order: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },

    /* =====================================================
       APPLICATION
    ===================================================== */

    applicationEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    applicationInstructions: {
      type: String,
      trim: true,
    },

    /* =====================================================
       JOB STATUS
    ===================================================== */

    status: {
      type: String,
      enum: [
        "draft",
        "upcoming",
        "active",
        "paused",
        "closed",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    closingDate: {
      type: Date,
      default: null,
    },

    /* =====================================================
       SHAREABLE JOB DESCRIPTION
    ===================================================== */

    publicId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    publicSlug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },

    publicUrl: {
      type: String,
      default: null,
    },

    shareCount: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    applicationCount: {
      type: Number,
      default: 0,
    },

    /* =====================================================
       INTERNAL HR NOTES
    ===================================================== */

    internalNotes: {
      type: String,
      trim: true,
    },

    /* =====================================================
       CREATOR
    ===================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
========================================================= */

JobOpeningSchema.index({
  title: "text",
  description: "text",
  shortDescription: "text",
});

JobOpeningSchema.index({
  department: 1,
  designation: 1,
});

JobOpeningSchema.index({
  status: 1,
  isPublic: 1,
});

JobOpeningSchema.index({
  closingDate: 1,
});

/* =========================================================
   EXPORT
========================================================= */

export const JobOpening = mongoose.model(
  "JobOpening",
  JobOpeningSchema
);