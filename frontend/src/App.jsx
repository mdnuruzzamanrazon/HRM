import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <AuthProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/attendance" element={<AttendanceDashboard />} />
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
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
