export function attendanceTerminalKey(req, res, next) {
  const configuredKey = process.env.ATTENDANCE_TERMINAL_KEY;

  const receivedKey = req.get("x-attendance-terminal-key");

  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      message: "Attendance terminal is not configured.",
    });
  }

  if (!receivedKey || receivedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid attendance terminal.",
    });
  }

  req.attendanceTerminalId =
    req.get("x-attendance-terminal-id") || "OFFICE-01";

  next();
}