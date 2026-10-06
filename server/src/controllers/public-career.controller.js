import mongoose from "mongoose";
import { CandidateApplication } from "../models/CandidateApplication.js";
import { JobOpening } from "../models/JobOpening.js";
import { sendHREventEmail } from "../services/hr-email-events.service.js";

/* =========================================================
   HELPERS
========================================================= */

function createSlug(title, publicId = "") {
  const slug = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return publicId ? `${slug}-${publicId}` : slug;
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* =========================================================
   PUBLIC JOB SERIALIZER
========================================================= */

function serializePublicJob(job) {
  const data = job?.toObject ? job.toObject() : job;

  return {
    _id: data._id,

    publicId: data.publicId,

    publicSlug: data.publicSlug,

    publicUrl: data.publicUrl,

    title: data.title,

    jobCode: data.jobCode,

    department: data.department,

    designation: data.designation,

    shortDescription: data.shortDescription,

    description: data.description,

    responsibilities: data.responsibilities || [],

    requirements: data.requirements || [],

    qualifications: data.qualifications || [],

    preferredQualifications:
      data.preferredQualifications || [],

    skills: data.skills || [],

    experience:
      data.experience || {
        minimumYears: 0,
        maximumYears: null,
        description: "",
      },

    education: data.education || {},

    employmentType: data.employmentType,

    workMode: data.workMode,

    location: data.location,

    openings: data.openings,

    salary: data.salary?.isDisclosed
      ? data.salary
      : {
          isDisclosed: false,
        },

    benefits: data.benefits || [],

    hiringProcess: data.hiringProcess || [],

    applicationEmail: data.applicationEmail,

    applicationInstructions:
      data.applicationInstructions,

    publishedAt: data.publishedAt,

    closingDate: data.closingDate,

    viewCount: data.viewCount || 0,

    shareCount: data.shareCount || 0,

    applicationCount:
      data.applicationCount || 0,

    createdAt: data.createdAt,
  };
}

/* =========================================================
   FIND PUBLIC JOB
========================================================= */

async function findPublicJob(slug) {
  let job = await JobOpening.findOne({
    publicSlug: slug,
    isPublic: true,
    status: "active",
  })
    .populate("department", "name")
    .populate("designation", "name");

  /*
   * Fallback for older jobs where publicSlug
   * may not have been generated.
   */
  if (!job) {
    const jobs = await JobOpening.find({
      isPublic: true,
      status: "active",
    })
      .populate("department", "name")
      .populate("designation", "name");

    job =
      jobs.find(
        (item) =>
          createSlug(
            item.title,
            item.publicId
          ) === slug
      ) || null;
  }

  return job;
}

/* =========================================================
   GET PUBLIC JOBS
   GET /api/v1/public/careers/jobs
========================================================= */

export async function getPublicJobs(req, res) {
  try {
    const now = new Date();

    const jobs = await JobOpening.find({
      isPublic: true,

      status: "active",

      $or: [
        {
          closingDate: null,
        },
        {
          closingDate: {
            $gte: now,
          },
        },
      ],
    })
      .populate("department", "name")
      .populate("designation", "name")
      .sort({
        publishedAt: -1,
        createdAt: -1,
      });

    const publicJobs = jobs.map(
      serializePublicJob
    );

    return res.status(200).json({
      success: true,
      count: publicJobs.length,
      data: publicJobs,
    });
  } catch (error) {
    console.error(
      "PUBLIC CAREER JOBS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load job openings.",
    });
  }
}

/* =========================================================
   GET PUBLIC JOB
   GET /api/v1/public/careers/jobs/:slug
========================================================= */

export async function getPublicJob(req, res) {
  try {
    const { slug } = req.params;

    const job = await findPublicJob(slug);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found or no longer available.",
      });
    }

    if (
      job.closingDate &&
      new Date(job.closingDate) < new Date()
    ) {
      return res.status(410).json({
        success: false,
        message:
          "Applications for this position are closed.",
      });
    }

    /*
     * Increment views.
     */
    await JobOpening.updateOne(
      {
        _id: job._id,
      },
      {
        $inc: {
          viewCount: 1,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: serializePublicJob(job),
    });
  } catch (error) {
    console.error(
      "PUBLIC CAREER JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load job details.",
    });
  }
}

/* =========================================================
   APPLY FOR JOB
   POST /api/v1/public/careers/jobs/:slug/apply
========================================================= */

