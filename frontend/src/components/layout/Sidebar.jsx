import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import './Layout.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/products', icon: 'bi-box-seam', label: 'Products' },
    { path: '/costs', icon: 'bi-currency-dollar', label: 'Cost Management' },
    { path: '/seasons', icon: 'bi-calendar-event', label: 'Seasons' },
    { path: '/pricing-rules', icon: 'bi-gear', label: 'Pricing Rules' },
    { path: '/reports', icon: 'bi-file-earmark-text', label: 'Reports' }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      alert('Logged out!');
    }
  };

  return (
    <div className="sidebar-container">
      {/* Header/Branding */}
      <div className="sidebar-header">
        <h1 className="sidebar-brand">PriceWise</h1>
        <p className="sidebar-tagline">Smart Pricing Management</p>
      </div>
      
      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            <i className={`${item.icon} fs-5`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer with Logout */}
      <div className="p-3 border-top border-light border-opacity-10">
        <Button 
          variant="danger" 
          className="w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;