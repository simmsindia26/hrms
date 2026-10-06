import mongoose from "mongoose";
import { Department } from "../models/Department.js";
import { Designation } from "../models/Designation.js";
import { JobOpening } from "../models/JobOpening.js";
import { Candidate } from "../models/Candidate.js";
import { Interview } from "../models/Interview.js";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";

import {
  LeaveType,
  LeaveApplication,
} from "../models/Leave.js";

import { Notice } from "../models/Notice.js";
import { SalaryStructure } from "../models/SalaryStructure.js";
import { Payroll } from "../models/Payroll.js";
import { Notification } from "../models/Notification.js";
import EmailLog from "../models/EmailLog.js";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";

import {
  pagination,
  paginationMeta,
} from "../utils/pagination.js";

import {
  success,
  created,
} from "../utils/apiResponse.js";

import { audit } from "../middleware/audit.js";

import {
  calculatePayroll,
  upsertPayroll,
} from "../services/payroll.service.js";

import { sendEmail } from "../services/email.service.js";

import {
  sendHREventEmail,
} from "../services/hr-email-events.service.js";


/* =========================================================
   GENERIC CRUD FACTORY
========================================================= */

function factory(Model, populate = "") {
  return {
    /* -----------------------------------------------------
       LIST
    ----------------------------------------------------- */

    list: async (req, res) => {
      try {
        const {
          page,
          limit,
          skip,
        } = pagination(req);

        const filter = {};

        if (req.query.status) {
          filter.status = req.query.status;
        }

        if (req.query.employee) {
          filter.employee = req.query.employee;
        }

        if (req.query.department) {
          filter.department =
            req.query.department;
        }

        const [
          items,
          total,
        ] = await Promise.all([
          Model.find(filter)
            .populate(populate)
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit),

          Model.countDocuments(filter),
        ]);

        return success(res, {
          items,
          pagination:
            paginationMeta(
              page,
              limit,
              total
            ),
        });
      } catch (error) {
        console.error(
          `List ${Model.modelName} error:`,
          error
        );

        return res.status(500).json({
          success: false,
          message:
            `Failed to fetch ${Model.modelName}.`,
          error: error.message,
        });
      }
    },


    /* -----------------------------------------------------
       GET SINGLE
    ----------------------------------------------------- */

    get: async (req, res) => {
      try {
        const item =
          await Model.findById(
            req.params.id
          ).populate(populate);

        if (!item) {
          return res.status(404).json({
            success: false,
            message:
              "Record not found.",
          });
        }

        return success(
          res,
          item
        );
      } catch (error) {
        console.error(
          `Get ${Model.modelName} error:`,
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to fetch record.",
          error: error.message,
        });
      }
    },


    /* -----------------------------------------------------
       CREATE
    ----------------------------------------------------- */

    create: async (req, res) => {
      try {
        const item =
          await Model.create({
            ...req.body,
            createdBy:
              req.user._id,
          });

        await audit(
          req,
          "create",
          Model.modelName,
          `Created ${Model.modelName}`,
          {
            id: item._id,
          }
        );

        return created(
          res,
          item
        );
      } catch (error) {
        console.error(
          `Create ${Model.modelName} error:`,
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            `Failed to create ${Model.modelName}.`,
        });
      }
    },


    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    update: async (req, res) => {
      try {
        const item =
          await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
              new: true,
              runValidators: true,
            }
          );

        if (!item) {
          return res.status(404).json({
            success: false,
            message:
              "Record not found.",
          });
        }

        await audit(
          req,
          "update",
          Model.modelName,
          `Updated ${Model.modelName}`,
          {
            id: item._id,
          }
        );

        return success(
          res,
          item,
          "Updated."
        );
      } catch (error) {
        console.error(
          `Update ${Model.modelName} error:`,
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            `Failed to update ${Model.modelName}.`,
        });
      }
    },


    /* -----------------------------------------------------
       DELETE
    ----------------------------------------------------- */

    remove: async (req, res) => {
      try {
        const item =
          await Model.findByIdAndDelete(
            req.params.id
          );

        if (!item) {
          return res.status(404).json({
            success: false,
            message:
              "Record not found.",
          });
        }

        await audit(
          req,
          "delete",
          Model.modelName,
          `Deleted ${Model.modelName}`,
          {
            id: item._id,
          }
        );

        return success(
          res,
          null,
          "Deleted."
        );
      } catch (error) {
        console.error(
          `Delete ${Model.modelName} error:`,
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            `Failed to delete ${Model.modelName}.`,
        });
      }
    },
  };
}


/* =========================================================
   GENERIC CRUD EXPORTS
========================================================= */

export const departments =
  factory(Department);

export const designations =
  factory(Designation);

export const jobs =
  factory(
    JobOpening,
    "department designation"
  );

export const candidates = {
  ...factory(
    Candidate,
    "jobOpening"
  ),

  offer: async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);
      if (!candidate) return res.status(404).json({ success:false, message:"Candidate not found." });
      if (candidate.status !== "selected") {
        return res.status(400).json({ success:false, message:"Candidate must be selected before an offer can be sent." });
      }
      candidate.offerStatus = "sent";
      candidate.offerSentAt = new Date();
      if (req.body?.joiningDate) candidate.joiningDate = req.body.joiningDate;
      await candidate.save();
      await audit(req,"update","Candidate","Candidate offer marked as sent",{id:candidate._id,name:candidate.name,email:candidate.email});
      return success(res,candidate,"Offer status updated successfully.");
    } catch (error) {
      console.error("Mark offer sent error:",error);
      return res.status(500).json({success:false,message:error.message || "Failed to update offer status."});
    }
  },

  acceptOffer: async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);
      if (!candidate) return res.status(404).json({success:false,message:"Candidate not found."});
      if (candidate.offerStatus !== "sent") {
        return res.status(400).json({success:false,message:"The offer must be sent before it can be accepted."});
      }
      candidate.offerStatus = "accepted";
      candidate.offerAcceptedAt = new Date();
      candidate.offerAcceptedBy = req.user._id;
      await candidate.save();
      await audit(req,"update","Candidate","Candidate offer accepted",{id:candidate._id,name:candidate.name,email:candidate.email});
      return success(res,candidate,"Offer accepted successfully.");
    } catch (error) {
      console.error("Accept offer error:",error);
      return res.status(500).json({success:false,message:error.message || "Failed to accept offer."});
    }
  },

  join: async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);
      if (!candidate) return res.status(404).json({success:false,message:"Candidate not found."});
      if (candidate.offerStatus !== "accepted") {
        return res.status(400).json({success:false,message:"Candidate must accept the offer before joining."});
      }

      const employeeId = req.body?.employeeId || candidate.employee;
      if (!employeeId) {
        return res.status(400).json({success:false,message:"Create the employee HR profile first, then join this candidate."});
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) return res.status(404).json({success:false,message:"Employee HR profile not found."});

      candidate.status = "joined";
      candidate.joiningDate = req.body?.joiningDate || candidate.joiningDate || employee.joiningDate || new Date();
      candidate.joinedAt = new Date();
      candidate.employee = employee._id;
      await candidate.save();

      await audit(req,"update","Candidate","Candidate joined and linked to employee",{id:candidate._id,employee:employee._id,name:candidate.name,email:candidate.email});

      const populated = await Candidate.findById(candidate._id)
        .populate("jobOpening","title")
        .populate("employee");

      return success(res,populated,"Candidate joined successfully.");
    } catch (error) {
      console.error("Join candidate error:",error);
      return res.status(500).json({success:false,message:error.message || "Failed to join candidate."});
    }
  },

  reject: async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);
      if (!candidate) return res.status(404).json({success:false,message:"Candidate not found."});
      if (candidate.status === "joined") return res.status(400).json({success:false,message:"A joined employee cannot be rejected."});

      candidate.status = "rejected";
      candidate.offerStatus = "declined";
      candidate.offerDeclinedAt = new Date();
      await candidate.save();

      await audit(req,"update","Candidate","Candidate rejected",{id:candidate._id,name:candidate.name,email:candidate.email});
      return success(res,candidate,"Candidate rejected successfully.");
    } catch (error) {
      console.error("Reject candidate error:",error);
      return res.status(500).json({success:false,message:error.message || "Failed to reject candidate."});
    }
  },
};

