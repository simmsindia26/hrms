import express from "express";

import {
  getMyAttendanceSecurity,
  setMyAttendancePin,
  setMyAttendanceFace,
  listTerminalFaces,
  verifyTerminalAttendance,
} from "../controllers/attendanceTerminal.controller.js";

import { protect, authorize } from "../middleware/auth.js";
import { attendanceTerminalKey } from "../middleware/attendanceTerminal.js";

const router = express.Router();

// Employee account: attendance PIN/face setup.
router.get(
  "/me",
  protect,
  authorize("employee"),
  getMyAttendanceSecurity
);

router.post(
  "/me/pin",
  protect,
  authorize("employee"),
  setMyAttendancePin
);

router.post(
  "/me/face",
  protect,
  authorize("employee"),
  setMyAttendanceFace
);

// Dedicated office attendance terminal.
router.get(
  "/terminal/faces",
  attendanceTerminalKey,
  listTerminalFaces
);

router.post(
  "/terminal/verify",
  attendanceTerminalKey,
  verifyTerminalAttendance
);

export default router;