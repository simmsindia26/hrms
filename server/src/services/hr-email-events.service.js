import { User } from "../models/User.js";
import { sendEmail } from "./email.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

/* =========================================================
   CONFIG
========================================================= */

const APP_NAME =
  process.env.APP_NAME ||
  "Sellopedia HRMS";

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

const COMPANY_NAME =
  process.env.COMPANY_NAME ||
  "Sellopedia";

const HR_ROLES = [
  "hr",
  "super_admin",
];

const BRAND_RED = "#FE0100";



/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   FORMAT DATE TIME
========================================================= */

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   EMPLOYEE NAME
========================================================= */

function employeeName(employee) {
  if (!employee) {
    return "Employee";
  }

  if (employee.name) {
    return employee.name;
  }

  const name = [
    employee.firstName,
    employee.middleName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    name ||
    employee.email ||
    "Employee"
  );
}

/* =========================================================
   CANDIDATE NAME
========================================================= */

function candidateName(candidate) {
  if (!candidate) {
    return "Candidate";
  }

  if (candidate.name) {
    return candidate.name;
  }

  const name = [
    candidate.firstName,
    candidate.middleName,
    candidate.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    name ||
    candidate.email ||
    "Candidate"
  );
}

/* =========================================================
   GET EMAIL
========================================================= */

function getEmail(person) {
  if (!person) {
    return "";
  }

  if (typeof person === "string") {
    return person;
  }

  return (
    person.email ||
    person.emailAddress ||
    person.workEmail ||
    ""
  );
}

/* =========================================================
   USER NAME
========================================================= */

function getUserName(user) {
  if (!user) {
    return "User";
  }

  return (
    user.name ||
    user.fullName ||
    user.email ||
    "User"
  );
}

/* =========================================================
   EMAIL CATEGORY
=========================================================

   EmailLog.category only allows:

   general
   recruitment
   leave
   attendance
   payroll
   notice
   document
   system

   Therefore the exact HR event is stored inside
   metadata.event.
========================================================= */

function getEmailCategory(event) {
  if (!event) {
    return "general";
  }

  if (
    event.startsWith("candidate.") ||
    event.startsWith("interview.") ||
    event === "offer.generated"
  ) {
    return "recruitment";
  }

  if (
    event.startsWith("leave.")
  ) {
    return "leave";
  }

  if (
    event.startsWith("attendance.")
  ) {
    return "attendance";
  }

  if (
    event.startsWith("payroll.") ||
    event === "payslip.generated" ||
    event.startsWith("salary.")
  ) {
    return "payroll";
  }

  if (
    event.startsWith("document.") ||
    event === "appointment.generated"
  ) {
    return "document";
  }

  if (
    event === "notice.created"
  ) {
    return "notice";
  }

  if (
    event.startsWith("employee.") ||
    event.startsWith("user.") ||
    event === "password.reset"
  ) {
    return "system";
  }

  return "general";
}

/* =========================================================
   EMAIL LAYOUT
========================================================= */

function emailLayout({
  title,
  subtitle = "",
  content = "",
  actionText = "",
  actionUrl = "",
}) {
  return `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    ${escapeHtml(title)}
  </title>

</head>

<body style="
  margin:0;
  padding:0;
  background:#ffffff;
  font-family:Arial,Helvetica,sans-serif;
  color:#1f2937;
">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
>

<tr>

<td
  align="center"
  style="padding:30px 15px;"
>

<table
  width="650"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    max-width:650px;
    width:100%;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 5px 20px rgba(0,0,0,0.08);
  "
>

<!-- HEADER -->

<tr>

<td style="
  background:${BRAND_RED};
  padding:24px 30px;
  color:#ffffff;
">

<div style="
  font-size:22px;
  font-weight:700;
">

${escapeHtml(APP_NAME)}

</div>

<div style="
  margin-top:6px;
  font-size:13px;
  opacity:0.9;
">

${escapeHtml(COMPANY_NAME)}

</div>

</td>

</tr>

<!-- CONTENT -->

<tr>

<td style="
  padding:35px 30px;
">

<h1 style="
  margin:0 0 10px;
  font-size:24px;
  color:#111111;
">

${escapeHtml(title)}

</h1>

${
  subtitle
    ? `
<p style="
  margin:0 0 25px;
  color:#666666;
  font-size:14px;
">

${escapeHtml(subtitle)}

</p>
`
    : ""
}

<div style="
  font-size:15px;
  line-height:1.7;
">

${content}

</div>

${
  actionText && actionUrl
    ? `
<div style="
  margin-top:30px;
">

<a
  href="${escapeHtml(actionUrl)}"
  style="
    display:inline-block;
    background:${BRAND_RED};
    color:#ffffff;
    text-decoration:none;
    padding:12px 22px;
    border-radius:7px;
    font-weight:600;
  "
>

${escapeHtml(actionText)}

</a>

</div>
`
    : ""
}

</td>

</tr>

<!-- FOOTER -->

<tr>

<td style="
  padding:20px 30px;
  background:#ffffff;
  border-top:1px solid #FE0100;
">

<p style="
  margin:0;
  color:#666666;
  font-size:12px;
  line-height:1.6;
">

This is an automated email from
${escapeHtml(APP_NAME)}.

Please do not reply unless instructed.

</p>

<p style="
  margin:8px 0 0;
  color:#9ca3af;
  font-size:11px;
">

© ${new Date().getFullYear()}
${escapeHtml(COMPANY_NAME)}

</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`;
}

