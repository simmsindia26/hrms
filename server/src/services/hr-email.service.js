import { User } from "../models/User.js";
import { sendEmail } from "./email.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =========================================================
   PATH
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   CONFIG
========================================================= */

const APP_NAME =
  process.env.APP_NAME || "Sellopedia HRMS";

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

const COMPANY_NAME =
  process.env.COMPANY_NAME || "Sellopedia";

const HR_ROLES = [
  "hr",
  "super_admin",
];

/* =========================================================
   BRAND
========================================================= */

const BRAND_RED = "#FE0100";
const BRAND_DARK = "#111111";
const TEXT = "#333333";
const MUTED = "#666666";
const BORDER = "#E7E7E7";
const LIGHT_RED = "#FFF2F2";
const SOFT_RED = "#FFF7F7";

/* =========================================================
   LOGO
========================================================= */

function getLogoPath() {
  const candidates = [
    path.resolve(
      __dirname,
      "../public/logo.png"
    ),

    path.resolve(
      __dirname,
      "../../public/logo.png"
    ),

    path.resolve(
      process.cwd(),
      "src/public/logo.png"
    ),

    path.resolve(
      process.cwd(),
      "public/logo.png"
    ),
  ];

  const logoPath = candidates.find((filePath) =>
    fs.existsSync(filePath)
  );

  if (!logoPath) {
    console.warn(
      "[HR EMAIL] Sellopedia logo not found."
    );

    console.warn(
      "[HR EMAIL] Checked:",
      candidates
    );

    return null;
  }

  console.log(
    "[HR EMAIL] Logo:",
    logoPath
  );

  return logoPath;
}

