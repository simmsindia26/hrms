import { Candidate } from "../models/Candidate.js";
import { Employee } from "../models/Employee.js";
import { User } from "../models/User.js";
import { sendEmail } from "../services/email.service.js";
import { audit } from "../middleware/audit.js";
import { success } from "../utils/apiResponse.js";

/* =========================================================
   APPROVE SELECTION
========================================================= */

export async function approveSelection(req, res) {
  const candidate = await Candidate.findById(
    req.params.id
  ).populate("jobOpening");

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: "Candidate not found.",
    });
  }

  if (candidate.status === "rejected") {
    return res.status(400).json({
      success: false,
      message:
        "Rejected candidate cannot be selected.",
    });
  }

  if (candidate.status === "joined") {
    return res.status(400).json({
      success: false,
      message:
        "Candidate has already joined.",
    });
  }

  candidate.status = "selected";

  candidate.selectionApproved = true;

  candidate.selectionApprovedAt =
    new Date();

  candidate.selectionApprovedBy =
    req.user._id;

  await candidate.save();

  await audit(
    req,
    "update",
    "Candidate",
    "Candidate selection approved",
    {
      id: candidate._id,
      candidate: candidate._id,
    }
  );

  /* -------------------------------------------------------
     Send selection email
  ------------------------------------------------------- */

  if (candidate.email) {
    try {
      await sendEmail({
        to: candidate.email,

        subject:
          "Selection Confirmation - Sellopedia",

        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">

            <h2>Selection Confirmation</h2>

            <p>
              Dear ${candidate.name},
            </p>

            <p>
              We are pleased to inform you that your selection
              for the position
              <strong>
                ${candidate.jobOpening?.title || ""}
              </strong>
              has been approved.
            </p>

            <p>
              Our HR team will contact you regarding your
              Offer Letter and joining formalities.
            </p>

            <p>
              Regards,<br/>
              HR Department<br/>
              Sellopedia
            </p>

          </div>
        `,

        category: "recruitment",

        sentBy: req.user._id,

        relatedCandidate:
          candidate._id,
      });
    } catch (error) {
      console.error(
        "Selection email failed:",
        error.message
      );
    }
  }

  return success(
    res,
    candidate,
    "Candidate selection approved."
  );
}

/* =========================================================
   REJECT CANDIDATE
========================================================= */

export async function rejectCandidate(req, res) {
  const candidate = await Candidate.findById(
    req.params.id
  ).populate("jobOpening");

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: "Candidate not found.",
    });
  }

  if (candidate.status === "joined") {
    return res.status(400).json({
      success: false,
      message:
        "A joined employee cannot be rejected as a candidate.",
    });
  }

  candidate.status = "rejected";

  candidate.selectionApproved = false;

  candidate.selectionApprovedAt = null;

  candidate.selectionApprovedBy = null;

  await candidate.save();

  await audit(
    req,
    "update",
    "Candidate",
    "Candidate rejected",
    {
      id: candidate._id,
    }
  );

  /* -------------------------------------------------------
     Send rejection email
  ------------------------------------------------------- */

  if (candidate.email) {
    try {
      await sendEmail({
        to: candidate.email,

        subject:
          "Application Update - Sellopedia",

        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">

            <h2>Application Update</h2>

            <p>
              Dear ${candidate.name},
            </p>

            <p>
              Thank you for your interest in Sellopedia.
            </p>

            <p>
              After reviewing your application,
              we will not be proceeding with your
              candidature for this position at this stage.
            </p>

            <p>
              We appreciate the time and effort you
              invested in the recruitment process.
            </p>

            <p>
              Regards,<br/>
              HR Department<br/>
              Sellopedia
            </p>

          </div>
        `,

        category: "recruitment",

        sentBy: req.user._id,

        relatedCandidate:
          candidate._id,
      });
    } catch (error) {
      console.error(
        "Candidate rejection email failed:",
        error.message
      );
    }
  }

  return success(
    res,
    candidate,
    "Candidate rejected."
  );
}

/* =========================================================
   MARK OFFER AS SENT
========================================================= */

export async function markOfferSent(req, res) {
  const candidate =
    await Candidate.findById(
      req.params.id
    );

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: "Candidate not found.",
    });
  }

  if (
    !candidate.selectionApproved
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Candidate selection must be approved first.",
    });
  }

  candidate.offerStatus =
    "sent";

  candidate.offerSentAt =
    new Date();

  await candidate.save();

  await audit(
    req,
    "update",
    "Candidate",
    "Offer letter marked as sent",
    {
      id: candidate._id,
    }
  );

  return success(
    res,
    candidate,
    "Offer status updated."
  );
}

/* =========================================================
   ACCEPT OFFER
========================================================= */

export async function acceptOffer(req, res) {
  const candidate =
    await Candidate.findById(
      req.params.id
    );

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: "Candidate not found.",
    });
  }

  if (
    !candidate.selectionApproved
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Candidate selection has not been approved.",
    });
  }

  if (
    candidate.offerStatus !== "sent"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Offer must be sent before it can be accepted.",
    });
  }

  candidate.offerStatus =
    "accepted";

  candidate.offerAcceptedAt =
    new Date();

  candidate.offerAcceptedBy =
    req.user._id;

  await candidate.save();

  await audit(
    req,
    "update",
    "Candidate",
    "Offer accepted",
    {
      id: candidate._id,
    }
  );

  return success(
    res,
    candidate,
    "Offer accepted successfully."
  );
}

