import bcrypt from "bcryptjs";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";
import AttendanceSecurity from "../models/AttendanceSecurity.js";
const FACE_MATCH_THRESHOLD = Number(
  process.env.ATTENDANCE_FACE_THRESHOLD || 0.52
);
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MINUTES = 10;

function cleanEmbedding(value) {
  if (!Array.isArray(value) || value.length < 32 || value.length > 4096) {
    return null;
  }

  const embedding = value.map(Number);
  if (embedding.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const norm = Math.sqrt(embedding.reduce((sum, n) => sum + n * n, 0));
  if (!Number.isFinite(norm) || norm === 0) return null;

  return embedding;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getEmployeeName(employee) {
  if (!employee) return "Employee";
  if (employee.name) return employee.name;
  return [employee.firstName, employee.middleName, employee.lastName]
    .filter(Boolean)
    .join(" ") || "Employee";
}

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function getSecurity(employeeId, includeSecrets = false) {
  const query = AttendanceSecurity.findOne({ employee: employeeId });
  if (includeSecrets) {
    query.select("+pinHash +faceEmbedding");
  }
  return query;
}

export async function getMyAttendanceSecurity(req, res) {
  try {
    // ----------------------------------------------------
    // Make sure the authenticated user has an employee
    // linked to their account
    // ----------------------------------------------------

    if (!req.user?.employee) {
      return res.status(400).json({
        success: false,
        message:
          "Your user account is not linked to an employee profile.",
      });
    }

    // ----------------------------------------------------
    // Resolve employee ID
    //
    // req.user.employee can be:
    // - ObjectId/string
    // - populated employee object
    // ----------------------------------------------------

    const employeeId =
      typeof req.user.employee === "string"
        ? req.user.employee
        : req.user.employee?._id ||
          req.user.employee?.id;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to determine your employee profile.",
      });
    }

    // ----------------------------------------------------
    // Confirm employee exists
    // ----------------------------------------------------

    const employee = await Employee.findById(
      employeeId
    ).select("_id employeeId firstName lastName email");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee profile was not found.",
      });
    }

    // ----------------------------------------------------
    // Get attendance security record
    // ----------------------------------------------------

    const security = await getSecurity(
      employee._id,
      false
    );

    // ----------------------------------------------------
    // Return only safe information
    //
    // Never send:
    // - pinHash
    // - faceEmbedding
    // ----------------------------------------------------

    return res.status(200).json({
      success: true,

      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: getEmployeeName(employee),
          email: employee.email,
        },

        pinConfigured: Boolean(
          security?.pinHash
        ),

        faceRegistered: Boolean(
          security?.faceEmbedding &&
          Array.isArray(
            security.faceEmbedding
          ) &&
          security.faceEmbedding.length > 0
        ),

        pinUpdatedAt:
          security?.pinUpdatedAt || null,

        faceRegisteredAt:
          security?.faceRegisteredAt || null,

        faceUpdatedAt:
          security?.faceUpdatedAt || null,
      },
    });
  } catch (error) {
    console.error(
      "getMyAttendanceSecurity error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load attendance security settings.",
    });
  }
}

export async function setMyAttendancePin(req, res) {
  try {
    if (!req.user?.employee) {
      return res.status(400).json({ success: false, message: "Employee profile is not linked to this account." });
    }

    const pin = String(req.body?.pin || "").trim();
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: "Attendance PIN must contain 4 to 6 digits." });
    }

    const pinHash = await bcrypt.hash(pin, 12);

    await AttendanceSecurity.findOneAndUpdate(
      { employee: req.user.employee },
      {
        $set: {
          employee: req.user.employee,
          pinHash,
          pinUpdatedAt: new Date(),
          failedPinAttempts: 0,
          pinLockedUntil: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: "Attendance PIN updated successfully." });
  } catch (error) {
    console.error("setMyAttendancePin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update attendance PIN." });
  }
}