/* =========================================================
   GET HR EMAILS
========================================================= */

async function getHREmails() {
  const users =
    await User.find({
      role: {
        $in: HR_ROLES,
      },

      isActive: true,
    }).select(
      "email name role"
    );

  return users
    .map(
      (user) => user.email
    )
    .filter(Boolean);
}

/* =========================================================
   CENTRAL EVENT EMAIL SENDER
========================================================= */

async function sendEventEmail({
  event,

  to,

  subject,

  html,

  text = "",

  sentBy = null,

  relatedEmployee = null,

  relatedCandidate = null,

  attachments = [],

  metadata = {},
}) {
  const recipients =
    Array.isArray(to)
      ? to.filter(Boolean)
      : [to].filter(Boolean);

  if (!recipients.length) {
    console.log(
      `[HR EMAIL] No recipients: ${event}`
    );

    return {
      sent: false,
      event,
      reason: "NO_RECIPIENTS",
    };
  }

  try {
    await sendEmail({
      to: recipients,

      subject,

      text,

      html,

      attachments,

      category:
        getEmailCategory(event),

      metadata: {
        event,

        ...metadata,
      },

      sentBy,

      relatedEmployee,

      relatedCandidate,
    });

    console.log(
      `[HR EMAIL] ${event} -> ${recipients.join(
        ", "
      )}`
    );

    return {
      sent: true,

      event,

      recipients,
    };
  } catch (error) {
    console.error(
      `[HR EMAIL FAILED] ${event}:`,
      error.message
    );

    return {
      sent: false,

      event,

      error:
        error.message,
    };
  }
}

/* =========================================================
   MAIN HR EVENT EMAIL FUNCTION
========================================================= */

