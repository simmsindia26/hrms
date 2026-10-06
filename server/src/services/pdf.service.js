import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

/*
|--------------------------------------------------------------------------
| BRAND CONFIGURATION
|--------------------------------------------------------------------------
*/

const BRAND_COLOR = "#FE0100";
const BRAND_NAME = "SELLOPEDIA";
const BRAND_SUBTITLE = "Digital Marketing Agency";

/*
|--------------------------------------------------------------------------
| LOGO
|--------------------------------------------------------------------------
|
| Expected structure:
|
| server/
| ├── src/
| │   ├── public/
| │   │   └── logo.png
| │   └── ...
|
| Change this filename if your logo has another name.
|
*/

const LOGO_FILE_NAME = "logo.png";

function getLogoPath() {
  const possiblePaths = [
    path.resolve(process.cwd(), "src", "public", LOGO_FILE_NAME),
    path.resolve(process.cwd(), "public", LOGO_FILE_NAME),
    path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../public",
      LOGO_FILE_NAME
    ),
  ];

  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| UPLOAD DIRECTORY
|--------------------------------------------------------------------------
*/

function ensureUploadDirectory() {
  const dir = path.resolve(env.uploadDir);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }

  return dir;
}

/*
|--------------------------------------------------------------------------
| SAFE FILE NAME
|--------------------------------------------------------------------------
*/

function safeFileName(value) {
  return String(value || "document")
    .replace(/[^a-z0-9-_]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| FORMAT HELPERS
|--------------------------------------------------------------------------
*/

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function employeeFullName(employee) {
  return `${employee?.firstName || ""} ${
    employee?.lastName || ""
  }`.trim();
}

/*
|--------------------------------------------------------------------------
| PDF CREATION
|--------------------------------------------------------------------------
*/

function createPDF(filePath, callback) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: "A4",
      margins: {
        top: 50,
        bottom: 55,
        left: 50,
        right: 50,
      },
      info: {
        Title: "Sellopedia Document",
        Author: BRAND_NAME,
        Subject: "Official Company Document",
        Creator: "Sellopedia HRMS",
      },
    });

    const stream = fs.createWriteStream(filePath);

    let finished = false;

    const complete = () => {
      if (finished) return;

      finished = true;
      resolve();
    };

    stream.on("finish", complete);

    stream.on("error", (error) => {
      if (finished) return;

      finished = true;
      reject(error);
    });

    pdf.on("error", reject);

    pdf.pipe(stream);

    try {
      callback(pdf);
      pdf.end();
    } catch (error) {
      reject(error);
    }
  });
}

/*
|--------------------------------------------------------------------------
| DRAW LINE
|--------------------------------------------------------------------------
*/

function drawLine(pdf, y, color = "#DDDDDD", width = 1) {
  pdf
    .save()
    .strokeColor(color)
    .lineWidth(width)
    .moveTo(pdf.page.margins.left, y)
    .lineTo(
      pdf.page.width - pdf.page.margins.right,
      y
    )
    .stroke()
    .restore();
}

/*
|--------------------------------------------------------------------------
| TOP HEADER
|--------------------------------------------------------------------------
*/

function drawHeader(pdf, title, documentNumber = null) {
  const logoPath = getLogoPath();

  const startX = pdf.page.margins.left;
  const startY = 40;

  /*
   * Header accent line
   */
  pdf
    .save()
    .rect(
      0,
      0,
      pdf.page.width,
      6
    )
    .fill(BRAND_COLOR)
    .restore();

  /*
   * Logo
   */
  if (logoPath) {
    try {
      pdf.image(
        logoPath,
        startX,
        startY + 5,
        {
          fit: [85, 55],
          align: "left",
          valign: "center",
        }
      );
    } catch (error) {
      // If logo cannot be loaded, continue without it.
    }
  }

  /*
   * Company information
   */
  const companyX = startX + 100;

  pdf
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#111111")
    .text(
      BRAND_NAME,
      companyX,
      startY + 8
    );

  pdf
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#555555")
    .text(
      BRAND_SUBTITLE,
      companyX,
      startY + 30
    );

  /*
   * Document label on right
   */
  pdf
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(BRAND_COLOR)
    .text(
      title.toUpperCase(),
      390,
      startY + 8,
      {
        width: 152,
        align: "right",
      }
    );

  if (documentNumber) {
    pdf
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#777777")
      .text(
        `Document No. ${documentNumber}`,
        390,
        startY + 29,
        {
          width: 152,
          align: "right",
        }
      );
  }

  /*
   * Header bottom line
   */
  drawLine(
    pdf,
    108,
    "#E5E5E5",
    1
  );

  pdf.y = 128;
}