export const interviews =
  factory(
    Interview,
    "candidate interviewer"
  );

/* =========================================================
   EMPLOYEES
   =========================================================
   Employee ID is generated automatically by the backend.

   Example:
   EMP-0001
   EMP-0002
   EMP-0003

   Frontend should NOT send employeeId while creating.
========================================================= */

export const employees = {

  /* ---------------------------------------------------------
     LIST EMPLOYEES
  --------------------------------------------------------- */

  list: async (req, res) => {
    try {
      const {
        page,
        limit,
        skip,
      } = pagination(req);

      const filter = {};

      /*
       * Employee users can only see themselves.
       */
      if (req.user.role === "employee") {
        if (!req.user.employee) {
          return success(res, {
            items: [],
            pagination:
              paginationMeta(
                page,
                limit,
                0
              ),
          });
        }

        filter._id =
          req.user.employee;
      }

      /*
       * Department filter
       */
      if (req.query.department) {
        filter.department =
          req.query.department;
      }

      /*
       * Designation filter
       */
      if (req.query.designation) {
        filter.designation =
          req.query.designation;
      }

      /*
       * Status filter
       */
      if (req.query.status) {
        filter.status =
          req.query.status;
      }

      /*
       * Employment type filter
       */
      if (req.query.employmentType) {
        filter.employmentType =
          req.query.employmentType;
      }

      /*
       * Search
       */
      if (req.query.search) {
        const search =
          String(
            req.query.search
          ).trim();

        if (search) {
          filter.$or = [
            {
              firstName: {
                $regex: search,
                $options: "i",
              },
            },

            {
              lastName: {
                $regex: search,
                $options: "i",
              },
            },

            {
              email: {
                $regex: search,
                $options: "i",
              },
            },

            {
              phone: {
                $regex: search,
                $options: "i",
              },
            },

            {
              employeeId: {
                $regex: search,
                $options: "i",
              },
            },
          ];
        }
      }

      const [
        items,
        total,
      ] = await Promise.all([

        Employee.find(filter)
          .populate(
            "department designation salaryStructure"
          )
          .populate({
            path: "user",
            select:
              "name email role isActive",
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit),

        Employee.countDocuments(
          filter
        ),
      ]);

      return success(res, {
        items,

        pagination:
          paginationMeta(
            page,
            limit,
            total
          ),
      });

    } catch (error) {

      console.error(
        "List employees error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch employees.",

        error:
          error.message,
      });
    }
  },


  /* ---------------------------------------------------------
     GET SINGLE EMPLOYEE
  --------------------------------------------------------- */

  get: async (req, res) => {
    try {

      const employee =
        await Employee.findById(
          req.params.id
        )
          .populate(
            "department designation salaryStructure"
          )
          .populate({
            path: "user",
            select:
              "name email role isActive",
          });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found.",
        });
      }

      /*
       * Employee can only view
       * their own profile.
       */
      if (
        req.user.role ===
          "employee" &&
        String(
          req.user.employee
        ) !==
          String(
            employee._id
          )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this employee.",
        });
      }

      return success(
        res,
        employee
      );

    } catch (error) {

      console.error(
        "Get employee error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch employee.",

        error:
          error.message,
      });
    }
  },


  /* ---------------------------------------------------------
     GENERATE NEXT EMPLOYEE ID
  ---------------------------------------------------------

     Finds the latest numeric EMP ID.

     Example:

     Existing:
       EMP-0001
       EMP-0002
       EMP-0003

     Returns:
       EMP-0004
  --------------------------------------------------------- */

  generateEmployeeId:
    async () => {

      const latest =
        await Employee.findOne({
          employeeId: {
            $regex:
              /^EMP-[0-9]+$/,
          },
        })
          .sort({
            createdAt: -1,
          })
          .select(
            "employeeId"
          )
          .lean();

      let nextNumber = 1;

      if (
        latest?.employeeId
      ) {

        const match =
          latest.employeeId.match(
            /^EMP-(\d+)$/
          );

        if (match) {
          nextNumber =
            Number(
              match[1]
            ) + 1;
        }
      }

      return `EMP-${String(
        nextNumber
      ).padStart(
        4,
        "0"
      )}`;
    },


  /* ---------------------------------------------------------
     CREATE EMPLOYEE
  ---------------------------------------------------------

     IMPORTANT:
     employeeId from frontend is ignored.

     Backend generates it automatically.
  --------------------------------------------------------- */

  create: async (req, res) => {
    try {

      /*
       * Remove employeeId supplied
       * by frontend.
       *
       * Backend is the authority.
       */
      const {
        employeeId:
          ignoredEmployeeId,

        ...body
      } = req.body;


      /*
       * Generate Employee ID.
       */
      let generatedEmployeeId =
        await employees.generateEmployeeId();


      /*
       * Safety check.

       * If an ID already exists,
       * keep incrementing.
       */
      while (
        await Employee.exists({
          employeeId:
            generatedEmployeeId,
        })
      ) {

        const currentNumber =
          Number(
            generatedEmployeeId.replace(
              "EMP-",
              ""
            )
          );

        generatedEmployeeId =
          `EMP-${String(
            currentNumber + 1
          ).padStart(
            4,
            "0"
          )}`;
      }


      /*
       * Create employee.
       */
      const employee =
        await Employee.create({

          ...body,

          /*
           * Automatically generated.
           */
          employeeId:
            generatedEmployeeId,

          /*
           * Logged-in HR user.
           */
          createdBy:
            req.user._id,
        });


      /*
       * Populate employee
       * before returning.
       */
      const populatedEmployee =
        await Employee.findById(
          employee._id
        )
          .populate(
            "department designation salaryStructure"
          )
          .populate({
            path: "user",
            select:
              "name email role isActive",
          });


      /*
       * Audit log.
       */
      await audit(
        req,

        "create",

        "Employee",

        "Employee created",

        {
          id:
            employee._id,

          employeeId:
            employee.employeeId,

          name:
            `${employee.firstName || ""} ${
              employee.lastName || ""
            }`.trim(),

          email:
            employee.email,
        }
      );


      /*
       * Response.
       */
      return created(
        res,

        populatedEmployee,

        "Employee created successfully."
      );

    } catch (error) {

      console.error(
        "Create employee error:",
        error
      );


      /*
       * MongoDB duplicate key.
       */
      if (
        error?.code ===
        11000
      ) {

        return res.status(
          409
        ).json({

          success:
            false,

          message:
            "Employee ID conflict. Please try again.",

          error:
            error.message,
        });
      }


      return res.status(
        500
      ).json({

        success:
          false,

        message:
          error.message ||
          "Failed to create employee.",

        error:
          error.message,
      });
    }
  },


  /* ---------------------------------------------------------
     UPDATE EMPLOYEE
  ---------------------------------------------------------

     Employee ID cannot be changed after creation.
  --------------------------------------------------------- */

  update: async (req, res) => {
    try {

      /*
       * Remove employeeId from update.
       *
       * This prevents someone from changing:
       *
       * EMP-0001
       *
       * into:
       *
       * EMP-9999
       */
      const {
        employeeId:
          ignoredEmployeeId,

        ...updateData
      } = req.body;


      const employee =
        await Employee.findByIdAndUpdate(

          req.params.id,

          updateData,

          {
            new: true,

            runValidators:
              true,
          }
        )
          .populate(
            "department designation salaryStructure"
          )
          .populate({
            path: "user",
            select:
              "name email role isActive",
          });


      if (!employee) {

        return res.status(
          404
        ).json({

          success:
            false,

          message:
            "Employee not found.",
        });
      }


      /*
       * Audit.
       */
      await audit(
        req,

        "update",

        "Employee",

        "Employee updated",

        {
          id:
            employee._id,

          employeeId:
            employee.employeeId,
        }
      );


      return success(
        res,

        employee,

        "Employee updated successfully."
      );

    } catch (error) {

      console.error(
        "Update employee error:",
        error
      );

      return res.status(
        500
      ).json({

        success:
          false,

        message:
          error.message ||
          "Failed to update employee.",

        error:
          error.message,
      });
    }
  },


  /* ---------------------------------------------------------
     DELETE EMPLOYEE
  --------------------------------------------------------- */

  remove: async (req, res) => {
    try {

      const employee =
        await Employee.findByIdAndDelete(
          req.params.id
        );


      if (!employee) {

        return res.status(
          404
        ).json({

          success:
            false,

          message:
            "Employee not found.",
        });
      }


      /*
       * Audit.
       */
      await audit(
        req,

        "delete",

        "Employee",

        "Employee deleted",

        {
          id:
            employee._id,

          employeeId:
            employee.employeeId,
        }
      );


      return success(
        res,

        null,

        "Employee deleted successfully."
      );

    } catch (error) {

      console.error(
        "Delete employee error:",
        error
      );

      return res.status(
        500
      ).json({

        success:
          false,

        message:
          error.message ||
          "Failed to delete employee.",

        error:
          error.message,
      });
    }
  },
};

