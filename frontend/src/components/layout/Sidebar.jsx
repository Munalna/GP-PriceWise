import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';
import './Layout.css';
import { supabase } from '../../client';
const Sidebar = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/products', icon: 'bi-box-seam', label: 'Products' },
    { path: '/costs', icon: 'bi-currency-dollar', label: 'Cost Management' },
    { path: '/seasons', icon: 'bi-calendar-event', label: 'Seasons' },
    { path: '/pricing-rules', icon: 'bi-gear', label: 'Pricing Rules' },
    { path: '/reports', icon: 'bi-file-earmark-text', label: 'Reports' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('supabase_token');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div className="sidebar-container">
        {/* Header */}
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

        {/* Logout */}
        <div className="p-3 border-top border-light border-opacity-10">
          <Button
            variant="danger"
            className="w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={() => setShowLogoutModal(true)}
          >
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </Button>
        </div>
      </div>

      {/* Logout Modal */}
      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            Confirm Logout
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to logout from <strong>PriceWise</strong>?
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Sidebar;
