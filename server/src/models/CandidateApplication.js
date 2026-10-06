import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    qualification: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
    },
    boardUniversity: {
      type: String,
      trim: true,
    },
    passingYear: {
      type: String,
      trim: true,
    },
    percentage: {
      type: String,
      trim: true,
    },
    cgpa: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      trim: true,
    },
    startDate: Date,
    endDate: Date,
    currentlyWorking: {
      type: Boolean,
      default: false,
    },
    responsibilities: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "resume",
        "photo",
        "certificate",
        "experience",
        "identity",
        "other",
      ],
      default: "other",
    },

    originalName: String,

    fileName: String,

    fileUrl: String,

    mimeType: String,

    fileSize: Number,

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const candidateApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      unique: true,
      index: true,
    },

   job: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "JobOpening",
  required: true,
  index: true,
},

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
      index: true,
    },

    personalDetails: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },

      lastName: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      alternatePhone: {
        type: String,
        trim: true,
      },

      dateOfBirth: Date,

      gender: {
        type: String,
        trim: true,
      },

      address: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      country: {
        type: String,
        default: "India",
        trim: true,
      },

      pincode: {
        type: String,
        trim: true,
      },
    },

    professionalDetails: {
      currentCompany: {
        type: String,
        trim: true,
      },

      currentDesignation: {
        type: String,
        trim: true,
      },

      totalExperience: {
        type: String,
        trim: true,
      },

      relevantExperience: {
        type: String,
        trim: true,
      },

      currentSalary: {
        type: String,
        trim: true,
      },

      expectedSalary: {
        type: String,
        trim: true,
      },

      noticePeriod: {
        type: String,
        trim: true,
      },
    },

    education: [educationSchema],

    experience: [experienceSchema],

    links: {
      linkedin: {
        type: String,
        trim: true,
      },

      github: {
        type: String,
        trim: true,
      },

      portfolio: {
        type: String,
        trim: true,
      },

      other: {
        type: String,
        trim: true,
      },
    },

    coverLetter: {
      type: String,
      trim: true,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    documents: [documentSchema],

    source: {
      type: String,
      default: "career_portal",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
        "withdrawn",
        "joined",
      ],
      default: "submitted",
      index: true,
    },

    consent: {
      type: Boolean,
      required: true,
      default: false,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Generate application number
 * Example:
 * APP-2026-000001
 */
candidateApplicationSchema.pre("save", async function (next) {
  if (!this.isNew || this.applicationNumber) {
    return next();
  }

  const year = new Date().getFullYear();

  const lastApplication = await mongoose
    .model("CandidateApplication")
    .findOne({
      applicationNumber: new RegExp(`^APP-${year}-`),
    })
    .sort({ createdAt: -1 })
    .select("applicationNumber")
    .lean();

  let nextNumber = 1;

  if (lastApplication?.applicationNumber) {
    const parts = lastApplication.applicationNumber.split("-");
    const lastNumber = Number(parts[2]);

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  this.applicationNumber = `APP-${year}-${String(nextNumber).padStart(
    6,
    "0"
  )}`;

  next();
});

export const CandidateApplication = mongoose.model(
  "CandidateApplication",
  candidateApplicationSchema
);