export async function applyForJob(req, res) {
  try {
    const { slug } = req.params;

    const {
      personalDetails,
      professionalDetails,
      education,
      experience,
      links,
      coverLetter,
      skills,
      consent,
    } = req.body;

    console.log("\n==========================================");
    console.log("PUBLIC CAREER APPLICATION");
    console.log("==========================================");
    console.log("Job Slug:", slug);
    console.log(
      "Personal Details:",
      JSON.stringify(personalDetails, null, 2)
    );
    console.log(
      "Consent:",
      consent,
      "Type:",
      typeof consent
    );

    // ========================================
    // VALIDATION
    // ========================================

    if (!personalDetails) {
      return res.status(400).json({
        success: false,
        message: "Personal details are required.",
      });
    }

    if (!personalDetails.firstName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name is required.",
      });
    }

    if (!personalDetails.email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    if (!personalDetails.phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: "You must accept the declaration and consent.",
        receivedConsent: consent,
        consentType: typeof consent,
      });
    }

    // ========================================
    // FIND JOB
    // ========================================

    const job = await findPublicJob(slug);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }

    // ========================================
    // CHECK CLOSING DATE
    // ========================================

    if (
      job.closingDate &&
      new Date(job.closingDate) < new Date()
    ) {
      return res.status(410).json({
        success: false,
        message: "Applications for this job are closed.",
      });
    }

    // ========================================
    // NORMALIZE PERSONAL DATA
    // ========================================

    const firstName =
      clean(personalDetails.firstName);

    const lastName =
      clean(personalDetails.lastName);

    const email =
      clean(personalDetails.email).toLowerCase();

    const phone =
      clean(personalDetails.phone);

    // ========================================
    // DUPLICATE APPLICATION CHECK
    // ========================================

    const existingApplication =
      await CandidateApplication.findOne({
        job: job._id,
        "personalDetails.email": email,
      });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message:
          "You have already applied for this position.",
        applicationNumber:
          existingApplication.applicationNumber,
      });
    }

    // ========================================
    // CREATE APPLICATION
    // ========================================

    const application =
      await CandidateApplication.create({
        job: job._id,

        personalDetails: {
          ...personalDetails,

          firstName,
          lastName,
          email,
          phone,
        },

        professionalDetails:
          professionalDetails || {},

        education:
          Array.isArray(education)
            ? education
            : [],

        experience:
          Array.isArray(experience)
            ? experience
            : [],

        links:
          links || {},

        coverLetter:
          clean(coverLetter),

        skills:
          Array.isArray(skills)
            ? skills
            : [],

        source: "career_portal",

        status: "submitted",

        consent: true,
      });

    console.log(
      "✅ Application created:",
      application._id
    );

    // ========================================
    // UPDATE JOB APPLICATION COUNT
    // ========================================

    await JobOpening.updateOne(
      {
        _id: job._id,
      },
      {
        $inc: {
          applicationCount: 1,
        },
      }
    );

    // ========================================
    // EMAIL NOTIFICATIONS
    // ========================================

    const applicantName =
      `${firstName} ${lastName}`.trim();

    const applicationNumber =
      application.applicationNumber ||
      String(application._id);

    // ----------------------------------------
    // Candidate confirmation
    // ----------------------------------------

    try {
      await sendHREventEmail({
        event:
          "candidate.application_received",

        recipients: [email],

        metadata: {
          applicationNumber,

          candidateName:
            applicantName,

          candidateEmail:
            email,

          candidatePhone:
            phone,

          jobTitle:
            job.title,

          jobCode:
            job.jobCode,

          publicSlug:
            job.publicSlug,

          applicationId:
            application._id?.toString(),

          submittedAt:
            application.submittedAt ||
            new Date(),
        },
      });
    } catch (emailError) {
      console.error(
        "Candidate confirmation email failed:",
        emailError.message
      );
    }

    // ----------------------------------------
    // HR notification
    // ----------------------------------------

    try {
      await sendHREventEmail({
        event:
          "candidate.application_submitted",

        metadata: {
          applicationNumber,

          candidateName:
            applicantName,

          candidateEmail:
            email,

          candidatePhone:
            phone,

          jobTitle:
            job.title,

          jobCode:
            job.jobCode,

          jobId:
            job._id?.toString(),

          applicationId:
            application._id?.toString(),

          submittedAt:
            application.submittedAt ||
            new Date(),

          source:
            "career_portal",
        },
      });
    } catch (emailError) {
      console.error(
        "HR application notification failed:",
        emailError.message
      );
    }

    // ========================================
    // SUCCESS
    // ========================================

    return res.status(201).json({
      success: true,

      message:
        "Your application has been submitted successfully.",

      data: {
        applicationId:
          application._id,

        applicationNumber:
          application.applicationNumber,

        jobId:
          job._id,

        jobTitle:
          job.title,

        status:
          application.status,

        submittedAt:
          application.submittedAt,
      },
    });
  } catch (error) {
    // ========================================
    // ERROR LOGGING
    // ========================================

    console.error("\n==========================================");
    console.error(
      "❌ CAREER APPLICATION ERROR"
    );
    console.error("==========================================");

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Code:",
      error?.code || "N/A"
    );

    if (error?.errors) {
      console.error(
        "MONGOOSE VALIDATION ERRORS:"
      );

      Object.entries(error.errors).forEach(
        ([field, validationError]) => {
          console.error(
            `${field}: ${validationError.message}`
          );
        }
      );
    }

    console.error(
      "Full Error:",
      error
    );

    console.error(
      "==========================================\n"
    );

    // ========================================
    // MONGOOSE VALIDATION ERROR
    // ========================================

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      const errors = Object.fromEntries(
        Object.entries(error.errors).map(
          ([field, validationError]) => [
            field,
            validationError.message,
          ]
        )
      );

      return res.status(400).json({
        success: false,

        message:
          "Application validation failed.",

        errors,
      });
    }

    // ========================================
    // DUPLICATE KEY
    // ========================================

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "An application with these details already exists.",

        duplicateFields:
          error.keyValue || {},
      });
    }

    // ========================================
    // OTHER ERROR
    // ========================================

    return res.status(500).json({
      success: false,

      message:
        "Unable to submit application.",

      error:
        process.env.NODE_ENV !== "production"
          ? error?.message
          : undefined,
    });
  }
}