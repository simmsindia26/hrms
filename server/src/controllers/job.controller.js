import crypto from "crypto";
import { JobOpening } from "../models/JobOpening.js";

/* =========================================================
   CAREER PORTAL CONFIG
========================================================= */

const CAREER_PORTAL_URL =
  process.env.CAREER_PORTAL_URL ||
  "http://localhost:5174";

/* =========================================================
   GENERATE JOB IDENTIFIERS
========================================================= */

function generatePublicId() {
  return crypto.randomBytes(6).toString("hex");
}

function createSlug(title, publicId) {
  const slug = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}-${publicId}`;
}

/* =========================================================
   BUILD PUBLIC URL
========================================================= */

function createPublicUrl(publicSlug) {
  return `${CAREER_PORTAL_URL.replace(
    /\/$/,
    ""
  )}/jobs/${publicSlug}`;
}

/* =========================================================
   PUBLIC JOB SERIALIZER
   Never expose internal HR information.
========================================================= */

function serializePublicJob(job) {
  const data = job.toObject
    ? job.toObject()
    : job;

  return {
    _id: data._id,

    publicId:
      data.publicId,

    publicSlug:
      data.publicSlug,

    publicUrl:
      data.publicUrl,

    title:
      data.title,

    jobCode:
      data.jobCode,

    department:
      data.department,

    designation:
      data.designation,

    shortDescription:
      data.shortDescription,

    description:
      data.description,

    responsibilities:
      data.responsibilities || [],

    requirements:
      data.requirements || [],

    qualifications:
      data.qualifications || [],

    preferredQualifications:
      data.preferredQualifications || [],

    skills:
      data.skills || [],

    experience:
      data.experience || {
        minimumYears: 0,
        maximumYears: null,
        description: "",
      },

    education:
      data.education || {},

    employmentType:
      data.employmentType,

    workMode:
      data.workMode,

    location:
      data.location,

    openings:
      data.openings,

    salary:
      data.salary?.isDisclosed
        ? data.salary
        : {
            isDisclosed: false,
          },

    benefits:
      data.benefits || [],

    hiringProcess:
      data.hiringProcess || [],

    applicationEmail:
      data.applicationEmail,

    applicationInstructions:
      data.applicationInstructions,

    publishedAt:
      data.publishedAt,

    closingDate:
      data.closingDate,

    viewCount:
      data.viewCount || 0,

    shareCount:
      data.shareCount || 0,

    applicationCount:
      data.applicationCount || 0,
  };
}

/* =========================================================
   CREATE JOB
========================================================= */

export async function createJob(req, res) {
  try {
    const {
      title,
      department,
      designation,
      shortDescription,
      description,
      responsibilities,
      requirements,
      qualifications,
      preferredQualifications,
      skills,
      experience,
      education,
      employmentType,
      workMode,
      location,
      openings,
      salary,
      benefits,
      hiringProcess,
      applicationEmail,
      applicationInstructions,
      closingDate,
      internalNotes,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Job title and description are required.",
      });
    }

    const publicId =
      generatePublicId();

    const publicSlug =
      createSlug(
        title,
        publicId
      );

    const job =
      await JobOpening.create({
        title,

        department:
          department || null,

        designation:
          designation || null,

        shortDescription,

        description,

        responsibilities:
          responsibilities || [],

        requirements:
          requirements || [],

        qualifications:
          qualifications || [],

        preferredQualifications:
          preferredQualifications || [],

        skills:
          skills || [],

        experience:
          experience || {},

        education:
          education || {},

        employmentType:
          employmentType ||
          "full_time",

        workMode:
          workMode || "office",

        location,

        openings:
          Number(openings) || 1,

        salary:
          salary || {},

        benefits:
          benefits || [],

        hiringProcess:
          hiringProcess || [],

        applicationEmail,

        applicationInstructions,

        closingDate:
          closingDate || null,

        internalNotes,

        publicId,

        publicSlug,

        publicUrl:
          createPublicUrl(
            publicSlug
          ),

        isPublic: false,

        status: "draft",

        createdBy:
          req.user._id,

        updatedBy:
          req.user._id,
      });

    return res.status(201).json({
      success: true,

      data: job,

      message:
        "Job opening created successfully.",
    });
  } catch (error) {
    console.error(
      "CREATE JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create job opening.",
    });
  }
}

/* =========================================================
   GET PUBLIC JOBS
========================================================= */

export async function getPublicJobs(
  req,
  res
) {
  try {
    const now =
      new Date();

    const jobs =
      await JobOpening.find({
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
        .populate(
          "department",
          "name"
        )
        .populate(
          "designation",
          "name"
        )
        .sort({
          publishedAt: -1,
          createdAt: -1,
        })
        .lean();

    const data =
      jobs.map(
        serializePublicJob
      );

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "GET PUBLIC JOBS ERROR:",
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
========================================================= */

export async function getPublicJob(
  req,
  res
) {
  try {
    const { slug } =
      req.params;

    const job =
      await JobOpening.findOne({
        publicSlug: slug,

        isPublic: true,

        status: "active",
      })
        .populate(
          "department",
          "name"
        )
        .populate(
          "designation",
          "name"
        );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found or no longer available.",
      });
    }

    if (
      job.closingDate &&
      new Date(job.closingDate) <
        new Date()
    ) {
      return res.status(410).json({
        success: false,
        message:
          "Applications for this position are closed.",
      });
    }

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

    return res.json({
      success: true,

      data:
        serializePublicJob(
          job
        ),
    });
  } catch (error) {
    console.error(
      "GET PUBLIC JOB ERROR:",
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
   PUBLISH JOB
========================================================= */

export async function publishJob(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const job =
      await JobOpening.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found.",
      });
    }

    if (
      !job.title ||
      !job.description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete the job description before publishing.",
      });
    }

    if (!job.publicId) {
      job.publicId =
        generatePublicId();
    }

    if (!job.publicSlug) {
      job.publicSlug =
        createSlug(
          job.title,
          job.publicId
        );
    }

    job.publicUrl =
      createPublicUrl(
        job.publicSlug
      );

    job.status =
      "active";

    job.isPublic =
      true;

    job.publishedAt =
      job.publishedAt ||
      new Date();

    job.updatedBy =
      req.user._id;

    await job.save();

    return res.json({
      success: true,

      data: {
        job,

        publicId:
          job.publicId,

        publicSlug:
          job.publicSlug,

        publicUrl:
          job.publicUrl,
      },

      message:
        "Job opening published successfully.",
    });
  } catch (error) {
    console.error(
      "PUBLISH JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to publish job opening.",
    });
  }
}

/* =========================================================
   UNPUBLISH JOB
========================================================= */

export async function unpublishJob(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const job =
      await JobOpening.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found.",
      });
    }

    job.isPublic =
      false;

    if (
      job.status ===
      "active"
    ) {
      job.status =
        "paused";
    }

    job.updatedBy =
      req.user._id;

    await job.save();

    return res.json({
      success: true,
      data: job,
      message:
        "Job opening unpublished.",
    });
  } catch (error) {
    console.error(
      "UNPUBLISH JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to unpublish job.",
    });
  }
}

/* =========================================================
   CLOSE JOB
========================================================= */

export async function closeJob(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const job =
      await JobOpening.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found.",
      });
    }

    job.status =
      "closed";

    job.isPublic =
      false;

    job.updatedBy =
      req.user._id;

    await job.save();

    return res.json({
      success: true,
      data: job,
      message:
        "Job opening closed.",
    });
  } catch (error) {
    console.error(
      "CLOSE JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to close job.",
    });
  }
}

/* =========================================================
   SHARE JOB
========================================================= */

export async function shareJob(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const job =
      await JobOpening.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found.",
      });
    }

    if (
      !job.publicSlug ||
      !job.isPublic
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This job is not publicly available.",
      });
    }

    job.shareCount =
      (job.shareCount || 0) +
      1;

    await job.save();

    return res.json({
      success: true,

      data: {
        publicUrl:
          job.publicUrl ||
          createPublicUrl(
            job.publicSlug
          ),

        shareCount:
          job.shareCount,
      },
    });
  } catch (error) {
    console.error(
      "SHARE JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to share job.",
    });
  }
}

/* =========================================================
   GET JOB BY ID - HR
========================================================= */

export async function getJobById(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const job =
      await JobOpening.findById(id)
        .populate(
          "department",
          "name"
        )
        .populate(
          "designation",
          "name"
        );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found.",
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error(
      "GET JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load job opening.",
    });
  }
}

/* =========================================================
   UPDATE JOB
========================================================= */

export async function updateJob(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const job =
      await JobOpening.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job opening not found.",
      });
    }

    const allowedFields = [
      "title",
      "jobCode",
      "department",
      "designation",
      "shortDescription",
      "description",
      "responsibilities",
      "requirements",
      "qualifications",
      "preferredQualifications",
      "skills",
      "experience",
      "education",
      "employmentType",
      "workMode",
      "location",
      "openings",
      "salary",
      "benefits",
      "hiringProcess",
      "applicationEmail",
      "applicationInstructions",
      "closingDate",
      "internalNotes",
    ];

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {
        job[field] =
          req.body[field];
      }
    }

    /*
     * If a published job title changes,
     * keep its existing public URL stable.
     *
     * New jobs get their slug during publishing.
     */

    if (
      job.isPublic &&
      !job.publicSlug
    ) {
      if (!job.publicId) {
        job.publicId =
          generatePublicId();
      }

      job.publicSlug =
        createSlug(
          job.title,
          job.publicId
        );
    }

    if (
      job.isPublic &&
      job.publicSlug
    ) {
      job.publicUrl =
        createPublicUrl(
          job.publicSlug
        );
    }

    job.updatedBy =
      req.user._id;

    await job.save();

    await job.populate(
      "department",
      "name"
    );

    await job.populate(
      "designation",
      "name"
    );

    return res.json({
      success: true,
      data: job,
      message:
        "Job opening updated successfully.",
    });
  } catch (error) {
    console.error(
      "UPDATE JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update job opening.",
    });
  }
}