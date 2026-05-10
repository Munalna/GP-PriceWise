import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Products     = lazy(() => import('./pages/Products'));
const Costs        = lazy(() => import('./pages/Costs'));
const Seasons      = lazy(() => import('./pages/Seasons'));
const Reports      = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./components/sales/Analytics'));
const PricingRules = lazy(() => import('./pages/PricingRules'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-purple" role="status"
         style={{ color: '#382372' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/verify-email"   element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          {[
            { path: '/dashboard',     Page: Dashboard },
            { path: '/products',      Page: Products },
            { path: '/costs',         Page: Costs },
            { path: '/seasons',       Page: Seasons },
            { path: '/pricing-rules', Page: PricingRules },
            { path: '/reports',       Page: Reports },
            { path: '/analytics',     Page: Analytics },
          ].map(({ path, Page }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Page />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          ))}

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