export async function sendHREventEmail({
  event,

  employee = null,

  candidate = null,

  interview = null,

  leave = null,

  attendance = null,

  document = null,

  payroll = null,

  salaryStructure = null,

  notice = null,

  user = null,

  sentBy = null,

  recipients = [],

  attachments = [],

  metadata = {},
}) {
  try {

    /* =====================================================
       CANDIDATE CREATED
    ===================================================== */

    if (
      event ===
      "candidate.created"
    ) {
      const hrEmails =
        await getHREmails();

      const name =
        candidateName(
          candidate
        );

      return await sendEventEmail({
        event,

        to: hrEmails,

        subject:
          `New Candidate Added - ${name}`,

        relatedCandidate:
          candidate?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "New Candidate Added",

            subtitle:
              "A new candidate has been added to the recruitment system.",

            content: `
<p>

<strong>
Candidate:
</strong>

${escapeHtml(name)}

</p>

<p>

<strong>
Email:
</strong>

${escapeHtml(
  getEmail(candidate)
)}

</p>

<p>

<strong>
Phone:
</strong>

${escapeHtml(
  candidate?.phone ||
  "-"
)}

</p>

<p>

<strong>
Position:
</strong>

${escapeHtml(
  candidate?.jobOpening
    ?.title ||
  candidate?.jobTitle ||
  "-"
)}

</p>

<p>

<strong>
Added On:
</strong>

${formatDateTime(
  new Date()
)}

</p>
`,
          }),
      });
    }

    /* =====================================================
       INTERVIEW SCHEDULED / UPDATED
    ===================================================== */

    if (
      event ===
        "interview.scheduled" ||
      event ===
        "interview.updated"
    ) {
      const email =
        getEmail(candidate);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "CANDIDATE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          event ===
          "interview.updated"
            ? "Interview Details Updated"
            : "Interview Scheduled",

        relatedCandidate:
          candidate?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              event ===
              "interview.updated"
                ? "Interview Details Updated"
                : "Interview Scheduled",

            subtitle:
              `Dear ${candidateName(
                candidate
              )},`,

            content: `

<p>

Your interview details have been
${
  event ===
  "interview.updated"
    ? "updated"
    : "scheduled"
}.

</p>

<p>

<strong>
Position:
</strong>

${escapeHtml(
  interview
    ?.jobOpening
    ?.title ||
  candidate
    ?.jobOpening
    ?.title ||
  candidate?.jobTitle ||
  "-"
)}

</p>

<p>

<strong>
Date:
</strong>

${formatDate(
  interview?.scheduledAt
)}

</p>

<p>

<strong>
Time:
</strong>

${
  interview?.scheduledAt
    ? new Date(
        interview.scheduledAt
      ).toLocaleTimeString(
        "en-IN",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      )
    : "-"
}

</p>

<p>

<strong>
Interview Type:
</strong>

${escapeHtml(
  interview?.type ||
  "-"
)}

</p>

${
  interview?.locationOrLink
    ? `
<p>

<strong>
Location / Meeting Link:
</strong>

${escapeHtml(
  interview.locationOrLink
)}

</p>
`
    : ""
}

${
  interview?.meetingLink
    ? `
<p>

<strong>
Meeting Link:
</strong>

<a
  href="${escapeHtml(
    interview.meetingLink
  )}"
>

Join Interview

</a>

