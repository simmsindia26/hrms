import mongoose from "mongoose";

import {
  CandidateApplication,
} from "../models/CandidateApplication.js";

import { Candidate } from "../models/Candidate.js";

import { JobOpening } from "../models/JobOpening.js";

import {
  success,
  created,
} from "../utils/apiResponse.js";

import { audit } from "../middleware/audit.js";

// ============================================================
// HELPERS
// ============================================================

function clean(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getApplicationName(application) {
  const firstName =
    clean(
      application?.personalDetails
        ?.firstName
    );

  const lastName =
    clean(
      application?.personalDetails
        ?.lastName
    );

  return `${firstName} ${lastName}`.trim();
}

function formatEducation(education = []) {
  if (!Array.isArray(education)) {
    return "";
  }

  return education
    .map((item) => {
      return [
        item.qualification,
        item.field,
        item.institution,
        item.passingYear,
        item.percentage,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function formatExperience(experience = []) {
  if (!Array.isArray(experience)) {
    return "";
  }

  return experience
    .map((item) => {
      return [
        item.company,
        item.designation,
        item.startDate &&
        item.endDate
          ? `${item.startDate} - ${item.endDate}`
          : "",
        item.description,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

// ============================================================
// LIST APPLICATIONS
// ============================================================

export async function listApplications(
  req,
  res
) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      job,
      search,
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const pageLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (job) {
      filter.job = job;
    }

    let applications =
      await CandidateApplication.find(
        filter
      )
        .populate(
          "job",
          "title jobCode department designation location employmentType"
        )
        .sort({
          submittedAt: -1,
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) *
            pageLimit
        )
        .limit(pageLimit)
        .lean();

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    if (search) {
      const keyword =
        String(search)
          .trim()
          .toLowerCase();

      applications =
        applications.filter(
          (application) => {
            const name =
              getApplicationName(
                application
              ).toLowerCase();

            const email =
              clean(
                application
                  ?.personalDetails
                  ?.email
              ).toLowerCase();

            const phone =
              clean(
                application
                  ?.personalDetails
                  ?.phone
              ).toLowerCase();

            const jobTitle =
              application?.job?.title
                ?.toLowerCase() || "";

            const applicationNumber =
              application
                ?.applicationNumber
                ?.toLowerCase() || "";

            return (
              name.includes(keyword) ||
              email.includes(keyword) ||
              phone.includes(keyword) ||
              jobTitle.includes(keyword) ||
              applicationNumber.includes(
                keyword
              )
            );
          }
        );
    }

    const total =
      await CandidateApplication.countDocuments(
        filter
      );

    return success(res, {
      items: applications,

      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        pages: Math.ceil(
          total / pageLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "List career applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch career applications.",
      error: error.message,
    });
  }
}

// ============================================================
// GET SINGLE APPLICATION
// ============================================================

export async function getApplication(
  req,
  res
) {
  try {
    const application =
      await CandidateApplication.findById(
        req.params.id
      )
        .populate(
          "job",
          "title jobCode department designation location employmentType workMode description requirements qualifications"
        )
        .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found.",
      });
    }

    return success(
      res,
      application
    );
  } catch (error) {
    console.error(
      "Get career application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch application.",
      error: error.message,
    });
  }
}

// ============================================================
// CONVERT APPLICATION TO CANDIDATE
// ============================================================

export async function convertApplicationToCandidate(
  req,
  res
) {
  try {
    const application =
      await CandidateApplication.findById(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found.",
      });
    }

    // --------------------------------------------------------
    // Check job
    // --------------------------------------------------------

    if (!application.job) {
      return res.status(400).json({
        success: false,
        message:
          "This application is not linked to a job opening.",
      });
    }

    // --------------------------------------------------------
    // Applicant details
    // --------------------------------------------------------

    const firstName =
      clean(
        application
          ?.personalDetails
          ?.firstName
      );

    const lastName =
      clean(
        application
          ?.personalDetails
          ?.lastName
      );

    const email =
      clean(
        application
          ?.personalDetails
          ?.email
      ).toLowerCase();

    const phone =
      clean(
        application
          ?.personalDetails
          ?.phone
      );

    const name =
      `${firstName} ${lastName}`.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Applicant name is missing.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Applicant email is missing.",
      });
    }

    // --------------------------------------------------------
    // Existing candidate
    // --------------------------------------------------------

    let candidate =
      await Candidate.findOne({
        email,
        jobOpening:
          application.job,
      });

    if (candidate) {
      return success(
        res,
        {
          candidate,
          alreadyExists: true,
        },
        "Candidate already exists."
      );
    }

    // --------------------------------------------------------
    // Candidate
    // --------------------------------------------------------

    candidate =
      await Candidate.create({
        name,

        email,

        phone,

        source:
          "career_portal",

        jobOpening:
          application.job,

        status:
          "applied",

        notes:
          `Career Portal Application: ${
            application.applicationNumber ||
            application._id
          }\n\n${
            clean(
              application.coverLetter
            )
          }`,

        education:
          formatEducation(
            application.education
          ),

        experience:
          formatExperience(
            application.experience
          ),

        createdBy:
          req.user._id,
      });

    // --------------------------------------------------------
    // Link application if schema supports candidate
    // --------------------------------------------------------

    try {
      application.candidate =
        candidate._id;

      await application.save();
    } catch (linkError) {
      console.warn(
        "Could not link candidate to application:",
        linkError.message
      );
    }

    // --------------------------------------------------------
    // Audit
    // --------------------------------------------------------

    await audit(
      req,
      "create",
      "Candidate",
      "Career application converted to candidate",
      {
        candidateId:
          candidate._id,

        applicationId:
          application._id,

        applicationNumber:
          application.applicationNumber,

        email,
      }
    );

    return created(
      res,
      {
        candidate,
        applicationId:
          application._id,
      },
      "Application converted to candidate successfully."
    );
  } catch (error) {
    console.error(
      "Convert application error:",
      error
    );

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Candidate validation failed.",
        errors: Object.fromEntries(
          Object.entries(
            error.errors
          ).map(
            ([field, item]) => [
              field,
              item.message,
            ]
          )
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to convert application.",
      error: error.message,
    });
  }
}