/*
|--------------------------------------------------------------------------
| FOOTER
|--------------------------------------------------------------------------
*/

function drawFooter(pdf, documentType = "Official Document") {
  const footerY = pdf.page.height - 48;

  drawLine(
    pdf,
    footerY - 8,
    "#E5E5E5",
    1
  );

  pdf
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor("#777777")
    .text(
      `${BRAND_NAME} • ${documentType}`,
      pdf.page.margins.left,
      footerY,
      {
        width: 250,
        align: "left",
      }
    );

  pdf
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor("#777777")
    .text(
      "Confidential • System Generated",
      295,
      footerY,
      {
        width: 250,
        align: "right",
      }
    );
}

/*
|--------------------------------------------------------------------------
| DOCUMENT TITLE
|--------------------------------------------------------------------------
*/

function drawDocumentTitle(pdf, title, subtitle = "") {
  pdf
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#111111")
    .text(title.toUpperCase(), {
      align: "center",
    });

  if (subtitle) {
    pdf
      .moveDown(0.4)
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#777777")
      .text(subtitle, {
        align: "center",
      });
  }

  pdf.moveDown(1.4);
}

/*
|--------------------------------------------------------------------------
| SECTION TITLE
|--------------------------------------------------------------------------
*/

function sectionTitle(pdf, title) {
  const y = pdf.y;

  pdf
    .save()
    .rect(
      pdf.page.margins.left,
      y,
      4,
      18
    )
    .fill(BRAND_COLOR)
    .restore();

  pdf
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#111111")
    .text(
      title.toUpperCase(),
      pdf.page.margins.left + 12,
      y + 2
    );

  pdf.moveDown(1.2);
}

/*
|--------------------------------------------------------------------------
| INFO BOX
|--------------------------------------------------------------------------
*/

function infoBox(pdf, items) {
  const x = pdf.page.margins.left;
  const width =
    pdf.page.width -
    pdf.page.margins.left -
    pdf.page.margins.right;

  const startY = pdf.y;

  const rowHeight = 27;
  const rows = Math.ceil(items.length / 2);
  const height = rows * rowHeight + 18;

  pdf
    .save()
    .roundedRect(
      x,
      startY,
      width,
      height,
      5
    )
    .fill("#FAFAFA")
    .restore();

  pdf
    .save()
    .roundedRect(
      x,
      startY,
      width,
      height,
      5
    )
    .lineWidth(0.7)
    .strokeColor("#E2E2E2")
    .stroke()
    .restore();

  items.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);

    const cellX =
      x + 15 + column * (width / 2);

    const cellY =
      startY + 10 + row * rowHeight;

    pdf
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#777777")
      .text(
        item.label.toUpperCase(),
        cellX,
        cellY,
        {
          width: width / 2 - 25,
        }
      );

    pdf
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#222222")
      .text(
        item.value || "-",
        cellX,
        cellY + 10,
        {
          width: width / 2 - 25,
        }
      );
  });

  pdf.y = startY + height + 20;
}

/*
|--------------------------------------------------------------------------
| PARAGRAPH
|--------------------------------------------------------------------------
*/

function paragraph(pdf, text) {
  pdf
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#222222")
    .text(text, {
      align: "justify",
      lineGap: 4,
    });

  pdf.moveDown(1);
}

/*
|--------------------------------------------------------------------------
| SIGNATURE BLOCK
|--------------------------------------------------------------------------
*/

function signatureBlock(
  pdf,
  label = "HR / Authorized Signatory"
) {
  pdf.moveDown(2);

  const x = pdf.page.margins.left;
  const width = 210;

  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#555555")
    .text("For " + BRAND_NAME);

  pdf.moveDown(2);

  pdf
    .moveTo(x, pdf.y)
    .lineTo(x + width, pdf.y)
    .strokeColor("#333333")
    .lineWidth(0.8)
    .stroke();

  pdf.moveDown(0.5);

  pdf
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#111111")
    .text(label);

  pdf
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#777777")
    .text("Authorized Signatory");
}

/*
|--------------------------------------------------------------------------
| TABLE HEADER
|--------------------------------------------------------------------------
*/

