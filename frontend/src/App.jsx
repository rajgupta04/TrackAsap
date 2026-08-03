import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';

// ── Lazy-loaded pages — each becomes its own async JS chunk ─────────────────
// Critical auth pages load first (small, fast)
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// Protected pages — split by route so each loads only when visited
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const DailyTracker = lazy(() => import('./pages/DailyTracker'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const PhysiqueTracker = lazy(() => import('./pages/PhysiqueTracker'));
const Profile      = lazy(() => import('./pages/Profile'));
const Sheets       = lazy(() => import('./pages/Sheets'));
const Problems     = lazy(() => import('./pages/Problems'));
const Playground   = lazy(() => import('./pages/Playground'));
const Discussion   = lazy(() => import('./pages/Discussion'));
const Admin        = lazy(() => import('./pages/Admin'));
const Leaderboard  = lazy(() => import('./pages/Leaderboard'));

// ── Page-level loading skeleton ──────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark-950">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-neon-green" />
      <span className="text-dark-400 text-sm animate-pulse">Loading…</span>
    </div>
  </div>
);

// ── Route guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Fully public — no auth required */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

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
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="daily-tracker" element={<DailyTracker />} />
          <Route path="analytics"     element={<Analytics />} />
          <Route path="physique"      element={<PhysiqueTracker />} />
          <Route path="profile"       element={<Profile />} />
          <Route path="sheets"        element={<Sheets />} />
          <Route path="problems"      element={<Problems />} />
          <Route path="playground"    element={<Playground />} />
          <Route path="discussion"    element={<Discussion />} />
          <Route path="admin"         element={<Admin />} />
          <Route path="leaderboard"   element={<Leaderboard />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
