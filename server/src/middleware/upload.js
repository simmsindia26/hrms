import multer from "multer";
import path from "path";
import fs from "fs";

import { env } from "../config/env.js";

const uploadDir = path.resolve(env.uploadDir);

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
      `${name}_${Date.now()}${extension}`
    );
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage,

  limits: {
    fileSize:
      env.maxFileSizeMb * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      allowedMimeTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, JPG, PNG and WEBP files are allowed."
        )
      );
    }
  },
});

export default upload;