export const attendance =
  factory(
    Attendance,
    "employee"
  );

export const leaveTypes =
  factory(LeaveType);

export const notices =
  factory(
    Notice,
    "employee issuedBy"
  );

export const salaryStructures =
  factory(
    SalaryStructure,
    "employee"
  );









  export const updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "applied",
      "screening",
      "interview",
      "selected",
      "rejected",
      "joined",
      "withdrawn",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate status",
      });
    }

    const candidate =
      await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    /*
     * Do not allow manually setting joined unless
     * the employee conversion has actually happened.
     */
    if (
      status === "joined" &&
      !candidate.employee
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Candidate must be converted to an employee before being marked as joined.",
      });
    }

    candidate.status = status;

    await candidate.save();

    const populatedCandidate =
      await Candidate.findById(candidate._id)
        .populate("jobOpening")
        .populate("employee");

    return res.json({
      success: true,
      message:
        "Candidate status updated successfully",
      data: populatedCandidate,
    });
  } catch (error) {
    console.error(
      "Update candidate status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update candidate status",
    });
  }
};



/* =========================================================
   CREATE CANDIDATE
========================================================= */

export async function createCandidate(
  req,
  res
) {
  try {
    const candidate =
      await Candidate.create({
        ...req.body,
        createdBy:
          req.user._id,
      });

    const populatedCandidate =
      await Candidate.findById(
        candidate._id
      ).populate(
        "jobOpening",
        "title"
      );

    await audit(
      req,
      "create",
      "Candidate",
      "Candidate created",
      {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
      }
    );

    /* -----------------------------------------------------
       EMAIL: CANDIDATE CREATED
    ----------------------------------------------------- */

    try {
      await sendHREventEmail({
        event:
          "candidate.created",

        candidate:
          populatedCandidate,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Candidate creation email failed:",
        emailError.message
      );
    }

    return created(
      res,
      populatedCandidate,
      "Candidate created successfully."
    );
  } catch (error) {
    console.error(
      "Create candidate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create candidate.",
    });
  }
}


/* =========================================================
   EMPLOYEE LIST
========================================================= */

