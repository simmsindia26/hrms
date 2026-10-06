import { Employee } from "../models/Employee.js";
import { SalaryStructure } from "../models/SalaryStructure.js";
import { Payroll } from "../models/Payroll.js";

/* =========================================================
   HELPERS
========================================================= */

function num(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
}

/* =========================================================
   ACTIVE SALARY STRUCTURE
========================================================= */

export async function getActiveSalaryStructure(employeeId) {
  const structure = await SalaryStructure.findOne({
    employee: employeeId,
    isActive: true,
  }).sort({
    effectiveFrom: -1,
    createdAt: -1,
  });

  if (!structure) {
    throw new Error(
      "Active salary structure not found.",
    );
  }

  return structure;
}

/* =========================================================
   CALCULATE PAYROLL
========================================================= */

export async function calculatePayroll({
  employeeId,
  month,
  year,

  workingDays = 26,
  paidDays = 26,

  presentDays = 26,
  leaveDays = 0,
  absentDays = 0,
  halfDays = 0,
  lopDays = 0,

  overtimeHours = 0,

  advanceDeduction = 0,
  loanDeduction = 0,
  otherDeductions = 0,

  unpaidDays = 0,
  additions = 0,
  deductions = 0,
}) {
  if (!employeeId) {
    throw new Error("Employee is required.");
  }

  if (!month) {
    throw new Error("Month is required.");
  }

  if (!year) {
    throw new Error("Year is required.");
  }

  /* =======================================================
     EMPLOYEE
  ======================================================= */

  const employee =
    await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("Employee not found.");
  }

  /* =======================================================
     SALARY STRUCTURE
  ======================================================= */

  const structure =
    await getActiveSalaryStructure(employeeId);

  /*
   * Your actual SalaryStructure model:
   *
   * monthlySalary
   * basic
   * hra
   * allowances
   * deductions
   */

  const monthlySalary = num(
    structure.monthlySalary,
  );

  const basic = num(structure.basic);

  const hra = num(structure.hra);

  const allowances = num(
    structure.allowances,
  );

  const structureDeductions = num(
    structure.deductions,
  );

  /* =======================================================
     PAYROLL DAYS
  ======================================================= */

  const payrollBasisDays = Math.max(
    num(workingDays, 26),
    1,
  );

  let payableDays = Math.max(
    num(paidDays, payrollBasisDays),
    0,
  );

  /*
   * If unpaid days are supplied, reduce
   * payable days accordingly.
   */

  const normalizedUnpaidDays = Math.min(
    Math.max(
      num(
        unpaidDays || lopDays,
        0,
      ),
      0,
    ),
    payrollBasisDays,
  );

  if (
    normalizedUnpaidDays > 0 &&
    payableDays >= payrollBasisDays
  ) {
    payableDays =
      payrollBasisDays -
      normalizedUnpaidDays;
  }

  payableDays = Math.min(
    payableDays,
    payrollBasisDays,
  );

  /* =======================================================
     PER DAY SALARY
  ======================================================= */

  const perDaySalary =
    payrollBasisDays > 0
      ? monthlySalary / payrollBasisDays
      : 0;

  /* =======================================================
     ATTENDANCE ADJUSTMENT
  ======================================================= */

  const attendanceRatio =
    payrollBasisDays > 0
      ? payableDays / payrollBasisDays
      : 0;

  const payableMonthlySalary =
    monthlySalary *
    attendanceRatio;

  /* =======================================================
     ADDITIONS
  ======================================================= */

  const normalizedAdditions =
    num(additions);

  /*
   * There is no overtimeRate field in your
   * SalaryStructure schema.
   *
   * Therefore overtime is not automatically
   * converted into money here.
   */

  const overtimeHoursValue =
    Math.max(
      num(overtimeHours),
      0,
    );

  /* =======================================================
     GROSS PAY
  ======================================================= */

  const grossPay =
    payableMonthlySalary +
    normalizedAdditions;

  /* =======================================================
     DEDUCTIONS
  ======================================================= */

  const normalizedAdvance =
    num(advanceDeduction);

  const normalizedLoan =
    num(loanDeduction);

  const normalizedOther =
    num(otherDeductions);

  const legacyDeductions =
    num(deductions);

  const totalDeductions =
    structureDeductions +
    normalizedAdvance +
    normalizedLoan +
    normalizedOther +
    legacyDeductions;

  /* =======================================================
     NET PAY
  ======================================================= */

  const netPay =
    grossPay -
    totalDeductions;

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    employee: employeeId,

    month: num(month),
    year: num(year),

    /*
     * Attendance
     */

    payrollBasisDays,

    payableDays,

    unpaidDays:
      normalizedUnpaidDays,

    presentDays:
      num(presentDays),

    leaveDays:
      num(leaveDays),

    absentDays:
      num(absentDays),

    halfDays:
      num(halfDays),

    /*
     * Salary
     */

    monthlySalary,

    perDaySalary,

    basic,

    hra,

    allowances,

    /*
     * Additions
     */

    additions:
      normalizedAdditions,

    overtimeHours:
      overtimeHoursValue,

    /*
     * Deductions
     */

    deductions:
      totalDeductions,

    /*
     * Final payroll
     */

    grossPay,

    netPay,

    /*
     * Salary structure reference
     */

    salaryStructure:
      structure._id,

    status: "draft",
  };
}

/* =========================================================
   UPSERT PAYROLL
========================================================= */

export async function upsertPayroll(
  calculation,
) {
  if (!calculation?.employee) {
    throw new Error(
      "Employee is required for payroll.",
    );
  }

  if (!calculation?.month) {
    throw new Error(
      "Month is required for payroll.",
    );
  }

  if (!calculation?.year) {
    throw new Error(
      "Year is required for payroll.",
    );
  }

  const filter = {
    employee:
      calculation.employee,

    month:
      Number(calculation.month),

    year:
      Number(calculation.year),
  };

  const update = {
    ...calculation,

    month:
      Number(calculation.month),

    year:
      Number(calculation.year),

    updatedAt: new Date(),
  };

  const item =
    await Payroll.findOneAndUpdate(
      filter,
      {
        $set: update,

        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

  return item;
}