function drawTableHeader(
  pdf,
  columns,
  y
) {
  const x = pdf.page.margins.left;
  const width =
    pdf.page.width -
    pdf.page.margins.left -
    pdf.page.margins.right;

  pdf
    .save()
    .rect(
      x,
      y,
      width,
      28
    )
    .fill(BRAND_COLOR)
    .restore();

  let currentX = x;

  columns.forEach((column) => {
    pdf
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#FFFFFF")
      .text(
        column.title,
        currentX + 8,
        y + 9,
        {
          width: column.width - 16,
          align: column.align || "left",
        }
      );

    currentX += column.width;
  });

  return y + 28;
}

/*
|--------------------------------------------------------------------------
| TABLE ROW
|--------------------------------------------------------------------------
*/

function drawTableRow(
  pdf,
  columns,
  values,
  y,
  shaded = false
) {
  const x = pdf.page.margins.left;
  const width =
    pdf.page.width -
    pdf.page.margins.left -
    pdf.page.margins.right;

  const rowHeight = 30;

  if (shaded) {
    pdf
      .save()
      .rect(
        x,
        y,
        width,
        rowHeight
      )
      .fill("#FAFAFA")
      .restore();
  }

  pdf
    .save()
    .rect(
      x,
      y,
      width,
      rowHeight
    )
    .lineWidth(0.5)
    .strokeColor("#DDDDDD")
    .stroke()
    .restore();

  let currentX = x;

  columns.forEach((column, index) => {
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#222222")
      .text(
        String(values[index] ?? "-"),
        currentX + 8,
        y + 9,
        {
          width: column.width - 16,
          align: column.align || "left",
        }
      );

    currentX += column.width;
  });

  return y + rowHeight;
}

/*
|--------------------------------------------------------------------------
| GENERATE OFFER LETTER
|--------------------------------------------------------------------------
*/

export async function generateOfferLetter({
  candidate,
  designation,
  salary,
  joiningDate,
}) {
  const directory = ensureUploadDirectory();

  const candidateName =
    candidate?.name ||
    employeeFullName(candidate) ||
    "Candidate";

  const documentNumber = `OFF-${Date.now()}`;

  const fileName = `offer_letter_${safeFileName(
    candidateName
  )}_${Date.now()}.pdf`;

  const filePath = path.join(
    directory,
    fileName
  );

  await createPDF(filePath, (pdf) => {
    drawHeader(
      pdf,
      "Offer Letter",
      documentNumber
    );

    drawDocumentTitle(
      pdf,
      "Offer Letter",
      "Official Employment Offer"
    );

    infoBox(pdf, [
      {
        label: "Candidate",
        value: candidateName,
      },
      {
        label: "Designation",
        value: designation || "Employee",
      },
      {
        label: "Issue Date",
        value: formatDate(new Date()),
      },
      {
        label: "Joining Date",
        value:
          formatDate(joiningDate) || "To be confirmed",
      },
    ]);

    paragraph(
      pdf,
      `Dear ${candidateName},`
    );

    paragraph(
      pdf,
      `We are pleased to offer you the position of ${
        designation || "Employee"
      } with ${BRAND_NAME}, ${BRAND_SUBTITLE}. We are confident that your skills, experience and contribution will be valuable to our organization.`
    );

    sectionTitle(
      pdf,
      "Compensation & Employment"
    );

    paragraph(
      pdf,
      `Your proposed monthly salary will be ${formatCurrency(
        salary
      )}. The applicable salary structure, benefits, deductions and other employment terms will be governed by the organization's approved policies and applicable regulations.`
    );

    if (joiningDate) {
      paragraph(
        pdf,
        `Your expected date of joining is ${formatDate(
          joiningDate
        )}. You are requested to complete the required joining formalities and submit all necessary documents as instructed by the HR department.`
      );
    }

    sectionTitle(
      pdf,
      "Terms & Conditions"
    );

    paragraph(
      pdf,
      `Your employment will be subject to the company's policies, procedures, code of conduct, confidentiality requirements and other applicable terms of employment. You are expected to maintain professional standards and comply with all organizational requirements.`
    );

    paragraph(
      pdf,
      `This offer letter represents the formal offer of employment. Detailed terms and conditions may be provided separately as part of the organization's employment documentation.`
    );

    paragraph(
      pdf,
      `We look forward to welcoming you to ${BRAND_NAME} and wish you a successful and rewarding association with us.`
    );

    signatureBlock(
      pdf,
      "HR / Authorized Signatory"
    );

    drawFooter(
      pdf,
      "Offer Letter"
    );
  });

  return {
    fileName,
    filePath,
  };
}

