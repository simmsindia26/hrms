import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";

// ==========================================
// CONFIG
// ==========================================

import "./config/env.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

// ==========================================
// SERVICES
// ==========================================

import { verifyEmailTransport } from "./services/email.service.js";

// ==========================================
// ROUTES
// ==========================================

import routes from "./routes/index.js";

// ==========================================
// MIDDLEWARE
// ==========================================

import {
  errorHandler,
  notFound,
} from "./middleware/errorHandler.js";

// ==========================================
// APP
// ==========================================

const app = express();

app.set("trust proxy", 1);

// ==========================================
// SECURITY
// ==========================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups",
    },
  })
);

// ==========================================
// COMPRESSION
// ==========================================

app.use(compression());

// ==========================================
// LOGGER
// ==========================================

app.use(
  morgan(
    env.nodeEnv === "production"
      ? "combined"
      : "dev"
  )
);

// ==========================================
// CORS
// ==========================================

// Local development + production frontends
const allowedOrigins = [
  // ----------------------------------------
  // Local Development
  // ----------------------------------------
  "http://localhost:5173",
  "http://localhost:5174",

  // ----------------------------------------
  // Environment-based origins
  // ----------------------------------------
  env.clientUrl,
  env.careerClientUrl,

  // ----------------------------------------
  // Production domains
  // ----------------------------------------
  "https://hr.yourdomain.com",
  "https://career.yourdomain.com",
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim())
  .filter(Boolean)
  .filter(
    (value, index, array) =>
      array.indexOf(value) === index
  );

app.use(
  cors({
    origin(origin, callback) {
      // Requests without Origin:
      // Postman, curl, server-to-server, health checks, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Allowed frontend origin
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(
        `CORS blocked origin: ${origin}`
      );

      return callback(
        new Error("CORS origin not allowed")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Origin",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",

      // Attendance Terminal
      "x-attendance-terminal-key",
      "x-attendance-terminal-id",
    ],

    exposedHeaders: [
      "Content-Disposition",
    ],

    optionsSuccessStatus: 204,
  })
);
// ==========================================
// BODY PARSING
// ==========================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(cookieParser());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sellopedia HRD API is running",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// STATIC HR DOCUMENTS
// ==========================================
//
// Documents should preferably be accessed through
// the protected /api/v1/documents/:id/download route.
//
// This static route is kept here only if your existing
// application requires direct access to uploaded files.
// ==========================================

app.use(
  "/uploads",
  express.static(
    path.resolve(env.uploadDir),
    {
      setHeaders: (res) => {
        res.setHeader(
          "Cache-Control",
          "private, no-cache, no-store, must-revalidate"
        );

        res.setHeader(
          "Pragma",
          "no-cache"
        );

        res.setHeader(
          "Expires",
          "0"
        );
      },
    }
  )
);

// ==========================================
// API ROUTES
// ==========================================

app.use(
  "/api/v1",
  routes
);

// ==========================================
// 404 HANDLER
// ==========================================

app.use(notFound);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

async function start() {
  try {
    // ----------------------------------------
    // MongoDB
    // ----------------------------------------

    await connectDB();

    console.log("✅ MongoDB connected successfully");

    // ----------------------------------------
    // SMTP
    // ----------------------------------------

    try {
      await verifyEmailTransport();

      console.log(
        "✅ SMTP connection verified successfully"
      );
    } catch (error) {
      console.error(
        "❌ SMTP verification failed"
      );

      console.error(
        "SMTP Code:",
        error.code || "N/A"
      );

      console.error(
        "SMTP Message:",
        error.message || "Unknown error"
      );

      if (error.response) {
        console.error(
          "SMTP Response:",
          error.response
        );
      }

      /*
       * Do NOT stop the server if SMTP fails.
       *
       * The HRMS can still run while the SMTP
       * configuration is being fixed.
       */
    }

    // ----------------------------------------
    // HTTP SERVER
    // ----------------------------------------

    app.listen(
      env.port,
      () => {
        console.log("");

        console.log(
          "=========================================="
        );

        console.log(
          "       SELLOPEDIA HRD API SERVER"
        );

        console.log(
          "=========================================="
        );

        console.log(
          `🚀 Server: http://localhost:${env.port}`
        );

        console.log(
          `❤️  Health: http://localhost:${env.port}/api/v1/health`
        );

        console.log(
          `🌍 Environment: ${env.nodeEnv}`
        );

        console.log(
          `🔌 Port: ${env.port}`
        );

        console.log(
          `📧 SMTP: ${env.smtp.host}:${env.smtp.port}`
        );

        console.log(
          `👤 SMTP User: ${env.smtp.user}`
        );

        console.log(
          `🌐 Allowed Origins: ${
            allowedOrigins.join(", ") || "None"
          }`
        );

        console.log(
          "=========================================="
        );

        console.log("");
      }
    );
  } catch (error) {
    console.error("");

    console.error(
      "=========================================="
    );

    console.error(
      "❌ SERVER STARTUP FAILED"
    );

    console.error(
      "=========================================="
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(error);

    console.error(
      "=========================================="
    );

    process.exit(1);
  }
}

// ==========================================
// START
// ==========================================

start();