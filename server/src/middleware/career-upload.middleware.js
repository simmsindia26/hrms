import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "career-applications"
);

/* =========================================================
   CREATE DIRECTORY
========================================================= */

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/* =========================================================
   STORAGE
========================================================= */

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path.extname(
          file.originalname
        );

      const name =
        crypto
          .randomBytes(16)
          .toString("hex");

      cb(
        null,
        `${Date.now()}-${name}${extension}`
      );
    },
  });

/* =========================================================
   FILE FILTER
========================================================= */

const allowedMimeTypes = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "image/jpeg",

  "image/png",

  "image/webp",
];

function fileFilter(
  req,
  file,
  cb
) {
  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, DOC, DOCX, JPG, PNG and WEBP files are allowed."
      ),
      false
    );
  }
}

/* =========================================================
   MULTER
========================================================= */

export const careerUpload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },
  });