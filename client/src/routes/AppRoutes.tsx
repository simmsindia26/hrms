import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

// =====================================================
// LAYOUTS
// =====================================================

import HRLayout from "../layouts/HRLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import AttendanceLayout from "../layouts/AttendanceLayout";

// =====================================================
// AUTH
// =====================================================

import Login from "../pages/auth/Login";

// =====================================================
// HR PAGES
// =====================================================

import HRDashboard from "../pages/hr/Dashboard";
import Attendance from "../pages/hr/Attendance";
import Recruitment from "../pages/hr/Recruitment";
import Employees from "../pages/hr/Employees";
import EmployeeDetails from "../pages/hr/EmployeeDetails";
import LeaveManagement from "../pages/hr/LeaveManagement";
import LeaveTypes from "../pages/hr/LeaveTypes";
import Documents from "../pages/hr/Documents";
import Notices from "../pages/hr/Notices";
import Payroll from "../pages/hr/Payroll";
import Mail from "../pages/hr/Mail";
import Notifications from "../pages/hr/Notifications";
import UserManagement from "../pages/hr/UserManagement";
import Departments from "../pages/hr/Departments";
import Designations from "../pages/hr/Designations";
import Organization from "../pages/hr/Organization";
import AuditLogs from "../pages/hr/AuditLogs";
import JobOpeningForm from "../pages/hr/JobOpeningForm";
import AdminEmployeeProfile from "../pages/hr/EmployeeProfile";
import SalaryStructures from "../pages/hr/SalaryStructures";

// =====================================================
// EMPLOYEE PAGES
// =====================================================

import EmployeeDashboard from "../pages/employee/Dashboard";
import EmployeeProfile from "../pages/employee/Profile";
import EmployeeAttendance from "../pages/employee/Attendance";
import EmployeeLeave from "../pages/employee/Leave";
import EmployeeDocuments from "../pages/employee/Documents";
import EmployeePayslips from "../pages/employee/Payslips";
import EmployeeNotices from "../pages/employee/Notices";
import EmployeeNotifications from "../pages/employee/Notifications";
import EmployeeChangePassword from "../pages/employee/ChangePassword";

// =====================================================
// ATTENDANCE SECURITY / TERMINAL
// =====================================================

import AttendanceSecurity from "../pages/attendance/AttendanceSecurity";
import AttendanceTerminal from "../pages/attendance/AttendanceTerminal";

// =====================================================
// APP ROUTES
// =====================================================