export async function listEmployees(
  req,
  res
) {
  try {
    const {
      page,
      limit,
      skip,
    } = pagination(req);

    const filter = {};

    /*
     * Employee can only see own profile.
     */

    if (
      req.user.role ===
      "employee"
    ) {
      if (!req.user.employee) {
        return success(res, {
          items: [],
          pagination:
            paginationMeta(
              page,
              limit,
              0
            ),
        });
      }

      filter._id =
        req.user.employee;
    }

    if (req.query.department) {
      filter.department =
        req.query.department;
    }

    if (
      req.query.employmentStatus
    ) {
      filter.employmentStatus =
        req.query.employmentStatus;
    }

    if (req.query.search) {
      const search =
        req.query.search.trim();

      filter.$or = [
        {
          firstName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          employeeId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [
      items,
      total,
    ] = await Promise.all([
      Employee.find(filter)
        .populate(
          "department designation salaryStructure"
        )
        .populate({
          path: "user",
          select:
            "name email role isActive",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Employee.countDocuments(
        filter
      ),
    ]);

    return success(res, {
      items,
      pagination:
        paginationMeta(
          page,
          limit,
          total
        ),
    });
  } catch (error) {
    console.error(
      "List employees error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch employees.",
      error: error.message,
    });
  }
}

/* =========================================================
   APPLY LEAVE
========================================================= */

export async function applyLeave(
  req,
  res
) {
  try {
    const employeeId =
      req.user.employee ||
      req.body.employee;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message:
          "Employee profile is required.",
      });
    }

    const {
      leaveType,
      startDate,
      endDate,
      days,
      reason,
    } = req.body;

    if (
      !leaveType ||
      !startDate ||
      !endDate ||
      !days
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Leave type, start date, end date and days are required.",
      });
    }

    const item =
      await LeaveApplication.create({
        employee: employeeId,
        leaveType,
        startDate,
        endDate,
        days,
        reason,
      });

    await audit(
      req,
      "create",
      "Leave",
      "Leave application submitted",
      {
        id: item._id,
      }
    );

    /*
     * Populate before sending email.
     */

    const populatedLeave =
      await LeaveApplication.findById(
        item._id
      )
        .populate(
          "employee",
          "firstName middleName lastName email employeeId"
        )
        .populate(
          "leaveType",
          "name annualQuota isPaid"
        );

    /* -----------------------------------------------------
       EMAIL: LEAVE APPLIED
       HR + SUPER ADMIN
    ----------------------------------------------------- */

    try {
      await sendHREventEmail({
        event:
          "leave.applied",

        employee:
          populatedLeave?.employee,

        leave:
          populatedLeave,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Leave submission email failed:",
        emailError.message
      );
    }

    return created(
      res,
      populatedLeave,
      "Leave application submitted."
    );
  } catch (error) {
    console.error(
      "Apply leave error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to submit leave.",
    });
  }
}


/* =========================================================
   REVIEW LEAVE
========================================================= */

export async function reviewLeave(
  req,
  res
) {
  try {
    const {
      status,
      reviewComment,
    } = req.body;

    if (
      ![
        "approved",
        "rejected",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be approved or rejected.",
      });
    }

    const item =
      await LeaveApplication.findByIdAndUpdate(
        req.params.id,
        {
          status,
          reviewedBy:
            req.user._id,
          reviewedAt:
            new Date(),
          reviewComment,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "employee",
          "firstName middleName lastName email employeeId"
        )
        .populate(
          "leaveType",
          "name annualQuota isPaid"
        )
        .populate(
          "reviewedBy",
          "name email"
        );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Leave application not found.",
      });
    }

    await audit(
      req,
      "update",
      "Leave",
      `Leave application ${status}`,
      {
        id: item._id,
        status,
      }
    );

    /* -----------------------------------------------------
       EMAIL: LEAVE APPROVED / REJECTED
    ----------------------------------------------------- */

    try {
      await sendHREventEmail({
        event:
          status === "approved"
            ? "leave.approved"
            : "leave.rejected",

        employee:
          item.employee,

        leave:
          item,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Leave decision email failed:",
        emailError.message
      );
    }

    return success(
      res,
      item,
      `Leave ${status}.`
    );
  } catch (error) {
    console.error(
      "Review leave error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to review leave.",
    });
  }
}


/* =========================================================
   LIST LEAVES
========================================================= */

export async function listLeaves(
  req,
  res
) {
  try {
    const {
      page,
      limit,
      skip,
    } = pagination(req);

    const filter =
      req.user.role ===
      "employee"
        ? {
            employee:
              req.user.employee,
          }
        : {};

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    if (req.query.employee) {
      filter.employee =
        req.query.employee;
    }

    const [
      items,
      total,
    ] = await Promise.all([
      LeaveApplication.find(
        filter
      )
        .populate(
          "employee leaveType reviewedBy"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      LeaveApplication.countDocuments(
        filter
      ),
    ]);

    return success(res, {
      items,
      pagination:
        paginationMeta(
          page,
          limit,
          total
        ),
    });
  } catch (error) {
    console.error(
      "List leaves error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch leaves.",
      error: error.message,
    });
  }
}


/* =========================================================
   CREATE INTERVIEW
========================================================= */

export async function createInterview(
  req,
  res
) {
  try {
    const {
      candidate,
      scheduledAt,
      type,
      locationOrLink,
      interviewer,
      status,
    } = req.body;

    if (
      !candidate ||
      !scheduledAt ||
      !type
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Candidate, scheduled date/time and interview type are required.",
      });
    }

    const interview =
      await Interview.create({
        candidate,
        scheduledAt,
        type,
        locationOrLink,
        interviewer,
        status:
          status ||
          "scheduled",
      });

    const populatedInterview =
      await Interview.findById(
        interview._id
      )
        .populate({
          path: "candidate",
          populate: {
            path: "jobOpening",
            select: "title",
          },
        })
        .populate(
          "interviewer",
          "name email"
        );

    await audit(
      req,
      "create",
      "Interview",
      "Interview scheduled",
      {
        id: interview._id,
        candidate,
      }
    );

    /* -----------------------------------------------------
       EMAIL: INTERVIEW SCHEDULED
       Candidate
    ----------------------------------------------------- */

    try {
      await sendHREventEmail({
        event:
          "interview.scheduled",

        candidate:
          populatedInterview?.candidate,

        interview:
          populatedInterview,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Interview email failed:",
        emailError.message
      );
    }

    return created(
      res,
      populatedInterview,
      "Interview scheduled successfully."
    );
  } catch (error) {
    console.error(
      "Create interview error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to schedule interview.",
    });
  }
}


/* =========================================================
   CREATE ATTENDANCE
========================================================= */