/*
|--------------------------------------------------------------------------
| GENERATE APPOINTMENT LETTER
|--------------------------------------------------------------------------
*/

export async function generateAppointmentLetter({
  employee,
  designation,
  salary,
}) {
  const directory = ensureUploadDirectory();

  const employeeName =
    employeeFullName(employee) ||
    employee?.name ||
    "Employee";

  const documentNumber = `APT-${Date.now()}`;

  const fileName = `appointment_letter_${safeFileName(
    employeeName
  )}_${Date.now()}.pdf`;

  const filePath = path.join(
    directory,
    fileName
  );

  await createPDF(filePath, (pdf) => {
    drawHeader(
      pdf,
      "Appointment Letter",
      documentNumber
    );

    drawDocumentTitle(
      pdf,
      "Appointment Letter",
      "Official Employment Appointment"
    );

    infoBox(pdf, [
      {
        label: "Employee",
        value: employeeName,
      },
      {
        label: "Employee ID",
        value:
          employee?.employeeId || "-",
      },
      {
        label: "Designation",
        value: designation || "Employee",
      },
      {
        label: "Joining Date",
        value:
          formatDate(employee?.joiningDate) ||
          "Not specified",
      },
    ]);

    paragraph(
      pdf,
      `Dear ${employee?.firstName || employeeName},`
    );

    paragraph(
      pdf,
      `We are pleased to formally appoint you as ${
        designation || "Employee"
      } at ${BRAND_NAME}, ${BRAND_SUBTITLE}. Your appointment is based on the terms and conditions outlined by the organization.`
    );

    sectionTitle(
      pdf,
      "Appointment Details"
    );

    const appointmentColumns = [
      {
        title: "Particular",
        width: 250,
      },
      {
        title: "Details",
        width: 200,
      },
    ];

    let tableY = drawTableHeader(
      pdf,
      appointmentColumns,
      pdf.y
    );

    tableY = drawTableRow(
      pdf,
      appointmentColumns,
      [
        "Employee Name",
        employeeName,
      ],
      tableY,
      false
    );

    tableY = drawTableRow(
      pdf,
      appointmentColumns,
      [
        "Employee ID",
        employee?.employeeId || "-",
      ],
      tableY,
      true
    );

    tableY = drawTableRow(
      pdf,
      appointmentColumns,
      [
        "Designation",
        designation || "Employee",
      ],
      tableY,
      false
    );

    tableY = drawTableRow(
      pdf,
      appointmentColumns,
      [
        "Joining Date",
        formatDate(
          employee?.joiningDate
        ) || "-",
      ],
      tableY,
      false
    );

    pdf.y = tableY + 20;

    sectionTitle(
      pdf,
      "Employment Terms"
    );

    paragraph(
      pdf,
      `Your monthly salary will be based on the approved salary structure .
      )}. Any applicable statutory deductions, benefits or other adjustments will be handled in accordance with company policy and applicable laws.`
    );

    paragraph(
      pdf,
      `You will be expected to comply with all company policies, procedures, confidentiality requirements, attendance requirements and employment standards applicable to your position.`
    );

    paragraph(
      pdf,
      `The organization reserves the right to amend policies, procedures and employment requirements in accordance with business needs and applicable regulations.`
    );

    paragraph(
      pdf,
      `We welcome you to ${BRAND_NAME} and look forward to your valuable contribution to the organization.`
    );

    signatureBlock(
      pdf,
      "HR / Authorized Signatory"
    );

    drawFooter(
      pdf,
      "Appointment Letter"
    );
  });

  return {
    fileName,
    filePath,
  };
}

/*
|--------------------------------------------------------------------------
| GENERATE PAYSLIP
|--------------------------------------------------------------------------
*/

