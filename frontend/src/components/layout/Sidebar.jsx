import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import './Layout.css';
import { supabase } from '../../client';

const Sidebar = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userInitials, setUserInitials] = useState('U');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .single();

      const name = profile?.business_name || user.email?.split('@')[0] || 'User';
      setUserName(name);
      setUserInitials(name.charAt(0).toUpperCase());
    };

    getUser();
  }, []);

  const menuItems = [
    { path: '/home',          icon: 'bi-house-door',      label: 'Home' },
    { path: '/dashboard',     icon: 'bi-speedometer2',    label: 'Dashboard' },
    { path: '/products',      icon: 'bi-box-seam',        label: 'Products' },
    { path: '/costs',         icon: 'bi-currency-dollar', label: 'Cost Management' },
    { path: '/seasons',       icon: 'bi-calendar-event',  label: 'Seasons' },
    { path: '/pricing-rules', icon: 'bi-sliders',         label: 'Pricing Rules' },
    { path: '/reports',       icon: 'bi-file-earmark-text', label: 'Reports' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_token');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div className="sidebar-container">
        <div className="sidebar-header">
          <div
            className="sidebar-logo-row"
            onClick={() => navigate('/home')}
            style={{ cursor: 'pointer' }}
          >
            <div className="sidebar-logo-icon">
              <i className="bi bi-layers-fill"></i>
            </div>

            <div>
              <h1 className="sidebar-brand">PriceWise</h1>
              <p className="sidebar-tagline">Smart Pricing</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">{userInitials}</div>

            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName || 'User'}</div>
              <div className="sidebar-user-role">Admin</div>
            </div>

            <button
              className="sidebar-logout-btn"
              title="Logout"
              onClick={() => setShowLogoutModal(true)}
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirm Logout</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to logout from <strong>PriceWise</strong>?
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>

          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Sidebar;