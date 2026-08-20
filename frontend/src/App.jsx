import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useFeatureStore } from './store/featureStore';
import { initTelemetry, trackPageView } from './utils/telemetry';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DailyTracker from './pages/DailyTracker';
import Analytics from './pages/Analytics';
import PhysiqueTracker from './pages/PhysiqueTracker';
import Profile from './pages/Profile';
import Sheets from './pages/Sheets';
import Problems from './pages/Problems';
import Playground from './pages/Playground';
import Discussion from './pages/Discussion';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Leaderboard from './pages/Leaderboard';
import LandingPage from './pages/LandingPage';
import EmailVerified from './pages/EmailVerified';
import ResetPassword from './pages/ResetPassword';
import Roadmap from './pages/Roadmap';
import ProblemArena from './pages/ProblemArena';
import ProblemSetterStudio from './pages/ProblemSetterStudio';
import ProblemSolve from './pages/ProblemSolve';
import ThemeModal from './components/layout/ThemeModal';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Feature Route guard (redirects if section is toggled off and user is not admin)
const FeatureRoute = ({ feature, children }) => {
  const { showProblems, showLeaderboard } = useFeatureStore();
  const { user } = useAuthStore();

  const isEnabled =
    user?.role === 'admin' ||
    (feature === 'problems' && showProblems) ||
    (feature === 'leaderboard' && showLeaderboard);

  if (!isEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route wrapper (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect') || location.state?.from || '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return children;
};

function App() {
  const { currentTheme } = useThemeStore();
  const { fetchFeatures } = useFeatureStore();
  const { checkAuth, token } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initTelemetry();
  }, []);

  useEffect(() => {
    if (location.pathname) {
      trackPageView(location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    fetchFeatures();
    if (token) {
      checkAuth();
    }
  }, []);

  return (
    <>
      <ThemeModal />
      <Routes>
      {/* Fully public — no auth required */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/verify-email/:token" element={<EmailVerified />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      {/* Public Layout Routes (Visible without login) */}
      <Route path="/" element={<Layout />}>
        <Route path="arena" element={<ProblemArena />} />
      </Route>

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="daily-tracker" element={<DailyTracker />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="physique" element={<PhysiqueTracker />} />
        <Route path="profile" element={<Profile />} />
        <Route path="sheets" element={<Sheets />} />
        <Route
          path="problems"
          element={
            <FeatureRoute feature="problems">
              <Problems />
            </FeatureRoute>
          }
        />
        <Route path="playground" element={<Playground />} />
        <Route path="discussion" element={<Discussion />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="studio" element={<ProblemSetterStudio />} />
        <Route path="admin" element={<Admin />} />
        <Route
          path="leaderboard"
          element={
            <FeatureRoute feature="leaderboard">
              <Leaderboard />
            </FeatureRoute>
          }
        />
      </Route>

      {/* Standalone Full-screen Problem Solving Workspace */}
      <Route
        path="/solve/:slug"
        element={
          <ProblemSolve />
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}

export default App;