export async function generatePayslip({
  employee,
  payroll,
}) {
  const directory = ensureUploadDirectory();

  const employeeName =
    employeeFullName(employee) ||
    employee?.name ||
    "Employee";

  const fileName = `payslip_${safeFileName(
    employee?.employeeId || employeeName
  )}_${payroll?.month}_${payroll?.year}.pdf`;

  const filePath = path.join(
    directory,
    fileName
  );

  const documentNumber = `PAY-${payroll?.month || ""}-${
    payroll?.year || ""
  }-${Date.now()}`;

  await createPDF(filePath, (pdf) => {
    drawHeader(
      pdf,
      "Salary Payslip",
      documentNumber
    );

    drawDocumentTitle(
      pdf,
      "Salary Payslip",
      "Confidential Payroll Statement"
    );

    infoBox(pdf, [
      {
        label: "Employee Name",
        value: employeeName,
      },
      {
        label: "Employee ID",
        value:
          employee?.employeeId || "-",
      },
      {
        label: "Email",
        value:
          employee?.email || "-",
      },
      {
        label: "Payroll Period",
        value: `${payroll?.month || "-"} / ${
          payroll?.year || "-"
        }`,
      },
    ]);

    sectionTitle(
      pdf,
      "Payroll Summary"
    );

    const salaryColumns = [
      {
        title: "Salary Component",
        width: 300,
      },
      {
        title: "Amount",
        width: 150,
        align: "right",
      },
    ];

    let tableY = drawTableHeader(
      pdf,
      salaryColumns,
      pdf.y
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Monthly Salary",
        formatCurrency(
          payroll?.monthlySalary
        ),
      ],
      tableY,
      false
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Payroll Basis",
        `${payroll?.payrollBasisDays || 0} days`,
      ],
      tableY,
      true
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Payable Days",
        `${payroll?.payableDays || 0} days`,
      ],
      tableY,
      false
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Unpaid Days",
        `${payroll?.unpaidDays || 0} days`,
      ],
      tableY,
      true
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Per Day Salary",
        formatCurrency(
          payroll?.perDaySalary
        ),
      ],
      tableY,
      false
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Additions",
        formatCurrency(
          payroll?.additions
        ),
      ],
      tableY,
      true
    );

    tableY = drawTableRow(
      pdf,
      salaryColumns,
      [
        "Deductions",
        formatCurrency(
          payroll?.deductions
        ),
      ],
      tableY,
      false
    );

    pdf.y = tableY + 22;

    /*
     * NET PAY BOX
     */

    const boxX = pdf.page.margins.left;
    const boxWidth =
      pdf.page.width -
      pdf.page.margins.left -
      pdf.page.margins.right;

    const boxY = pdf.y;
    const boxHeight = 58;

    pdf
      .save()
      .roundedRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight,
        5
      )
      .fill(BRAND_COLOR)
      .restore();

    pdf
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text(
        "NET PAY",
        boxX + 18,
        boxY + 13
      );

    pdf
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor("#FFFFFF")
      .text(
        formatCurrency(
          payroll?.netPay
        ),
        boxX + 18,
        boxY + 28
      );

    pdf.y =
      boxY +
      boxHeight +
      25;

    sectionTitle(
      pdf,
      "Payroll Information"
    );

    paragraph(
      pdf,
      `The above salary has been calculated based on the applicable payroll period, payable days, additions and deductions recorded in the HRMS.`
    );

    paragraph(
      pdf,
      `This payslip is generated electronically by the ${BRAND_NAME} HRMS and is considered an official payroll statement unless otherwise specified by the organization.`
    );

    /*
     * Employee / HR acknowledgement area
     */

    pdf.moveDown(1);

    const signatureY = pdf.y;

    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#777777")
      .text(
        "Employee Acknowledgement",
        pdf.page.margins.left,
        signatureY
      );

    pdf
      .moveTo(
        pdf.page.margins.left,
        signatureY + 35
      )
      .lineTo(
        pdf.page.margins.left + 170,
        signatureY + 35
      )
      .strokeColor("#333333")
      .lineWidth(0.7)
      .stroke();

    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#777777")
      .text(
        "HR / Authorized Signatory",
        325,
        signatureY
      );

    pdf
      .moveTo(
        325,
        signatureY + 35
      )
      .lineTo(
        495,
        signatureY + 35
      )
      .strokeColor("#333333")
      .lineWidth(0.7)
      .stroke();

    pdf
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#888888")
      .text(
        "This is a system-generated payslip and does not require a physical stamp.",
        pdf.page.margins.left,
        signatureY + 60,
        {
          width: 495,
          align: "center",
        }
      );

    drawFooter(
      pdf,
      "Salary Payslip"
    );
  });

  return {
    fileName,
    filePath,
  };
}