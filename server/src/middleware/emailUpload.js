import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";

const uploadDir = path.resolve(
  env.uploadDir || "uploads",
  "email-attachments"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const name = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    cb(
      null,
      `${Date.now()}-${name}${extension}`
    );
  },
});

const allowedMimeTypes = new Set([
  // PDF
  "application/pdf",

  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Images
  "image/jpeg",
  "image/png",
  "image/webp",

  // Text
  "text/plain",
]);

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported attachment type: ${file.mimetype}`
      ),
      false
    );
  }
};

const emailUpload = multer({
  storage,

  limits: {
    fileSize:
      Number(env.maxFileSizeMb || 10) *
      1024 *
      1024,

    files: 10,
  },

  fileFilter,
});

export default emailUpload;