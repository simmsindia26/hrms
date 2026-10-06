import fs from "fs";
import path from "path";



import { Document } from "../models/Document.js";
import { Employee } from "../models/Employee.js";
import { Candidate } from "../models/Candidate.js";
import { Payroll } from "../models/Payroll.js";

import {
  generateOfferLetter,
  generateAppointmentLetter,
  generatePayslip,
} from "../services/pdf.service.js";

import {
  sendHREventEmail,
} from "../services/hr-email-events.service.js";

import {
  success,
  created,
} from "../utils/apiResponse.js";


/* =========================================================
   LIST DOCUMENTS
========================================================= */

export async function listDocuments(req, res) {
  try {
    const filter = {};

    if (req.query.employee) {
      filter.employee = req.query.employee;
    }

    if (req.query.candidate) {
      filter.candidate = req.query.candidate;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const documents = await Document.find(filter)
      .populate("employee candidate uploadedBy")
      .sort({
        createdAt: -1,
      });

    return success(res, documents);
  } catch (error) {
    console.error(
      "List documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents.",
      error: error.message,
    });
  }
}


/* =========================================================
   UPLOAD DOCUMENT
========================================================= */

export async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required.",
      });
    }

    const document = await Document.create({
      employee:
        req.body.employee || null,

      candidate:
        req.body.candidate || null,

      type:
        req.body.type || "other",

      title:
        req.body.title ||
        req.file.originalname,

      fileName:
        req.file.filename,

      fileUrl:
        `/uploads/${req.file.filename}`,

      mimeType:
        req.file.mimetype,

      fileSize:
        req.file.size,

      uploadedBy:
        req.user._id,
    });

    /*
     * Populate all required relations before
     * sending the email event.
     */

    const populatedDocument =
      await Document.findById(
        document._id
      )
        .populate(
          "employee",
          "firstName middleName lastName name email employeeId"
        )
        .populate(
          "candidate",
          "name firstName middleName lastName email"
        )
        .populate(
          "uploadedBy",
          "name email"
        );

    /* -----------------------------------------------------
       EMAIL: DOCUMENT UPLOADED
    ----------------------------------------------------- */

    if (populatedDocument?.employee) {
      try {
        await sendHREventEmail({
          event: "document.uploaded",

          employee:
            populatedDocument.employee,

          document:
            populatedDocument,

          sentBy:
            req.user._id,
        });
      } catch (emailError) {
        console.error(
          "Document upload email failed:",
          emailError.message
        );
      }
    }

    return created(
      res,
      populatedDocument,
      "Document uploaded successfully."
    );
  } catch (error) {
    console.error(
      "Upload document error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to upload document.",
    });
  }
}


/* =========================================================
   GENERATE OFFER LETTER
========================================================= */

export async function generateOffer(req, res) {
  try {
    const candidate =
      await Candidate.findById(
        req.params.candidateId
      ).populate("jobOpening");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    const {
      designation,
      salary,
      joiningDate,
    } = req.body;

    /* -----------------------------------------------------
       GENERATE PDF
    ----------------------------------------------------- */

    const pdf =
      await generateOfferLetter({
        candidate,
        designation,
        salary,
        joiningDate,
      });

    /* -----------------------------------------------------
       SAVE DOCUMENT
    ----------------------------------------------------- */

    const document =
      await Document.create({
        candidate:
          candidate._id,

        type:
          "offer_letter",

        title:
          `Offer Letter - ${
            candidate.name ||
            candidate.firstName ||
            "Candidate"
          }`,

        fileName:
          pdf.fileName,

        fileUrl:
          `/uploads/${pdf.fileName}`,

        mimeType:
          "application/pdf",

        fileSize:
          fs.statSync(
            pdf.filePath
          ).size,

        uploadedBy:
          req.user._id,

        metadata: {
          designation,
          salary,
          joiningDate,
        },
      });

    /* -----------------------------------------------------
       UPDATE CANDIDATE OFFER STATE
    ----------------------------------------------------- */
    candidate.offerStatus = "sent";
    candidate.offerSentAt = new Date();

    if (joiningDate) {
      candidate.joiningDate = joiningDate;
    }

    await candidate.save();

    /* -----------------------------------------------------
       POPULATE DOCUMENT
    ----------------------------------------------------- */

    const populatedDocument =
      await Document.findById(
        document._id
      )
        .populate(
          "candidate",
          "name firstName middleName lastName email"
        )
        .populate(
          "uploadedBy",
          "name email"
        );

    /* -----------------------------------------------------
       EMAIL: OFFER GENERATED

       IMPORTANT:
       The PDF attachment is sent through the
       centralized event email service.

       This creates ONE email only.
    ----------------------------------------------------- */

    if (candidate.email) {
      try {
        await sendHREventEmail({
          event:
            "offer.generated",

          candidate,

          document:
            populatedDocument,

          sentBy:
            req.user._id,

          attachments: [
            {
              filename:
                pdf.fileName,

              path:
                pdf.filePath,
            },
          ],

          metadata: {
            designation,
            salary,
            joiningDate,
          },
        });
      } catch (emailError) {
        console.error(
          "Offer letter email failed:",
          emailError.message
        );
      }
    }

    return created(
      res,
      document,
      "Offer letter generated and email processed."
    );
  } catch (error) {
    console.error(
      "Generate offer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate offer letter.",
    });
  }
}