export async function createAttendance(
  req,
  res
) {
  try {
    const {
      employee,
      date,
      status,
      checkIn,
      checkOut,
      lateMinutes,
      notes,
    } = req.body;

    if (
      !employee ||
      !date ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee, date and attendance status are required.",
      });
    }

    const attendanceItem =
      await Attendance.create({
        employee,
        date,
        status,
        checkIn,
        checkOut,
        lateMinutes:
          lateMinutes || 0,
        notes,
        markedBy:
          req.user._id,
      });

    const populatedAttendance =
      await Attendance.findById(
        attendanceItem._id
      ).populate(
        "employee",
        "firstName middleName lastName email employeeId"
      );

    await audit(
      req,
      "create",
      "Attendance",
      "Attendance recorded",
      {
        id:
          attendanceItem._id,
        employee,
      }
    );

    /*
     * Email only for important attendance events.
     */

    try {
      let event =
        "attendance.marked";

      if (
        String(
          populatedAttendance?.status
        ).toLowerCase() ===
        "absent"
      ) {
        event =
          "attendance.absent";
      } else if (
        Number(
          populatedAttendance
            ?.lateMinutes || 0
        ) > 0
      ) {
        event =
          "attendance.late";
      }

      await sendHREventEmail({
        event,

        employee:
          populatedAttendance?.employee,

        attendance:
          populatedAttendance,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Attendance email failed:",
        emailError.message
      );
    }

    return created(
      res,
      populatedAttendance,
      "Attendance recorded."
    );
  } catch (error) {
    console.error(
      "Create attendance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to record attendance.",
    });
  }
}


/* =========================================================
   CREATE NOTICE
========================================================= */

export async function createNotice(req, res) {
  try {
    const {
      employee,
      type,
      subject,
      body,

      // Frontend-compatible fields
      title,
      description,
      department,
      issuedDate,
      effectiveDate,
      expiryDate,
      remarks,
      status,
    } = req.body;

    /*
     * Employee is NOT required.
     *
     * employee = specific employee
     * employee = null => all employees
     */

    if (!type || !String(type).trim()) {
      return res.status(400).json({
        success: false,
        message: "Notice type is required.",
      });
    }

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({
        success: false,
        message: "Notice subject is required.",
      });
    }

    /*
     * Accept both:
     *
     * body
     * content
     *
     * This keeps compatibility with your existing frontend.
     */
    const noticeBody =
      body ||
      req.body.content ||
      "";

    if (!String(noticeBody).trim()) {
      return res.status(400).json({
        success: false,
        message: "Notice body is required.",
      });
    }

    /*
     * Create notice
     *
     * employee = null means company-wide notice.
     */
    const notice = await Notice.create({
      employee: employee || null,

      type: String(type).trim(),

      subject: String(subject).trim(),

      body: String(noticeBody).trim(),

      /*
       * Optional fields.
       * These are included only if your Notice schema supports them.
       */
      title:
        title?.trim() ||
        subject.trim(),

      description:
        description?.trim() ||
        "",

      department:
        department ||
        null,

      issuedDate:
        issuedDate ||
        new Date(),

      effectiveDate:
        effectiveDate ||
        null,

      expiryDate:
        expiryDate ||
        null,

      remarks:
        remarks?.trim() ||
        "",

      status:
        status ||
        "draft",

      issuedBy: req.user._id,
    });

    /*
     * Populate notice
     */
    const populatedNotice =
      await Notice.findById(notice._id)
        .populate(
          "employee",
          "firstName middleName lastName email employeeId"
        )
        .populate(
          "issuedBy",
          "name email"
        );

    /*
     * AUDIT LOG
     */
    await audit(
      req,
      "create",
      "Notice",

      employee
        ? "Employee notice created"
        : "Company-wide notice created",

      {
        id: notice._id,

        employee:
          employee || null,

        type,

        audience:
          employee
            ? "employee"
            : "all_employees",
      }
    );

    /*
     * EMAIL NOTIFICATION
     */
    try {
      /*
       * Specific employee
       */
      if (employee) {
        await sendHREventEmail({
          event: "notice.created",

          employee:
            populatedNotice?.employee,

          notice:
            populatedNotice,

          sentBy:
            req.user._id,
        });
      }

      /*
       * ALL EMPLOYEES
       */
      else {
        const allEmployees =
          await Employee.find({
            email: {
              $exists: true,
              $ne: "",
            },
          })
            .select(
              "firstName middleName lastName email employeeId"
            );

        console.log(
          `📢 Sending notice to ${allEmployees.length} employees`
        );

        for (const employeeItem of allEmployees) {
          try {
            await sendHREventEmail({
              event: "notice.created",

              employee:
                employeeItem,

              notice:
                populatedNotice,

              sentBy:
                req.user._id,
            });
          } catch (employeeEmailError) {
            console.error(
              `Notice email failed for ${employeeItem.email}:`,
              employeeEmailError.message
            );
          }
        }
      }
    } catch (emailError) {
      /*
       * Email failure should NOT make
       * notice creation fail.
       */
      console.error(
        "Notice email processing failed:",
        emailError.message
      );
    }

    return created(
      res,
      populatedNotice,

      employee
        ? "Notice created successfully."
        : "Company-wide notice created and sent to all employees successfully."
    );
  } catch (error) {
    console.error(
      "Create notice error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create notice.",
    });
  }
}

/* =========================================================
   CREATE PAYROLL
========================================================= */

export async function createPayroll(
  req,
  res
) {
  try {
    const {
      employee,
      month,
      year,
      unpaidDays,
      additions,
      deductions,
    } = req.body;

    if (
      !employee ||
      !month ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee, month and year are required.",
      });
    }

    const calculation =
      await calculatePayroll({
        employeeId:
          employee,

        month,

        year,

        unpaidDays:
          unpaidDays || 0,

        additions:
          additions || 0,

        deductions:
          deductions || 0,
      });

    const item =
      await upsertPayroll(
        calculation
      );

    const populatedPayroll =
      await Payroll.findById(
        item._id
      ).populate(
        "employee",
        "firstName middleName lastName email employeeId"
      );

    await audit(
      req,
      "create",
      "Payroll",
      "Payroll calculated",
      {
        id: item._id,
      }
    );

    /* -----------------------------------------------------
       EMAIL: PAYROLL GENERATED
    ----------------------------------------------------- */

    try {
      await sendHREventEmail({
        event:
          "payroll.created",

        employee:
          populatedPayroll?.employee,

        payroll:
          populatedPayroll,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Payroll creation email failed:",
        emailError.message
      );
    }

    return success(
      res,
      populatedPayroll,
      "Payroll calculated."
    );
  } catch (error) {
    console.error(
      "Create payroll error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to calculate payroll.",
    });
  }
}


/* =========================================================
   LIST PAYROLL
========================================================= */

