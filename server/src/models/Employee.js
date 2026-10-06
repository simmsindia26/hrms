import mongoose from "mongoose";

const Employee = mongoose.model(
  "Employee",
  new mongoose.Schema(
    {
      employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },

      firstName: {
        type: String,
        required: true
      },

      lastName: String,

      email: {
        type: String,
        required: true,
        lowercase: true
      },

      phone: String,

      dateOfBirth: Date,

      gender: String,

      address: String,

      department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
      },

      designation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Designation"
      },

      joiningDate: Date,

      employmentStatus: {
        type: String,
        enum: ["active", "on_notice", "exited"],
        default: "active"
      },

      education: [
        {
          qualification: String,
          institution: String,
          year: Number
        }
      ],

      previousEmployment: [
        {
          company: String,
          designation: String,
          from: Date,
          to: Date
        }
      ],

      identityDocuments: [
        {
          type: String,
          name: String,
          fileUrl: String
        }
      ],

      bankDetails: {
        accountName: String,
        accountNumber: String,
        ifsc: String,
        bankName: String
      },

      salaryStructure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalaryStructure"
      },

      documents: [
        {
          name: String,
          fileUrl: String,
          uploadedAt: Date
        }
      ],

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    {
      timestamps: true
    }
  )
);

export { Employee };