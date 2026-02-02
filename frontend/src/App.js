import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";

// صفحات مؤقتة
const Dashboard = () => <h2>Dashboard Page - Teammate can work here</h2>;
const Products = () => <h2>Products Page - Teammate can work here</h2>;
const Costs = () => <h2>Costs Page - Teammate can work here</h2>;
const Seasons = () => <h2>Seasons Page - Teammate can work here</h2>;
const PricingRules = () => <h2>Pricing Rules Page - Teammate can work here</h2>;
const Reports = () => <h2>Reports Page - Teammate can work here</h2>;
const Analytics = () => <h2>Analytics Page - Teammate can work here</h2>;

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
        {/* أول صفحة */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ Login برا MainLayout */}
        <Route path="/login" element={<Login setToken={setToken} />} />

        {/* ✅ كل النظام داخل MainLayout ومحمّي */}
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

        {/* أي رابط غلط */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
