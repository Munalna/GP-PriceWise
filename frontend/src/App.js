import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
// Remove or comment out this import:
 import Products from './pages/Products';

// Placeholder components for all pages
const Dashboard = () => <h2>Dashboard Page - Teammate can work here</h2>;
//const Products = () => <h2>Products Page - Teammate can work here</h2>;  
const Costs = () => <h2>Costs Page - Teammate can work here</h2>;
const Seasons = () => <h2>Seasons Page - Teammate can work here</h2>;
const PricingRules = () => <h2>Pricing Rules Page - Teammate can work here</h2>;
const Reports = () => <h2>Reports Page - Teammate can work here</h2>;
const Analytics = () => <h2>Analytics Page - Teammate can work here</h2>;

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/seasons" element={<Seasons />} />
          <Route path="/pricing-rules" element={<PricingRules />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;