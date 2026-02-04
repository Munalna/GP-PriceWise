import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";

// App pages
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Costs from "./pages/Costs";
// لو جاهزة فعّليها
// import Seasons from "./pages/Seasons";
// import PricingRules from "./pages/PricingRules";
// import Reports from "./pages/Reports";
// import Analytics from "./pages/Analytics";

function App() {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("supabase_token");
    return saved ? JSON.parse(saved) : null;
  });

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* ✅ Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ Auth Routes (بدون MainLayout) */}
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ✅ Protected Routes (داخل MainLayout) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Products />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/costs"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Costs />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/*
        <Route
          path="/seasons"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Seasons />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pricing-rules"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PricingRules />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        */}

        {/* ✅ أي رابط غلط */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
