import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Public & Auth Pages
import Login from './pages/Login';
import EmployeeLogin from './pages/employee/EmployeeLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';

// HR / Admin Management Pages
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import LeaveDashboard from './pages/leave/LeaveDashboard';
import LeaveApplicationForm from './pages/leave/LeaveApplicationForm';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import ShiftDashboard from './pages/shift/ShiftDashboard';
import ExpenseDashboard from './pages/expense/ExpenseDashboard';
import TaxDashboard from './pages/tax/TaxDashboard';
import TrackingDashboard from './pages/tracking/TrackingDashboard';
import NoticeBoard from './pages/noticeboard/NoticeBoard';
import TaskDashboard from './pages/task/TaskDashboard';
import NotificationsDashboard from './pages/notifications/NotificationsDashboard';
import SecurityDashboard from './pages/security/SecurityDashboard';
import WorkplaceLocations from './pages/locations/WorkplaceLocations';
import RiskRegister from './pages/risk/RiskRegister';
import ComplaintsRegister from './pages/complaints/ComplaintsRegister';
import EventTracker from './pages/events/EventTracker';
import BeneficiaryManagement from './pages/beneficiaries/BeneficiaryManagement';

// Employee Portal Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeLeave from './pages/employee/EmployeeLeave';
import EmployeePayroll from './pages/employee/EmployeePayroll';
import EmployeeExpenses from './pages/employee/EmployeeExpenses';
import EmployeeShifts from './pages/employee/EmployeeShifts';
import EmployeeNotices from './pages/employee/EmployeeNotices';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeTasks from './pages/employee/EmployeeTasks';

import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER'];
  const employeeRoles = ['EMPLOYEE', 'SUPER_ADMIN'];

  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <AuthProvider>
        <Routes>
          {/* Public & Authentication Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

          {/* Dedicated Employee Portal Routes */}
          <Route element={<ProtectedRoute allowedRoles={employeeRoles} fallbackPath="/employee/login" />}>
            <Route element={<EmployeeLayout />}>
              <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/attendance" element={<EmployeeAttendance />} />
              <Route path="/employee/leave" element={<EmployeeLeave />} />
              <Route path="/employee/payroll" element={<EmployeePayroll />} />
              <Route path="/employee/expenses" element={<EmployeeExpenses />} />
              <Route path="/employee/shifts" element={<EmployeeShifts />} />
              <Route path="/employee/notices" element={<EmployeeNotices />} />
              <Route path="/employee/profile" element={<EmployeeProfile />} />
              <Route path="/employee/tasks" element={<EmployeeTasks />} />
            </Route>
          </Route>

          {/* HR / Admin Management Portal Routes */}
          <Route element={<ProtectedRoute allowedRoles={hrRoles} fallbackPath="/login" />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/attendance" element={<AttendanceDashboard />} />
              <Route path="/locations" element={<WorkplaceLocations />} />
              <Route path="/leave" element={<LeaveDashboard />} />
              <Route path="/leave/apply" element={<LeaveApplicationForm />} />
              <Route path="/payroll" element={<PayrollDashboard />} />
              <Route path="/shift" element={<ShiftDashboard />} />
              <Route path="/expense" element={<ExpenseDashboard />} />
              <Route path="/tax" element={<TaxDashboard />} />
              <Route path="/tracking" element={<TrackingDashboard />} />
              <Route path="/noticeboard" element={<NoticeBoard />} />
              <Route path="/task" element={<TaskDashboard />} />
              <Route path="/notifications" element={<NotificationsDashboard />} />
              <Route path="/security" element={<SecurityDashboard />} />
              <Route path="/risk-register" element={<RiskRegister />} />
              <Route path="/complaints-register" element={<ComplaintsRegister />} />
              <Route path="/complaints" element={<ComplaintsRegister />} />
              <Route path="/event-tracker" element={<EventTracker />} />
              <Route path="/events" element={<EventTracker />} />
              <Route path="/beneficiaries" element={<BeneficiaryManagement />} />
              <Route path="/beneficiary-information" element={<BeneficiaryManagement />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
