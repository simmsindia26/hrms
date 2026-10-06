import dotenv from "dotenv";

dotenv.config();

const getEnv = (name, fallback = "") => {
  return process.env[name] || fallback;
};

export const env = {
  // ==========================================
  // GENERAL CONFIGURATION
  // ==========================================

  nodeEnv: getEnv(
    "NODE_ENV",
    "development"
  ),

  port: Number(
    getEnv("PORT", "5000")
  ),

  clientUrl: getEnv(
    "CLIENT_URL",
    "http://localhost:5173"
  ),

  // ==========================================
  // DATABASE
  // ==========================================

  mongodbUri: getEnv(
    "MONGODB_URI"
  ),

  // ==========================================
  // JWT
  // ==========================================

  jwtSecret: getEnv(
    "JWT_SECRET"
  ),

  jwtExpiresIn: getEnv(
    "JWT_EXPIRES_IN",
    "7d"
  ),

  cookieName: getEnv(
    "COOKIE_NAME",
    "hrd_token"
  ),

  // ==========================================
  // FILE UPLOAD
  // ==========================================

  uploadDir: getEnv(
    "UPLOAD_DIR",
    "uploads"
  ),

  maxFileSizeMb: Number(
    getEnv(
      "MAX_FILE_SIZE_MB",
      "10"
    )
  ),

  // ==========================================
  // SMTP CONFIGURATION
  // ==========================================

  smtp: {
    host: getEnv(
      "SMTP_HOST",
      "smtp.hostinger.com"
    ),

    port: Number(
      getEnv(
        "SMTP_PORT",
        "465"
      )
    ),

    secure:
      getEnv(
        "SMTP_SECURE",
        "true"
      ).toLowerCase() === "true",

    user: getEnv(
      "SMTP_USER"
    ),

    pass: getEnv(
      "SMTP_PASS"
    ),

    fromName: getEnv(
      "MAIL_FROM_NAME",
      "Sellopedia HRD"
    ),

    fromEmail: getEnv(
      "MAIL_FROM_EMAIL",
      getEnv("SMTP_USER")
    ),
  },

  // ==========================================
  // IMAP CONFIGURATION
  // ==========================================

  imap: {
    host: getEnv(
      "IMAP_HOST",
      "imap.hostinger.com"
    ),

    port: Number(
      getEnv(
        "IMAP_PORT",
        "993"
      )
    ),

    secure:
      getEnv(
        "IMAP_SECURE",
        "true"
      ).toLowerCase() === "true",

    user: getEnv(
      "IMAP_USER",
      getEnv("SMTP_USER")
    ),

    pass: getEnv(
      "IMAP_PASS",
      getEnv("SMTP_PASS")
    ),
  },

  // ==========================================
  // HR EMAIL CONFIGURATION
  // ==========================================

  recruitmentEmail: getEnv(
    "RECRUITMENT_EMAIL"
  ),

  payrollEmail: getEnv(
    "PAYROLL_EMAIL"
  ),

  // ==========================================
  // PERMANENT EMAIL CC
  // ==========================================
  //
  // This CC will be automatically added
  // to every email sent by the HRMS.
  //
  // Multiple emails can be separated by commas.
  //
  // Example:
  // hr@company.com,admin@company.com
  //
  // ==========================================

  permanentEmailCc: getEnv(
    "PERMANENT_EMAIL_CC"
  ),
};