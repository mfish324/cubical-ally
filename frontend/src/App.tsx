import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Pages
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Evidence from '@/pages/Evidence';
import Skills from '@/pages/Skills';
import SkillCoaching from '@/pages/SkillCoaching';
import Document from '@/pages/Document';
import Settings from '@/pages/Settings';
import { ConfirmRole, InterpretTitle, RateSkills, SelectTarget, GapResults } from '@/pages/Onboarding';
import { SignUp, Login } from '@/pages/Auth';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, fetchUser } = useAuthStore();

  useEffect(() => {
    // Only fetch user if we think we're authenticated but don't have user data
    const token = localStorage.getItem('access_token');
    if (token && !user) {
      fetchUser();
    }
  }, [fetchUser, user]);

  // Show loading only if we have a token but haven't loaded user yet
  const token = localStorage.getItem('access_token');
  if (token && isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />

      {/* Onboarding flow (public, saves to localStorage) */}
      <Route path="/onboarding/interpret" element={<InterpretTitle />} />
      <Route path="/onboarding/confirm" element={<ConfirmRole />} />
      <Route path="/onboarding/skills" element={<RateSkills />} />
      <Route path="/onboarding/target" element={<SelectTarget />} />
      <Route path="/onboarding/analysis" element={<GapResults />} />

      {/* Auth routes */}
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Main app routes */}
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <Skills />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills/:skillId"
        element={
          <ProtectedRoute>
            <SkillCoaching />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evidence"
        element={
          <ProtectedRoute>
            <Evidence />
          </ProtectedRoute>
        }
      />
      <Route
        path="/document"
        element={
          <ProtectedRoute>
            <Document />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