export async function listPayroll(
  req,
  res
) {
  try {
    const {
      page,
      limit,
      skip,
    } = pagination(req);

    const filter = {};

    if (req.query.month) {
      filter.month =
        Number(
          req.query.month
        );
    }

    if (req.query.year) {
      filter.year =
        Number(
          req.query.year
        );
    }

    if (req.query.employee) {
      filter.employee =
        req.query.employee;
    }

    if (
      req.user.role ===
      "employee"
    ) {
      filter.employee =
        req.user.employee;
    }

    const [
      items,
      total,
    ] = await Promise.all([
      Payroll.find(filter)
        .populate(
          "employee approvedBy"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Payroll.countDocuments(
        filter
      ),
    ]);

    return success(res, {
      items,
      pagination:
        paginationMeta(
          page,
          limit,
          total
        ),
    });
  } catch (error) {
    console.error(
      "List payroll error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch payroll.",
      error: error.message,
    });
  }
}


/* =========================================================
   APPROVE PAYROLL
========================================================= */

export async function approvePayroll(
  req,
  res
) {
  try {
    const item =
      await Payroll.findByIdAndUpdate(
        req.params.id,
        {
          status: "approved",
          approvedBy:
            req.user._id,
          approvedAt:
            new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "employee"
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Payroll not found.",
      });
    }

    await audit(
      req,
      "update",
      "Payroll",
      "Payroll approved",
      {
        id: item._id,
        employee:
          item.employee?._id,
        month: item.month,
        year: item.year,
      }
    );

    /* -----------------------------------------------------
       EMAIL: PAYROLL APPROVED
    ----------------------------------------------------- */

    try {
      await sendHREventEmail({
        event:
          "payroll.approved",

        employee:
          item.employee,

        payroll:
          item,

        sentBy:
          req.user._id,
      });
    } catch (emailError) {
      console.error(
        "Payroll approval email failed:",
        emailError.message
      );
    }

    return success(
      res,
      item,
      "Payroll approved."
    );
  } catch (error) {
    console.error(
      "Approve payroll error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to approve payroll.",
    });
  }
}


/* =========================================================
   DASHBOARD
========================================================= */

/* =========================================================
   HR DASHBOARD
========================================================= */

export async function dashboard(
  req,
  res
) {
  try {
    /*
      Start and end of today.

      Using local server time here keeps the
      dashboard consistent with the server's
      configured timezone.
    */

    const now = new Date();

    const startOfToday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

    const endOfToday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );


    const [
      employeesCount,
      candidatesCount,
      activeJobs,
      pendingLeaves,
      pendingPayroll,
      todayAttendance,
      noticesCount,
      failedEmails,
      unreadNotifications,
    ] = await Promise.all([


      /* =====================================================
         ACTIVE EMPLOYEES
      ===================================================== */

      Employee.countDocuments({
        employmentStatus:
          "active",
      }),


      /* =====================================================
         ALL CANDIDATES
      ===================================================== */

      Candidate.countDocuments({}),


      /* =====================================================
         ACTIVE JOB OPENINGS
      ===================================================== */

      JobOpening.countDocuments({
        status: "active",
      }),


      /* =====================================================
         PENDING LEAVES
      ===================================================== */

      LeaveApplication.countDocuments({
        status: "pending",
      }),


      /* =====================================================
         PENDING PAYROLL
      ===================================================== */

      Payroll.countDocuments({
        status: {
          $in: [
            "draft",
            "pending",
          ],
        },
      }),


      /* =====================================================
         TODAY'S ATTENDANCE
      ===================================================== */

      Attendance.countDocuments({
        date: {
          $gte: startOfToday,
          $lt: endOfToday,
        },
      }),


      /* =====================================================
         NOTICES
      ===================================================== */

      Notice.countDocuments({}),


      /* =====================================================
         FAILED EMAILS
      ===================================================== */

      EmailLog.countDocuments({
        status: "failed",
      }),


      /* =====================================================
         UNREAD NOTIFICATIONS
      ===================================================== */

      Notification.countDocuments({
        user: req.user._id,
        read: false,
      }),

    ]);


    /* =======================================================
       RESPONSE
    ======================================================= */

    return success(
      res,
      {

        employees:
          employeesCount,

        candidates:
          candidatesCount,

        todayAttendance:
          todayAttendance,

        pendingLeaves:
          pendingLeaves,

        pendingPayroll:
          pendingPayroll,

        openJobs:
          activeJobs,

        notices:
          noticesCount,

        failedEmails:
          failedEmails,

        unreadNotifications:
          unreadNotifications,

      }
    );

  } catch (error) {

    console.error(
      "HR Dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load HR dashboard.",

      error:
        error.message,
    });
  }
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

/* =========================================================
   NOTIFICATIONS
========================================================= */

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

export async function notifications(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      type,
      status,
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const filter = {};

    /*
     * EMPLOYEE
     *
     * Notification.user contains Employee._id.
     * req.user.employee is the Employee._id
     * linked to the logged-in employee account.
     */
    if (req.user.role === "employee") {
      if (!req.user.employee) {
        return success(res, {
          items: [],
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: 0,
            pages: 0,
            totalPages: 0,
          },
        });
      }

      filter.user = req.user.employee;
    }

    /*
     * HR / ADMIN / SUPER ADMIN
     *
     * Do not filter by req.user._id.
     * They should see notifications sent to employees.
     */

    if (type) {
      filter.type = type;
    }

    if (status === "read") {
      filter.read = true;
    }

    if (status === "unread") {
      filter.read = false;
    }

    if (search && String(search).trim()) {
      const searchRegex = new RegExp(
        String(search).trim(),
        "i"
      );

      filter.$or = [
        {
          title: searchRegex,
        },
        {
          message: searchRegex,
        },
      ];
    }

    const [items, total] =
      await Promise.all([
        Notification.find(filter)
          .populate({
            path: "user",
            select:
              "firstName middleName lastName email employeeId department designation",
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber),

        Notification.countDocuments(filter),
      ]);

    return success(res, {
      items,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(
          total / limitNumber
        ),
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (error) {
    console.error(
      "Notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch notifications.",
      error: error.message,
    });
  }
}


/* =========================================================
   CREATE NOTIFICATION
========================================================= */

export async function createNotification(
  req,
  res
) {
  try {
    const {
      title,
      message,
      type = "notice",
      recipientType,
      employee,
      actionUrl,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Notification title is required.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Notification message is required.",
      });
    }

    if (!recipientType) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient type is required.",
      });
    }

    /*
     * SPECIFIC EMPLOYEE
     */
    if (recipientType === "employee") {
      if (!employee) {
        return res.status(400).json({
          success: false,
          message:
            "Employee is required.",
        });
      }

      const employeeExists =
        await Employee.findById(employee);

      if (!employeeExists) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found.",
        });
      }

      const notification =
        await Notification.create({
          user: employeeExists._id,
          title: title.trim(),
          message: message.trim(),
          type,
          read: false,
          actionUrl:
            actionUrl?.trim() || undefined,
        });

      return success(
        res,
        notification,
        "Notification sent successfully."
      );
    }

    /*
     * ALL EMPLOYEES
     */
    if (recipientType === "all") {
      const employees =
        await Employee.find({
          status: {
            $nin: [
              "inactive",
              "terminated",
              "resigned",
            ],
          },
        }).select("_id");

      if (!employees.length) {
        return res.status(400).json({
          success: false,
          message:
            "No active employees found.",
        });
      }

      const notificationData =
        employees.map((item) => ({
          user: item._id,
          title: title.trim(),
          message: message.trim(),
          type,
          read: false,
          actionUrl:
            actionUrl?.trim() ||
            undefined,
        }));

      const created =
        await Notification.insertMany(
          notificationData
        );

      return success(
        res,
        {
          count: created.length,
          notifications: created,
        },
        `Notification sent to ${created.length} employees.`
      );
    }

    return res.status(400).json({
      success: false,
      message:
        "Invalid recipient type.",
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create notification.",
    });
  }
}


