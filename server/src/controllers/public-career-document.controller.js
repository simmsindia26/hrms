import fs from "fs";
import path from "path";
import { CandidateApplication } from "../models/CandidateApplication.js";

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "career-applications"
);

/* =========================================================
   ENSURE DIRECTORY
========================================================= */

function ensureUploadDirectory() {
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
      recursive: true,
    });
  }
}

/* =========================================================
   UPLOAD APPLICATION DOCUMENT
   POST /api/v1/public/careers/applications/:applicationId/documents
========================================================= */

export async function uploadApplicationDocument(
  req,
  res
) {
  try {
    const {
      applicationId,
    } = req.params;

    const {
      type = "other",
    } = req.body;

    /* -----------------------------------------------------
       VALID DOCUMENT TYPE
    ----------------------------------------------------- */

    const allowedTypes = [
      "resume",
      "photo",
      "certificate",
      "experience",
      "identity",
      "other",
    ];

    if (
      !allowedTypes.includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid document type.",
      });
    }

    /* -----------------------------------------------------
       CHECK APPLICATION ID
    ----------------------------------------------------- */

    const application =
      await CandidateApplication.findById(
        applicationId
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found.",
      });
    }

    /* -----------------------------------------------------
       CHECK FILE
    ----------------------------------------------------- */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload a file.",
      });
    }

    /* -----------------------------------------------------
       DIRECTORY
    ----------------------------------------------------- */

    ensureUploadDirectory();

    /*
     * Multer should already have stored
     * the file.
     */

    const fileName =
      req.file.filename;

    const fileUrl =
      `/uploads/career-applications/${fileName}`;

    /* -----------------------------------------------------
       SAVE DOCUMENT
    ----------------------------------------------------- */

    application.documents.push({
      type,

      originalName:
        req.file.originalname,

      fileName,

      fileUrl,

      mimeType:
        req.file.mimetype,

      fileSize:
        req.file.size,

      uploadedAt:
        new Date(),
    });

    await application.save();

    const uploadedDocument =
      application.documents[
        application.documents.length - 1
      ];

    return res.status(201).json({
      success: true,

      message:
        "Document uploaded successfully.",

      data: {
        documentId:
          uploadedDocument._id,

        type:
          uploadedDocument.type,

        originalName:
          uploadedDocument.originalName,

        fileName:
          uploadedDocument.fileName,

        fileUrl:
          uploadedDocument.fileUrl,

        mimeType:
          uploadedDocument.mimeType,

        fileSize:
          uploadedDocument.fileSize,

        uploadedAt:
          uploadedDocument.uploadedAt,
      },
    });
  } catch (error) {
    console.error(
      "CAREER DOCUMENT UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload document.",
    });
  }
}