/* =========================================================
   GENERATE APPOINTMENT LETTER
========================================================= */

export async function generateAppointment(
  req,
  res
) {
  try {
    const employee =
      await Employee.findById(
        req.params.employeeId
      )
        .populate("designation")
        .populate("salaryStructure");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found.",
      });
    }

    const salary =
      employee.salaryStructure
        ?.monthlySalary || 0;

    const designation =
      employee.designation?.name ||
      "Employee";

    /* -----------------------------------------------------
       GENERATE PDF
    ----------------------------------------------------- */

    const pdf =
      await generateAppointmentLetter({
        employee,
        designation,
        salary,
      });

    /* -----------------------------------------------------
       SAVE DOCUMENT
    ----------------------------------------------------- */

    const document =
      await Document.create({
        employee:
          employee._id,

        type:
          "appointment_letter",

        title:
          `Appointment Letter - ${
            employee.firstName ||
            employee.name ||
            "Employee"
          }`,

        fileName:
          pdf.fileName,

        fileUrl:
          `/uploads/${pdf.fileName}`,

        mimeType:
          "application/pdf",

        fileSize:
          fs.statSync(
            pdf.filePath
          ).size,

        uploadedBy:
          req.user._id,

        metadata: {
          designation,
          salary,
        },
      });

    /* -----------------------------------------------------
       POPULATE DOCUMENT
    ----------------------------------------------------- */

    const populatedDocument =
      await Document.findById(
        document._id
      )
        .populate(
          "employee",
          "firstName middleName lastName name email employeeId"
        )
        .populate(
          "uploadedBy",
          "name email"
        );

    /* -----------------------------------------------------
       EMAIL: APPOINTMENT GENERATED

       ONE EMAIL + PDF ATTACHMENT
    ----------------------------------------------------- */

    if (employee.email) {
      try {
        await sendHREventEmail({
          event:
            "appointment.generated",

          employee,

          document:
            populatedDocument,

          sentBy:
            req.user._id,

          attachments: [
            {
              filename:
                pdf.fileName,

              path:
                pdf.filePath,
            },
          ],
        });
      } catch (emailError) {
        console.error(
          "Appointment letter email failed:",
          emailError.message
        );
      }
    }

    return created(
      res,
      document,
      "Appointment letter generated and email processed."
    );
  } catch (error) {
    console.error(
      "Generate appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate appointment letter.",
    });
  }
}


/* =========================================================
   GENERATE EMPLOYEE PAYSLIP
========================================================= */

export async function generateEmployeePayslip(
  req,
  res
) {
  try {
    const payroll =
      await Payroll.findById(
        req.params.payrollId
      );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message:
          "Payroll record not found.",
      });
    }

    const employee =
      await Employee.findById(
        payroll.employee
      );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found.",
      });
    }

    /* -----------------------------------------------------
       GENERATE PDF
    ----------------------------------------------------- */

    const pdf =
      await generatePayslip({
        employee,
        payroll,
      });

    /* -----------------------------------------------------
       SAVE DOCUMENT
    ----------------------------------------------------- */

    const document =
      await Document.create({
        employee:
          employee._id,

        type:
          "payslip",

        title:
          `Payslip - ${payroll.month}/${payroll.year}`,

        fileName:
          pdf.fileName,

        fileUrl:
          `/uploads/${pdf.fileName}`,

        mimeType:
          "application/pdf",

        fileSize:
          fs.statSync(
            pdf.filePath
          ).size,

        uploadedBy:
          req.user._id,

        metadata: {
          payroll:
            payroll._id,

          month:
            payroll.month,

          year:
            payroll.year,

          netPay:
            payroll.netPay,
        },
      });

    /* -----------------------------------------------------
       POPULATE DOCUMENT
    ----------------------------------------------------- */

    const populatedDocument =
      await Document.findById(
        document._id
      )
        .populate(
          "employee",
          "firstName middleName lastName name email employeeId"
        )
        .populate(
          "uploadedBy",
          "name email"
        );

    /* -----------------------------------------------------
       EMAIL: PAYSLIP GENERATED

       ONE EMAIL + PDF ATTACHMENT
    ----------------------------------------------------- */

    if (employee.email) {
      try {
        await sendHREventEmail({
          event:
            "payslip.generated",

          employee,

          payroll,

          document:
            populatedDocument,

          sentBy:
            req.user._id,

          attachments: [
            {
              filename:
                pdf.fileName,

              path:
                pdf.filePath,
            },
          ],
        });
      } catch (emailError) {
        console.error(
          "Payslip email failed:",
          emailError.message
        );
      }
    }

    return created(
      res,
      document,
      "Payslip generated and email processed."
    );
  } catch (error) {
    console.error(
      "Generate payslip error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate payslip.",
    });
  }
}