/* =========================================================
   MARK NOTIFICATION READ
========================================================= */

export async function markNotificationRead(
  req,
  res
) {
  try {
    const filter = {
      _id: req.params.id,
    };

    /*
     * Employees can only update
     * their own notifications.
     *
     * HR/Admin can update any notification.
     */
    if (req.user.role === "employee") {
      filter.user = req.user.employee;
    }

    const item =
      await Notification.findOneAndUpdate(
        filter,
        {
          $set: {
            read: true,
          },
        },
        {
          new: true,
        }
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return success(
      res,
      item,
      "Notification marked as read."
    );
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notification.",
      error: error.message,
    });
  }
}


/* =========================================================
   MARK NOTIFICATION UNREAD
========================================================= */

export async function markNotificationUnread(
  req,
  res
) {
  try {
    const filter = {
      _id: req.params.id,
    };

    if (req.user.role === "employee") {
      filter.user = req.user.employee;
    }

    const item =
      await Notification.findOneAndUpdate(
        filter,
        {
          $set: {
            read: false,
          },
        },
        {
          new: true,
        }
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return success(
      res,
      item,
      "Notification marked as unread."
    );
  } catch (error) {
    console.error(
      "Mark notification unread error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notification.",
      error: error.message,
    });
  }
}


/* =========================================================
   MARK ALL NOTIFICATIONS READ
========================================================= */

export async function markAllNotificationsRead(
  req,
  res
) {
  try {
    const filter = {
      read: false,
    };

    /*
     * Employee:
     * only their own notifications.
     *
     * HR/Admin:
     * all notifications.
     */
    if (req.user.role === "employee") {
      filter.user = req.user.employee;
    }

    const result =
      await Notification.updateMany(
        filter,
        {
          $set: {
            read: true,
          },
        }
      );

    return success(
      res,
      {
        modifiedCount:
          result.modifiedCount,
      },
      "All notifications marked as read."
    );
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to mark all notifications as read.",
      error: error.message,
    });
  }
}


/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export async function deleteNotification(
  req,
  res
) {
  try {
    const filter = {
      _id: req.params.id,
    };

    /*
     * Employee:
     * only delete their own notification.
     *
     * HR/Admin:
     * can delete any notification.
     */
    if (req.user.role === "employee") {
      filter.user = req.user.employee;
    }

    const item =
      await Notification.findOneAndDelete(
        filter
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return success(
      res,
      item,
      "Notification deleted successfully."
    );
  } catch (error) {
    console.error(
      "Delete notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete notification.",
      error: error.message,
    });
  }
}

/* =========================================================
   EMAIL LOGS
========================================================= */

export async function emailLogs(
  req,
  res
) {
  try {
    const {
      page,
      limit,
      skip,
    } = pagination(req);

    const filter = {};

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    if (req.query.category) {
      filter.category =
        req.query.category;
    }

    if (
      req.query.relatedEmployee
    ) {
      filter.relatedEmployee =
        req.query.relatedEmployee;
    }

    if (
      req.query.relatedCandidate
    ) {
      filter.relatedCandidate =
        req.query.relatedCandidate;
    }

    const [
      items,
      total,
    ] = await Promise.all([
      EmailLog.find(filter)
        .populate(
          "sentBy relatedEmployee relatedCandidate"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      EmailLog.countDocuments(
        filter
      ),
    ]);

    return success(res, {
      items,
      pagination:
        paginationMeta(
          page,
          limit,
          total
        ),
    });
  } catch (error) {
    console.error(
      "Email logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch email logs.",
      error: error.message,
    });
  }
}


/* =========================================================
   AUDIT LOGS
========================================================= */

export async function auditLogs(
  req,
  res
) {
  try {
    const {
      page,
      limit,
      skip,
    } = pagination(req);

    const filter = {};

    if (req.query.action) {
      filter.action =
        req.query.action;
    }

    if (req.query.module) {
      filter.module =
        req.query.module;
    }

    if (req.query.user) {
      filter.user =
        req.query.user;
    }

    const [
      items,
      total,
    ] = await Promise.all([
      AuditLog.find(filter)
        .populate("user")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      AuditLog.countDocuments(
        filter
      ),
    ]);

    return success(res, {
      items,
      pagination:
        paginationMeta(
          page,
          limit,
          total
        ),
    });
  } catch (error) {
    console.error(
      "Audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch audit logs.",
      error: error.message,
    });
  }
}


/* =========================================================
   GET USERS
========================================================= */

export const getUsers =
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        role,
        isActive,
      } = req.query;

      const currentPage =
        Math.max(
          Number.parseInt(
            page,
            10
          ) || 1,
          1
        );

      const perPage =
        Math.min(
          Math.max(
            Number.parseInt(
              limit,
              10
            ) || 10,
            1
          ),
          100
        );

      const skip =
        (currentPage - 1) *
        perPage;

      const query = {};

      if (role) {
        query.role = role;
      }

      if (
        isActive !==
        undefined
      ) {
        query.isActive =
          isActive ===
          "true";
      }

      if (search.trim()) {
        const regex =
          new RegExp(
            search
              .trim()
              .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              ),
            "i"
          );

        query.$or = [
          {
            name: regex,
          },
          {
            email: regex,
          },
          {
            phone: regex,
          },
          {
            employeeId:
              regex,
          },
        ];
      }

      const [
        users,
        total,
      ] = await Promise.all([
        User.find(query)
          .select(
            "-password -refreshToken"
          )
          .populate(
            "employee",
            "employeeId name email department designation firstName lastName"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(perPage)
          .lean(),

        User.countDocuments(
          query
        ),
      ]);

      return res.status(200).json({
        success: true,

        data: users,

        pagination: {
          page: currentPage,
          limit: perPage,
          total,

          pages: Math.ceil(
            total / perPage
          ),

          totalPages:
            Math.ceil(
              total / perPage
            ),
        },
      });
    } catch (error) {
      console.error(
        "getUsers error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch users.",
        error: error.message,
      });
    }
  };


