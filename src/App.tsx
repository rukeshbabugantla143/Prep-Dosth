import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ThemeInitializer from "./components/ThemeInitializer";

// Layouts
import MainLayout from "./components/layouts/MainLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import UserLayout from "./components/layouts/UserLayout";
import DashboardRedirect from "./components/DashboardRedirect";
import ScrollToTop from "./components/common/ScrollToTop";

// Lazy Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Exams = lazy(() => import("./pages/Exams"));
const Tests = lazy(() => import("./pages/Tests"));
const Premium = lazy(() => import("./pages/Premium"));
const Notifications = lazy(() => import("./pages/Notifications"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const JobDetails = lazy(() => import("./pages/JobDetails"));
const ExamDetails = lazy(() => import("./pages/ExamDetails"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageJobs = lazy(() => import("./pages/admin/ManageJobs"));
const ManageExams = lazy(() => import("./pages/admin/ManageExams"));
const ManageTests = lazy(() => import("./pages/admin/ManageTests"));
const ManageHome = lazy(() => import("./pages/admin/ManageHome"));
const ManageNotifications = lazy(() => import("./pages/admin/ManageNotifications"));
const ManageMenu = lazy(() => import("./pages/admin/ManageMenu"));
const ManageMegaMenu = lazy(() => import("./pages/admin/ManageMegaMenu"));
const ManageImportantLinks = lazy(() => import("./pages/admin/ManageImportantLinks"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManageCategories = lazy(() => import("./pages/admin/ManageCategories"));
const Settings = lazy(() => import("./pages/admin/Settings"));

// User Pages
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const AttemptTest = lazy(() => import("./pages/user/AttemptTest"));
const Results = lazy(() => import("./pages/user/Results"));
const Profile = lazy(() => import("./pages/user/Profile"));
const TestReview = lazy(() => import("./pages/user/TestReview"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: "admin" | "user" }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  // Admin can access everything
  if (user.role === "admin") return <>{children}</>;
  
  // If a specific role is required and user doesn't have it
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeInitializer />
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:slug" element={<JobDetails />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/:slug" element={<ExamDetails />} />
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
              <Route path="profile" element={<Profile />} />
              <Route path="results" element={<Results />} />
              <Route path="results/:resultId" element={<TestReview />} />
            </Route>
            <Route path="/user/test/:id" element={<ProtectedRoute role="user"><AttemptTest /></ProtectedRoute>} />

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
              <Route path="important-links" element={<ManageImportantLinks />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