</p>
`
    : ""
}

`,
          }),
      });
    }

    /* =====================================================
       INTERVIEW CANCELLED
    ===================================================== */

    if (
      event ===
      "interview.cancelled"
    ) {
      const email =
        getEmail(candidate);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "CANDIDATE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "Interview Cancelled",

        relatedCandidate:
          candidate?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Interview Cancelled",

            subtitle:
              `Dear ${candidateName(
                candidate
              )},`,

            content: `

<p>

Your scheduled interview has been cancelled.

</p>

<p>

<strong>
Position:
</strong>

${escapeHtml(
  candidate?.jobOpening
    ?.title ||
  candidate?.jobTitle ||
  "-"
)}

</p>

<p>

<strong>
Previous Interview Date:
</strong>

${formatDate(
  interview?.scheduledAt
)}

</p>

${
  metadata.reason
    ? `
<p>

<strong>
Reason:
</strong>

${escapeHtml(
  metadata.reason
)}

</p>
`
    : ""
}

`,
          }),
      });
    }

    /* =====================================================
       CANDIDATE SELECTED
    ===================================================== */

    if (
      event ===
      "candidate.selected"
    ) {
      const email =
        getEmail(candidate);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "CANDIDATE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "Congratulations - You Have Been Selected",

        relatedCandidate:
          candidate?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Congratulations!",

            subtitle:
              `Dear ${candidateName(
                candidate
              )},`,

            content: `

<p>

We are pleased to inform you that you have been selected for the position of

<strong>

${escapeHtml(
  candidate?.jobOpening
    ?.title ||
  candidate?.jobTitle ||
  "-"
)}

</strong>.

</p>

<p>

Our HR team will contact you with the next steps.

</p>

<p>

Thank you for your interest in
${escapeHtml(
  COMPANY_NAME
)}.

</p>

`,
          }),
      });
    }

    /* =====================================================
       CANDIDATE REJECTED
    ===================================================== */

    if (
      event ===
      "candidate.rejected"
    ) {
      const email =
        getEmail(candidate);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "CANDIDATE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "Application Update",

        relatedCandidate:
          candidate?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Application Update",

            subtitle:
              `Dear ${candidateName(
                candidate
              )},`,

            content: `

<p>

Thank you for taking the time to participate in our recruitment process.

</p>

<p>

After reviewing your application, we will not be proceeding with your application for this position at this time.

</p>

<p>

We appreciate your interest in
${escapeHtml(
  COMPANY_NAME
)}
and wish you success in your future career.

</p>

`,
          }),
      });
    }

    /* =====================================================
       EMPLOYEE CREATED / UPDATED
    ===================================================== */

    if (
      event ===
        "employee.created" ||
      event ===
        "employee.updated"
    ) {
      const email =
        getEmail(employee);

      const hrEmails =
        await getHREmails();

      const allRecipients = [
        email,
        ...hrEmails,
      ].filter(Boolean);

      return await sendEventEmail({
        event,

        to: [
          ...new Set(
            allRecipients
          ),
        ],

        subject:
          event ===
          "employee.created"
            ? `Employee Created - ${employeeName(
                employee
              )}`
            : `Employee Profile Updated - ${employeeName(
                employee
              )}`,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              event ===
              "employee.created"
                ? "Employee Profile Created"
                : "Employee Profile Updated",

            subtitle:
              employeeName(
                employee
              ),

            content: `

<p>

${
  event ===
  "employee.created"
    ? "A new employee profile has been created."
    : "An employee profile has been updated."
}

</p>

<p>

<strong>
Name:
</strong>

${escapeHtml(
  employeeName(
    employee
  )
)}

</p>

<p>

<strong>
Email:
</strong>

${escapeHtml(
  email || "-"
)}

</p>

<p>

<strong>
Department:
</strong>

${escapeHtml(
  employee?.department
    ?.name ||
  "-"
)}

</p>

<p>

<strong>
Designation:
</strong>

${escapeHtml(
  employee?.designation
    ?.name ||
  "-"
)}

</p>

<p>

<strong>
Employment Status:
</strong>

${escapeHtml(
  employee?.employmentStatus ||
  "-"
)}

</p>

`,
          }),
      });
    }

    /* =====================================================
       EMPLOYEE JOINED
    ===================================================== */

    if (
      event ===
      "employee.joined"
    ) {
      const email =
        getEmail(employee);

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "Welcome to Sellopedia",

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Welcome to Sellopedia!",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Welcome to
${escapeHtml(
  COMPANY_NAME
)}.

</p>

<p>

We are happy to have you as part of our team.

</p>

<p>

<strong>
Joining Date:
</strong>

${formatDate(
  employee?.joiningDate
)}

</p>

<p>

<strong>
Department:
</strong>

${escapeHtml(
  employee?.department
    ?.name ||
  "-"
)}

</p>

<p>

<strong>
Designation:
</strong>

${escapeHtml(
  employee?.designation
    ?.name ||
  "-"
)}

</p>

`,
          }),
      });
    }

    /* =====================================================
       ACCOUNT ACTIVATED / DEACTIVATED
    ===================================================== */

    if (
      event ===
        "employee.activated" ||
      event ===
        "employee.deactivated"
    ) {
      const email =
        getEmail(employee) ||
        getEmail(user);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      const active =
        event ===
        "employee.activated";

      return await sendEventEmail({
        event,

        to: email,

        subject:
          active
            ? "HRMS Account Activated"
            : "HRMS Account Deactivated",

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              active
                ? "HRMS Account Activated"
                : "HRMS Account Deactivated",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Your HRMS account has been

<strong>

${
  active
    ? "activated"
    : "deactivated"
}

</strong>.

</p>

${
  active
    ? `
<p>

You can now access the HRMS portal using your registered credentials.

</p>
`
    : `
<p>

Your access to the HRMS portal has been disabled.

Please contact HR if you believe this was done in error.

</p>
`
}

`,
            actionText:
              active
                ? "Open HRMS"
                : "",

            actionUrl:
              active
                ? `${CLIENT_URL}/login`
                : "",
          }),
      });
    }

    /* =====================================================
       USER CREATED
    ===================================================== */

    if (
      event ===
      "user.created"
    ) {
      const email =
        getEmail(user);

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "HRMS Account Created",

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "HRMS Account Created",

            subtitle:
              `Hello ${getUserName(
                user
              )},`,

            content: `

<p>

Your
${escapeHtml(
  APP_NAME
)}
account has been created.

</p>

<p>

<strong>
Email:
</strong>

${escapeHtml(
  email
)}

</p>

<p>

<strong>
Role:
</strong>

${escapeHtml(
  user?.role ||
  "-"
)}

</p>

<p>

You can now access the HRMS portal.

</p>

`,
            actionText:
              "Login to HRMS",

            actionUrl:
              `${CLIENT_URL}/login`,
          }),
      });
    }

    /* =====================================================
       PASSWORD RESET
    ===================================================== */

    if (
      event ===
      "password.reset"
    ) {
      const email =
        getEmail(user);

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "HRMS Password Reset",

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Password Reset",

            subtitle:
              `Hello ${getUserName(
                user
              )},`,

            content: `

<p>

Your HRMS password has been reset by an authorized administrator.

</p>

<p>

If you did not request this change, please contact HR or the system administrator immediately.

</p>

`,
            actionText:
              "Login to HRMS",

            actionUrl:
              `${CLIENT_URL}/login`,
          }),
      });
    }

    /* =====================================================
       LEAVE APPLIED
    ===================================================== */

    if (
      event ===
      "leave.applied"
    ) {
      const hrEmails =
        await getHREmails();

      return await sendEventEmail({
        event,

        to: hrEmails,

        subject:
          `New Leave Application - ${employeeName(
            employee
          )}`,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "New Leave Application",

            subtitle:
              "A new leave application requires review.",

            content: `

<p>

<strong>
Employee:
</strong>

${escapeHtml(
  employeeName(
    employee
  )
)}

</p>

<p>

<strong>
Leave Type:
</strong>

${escapeHtml(
  leave?.leaveType
    ?.name ||
  "-"
)}

</p>

<p>

<strong>
Start Date:
</strong>

${formatDate(
  leave?.startDate
)}

</p>

<p>

<strong>
End Date:
</strong>

${formatDate(
  leave?.endDate
)}

</p>

<p>

<strong>
Total Days:
</strong>

${escapeHtml(
  leave?.days ||
  "-"
)}

</p>

<p>

<strong>
Reason:
</strong>

${escapeHtml(
  leave?.reason ||
  "-"
)}

</p>

`,
            actionText:
              "Review Leave",

            actionUrl:
              `${CLIENT_URL}/hr/leave`,
          }),
      });
    }

    /* =====================================================
       LEAVE APPROVED / REJECTED
    ===================================================== */

    if (
      event ===
        "leave.approved" ||
      event ===
        "leave.rejected"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      const approved =
        event ===
        "leave.approved";

      return await sendEventEmail({
        event,

        to: email,

        subject:
          approved
            ? "Leave Application Approved"
            : "Leave Application Rejected",

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              approved
                ? "Leave Application Approved"
                : "Leave Application Rejected",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Your leave application has been

<strong>

${
  approved
    ? "approved"
    : "rejected"
}

</strong>.

</p>

<p>

<strong>
Leave Type:
</strong>

${escapeHtml(
  leave?.leaveType
    ?.name ||
  "-"
)}

</p>

<p>

<strong>
From:
</strong>

${formatDate(
  leave?.startDate
)}

</p>

<p>

<strong>
To:
</strong>

${formatDate(
  leave?.endDate
)}

</p>

<p>

<strong>
Days:
</strong>

${escapeHtml(
  leave?.days ||
  "-"
)}

</p>

${
  leave?.reviewComment
    ? `
<p>

<strong>
HR Comment:
</strong>

${escapeHtml(
  leave.reviewComment
)}

</p>
`
    : ""
}

`,
          }),
      });
    }

    /* =====================================================
       LEAVE CANCELLED
    ===================================================== */

    if (
      event ===
      "leave.cancelled"
    ) {
      const hrEmails =
        await getHREmails();

      return await sendEventEmail({
        event,

        to: hrEmails,

        subject:
          `Leave Cancelled - ${employeeName(
            employee
          )}`,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Leave Application Cancelled",

            content: `

<p>

<strong>
Employee:
</strong>

${escapeHtml(
  employeeName(
    employee
  )
)}

</p>

<p>

<strong>
Leave Type:
</strong>

${escapeHtml(
  leave?.leaveType
    ?.name ||
  "-"
)}

</p>

<p>

<strong>
Start Date:
</strong>

${formatDate(
  leave?.startDate
)}

</p>

<p>

<strong>
End Date:
</strong>

${formatDate(
  leave?.endDate
)}

</p>

`,
          }),
      });
    }

    /* =====================================================
       ATTENDANCE
    ===================================================== */

    if (
      event ===
        "attendance.marked" ||
      event ===
        "attendance.absent" ||
      event ===
        "attendance.late"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      let title =
        "Attendance Updated";

      if (
        event ===
        "attendance.absent"
      ) {
        title =
          "Attendance Alert - Absent";
      }

      if (
        event ===
        "attendance.late"
      ) {
        title =
          "Attendance Alert - Late";
      }

      return await sendEventEmail({
        event,

        to: email,

        subject: title,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title,

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Your attendance record has been updated.

</p>

<p>

<strong>
Date:
</strong>

${formatDate(
  attendance?.date
)}

</p>

<p>

<strong>
Status:
</strong>

${escapeHtml(
  attendance?.status ||
  "-"
)}

</p>

${
  attendance?.checkIn
    ? `
<p>

<strong>
Check In:
</strong>

${formatDateTime(
  attendance.checkIn
)}

</p>
`
    : ""
}

${
  attendance?.checkOut
    ? `
<p>

<strong>
Check Out:
</strong>

${formatDateTime(
  attendance.checkOut
)}

</p>
`
    : ""
}

${
  attendance?.lateMinutes
    ? `
<p>

<strong>
Late By:
</strong>

${escapeHtml(
  attendance.lateMinutes
)}
minutes

</p>
`
    : ""
}

`,
          }),
      });
    }

    /* =====================================================
       DOCUMENT UPLOADED
    ===================================================== */

    if (
      event ===
      "document.uploaded"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "New HR Document Available",

        relatedEmployee:
          employee?._id,

        sentBy,

        attachments,

        metadata,

        html:
          emailLayout({
            title:
              "New HR Document Available",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

A new document has been uploaded to your HRMS profile.

</p>

<p>

<strong>
Document:
</strong>

${escapeHtml(
  document?.title ||
  document?.name ||
  document?.fileName ||
  "HR Document"
)}

</p>

<p>

<strong>
Uploaded On:
</strong>

${formatDateTime(
  document?.createdAt ||
  new Date()
)}

</p>

<p>

Please log in to HRMS to view the document.

</p>

`,
            actionText:
              "Open HRMS",

            actionUrl:
              `${CLIENT_URL}/employee/documents`,
          }),
      });
    }

    /* =====================================================
       DOCUMENT ACKNOWLEDGED
    ===================================================== */

    if (
      event ===
      "document.acknowledged"
    ) {
      const hrEmails =
        await getHREmails();

      return await sendEventEmail({
        event,

        to: hrEmails,

        subject:
          `Document Acknowledged - ${employeeName(
            employee
          )}`,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              "Document Acknowledged",

            content: `

<p>

An employee has acknowledged an HR document.

</p>

<p>

<strong>
Employee:
</strong>

${escapeHtml(
  employeeName(
    employee
  )
)}

</p>

<p>

<strong>
Document:
</strong>

${escapeHtml(
  document?.title ||
  document?.name ||
  document?.fileName ||
  "-"
)}

</p>

<p>

<strong>
Acknowledged On:
</strong>

${formatDateTime(
  document?.acknowledgedAt ||
  new Date()
)}

</p>

`,
          }),
      });
    }

    /* =====================================================
       OFFER GENERATED
    ===================================================== */

    if (
      event ===
      "offer.generated"
    ) {
      const email =
        getEmail(candidate);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "CANDIDATE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "Offer Letter - Sellopedia",

        relatedCandidate:
          candidate?._id,

        sentBy,

        attachments,

        metadata,

        html:
          emailLayout({
            title:
              "Offer Letter",

            subtitle:
              `Dear ${candidateName(
                candidate
              )},`,

            content: `

<p>

We are pleased to share your offer letter.

</p>

<p>

Please find the Offer Letter attached to this email.

</p>

${
  metadata.designation
    ? `
<p>

<strong>
Designation:
</strong>

${escapeHtml(
  metadata.designation
)}

</p>
`
    : ""
}

${
  metadata.joiningDate
    ? `
<p>

<strong>
Joining Date:
</strong>

${formatDate(
  metadata.joiningDate
)}

</p>
`
    : ""
}

<p>

Please review the document carefully and follow the instructions provided.

</p>

`,
          }),
      });
    }

    /* =====================================================
       APPOINTMENT GENERATED
    ===================================================== */

    if (
      event ===
      "appointment.generated"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          "Appointment Letter - Sellopedia",

        relatedEmployee:
          employee?._id,

        sentBy,

        attachments,

        metadata,

        html:
          emailLayout({
            title:
              "Appointment Letter",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Your appointment letter has been generated.

</p>

<p>

Please find the Appointment Letter attached to this email.

</p>

<p>

Please keep this document for your records.

</p>

`,
          }),
      });
    }

    /* =====================================================
       PAYROLL CREATED / UPDATED / APPROVED
    ===================================================== */

    if (
      event ===
        "payroll.created" ||
      event ===
        "payroll.updated" ||
      event ===
        "payroll.approved"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      let title =
        "Payroll Updated";

      if (
        event ===
        "payroll.created"
      ) {
        title =
          "Payroll Generated";
      }

      if (
        event ===
        "payroll.approved"
      ) {
        title =
          "Payroll Approved";
      }

      return await sendEventEmail({
        event,

        to: email,

        subject: title,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title,

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Your payroll record has been updated.

</p>

<p>

<strong>
Month:
</strong>

${escapeHtml(
  payroll?.month ||
  "-"
)}

</p>

<p>

<strong>
Year:
</strong>

${escapeHtml(
  payroll?.year ||
  "-"
)}

</p>

<p>

<strong>
Status:
</strong>

${escapeHtml(
  payroll?.status ||
  "-"
)}

</p>

${
  payroll?.netPay !==
    undefined
    ? `
<p>

<strong>
Net Salary:
</strong>

₹${Number(
  payroll.netPay
).toLocaleString(
  "en-IN"
)}

</p>
`
    : ""
}

`,
          }),
      });
    }

    /* =====================================================
       PAYSLIP GENERATED
    ===================================================== */

    if (
      event ===
      "payslip.generated"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          `Payslip - ${
            payroll?.month || ""
          }/${
            payroll?.year || ""
          }`,

        relatedEmployee:
          employee?._id,

        sentBy,

        attachments,

        metadata,

        html:
          emailLayout({
            title:
              "Salary Payslip",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

Your salary payslip for

<strong>

${escapeHtml(
  payroll?.month ||
  "-"
)}/${
  escapeHtml(
    payroll?.year ||
    "-"
  )
}

</strong>

is attached to this email.

</p>

<p>

Please keep this document for your records.

</p>

`,
          }),
      });
    }

    /* =====================================================
       SALARY STRUCTURE
    ===================================================== */

    if (
      event ===
        "salary.created" ||
      event ===
        "salary.updated"
    ) {
      const email =
        getEmail(employee);

      const hrEmails =
        await getHREmails();

      const recipientsList = [
        email,
        ...hrEmails,
      ].filter(Boolean);

      return await sendEventEmail({
        event,

        to: [
          ...new Set(
            recipientsList
          ),
        ],

        subject:
          event ===
          "salary.created"
            ? `Salary Structure Created - ${employeeName(
                employee
              )}`
            : `Salary Structure Updated - ${employeeName(
                employee
              )}`,

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              event ===
              "salary.created"
                ? "Salary Structure Created"
                : "Salary Structure Updated",

            subtitle:
              employeeName(
                employee
              ),

            content: `

<p>

Your salary structure has been

<strong>

${
  event ===
  "salary.created"
    ? "created"
    : "updated"
}

</strong>.

</p>

<p>

Please log in to HRMS for complete details.

</p>

`,
          }),
      });
    }

   /* =====================================================
   CAREER APPLICATION RECEIVED
   Candidate confirmation email
===================================================== */