export async function setMyAttendanceFace(req, res) {
  try {
    if (!req.user?.employee) {
      return res.status(400).json({ success: false, message: "Employee profile is not linked to this account." });
    }

    const embedding = cleanEmbedding(req.body?.embedding);
    if (!embedding) {
      return res.status(400).json({ success: false, message: "A valid face embedding is required." });
    }

    const now = new Date();
    await AttendanceSecurity.findOneAndUpdate(
      { employee: req.user.employee },
      {
        $set: {
          employee: req.user.employee,
          faceEmbedding: embedding,
          faceRegisteredAt: now,
          faceUpdatedAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: "Face registration updated successfully." });
  } catch (error) {
    console.error("setMyAttendanceFace error:", error);
    return res.status(500).json({ success: false, message: "Failed to register face." });
  }
}

export async function listTerminalFaces(req, res) {
  try {
    const records = await AttendanceSecurity.find({
      faceEmbedding: { $exists: true, $ne: [] },
    })
      .select("employee +faceEmbedding")
      .populate("employee", "employeeId name firstName middleName lastName email")
      .lean();

    const employees = records
      .filter((item) => item.employee && Array.isArray(item.faceEmbedding))
      .map((item) => ({
        employeeId: item.employee._id,
        employeeCode: item.employee.employeeId || "",
        name: getEmployeeName(item.employee),
        embedding: item.faceEmbedding,
      }));

    return res.json({ success: true, data: employees });
  } catch (error) {
    console.error("listTerminalFaces error:", error);
    return res.status(500).json({ success: false, message: "Failed to load registered faces." });
  }
}

export async function verifyTerminalAttendance(req, res) {
  try {
    const embedding = cleanEmbedding(req.body?.embedding);
    const pin = String(req.body?.pin || "").trim();

    if (!embedding) {
      return res.status(400).json({ success: false, message: "A valid face embedding is required." });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: "Enter a valid attendance PIN." });
    }

    const records = await AttendanceSecurity.find({
      faceEmbedding: { $exists: true, $ne: [] },
    })
      .select("employee +pinHash +faceEmbedding pinLockedUntil failedPinAttempts")
      .populate("employee", "employeeId name firstName middleName lastName email")
      .lean();

    let best = null;
    for (const record of records) {
      if (!record.employee || !Array.isArray(record.faceEmbedding)) continue;
      const similarity = cosineSimilarity(embedding, record.faceEmbedding);
      if (!best || similarity > best.similarity) {
        best = { ...record, similarity };
      }
    }

    if (!best || best.similarity < FACE_MATCH_THRESHOLD) {
      return res.status(401).json({
        success: false,
        code: "FACE_NOT_RECOGNIZED",
        message: "Face not recognized. Please look directly at the camera and try again.",
      });
    }

    const employeeId = best.employee._id;
    const lockedUntil = best.pinLockedUntil ? new Date(best.pinLockedUntil) : null;
    if (lockedUntil && lockedUntil > new Date()) {
      return res.status(429).json({
        success: false,
        code: "PIN_LOCKED",
        message: `PIN verification is temporarily locked. Try again after ${lockedUntil.toLocaleTimeString("en-IN")}.`,
      });
    }

    if (!best.pinHash) {
      return res.status(409).json({
        success: false,
        code: "PIN_NOT_CONFIGURED",
        employee: {
          id: employeeId,
          employeeId: best.employee.employeeId,
          name: getEmployeeName(best.employee),
        },
        message: "Attendance PIN is not configured for this employee.",
      });
    }

    const pinMatches = await bcrypt.compare(pin, best.pinHash);
    if (!pinMatches) {
      const nextAttempts = Number(best.failedPinAttempts || 0) + 1;
      const update = { $set: { failedPinAttempts: nextAttempts } };
      if (nextAttempts >= MAX_PIN_ATTEMPTS) {
        update.$set.pinLockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
        update.$set.failedPinAttempts = 0;
      }
      await AttendanceSecurity.updateOne({ employee: employeeId }, update);

      return res.status(401).json({
        success: false,
        code: "INVALID_PIN",
        message: "Incorrect attendance PIN.",
      });
    }

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const now = new Date();
    const { start, end } = todayRange();
    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: start, $lt: end },
    }).sort({ createdAt: -1 });

    let action = "check-in";

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employeeId,
        date: start,
        status: "present",
        checkIn: now,
        markedBy: req.body?.markedBy || undefined,
        notes: `Face + PIN attendance | Terminal: ${req.attendanceTerminalId}`,
      });
    } else if (!attendance.checkIn) {
      attendance.checkIn = now;
      attendance.status = "present";
      attendance.notes = `${attendance.notes || ""} Face + PIN check-in | Terminal: ${req.attendanceTerminalId}`.trim();
      await attendance.save();
    } else if (!attendance.checkOut) {
      attendance.checkOut = now;
      attendance.notes = `${attendance.notes || ""} Face + PIN check-out | Terminal: ${req.attendanceTerminalId}`.trim();
      await attendance.save();
      action = "check-out";
    } else {
      return res.status(409).json({
        success: false,
        code: "ALREADY_COMPLETED",
        message: "Today's check-in and check-out are already recorded.",
        data: {
          employeeId: employee.employeeId,
          name: getEmployeeName(employee),
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
        },
      });
    }

    await AttendanceSecurity.updateOne(
      { employee: employeeId },
      {
        $set: {
          failedPinAttempts: 0,
          pinLockedUntil: null,
          lastVerifiedAt: now,
          lastVerifiedTerminal: req.attendanceTerminalId,
        },
      }
    );

    return res.json({
      success: true,
      message: `Attendance ${action} recorded successfully.`,
      data: {
        action,
        employeeId: employee.employeeId,
        name: getEmployeeName(employee),
        similarity: Number(best.similarity.toFixed(4)),
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        attendanceId: attendance._id,
        terminalId: req.attendanceTerminalId,
      },
    });
  } catch (error) {
    console.error("verifyTerminalAttendance error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to mark attendance." });
  }
}