const AppRoutes = () => {
  return (
    <Routes>

      {/* =================================================
          PUBLIC ROUTES
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* =================================================
          ROOT
      ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* =================================================
          EMPLOYEE ROUTES
          
          Only employees can access these routes.
      ================================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["employee"]}
          />
        }
      >
        {/* =================================================
            EMPLOYEE LAYOUT
        ================================================= */}

        <Route element={<EmployeeLayout />}>

          {/* =================================================
              EMPLOYEE DASHBOARD
          ================================================= */}

          <Route
            path="/employee/dashboard"
            element={<EmployeeDashboard />}
          />

          {/* =================================================
              EMPLOYEE PROFILE
          ================================================= */}

          <Route
            path="/employee/profile"
            element={<EmployeeProfile />}
          />

          {/* =================================================
              EMPLOYEE ATTENDANCE
          ================================================= */}

          <Route
            path="/employee/attendance"
            element={<EmployeeAttendance />}
          />

          {/* =================================================
              ATTENDANCE SECURITY
              
              Employee can:
              - Set attendance PIN
              - Register face
              - Update face
          ================================================= */}

          <Route
            path="/employee/attendance-security"
            element={<AttendanceSecurity />}
          />

          {/* =================================================
              EMPLOYEE LEAVE
          ================================================= */}

          <Route
            path="/employee/leave"
            element={<EmployeeLeave />}
          />

          {/* =================================================
              EMPLOYEE DOCUMENTS
          ================================================= */}

          <Route
            path="/employee/documents"
            element={<EmployeeDocuments />}
          />

          {/* =================================================
              EMPLOYEE PAYSLIPS
          ================================================= */}

          <Route
            path="/employee/payslips"
            element={<EmployeePayslips />}
          />

          {/* =================================================
              EMPLOYEE NOTICES
          ================================================= */}

          <Route
            path="/employee/notices"
            element={<EmployeeNotices />}
          />

          {/* =================================================
              EMPLOYEE NOTIFICATIONS
          ================================================= */}

          <Route
            path="/employee/notifications"
            element={<EmployeeNotifications />}
          />

          {/* =================================================
              EMPLOYEE CHANGE PASSWORD
          ================================================= */}

          <Route
            path="/employee/change-password"
            element={<EmployeeChangePassword />}
          />

        </Route>
      </Route>

      {/* =================================================
          HR ROUTES
          
          HR and Super Admin can access these routes.
      ================================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "hr",
              "super_admin",
            ]}
          />
        }
      >
        {/* =================================================
            HR LAYOUT
        ================================================= */}

        <Route element={<HRLayout />}>

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            path="/hr/dashboard"
            element={<HRDashboard />}
          />

          {/* =================================================
              ATTENDANCE
          ================================================= */}

          <Route
            path="/hr/attendance"
            element={<Attendance />}
          />

          {/* =================================================
              RECRUITMENT
          ================================================= */}

          <Route
            path="/hr/recruitment"
            element={<Recruitment />}
          />

          {/* =================================================
              CREATE JOB OPENING
          ================================================= */}

          <Route
            path="/hr/recruitment/jobs/new"
            element={<JobOpeningForm />}
          />

          {/* =================================================
              EMPLOYEES
          ================================================= */}

          <Route
            path="/hr/employees"
            element={<Employees />}
          />

          {/* =================================================
              EMPLOYEE DETAILS
          ================================================= */}

          <Route
            path="/hr/employees/:id"
            element={<EmployeeDetails />}
          />

          {/* =================================================
              ADMIN EMPLOYEE PROFILE
          ================================================= */}

          <Route
            path="/hr/employees/:id/profile"
            element={<AdminEmployeeProfile />}
          />

          {/* =================================================
              LEAVE MANAGEMENT
          ================================================= */}

          <Route
            path="/hr/leave"
            element={<LeaveManagement />}
          />

          {/* =================================================
              LEAVE TYPES
          ================================================= */}

          <Route
            path="/hr/leave-types"
            element={<LeaveTypes />}
          />

          {/* =================================================
              DOCUMENTS
          ================================================= */}

          <Route
            path="/hr/documents"
            element={<Documents />}
          />

          {/* =================================================
              NOTICES
          ================================================= */}

          <Route
            path="/hr/notices"
            element={<Notices />}
          />

          {/* =================================================
              PAYROLL
          ================================================= */}

          <Route
            path="/hr/payroll"
            element={<Payroll />}
          />

          {/* =================================================
              MAIL
          ================================================= */}

          <Route
            path="/hr/mail"
            element={<Mail />}
          />

          {/* =================================================
              SALARY STRUCTURES
          ================================================= */}

          <Route
            path="/hr/salary-structures"
            element={<SalaryStructures />}
          />

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <Route
            path="/hr/notifications"
            element={<Notifications />}
          />

          {/* =================================================
              USER MANAGEMENT
          ================================================= */}

          <Route
            path="/hr/users"
            element={<UserManagement />}
          />

          {/* =================================================
              DEPARTMENTS
          ================================================= */}

          <Route
            path="/hr/departments"
            element={<Departments />}
          />

          {/* =================================================
              DESIGNATIONS
          ================================================= */}

          <Route
            path="/hr/designations"
            element={<Designations />}
          />

          {/* =================================================
              ORGANIZATION
          ================================================= */}

          <Route
            path="/hr/organization"
            element={<Organization />}
          />

          {/* =================================================
              AUDIT LOGS
          ================================================= */}

          <Route
            path="/hr/audit-logs"
            element={<AuditLogs />}
          />

        </Route>
      </Route>

      {/* =================================================
          ATTENDANCE TERMINAL
          
          Physical office attendance device.

          Allowed roles:
          - attendance
          - hr
          - hrd
          - super_admin
      ================================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "attendance",
              "hr",
              "super_admin",
            ]}
          />
        }
      >
        <Route element={<AttendanceLayout />}>

          <Route
            path="/admin/attendance-terminal"
            element={<AttendanceTerminal />}
          />

        </Route>
      </Route>

      {/* =================================================
          FALLBACK
          
          Unknown routes go back to login.
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
};

export default AppRoutes;