/* =========================================================
   ACKNOWLEDGE DOCUMENT
========================================================= */

export async function acknowledgeDocument(
  req,
  res
) {
  try {
    const document =
      await Document.findByIdAndUpdate(
        req.params.id,

        {
          acknowledged: true,

          acknowledgedAt:
            new Date(),
        },

        {
          new: true,
        }
      )
        .populate(
          "employee",
          "firstName middleName lastName name email employeeId"
        )
        .populate(
          "candidate",
          "name firstName middleName lastName email"
        );

    if (!document) {
      return res.status(404).json({
        success: false,
        message:
          "Document not found.",
      });
    }

    /* -----------------------------------------------------
       EMAIL: DOCUMENT ACKNOWLEDGED
    ----------------------------------------------------- */

    if (document.employee) {
      try {
        await sendHREventEmail({
          event:
            "document.acknowledged",

          employee:
            document.employee,

          document,

          sentBy:
            req.user._id,
        });
      } catch (emailError) {
        console.error(
          "Document acknowledgement email failed:",
          emailError.message
        );
      }
    }

    return success(
      res,
      document,
      "Document acknowledged."
    );
  } catch (error) {
    console.error(
      "Acknowledge document error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to acknowledge document.",
    });
  }
}
export async function downloadDocument(req, res) {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (!document.filePath) {
      return res.status(404).json({
        success: false,
        message: "Document file path not found",
      });
    }

    const filePath = path.resolve(document.filePath);

    if (!fs.existsSync(filePath)) {
      console.error("Document file missing:", filePath);

      return res.status(404).json({
        success: false,
        message: "Document file does not exist on server",
      });
    }

    const fileName =
      document.fileName ||
      document.originalName ||
      path.basename(filePath);

    return res.download(filePath, fileName, (error) => {
      if (error && !res.headersSent) {
        console.error("Document download error:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to download document",
        });
      }
    });
  } catch (error) {
    console.error("downloadDocument error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download document",
      error: error.message,
    });
  }
}



export async function getPayslip(req, res) {
  try {
    const { payrollId } = req.params;

    if (!payrollId) {
      return res.status(400).json({
        success: false,
        message: "Payroll ID is required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find payroll
    |--------------------------------------------------------------------------
    */

    const payroll = await Payroll.findById(payrollId);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find employee
    |--------------------------------------------------------------------------
    */

    const employee = await Employee.findById(payroll.employee);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check if payslip document already exists
    |--------------------------------------------------------------------------
    */

    let document = await Document.findOne({
      employee: employee._id,
      type: "payslip",
      "metadata.payroll": payroll._id,
    }).sort({
      createdAt: -1,
    });

    /*
    |--------------------------------------------------------------------------
    | Generate PDF if it doesn't exist
    |--------------------------------------------------------------------------
    */

    let filePath;
    let fileName;

    if (document) {
      fileName = document.fileName;

      /*
       * The document currently stores fileUrl as:
       * /uploads/filename.pdf
       *
       * But the actual file is located using the
       * generated PDF's filesystem path.
       *
       * If the document has no usable physical path,
       * regenerate the PDF.
       */

      const possiblePath = path.resolve(
        process.cwd(),
        "uploads",
        fileName
      );

      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Generate a fresh PDF when file is missing
    |--------------------------------------------------------------------------
    */

    if (!filePath) {
      const pdf = await generatePayslip({
        employee,
        payroll,
      });

      filePath = pdf.filePath;
      fileName = pdf.fileName;

      /*
      |--------------------------------------------------------------------------
      | Update existing document or create a new one
      |--------------------------------------------------------------------------
      */

      if (document) {
        document.fileName = fileName;
        document.fileUrl = `/uploads/${fileName}`;
        document.mimeType = "application/pdf";
        document.fileSize = fs.statSync(filePath).size;

        await document.save();
      } else {
        document = await Document.create({
          employee: employee._id,

          type: "payslip",

          title: `Payslip - ${payroll.month}/${payroll.year}`,

          fileName,

          fileUrl: `/uploads/${fileName}`,

          mimeType: "application/pdf",

          fileSize: fs.statSync(filePath).size,

          uploadedBy: req.user._id,

          metadata: {
            payroll: payroll._id,
            month: payroll.month,
            year: payroll.year,
            netPay: payroll.netPay,
          },
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Verify PDF exists
    |--------------------------------------------------------------------------
    */

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Payslip PDF file does not exist on server.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Send actual PDF
    |--------------------------------------------------------------------------
    */

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    res.setHeader(
      "Content-Length",
      fs.statSync(filePath).size
    );

    return res.sendFile(
      path.resolve(filePath)
    );

  } catch (error) {
    console.error(
      "Get payslip error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to download payslip.",
    });
  }
}