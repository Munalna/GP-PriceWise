/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}
function App3() {
  return (
    <div className="container mt-5 text-center">
      <h1 className="text-primary mb-4">PriceWise</h1>

      <button className="btn btn-success btn-lg">
        Bootstrap شغال
      </button>
    </div>
  )
}

export default App3  */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Products from './pages/Products'; // تأكدنا أن الاستيراد شغال

const Dashboard = () => <h2>Dashboard Page</h2>;
const Costs = () => <h2>Costs Page</h2>;
const Seasons = () => <h2>Seasons Page</h2>;
const PricingRules = () => <h2>Pricing Rules Page</h2>;
const Reports = () => <h2>Reports Page</h2>;
const Analytics = () => <h2>Analytics Page</h2>;

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* التوجيه التلقائي للوحة التحكم */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          { }
          <Route path="/products" element={<Products />} />
          
          {/* بقية المسارات */}
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