if (
  event ===
  "candidate.application_received"
) {
  const email =
    Array.isArray(recipients)
      ? recipients.find(Boolean)
      : getEmail(candidate);

  if (!email) {
    return {
      sent: false,
      event,
      reason:
        "CANDIDATE_EMAIL_MISSING",
    };
  }

  const applicationNumber =
    metadata?.applicationNumber ||
    "-";

  const jobTitle =
    metadata?.jobTitle ||
    candidate?.jobOpening?.title ||
    "-";

  const applicantName =
    metadata?.candidateName ||
    candidateName(candidate);

  return await sendEventEmail({
    event,

    to: email,

    subject:
      `Application Received - ${jobTitle}`,

    relatedCandidate:
      candidate?._id ||
      null,

    sentBy,

    metadata,

    html:
      emailLayout({
        title:
          "Application Received",

        subtitle:
          `Dear ${escapeHtml(
            applicantName
          )},`,

        content: `
<p>
Thank you for applying for the position of
<strong>
${escapeHtml(jobTitle)}
</strong>.
</p>

<p>
We have successfully received your application.
</p>

<p>
<strong>
Application Number:
</strong>
${escapeHtml(applicationNumber)}
</p>

<p>
Our recruitment team will review your application
and contact you if your profile is shortlisted for
the next stage.
</p>

<p>
Please keep your application number for future
reference.
</p>
`,
      }),
  });
}