/* =========================================================
   DECLINE OFFER
========================================================= */

export async function declineOffer(req, res) {
  const candidate =
    await Candidate.findById(
      req.params.id
    );

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: "Candidate not found.",
    });
  }

  if (
    candidate.offerStatus !== "sent"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Offer must be sent before it can be declined.",
    });
  }

  candidate.offerStatus =
    "declined";

  candidate.offerDeclinedAt =
    new Date();

  await candidate.save();

  await audit(
    req,
    "update",
    "Candidate",
    "Offer declined",
    {
      id: candidate._id,
    }
  );

  return success(
    res,
    candidate,
    "Offer declined."
  );
}

/* =========================================================
   JOIN CANDIDATE
========================================================= */

export async function joinCandidate(req, res) {
  const candidate =
    await Candidate.findById(
      req.params.id
    ).populate("jobOpening");

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: "Candidate not found.",
    });
  }

  if (
    !candidate.selectionApproved
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Candidate selection must be approved before joining.",
    });
  }

  if (
    candidate.offerStatus !==
    "accepted"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Offer must be accepted before joining.",
    });
  }

  if (
    candidate.status === "joined" ||
    candidate.employee
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Candidate has already been converted to an employee.",
    });
  }

  const {
    employeeId,
    joiningDate,
    phone,
    department,
    designation,
  } = req.body;

  if (
    !employeeId ||
    !joiningDate
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Employee ID and joining date are required.",
    });
  }

  /* -------------------------------------------------------
     Employee ID duplicate check
  ------------------------------------------------------- */

  const existingEmployee =
    await Employee.findOne({
      employeeId,
    });

  if (existingEmployee) {
    return res.status(409).json({
      success: false,
      message:
        "Employee ID already exists.",
    });
  }

  /* -------------------------------------------------------
     Email duplicate check
  ------------------------------------------------------- */

  const existingEmail =
    await Employee.findOne({
      email: candidate.email,
    });

  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message:
        "An employee already exists with this email.",
    });
  }

  /* -------------------------------------------------------
     Split candidate name
  ------------------------------------------------------- */

  const nameParts =
    (candidate.name || "")
      .trim()
      .split(/\s+/);

  const firstName =
    nameParts.shift() || "";

  const lastName =
    nameParts.join(" ");

  /* -------------------------------------------------------
     Create Employee
  ------------------------------------------------------- */

  const employee =
    await Employee.create({
      employeeId,

      firstName,

      lastName,

      email:
        candidate.email,

      phone:
        phone ||
        candidate.phone,

      joiningDate,

      department:
        department ||
        null,

      designation:
        designation ||
        null,

      employmentStatus:
        "active",

      documents: [],
    });

  /* -------------------------------------------------------
     Create Employee Login
  ------------------------------------------------------- */

  /*
   * Temporary password.
   *
   * We will replace this later with
   * a secure password setup/reset link.
   */

  const temporaryPassword =
    `Sell@${employeeId}`;

  const user =
    await User.create({
      name:
        `${firstName} ${lastName}`.trim(),

      email:
        candidate.email,

      password:
        temporaryPassword,

      role:
        "employee",

      employee:
        employee._id,

      isActive:
        true,
    });

  employee.user =
    user._id;

  await employee.save();

  /* -------------------------------------------------------
     Update Candidate
  ------------------------------------------------------- */

  candidate.status =
    "joined";

  candidate.joiningDate =
    joiningDate;

  candidate.joinedAt =
    new Date();

  candidate.employee =
    employee._id;

  await candidate.save();

  /* -------------------------------------------------------
     Audit
  ------------------------------------------------------- */

  await audit(
    req,
    "create",
    "Employee",
    "Candidate converted to employee",
    {
      employee:
        employee._id,

      candidate:
        candidate._id,
    }
  );

  /* -------------------------------------------------------
     Welcome Email
  ------------------------------------------------------- */

  if (employee.email) {
    try {
      await sendEmail({
        to: employee.email,

        subject:
          "Welcome to Sellopedia - Employee Account",

        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">

            <h2>Welcome to Sellopedia</h2>

            <p>
              Dear ${firstName},
            </p>

            <p>
              Your employee account has been created successfully.
            </p>

            <p>
              <strong>Employee ID:</strong>
              ${employee.employeeId}
            </p>

            <p>
              <strong>Login Email:</strong>
              ${employee.email}
            </p>

            <p>
              <strong>Temporary Password:</strong>
              ${temporaryPassword}
            </p>

            <p>
              Please change your password after your first login.
            </p>

            <p>
              Regards,<br/>
              HR Department<br/>
              Sellopedia
            </p>

          </div>
        `,

        category:
          "employee",

        sentBy:
          req.user._id,

        relatedEmployee:
          employee._id,
      });
    } catch (error) {
      console.error(
        "Employee welcome email failed:",
        error.message
      );
    }
  }

  return success(
    res,
    {
      candidate,
      employee,

      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    },
    "Candidate successfully converted to employee."
  );
}