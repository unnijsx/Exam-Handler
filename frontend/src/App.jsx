import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';

// Guards
import { ProtectedAdminRoute, ProtectedStudentRoute } from './routes/ProtectedRoute';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Student Pages
import Login from './pages/student/Login';
import MCQExam from './pages/student/MCQExam';
import CodingExam from './pages/student/CodingExam';
import Completed from './pages/student/Completed';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import QuestionBank from './pages/admin/QuestionBank';
import AdminResults from './pages/admin/AdminResults';
import StudentReview from './pages/admin/StudentReview';

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <ExamProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Student Protected Examination Console */}
              <Route
                path="/exam/mcq"
                element={
                  <ProtectedStudentRoute>
                    <StudentLayout>
                      <MCQExam />
                    </StudentLayout>
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/exam/coding"
                element={
                  <ProtectedStudentRoute>
                    <StudentLayout>
                      <CodingExam />
                    </StudentLayout>
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/exam/completed"
                element={
                  <ProtectedStudentRoute>
                    <StudentLayout>
                      <Completed />
                    </StudentLayout>
                  </ProtectedStudentRoute>
                }
              />

              {/* Admin Protected Console */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <StudentManagement />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <QuestionBank />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/results"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminResults />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/review/:id"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <StudentReview />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />

              {/* Global Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ExamProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