/* =====================================================
   CAREER APPLICATION SUBMITTED
   HR notification email
===================================================== */

if (
  event ===
  "candidate.application_submitted"
) {
  const hrEmails =
    await getHREmails();

  if (!hrEmails.length) {
    return {
      sent: false,
      event,
      reason:
        "HR_EMAILS_NOT_FOUND",
    };
  }

  const applicationNumber =
    metadata?.applicationNumber ||
    "-";

  const jobTitle =
    metadata?.jobTitle ||
    candidate?.jobOpening?.title ||
    "-";

  const candidateEmail =
    metadata?.candidateEmail ||
    getEmail(candidate) ||
    "-";

  const candidatePhone =
    metadata?.candidatePhone ||
    candidate?.phone ||
    "-";

  const applicantName =
    metadata?.candidateName ||
    candidateName(candidate);

  return await sendEventEmail({
    event,

    to: hrEmails,

    subject:
      `New Job Application - ${jobTitle} - ${applicationNumber}`,

    relatedCandidate:
      candidate?._id ||
      null,

    sentBy,

    metadata,

    html:
      emailLayout({
        title:
          "New Job Application",

        subtitle:
          "A candidate has submitted an application through the Career Portal.",

        content: `
<p>
<strong>
Application Number:
</strong>
${escapeHtml(applicationNumber)}
</p>

<p>
<strong>
Candidate:
</strong>
${escapeHtml(applicantName)}
</p>

<p>
<strong>
Email:
</strong>
${escapeHtml(candidateEmail)}
</p>

<p>
<strong>
Phone:
</strong>
${escapeHtml(candidatePhone)}
</p>

<p>
<strong>
Position:
</strong>
${escapeHtml(jobTitle)}
</p>

<p>
<strong>
Job Code:
</strong>
${escapeHtml(metadata?.jobCode || "-")}
</p>

<p>
<strong>
Source:
</strong>
Career Portal
</p>

<p>
<strong>
Submitted:
</strong>
${formatDateTime(metadata?.submittedAt || new Date())}
</p>

<p>
Please open the candidate application in HRMS
to review the complete application and documents.
</p>
`,

        actionText:
          "Open HRMS",

        actionUrl:
          `${CLIENT_URL}/hr/recruitment`,
      }),
  });
}

    /* =====================================================
       NOTICE
    ===================================================== */

    if (
      event ===
      "notice.created"
    ) {
      const email =
        getEmail(employee);

      if (!email) {
        return {
          sent: false,
          event,
          reason:
            "EMPLOYEE_EMAIL_MISSING",
        };
      }

      return await sendEventEmail({
        event,

        to: email,

        subject:
          notice?.subject ||
          "New HR Notice",

        relatedEmployee:
          employee?._id,

        sentBy,

        metadata,

        html:
          emailLayout({
            title:
              notice?.subject ||
              "New HR Notice",

            subtitle:
              `Dear ${employeeName(
                employee
              )},`,

            content: `

<p>

${escapeHtml(
  notice?.body ||
  ""
).replace(/\n/g, "<br />")}

</p>

${
  notice?.type
    ? `
<p>

<strong>
Notice Type:
</strong>

${escapeHtml(
  notice.type
)}

</p>
`
    : ""
}

<p>

<strong>
Issued On:
</strong>

${formatDateTime(
  notice?.createdAt ||
  new Date()
)}

</p>

`,
          }),
      });
    }

    /* =====================================================
       UNKNOWN EVENT
    ===================================================== */

    console.warn(
      `[HR EMAIL] Unknown event: ${event}`
    );

    return {
      sent: false,

      event,

      reason:
        "UNKNOWN_EVENT",
    };

  } catch (error) {
    console.error(
      `[HR EMAIL EVENT ERROR] ${event}:`,
      error
    );

    return {
      sent: false,

      event,

      error:
        error.message,
    };
  }
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default sendHREventEmail;