const LOGO_PATH = getLogoPath();
const LOGO_CID = "sellopedia-logo";

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
   DATE
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
   DATE TIME
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
   EMAIL
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
   CATEGORY
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

  if (event.startsWith("leave.")) {
    return "leave";
  }

  if (event.startsWith("attendance.")) {
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

  if (event === "notice.created") {
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
   COMMON INFO ROW
========================================================= */

function infoRow(label, value) {
  return `
    <tr>
      <td
        style="
          padding:11px 0;
          border-bottom:1px solid ${BORDER};
          color:${MUTED};
          font-size:14px;
          font-weight:600;
          width:38%;
          vertical-align:top;
        "
      >
        ${escapeHtml(label)}
      </td>

      <td
        style="
          padding:11px 0;
          border-bottom:1px solid ${BORDER};
          color:${BRAND_DARK};
          font-size:14px;
          font-weight:700;
          vertical-align:top;
        "
      >
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
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
  const logoHtml = LOGO_PATH
    ? `
      <img
        src="cid:${LOGO_CID}"
        alt="${escapeHtml(COMPANY_NAME)}"
        width="190"
        style="
          display:block;
          width:190px;
          max-width:100%;
          height:auto;
          margin:0 auto;
          border:0;
          outline:none;
        "
      />
    `
    : `
      <div
        style="
          color:${BRAND_DARK};
          font-size:28px;
          line-height:1;
          font-weight:800;
        "
      >
        ${escapeHtml(COMPANY_NAME)}
      </div>
    `;

  const actionHtml =
    actionText && actionUrl
      ? `
        <div
          style="
            margin:30px 0 10px;
            text-align:center;
          "
        >
          <a
            href="${escapeHtml(actionUrl)}"
            style="
              display:inline-block;
              padding:14px 28px;
              background:${BRAND_RED};
              color:#ffffff !important;
              text-decoration:none;
              border-radius:8px;
              font-size:14px;
              font-weight:700;
              line-height:1.2;
            "
          >
            ${escapeHtml(actionText)}
          </a>
        </div>
      `
      : "";

  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1.0"
/>

<meta
  name="x-apple-disable-message-reformatting"
/>

<title>
  ${escapeHtml(title)}
</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f4f4;
    font-family:Arial,Helvetica,sans-serif;
    color:${TEXT};
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#f4f4f4;
    padding:40px 15px;
  "
>

<tr>

<td align="center">

<table
  width="680"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    max-width:680px;
    background:#ffffff;
    border:1px solid #e5e5e5;
    border-radius:16px;
    overflow:hidden;
  "
>

<!-- RED TOP BAR -->

<tr>

<td
  style="
    height:6px;
    background:${BRAND_RED};
    font-size:0;
    line-height:6px;
  "
>
&nbsp;
</td>

</tr>

<!-- HEADER -->

<tr>

<td
  align="center"
  style="
    padding:35px 30px 30px;
    border-bottom:1px solid #eeeeee;
  "
>

<div
  style="
    margin-bottom:24px;
  "
>
${logoHtml}
</div>

<h1
  style="
    margin:0;
    color:${BRAND_DARK};
    font-size:26px;
    line-height:1.3;
    font-weight:800;
  "
>
${escapeHtml(title)}
</h1>

${
  subtitle
    ? `
      <p
        style="
          margin:10px 0 0;
          color:${MUTED};
          font-size:14px;
          line-height:1.6;
        "
      >
        ${escapeHtml(subtitle)}
      </p>
    `
    : ""
}

</td>

</tr>

<!-- CONTENT -->

<tr>

<td
  style="
    padding:38px 40px;
  "
>

${content}

${actionHtml}

<!-- SIGNATURE -->

<div
  style="
    margin-top:35px;
    padding-top:22px;
    border-top:1px solid #eeeeee;
  "
>

<p
  style="
    margin:0 0 4px;
    color:${BRAND_DARK};
    font-size:14px;
    font-weight:800;
  "
>
HR Department
</p>

<p
  style="
    margin:0;
    color:${MUTED};
    font-size:12px;
    line-height:1.6;
  "
>
${escapeHtml(COMPANY_NAME)}
<br>
${escapeHtml(APP_NAME)}
</p>

</div>

</td>

</tr>

<!-- FOOTER -->

<tr>

<td
  align="center"
  style="
    padding:27px 30px;
    background:#fafafa;
    border-top:1px solid #eeeeee;
  "
>

<div
  style="
    width:45px;
    height:3px;
    margin:0 auto 13px;
    background:${BRAND_RED};
    border-radius:10px;
  "
></div>

<p
  style="
    margin:0 0 5px;
    color:${BRAND_RED};
    font-size:14px;
    font-weight:800;
  "
>
${escapeHtml(COMPANY_NAME)}
</p>

<p
  style="
    margin:0;
    color:${MUTED};
    font-size:11px;
    line-height:1.6;
  "
>
${escapeHtml(APP_NAME)}
</p>

<p
  style="
    margin:8px 0 0;
    color:${MUTED};
    font-size:11px;
    line-height:1.6;
  "
>
This is an automated email.
Please do not reply unless instructed.
</p>

<p
  style="
    margin:8px 0 0;
    color:#999999;
    font-size:10px;
  "
>
© ${new Date().getFullYear()}
${escapeHtml(COMPANY_NAME)}.
All rights reserved.
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
   HR EMAILS
========================================================= */

async function getHREmails() {
  const users = await User.find({
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
   CENTRAL EMAIL SENDER
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
    const emailAttachments = [
      ...attachments,
    ];

    /*
     * Embed Sellopedia logo.
     */

    if (LOGO_PATH) {
      emailAttachments.push({
        filename: "logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID,
        contentType: "image/png",
      });
    }

    await sendEmail({
      to: recipients,

      subject,

      text,

      html,

      attachments:
        emailAttachments,

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
      `[HR EMAIL] ${event} -> ${recipients.join(", ")}`
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
      error: error.message,
    };
  }
}

/* =========================================================
   MAIN HR EVENT EMAIL
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
    let to = [];
    let subject = "";
    let title = "";
    let subtitle = "";
    let content = "";
    let actionText = "";
    let actionUrl = "";

    /* =====================================================
       CANDIDATE CREATED
    ===================================================== */

    if (
      event ===
      "candidate.created"
    ) {
      const name =
        candidateName(candidate);

      const email =
        getEmail(candidate);

      to = email
        ? [email]
        : recipients;

      subject =
        "Application Received - Sellopedia";

      title =
        "Application Received";

      subtitle =
        "Thank you for your interest in joining Sellopedia.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 18px;
            font-size:14px;
            line-height:1.75;
          "
        >
          We have successfully received your
          application and our HR team will review
          your profile.
        </p>

        <div
          style="
            margin:25px 0;
            padding:20px;
            background:${LIGHT_RED};
            border:1px solid #ffd5d5;
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
          "
        >
          <p
            style="
              margin:0;
              color:${BRAND_RED};
              font-size:14px;
              font-weight:800;
            "
          >
            Application Status
          </p>

          <p
            style="
              margin:7px 0 0;
              color:${TEXT};
              font-size:13px;
              line-height:1.6;
            "
          >
            Your application has been received
            successfully.
          </p>
        </div>
      `;

      actionText =
        "Visit Sellopedia";

      actionUrl =
        CLIENT_URL;
    }

    /* =====================================================
       INTERVIEW SCHEDULED
    ===================================================== */

    else if (
      event ===
      "interview.scheduled"
    ) {
      const name =
        candidateName(candidate);

      const email =
        getEmail(candidate);

      to = email
        ? [email]
        : recipients;

      subject =
        "Interview Scheduled - Sellopedia";

      title =
        "Interview Scheduled";

      subtitle =
        "Your interview has been scheduled with Sellopedia.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          We are pleased to inform you that your
          interview has been scheduled.
        </p>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border:1px solid ${BORDER};
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
            padding:8px 20px;
          "
        >

          ${
            interview?.date ||
            interview?.scheduledAt
              ? infoRow(
                  "Date",
                  formatDate(
                    interview?.date ||
                    interview?.scheduledAt
                  )
                )
              : ""
          }

          ${
            interview?.scheduledAt
              ? infoRow(
                  "Time",
                  formatDateTime(
                    interview.scheduledAt
                  )
                )
              : ""
          }

          ${
            interview?.mode
              ? infoRow(
                  "Mode",
                  interview.mode
                )
              : ""
          }

          ${
            interview?.location
              ? infoRow(
                  "Location",
                  interview.location
                )
              : ""
          }

        </table>
      `;
    }

    /* =====================================================
       OFFER GENERATED
    ===================================================== */

    else if (
      event ===
      "offer.generated"
    ) {
      const name =
        candidateName(candidate);

      const email =
        getEmail(candidate);

      to = email
        ? [email]
        : recipients;

      subject =
        "Offer Letter - Sellopedia";

      title =
        "Congratulations!";

      subtitle =
        "Your offer letter has been generated.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 18px;
            font-size:14px;
            line-height:1.75;
          "
        >
          Congratulations on successfully
          completing the recruitment process.
          We are pleased to offer you an opportunity
          to join ${escapeHtml(COMPANY_NAME)}.
        </p>

        <div
          style="
            margin:25px 0;
            padding:20px;
            background:${LIGHT_RED};
            border:1px solid #ffd5d5;
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
          "
        >
          <p
            style="
              margin:0;
              color:${BRAND_RED};
              font-size:14px;
              font-weight:800;
            "
          >
            Offer Letter
          </p>

          <p
            style="
              margin:7px 0 0;
              color:${TEXT};
              font-size:13px;
              line-height:1.6;
            "
          >
            Your official offer letter is attached
            to this email.
          </p>
        </div>
      `;
    }

    /* =====================================================
       EMPLOYEE CREATED
    ===================================================== */

    else if (
      event ===
      "employee.created"
    ) {
      const name =
        employeeName(employee);

      const email =
        getEmail(employee);

      to = email
        ? [email]
        : recipients;

      subject =
        "Welcome to Sellopedia HRMS";

      title =
        "Welcome to Sellopedia";

      subtitle =
        "Your employee profile has been created.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          Welcome to ${escapeHtml(
            COMPANY_NAME
          )}.
          Your employee profile has been successfully
          created in the HRMS.
        </p>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border:1px solid ${BORDER};
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
            padding:8px 20px;
          "
        >

          ${
            employee?.employeeId
              ? infoRow(
                  "Employee ID",
                  employee.employeeId
                )
              : ""
          }

          ${
            employee?.joiningDate
              ? infoRow(
                  "Joining Date",
                  formatDate(
                    employee.joiningDate
                  )
                )
              : ""
          }

          ${
            employee?.email
              ? infoRow(
                  "Email",
                  employee.email
                )
              : ""
          }

        </table>
      `;

      actionText =
        "Open HRMS";

      actionUrl =
        CLIENT_URL;
    }

    /* =====================================================
       LEAVE
    ===================================================== */

    else if (
      event.startsWith("leave.")
    ) {
      const name =
        employeeName(employee);

      const email =
        getEmail(employee);

      to = email
        ? [email]
        : recipients;

      subject =
        "Leave Update - Sellopedia HRMS";

      title =
        "Leave Update";

      subtitle =
        "There has been an update to your leave request.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          Your leave request has been updated in
          the HRMS.
        </p>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border:1px solid ${BORDER};
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
            padding:8px 20px;
          "
        >

          ${
            leave?.fromDate
              ? infoRow(
                  "From",
                  formatDate(
                    leave.fromDate
                  )
                )
              : ""
          }

          ${
            leave?.toDate
              ? infoRow(
                  "To",
                  formatDate(
                    leave.toDate
                  )
                )
              : ""
          }

          ${
            leave?.status
              ? infoRow(
                  "Status",
                  leave.status
                )
              : ""
          }

          ${
            leave?.reason
              ? infoRow(
                  "Reason",
                  leave.reason
                )
              : ""
          }

        </table>
      `;
    }

    /* =====================================================
       ATTENDANCE
    ===================================================== */

    else if (
      event.startsWith(
        "attendance."
      )
    ) {
      const name =
        employeeName(employee);

      const email =
        getEmail(employee);

      to = email
        ? [email]
        : recipients;

      subject =
        "Attendance Update - Sellopedia HRMS";

      title =
        "Attendance Update";

      subtitle =
        "Your attendance record has been updated.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          Your attendance record has been updated
          in the HRMS.
        </p>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border:1px solid ${BORDER};
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
            padding:8px 20px;
          "
        >

          ${
            attendance?.date
              ? infoRow(
                  "Date",
                  formatDate(
                    attendance.date
                  )
                )
              : ""
          }

          ${
            attendance?.status
              ? infoRow(
                  "Status",
                  attendance.status
                )
              : ""
          }

          ${
            attendance?.checkIn
              ? infoRow(
                  "Check In",
                  formatDateTime(
                    attendance.checkIn
                  )
                )
              : ""
          }

          ${
            attendance?.checkOut
              ? infoRow(
                  "Check Out",
                  formatDateTime(
                    attendance.checkOut
                  )
                )
              : ""
          }

        </table>
      `;
    }

    /* =====================================================
       PAYROLL
    ===================================================== */

    else if (
      event.startsWith(
        "payroll."
      ) ||
      event ===
        "payslip.generated" ||
      event.startsWith(
        "salary."
      )
    ) {
      const name =
        employeeName(employee);

      const email =
        getEmail(employee);

      to = email
        ? [email]
        : recipients;

      subject =
        "Salary / Payroll Update - Sellopedia";

      title =
        "Payroll Update";

      subtitle =
        "Your payroll information is available.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          Your payroll information has been
          processed by the HR department.
        </p>

        ${
          payroll
            ? `
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  border:1px solid ${BORDER};
                  border-left:4px solid ${BRAND_RED};
                  border-radius:10px;
                  padding:8px 20px;
                "
              >

                ${
                  payroll.month
                    ? infoRow(
                        "Month",
                        `${payroll.month}/${payroll.year || ""}`
                      )
                    : ""
                }

                ${
                  payroll.grossPay !==
                  undefined
                    ? infoRow(
                        "Gross Pay",
                        `₹${Number(
                          payroll.grossPay
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      )
                    : ""
                }

                ${
                  payroll.deductions !==
                  undefined
                    ? infoRow(
                        "Deductions",
                        `₹${Number(
                          payroll.deductions
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      )
                    : ""
                }

                ${
                  payroll.netPay !==
                  undefined
                    ? infoRow(
                        "Net Pay",
                        `₹${Number(
                          payroll.netPay
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      )
                    : ""
                }

              </table>
            `
            : ""
        }
      `;

      actionText =
        "Open HRMS";

      actionUrl =
        CLIENT_URL;
    }

    /* =====================================================
       DOCUMENT
    ===================================================== */

    else if (
      event.startsWith(
        "document."
      ) ||
      event ===
        "appointment.generated"
    ) {
      const name =
        employeeName(employee);

      const email =
        getEmail(employee);

      to = email
        ? [email]
        : recipients;

      subject =
        "HR Document - Sellopedia";

      title =
        "HR Document";

      subtitle =
        "A document has been generated for you.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          An HR document has been generated and
          is attached to this email.
        </p>

        <div
          style="
            padding:20px;
            background:${LIGHT_RED};
            border:1px solid #ffd5d5;
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
          "
        >
          <p
            style="
              margin:0;
              color:${BRAND_RED};
              font-size:14px;
              font-weight:800;
            "
          >
            Document Attached
          </p>

          <p
            style="
              margin:7px 0 0;
              color:${TEXT};
              font-size:13px;
              line-height:1.6;
            "
          >
            Please review the attached document
            and keep it for your records.
          </p>
        </div>
      `;
    }

    /* =====================================================
       NOTICE
    ===================================================== */

    else if (
      event ===
      "notice.created"
    ) {
      const name =
        employeeName(employee);

      const email =
        getEmail(employee);

      to = email
        ? [email]
        : recipients;

      subject =
        "HR Notice - Sellopedia";

      title =
        "HR Notice";

      subtitle =
        "You have received an HR notice.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Dear ${escapeHtml(name)},
        </p>

        <div
          style="
            padding:20px;
            background:${LIGHT_RED};
            border:1px solid #ffd5d5;
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
          "
        >

          ${
            notice?.title
              ? `
                <p
                  style="
                    margin:0 0 8px;
                    color:${BRAND_RED};
                    font-size:15px;
                    font-weight:800;
                  "
                >
                  ${escapeHtml(
                    notice.title
                  )}
                </p>
              `
              : ""
          }

          ${
            notice?.message ||
            notice?.description
              ? `
                <p
                  style="
                    margin:0;
                    color:${TEXT};
                    font-size:14px;
                    line-height:1.7;
                  "
                >
                  ${escapeHtml(
                    notice.message ||
                    notice.description
                  )}
                </p>
              `
              : `
                <p
                  style="
                    margin:0;
                    color:${TEXT};
                    font-size:14px;
                    line-height:1.7;
                  "
                >
                  Please log in to HRMS to
                  review the notice.
                </p>
              `
          }

        </div>
      `;

      actionText =
        "Open HRMS";

      actionUrl =
        CLIENT_URL;
    }

    /* =====================================================
       PASSWORD RESET / USER
    ===================================================== */

    else if (
      event ===
        "password.reset" ||
      event.startsWith(
        "user."
      )
    ) {
      const email =
        getEmail(user);

      to = email
        ? [email]
        : recipients;

      subject =
        "Account Update - Sellopedia HRMS";

      title =
        "Account Update";

      subtitle =
        "There has been an update to your HRMS account.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Hello ${escapeHtml(
            getUserName(user)
          )},
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          Your Sellopedia HRMS account has been
          updated.
        </p>

        <div
          style="
            padding:20px;
            background:${LIGHT_RED};
            border:1px solid #ffd5d5;
            border-left:4px solid ${BRAND_RED};
            border-radius:10px;
          "
        >
          <p
            style="
              margin:0;
              color:${TEXT};
              font-size:14px;
              line-height:1.7;
            "
          >
            If you did not request this change,
            please contact the HR department
            immediately.
          </p>
        </div>
      `;

      actionText =
        "Open HRMS";

      actionUrl =
        CLIENT_URL;
    }

    /* =====================================================
       DEFAULT
    ===================================================== */

    else {
      to =
        recipients.length
          ? recipients
          : await getHREmails();

      subject =
        metadata?.subject ||
        "HRMS Notification - Sellopedia";

      title =
        metadata?.title ||
        "HRMS Notification";

      subtitle =
        metadata?.subtitle ||
        "You have a new notification from Sellopedia HRMS.";

      content = `
        <p
          style="
            margin:0 0 18px;
            color:${BRAND_DARK};
            font-size:17px;
            font-weight:700;
          "
        >
          Hello,
        </p>

        <p
          style="
            margin:0 0 20px;
            font-size:14px;
            line-height:1.75;
          "
        >
          ${
            metadata?.message ||
            "There is a new update available in Sellopedia HRMS."
          }
        </p>
      `;

      actionText =
        "Open HRMS";

      actionUrl =
        CLIENT_URL;
    }

    /* =====================================================
       FINAL HTML
    ===================================================== */

    const html = emailLayout({
      title,
      subtitle,
      content,
      actionText,
      actionUrl,
    });

    /* =====================================================
       TEXT VERSION
    ===================================================== */

    const text = `
${title}

${subtitle}

${String(
  content
)
  .replace(
    /<[^>]*>/g,
    " "
  )
  .replace(
    /\s+/g,
    " "
  )
  .trim()}

${actionUrl || ""}
`.trim();

    /* =====================================================
       SEND
    ===================================================== */

    return await sendEventEmail({
      event,

      to,

      subject,

      html,

      text,

      sentBy,

      relatedEmployee:
        employee?._id ||
        employee ||
        null,

      relatedCandidate:
        candidate?._id ||
        candidate ||
        null,

      attachments,

      metadata,
    });

  } catch (error) {
    console.error(
      `[HR EMAIL EVENT ERROR] ${event}:`,
      error
    );

    throw error;
  }
}

/* =========================================================
   EXPORT HELPERS
========================================================= */

export {
  emailLayout,
  getHREmails,
  sendEventEmail,
  employeeName,
  candidateName,
  formatDate,
  formatDateTime,
  getEmail,
  getUserName,
  getEmailCategory,
  LOGO_PATH,
  LOGO_CID,
};