/* =========================================================
   UPDATE USER
========================================================= */

export const updateUser =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const {
        name,
        email,
        phone,
        role,
        employee,
        isActive,
        password,
      } = req.body;

      if (
        name !== undefined
      ) {
        user.name =
          name.trim();
      }

      if (
        email !== undefined
      ) {
        user.email =
          email
            .trim()
            .toLowerCase();
      }

      if (
        phone !== undefined
      ) {
        user.phone =
          phone.trim();
      }

      if (
        role !== undefined
      ) {
        user.role = role;
      }

      if (
        employee !==
        undefined
      ) {
        user.employee =
          employee || null;
      }

      if (
        isActive !==
        undefined
      ) {
        user.isActive =
          Boolean(
            isActive
          );
      }

      if (password) {
        user.password =
          password;
      }

      await user.save();

      const result =
        await User.findById(
          user._id
        )
          .select(
            "-password -refreshToken"
          )
          .populate(
            "employee",
            "employeeId name email department designation firstName lastName"
          );

      return res.status(200).json({
        success: true,
        message:
          "User updated successfully.",
        data: result,
      });
    } catch (error) {
      console.error(
        "updateUser error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update user.",
      });
    }
  };


/* =========================================================
   UPDATE USER STATUS
========================================================= */

export const updateUserStatus =
  async (req, res) => {
    try {
      const {
        isActive,
      } = req.body;

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be a boolean.",
        });
      }

      const user =
        await User.findByIdAndUpdate(
          req.params.id,
          {
            isActive,
          },
          {
            new: true,
          }
        )
          .select(
            "-password -refreshToken"
          )
          .populate(
            "employee",
            "employeeId name email department designation firstName lastName"
          );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /*
       * Send account activation/deactivation
       * email.
       */

      try {
        await sendHREventEmail({
          event:
            isActive
              ? "employee.activated"
              : "employee.deactivated",

          employee:
            user.employee,

          user,

          sentBy:
            req.user._id,
        });
      } catch (emailError) {
        console.error(
          "Account status email failed:",
          emailError.message
        );
      }

      return res.status(200).json({
        success: true,

        message: isActive
          ? "User activated successfully."
          : "User deactivated successfully.",

        data: user,
      });
    } catch (error) {
      console.error(
        "updateUserStatus error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update user status.",
        error: error.message,
      });
    }
  };


/* =========================================================
   RESET USER PASSWORD
========================================================= */

export const resetUserPassword =
  async (req, res) => {
    try {
      const {
        password,
      } = req.body;

      if (
        !password ||
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 8 characters.",
        });
      }

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /*
       * IMPORTANT:
       * Do NOT bcrypt.hash() here.
       *
       * User.js pre-save hook hashes
       * the password automatically.
       */

      user.password =
        password;

      await user.save();

      const populatedUser =
        await User.findById(
          user._id
        )
          .select(
            "-password -refreshToken"
          )
          .populate(
            "employee",
            "employeeId name email department designation firstName lastName"
          );

      /* ---------------------------------------------------
         EMAIL: PASSWORD RESET
      --------------------------------------------------- */

      try {
        await sendHREventEmail({
          event:
            "password.reset",

          user:
            populatedUser,

          employee:
            populatedUser?.employee,

          sentBy:
            req.user._id,
        });
      } catch (emailError) {
        console.error(
          "Password reset email failed:",
          emailError.message
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "Password updated successfully.",
      });
    } catch (error) {
      console.error(
        "resetUserPassword error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update password.",
        error: error.message,
      });
    }
  };

  export async function acknowledgeNotice(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notice ID is required.",
      });
    }

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found.",
      });
    }

    /*
     * Employee acknowledgement
     *
     * If this is an employee request, make sure the
     * notice belongs to that employee.
     */
    if (req.user.role === "employee") {
      const employeeId =
        req.user.employee?._id ||
        req.user.employee;

      if (
        notice.employee &&
        employeeId &&
        String(notice.employee) !== String(employeeId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to acknowledge this notice.",
        });
      }
    }

    notice.acknowledged = true;
    notice.acknowledgedAt = new Date();

    /*
     * Don't change a cancelled notice.
     */
    if (notice.status !== "cancelled") {
      notice.status = "acknowledged";
    }

    await notice.save();

    const populatedNotice =
      await Notice.findById(notice._id)
        .populate(
          "employee",
          "firstName middleName lastName email employeeId"
        )
        .populate(
          "issuedBy",
          "name email"
        );

    await audit(
      req,
      "acknowledge",
      "Notice",
      "Notice acknowledged",
      {
        id: notice._id,
        employee:
          notice.employee || null,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Notice acknowledged successfully.",
      data: populatedNotice,
    });
  } catch (error) {
    console.error(
      "Acknowledge notice error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to acknowledge notice.",
    });
  }
}
export async function updatePayroll(req, res) {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    const {
      employee,
      month,
      year,
      unpaidDays,
      additions,
      deductions,
      status,
    } = req.body;

    if (employee !== undefined) payroll.employee = employee;
    if (month !== undefined) payroll.month = month;
    if (year !== undefined) payroll.year = year;
    if (unpaidDays !== undefined) payroll.unpaidDays = unpaidDays;
    if (additions !== undefined) payroll.additions = additions;
    if (deductions !== undefined) payroll.deductions = deductions;
    if (status !== undefined) payroll.status = status;

    await payroll.save();

    const populated = await Payroll.findById(payroll._id)
      .populate("employee");

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update payroll error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update payroll",
    });
  }
}
export async function payPayroll(req, res) {
  try {
    const payroll = await Payroll.findById(
      req.params.id,
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found.",
      });
    }

    if (payroll.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Only approved payroll can be marked as paid.",
      });
    }

    payroll.status = "paid";

    await payroll.save();

    const populatedPayroll =
      await Payroll.findById(payroll._id).populate(
        "employee",
      );

    return res.status(200).json({
      success: true,
      message: "Payroll marked as paid successfully.",
      data: populatedPayroll,
    });
  } catch (error) {
    console.error(
      "Pay payroll error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to mark payroll as paid.",
    });
  }
}


/* =========================================================
   CREATE NOTIFICATION
========================================================= */


/**
 * PATCH /api/v1/hr/employees/:id
 * Update employee
 */
export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updates = { ...req.body };

    // Don't allow MongoDB/internal fields to be overwritten
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error.message,
    });
  }
}
