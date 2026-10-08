import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProgressProvider } from "@/context/ProgressContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import CoursePage from "@/pages/CoursePage";
import VideoPage from "@/pages/VideoPage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import CheckWorkPage from "@/pages/CheckWorkPage";
import LearningRedirectPage from "@/pages/LearningRedirectPage";
import ProfilePage from "@/pages/ProfilePage";

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProgressProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/course"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CoursePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/video/:videoId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <VideoPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LearningRedirectPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AIAssistantPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/check-work"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CheckWorkPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
