import { Router } from "express";

import authRoutes from "./auth.routes.js";
import hrRoutes from "./hr.routes.js";
import emailRoutes from "./email.routes.js";
import settingsRoutes from "./settings.routes.js";
import documentRoutes from "./document.routes.js";
import recruitmentRoutes from "./recruitment.routes.js";
import jobRoutes from "./job.routes.js";
import publicCareerRoutes from "./public-career.routes.js";
import attendanceTerminalRoutes from "./attendanceTerminal.routes.js";

const router = Router();

router.use("/auth", authRoutes);

router.use("/hr", hrRoutes);

router.use("/email", emailRoutes);

router.use("/settings", settingsRoutes);

router.use("/documents", documentRoutes);

router.use("/recruitment", recruitmentRoutes);

router.use("/jobs", jobRoutes);

router.use("/public/careers", publicCareerRoutes);

/*
 * Office Attendance Terminal
 *
 * Face recognition + PIN verification
 */
router.use(
  "/attendance-terminal",
  attendanceTerminalRoutes
);

export default router;