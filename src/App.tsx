import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import MainLayout from "./components/layouts/MainLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import UserLayout from "./components/layouts/UserLayout";
import DashboardRedirect from "./components/DashboardRedirect";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import Exams from "./pages/Exams";
import Tests from "./pages/Tests";
import Premium from "./pages/Premium";
import Notifications from "./pages/Notifications";
import About from "./pages/About";
import Contact from "./pages/Contact";

import JobDetails from "./pages/JobDetails";
import ExamDetails from "./pages/ExamDetails";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageJobs from "./pages/admin/ManageJobs";
import ManageExams from "./pages/admin/ManageExams";
import ManageTests from "./pages/admin/ManageTests";
import ManageHome from "./pages/admin/ManageHome";
import ManageNotifications from "./pages/admin/ManageNotifications";
import ManageMenu from "./pages/admin/ManageMenu";
import ManageMegaMenu from "./pages/admin/ManageMegaMenu";

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import AttemptTest from "./pages/user/AttemptTest";

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: "admin" | "user" }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/:id" element={<ExamDetails />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Dashboard Redirect */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/user" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="tests/:id" element={<AttemptTest />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="exams" element={<ManageExams />} />
            <Route path="tests" element={<ManageTests />} />
            <Route path="home" element={<ManageHome />} />
            <Route path="notifications" element={<ManageNotifications />} />
            <Route path="menu" element={<ManageMenu />} />
            <Route path="mega-menu" element={<ManageMegaMenu />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
