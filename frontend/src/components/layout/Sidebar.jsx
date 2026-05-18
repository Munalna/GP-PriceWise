import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Layout.css";
import { supabase } from "../../client";

const Sidebar = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("user_id", user.id)
        .single();

      const name = profile?.business_name || user.email?.split("@")[0] || "User";
      setUserName(name);
      setUserInitials(name.charAt(0).toUpperCase());
    };

    getUser();
  }, []);

  const menuItems = [
    { path: "/home", icon: "bi-house-door", label: "Home" },
    { path: "/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
    { path: "/products", icon: "bi-box-seam", label: "Products" },
    { path: "/costs", icon: "bi-currency-dollar", label: "Cost Management" },
    { path: "/seasons", icon: "bi-calendar-event", label: "Seasons" },
    { path: "/pricing-rules", icon: "bi-sliders", label: "Pricing Rules" },
    { path: "/reports", icon: "bi-file-earmark-text", label: "Reports" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("supabase_token");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="sidebar-container">
        <div className="sidebar-header">
          <div
            className="sidebar-logo-row"
            onClick={() => navigate("/home")}
            style={{ cursor: "pointer" }}
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
                isActive ? "sidebar-link active" : "sidebar-link"
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
              <div className="sidebar-user-name">{userName || "User"}</div>
              <div className="sidebar-user-role">Admin</div>
            </div>

            <button
              className="sidebar-logout-btn"
              title="Logout"
              onClick={() => setShowLogoutModal(true)}
              type="button"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div style={modalOverlay}>
          <div style={confirmModal}>
            <div style={alertIcon}>
              <i className="bi bi-box-arrow-right" style={{ fontSize: 34 }}></i>
            </div>

            <h3 style={confirmTitle}>Confirm Logout</h3>

            <p style={confirmText}>
              Are you sure you want to logout from <strong>PriceWise</strong>?
            </p>

            <div style={confirmFooter}>
              <button
                style={secondaryBtn}
                onClick={() => setShowLogoutModal(false)}
                type="button"
              >
                Cancel
              </button>

              <button style={dangerBtn} onClick={handleLogout} type="button">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(17,24,39,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const confirmModal = {
  width: 350,
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  textAlign: "center",
  boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
};

const alertIcon = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: "#fff4e5",
  color: "#f59e0b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px",
};

const confirmTitle = {
  margin: "0 0 10px",
  fontSize: 20,
  fontWeight: 900,
  color: "#382372",
};

const confirmText = {
  color: "#666",
  fontSize: 14,
  marginBottom: 25,
};

const confirmFooter = {
  display: "flex",
  justifyContent: "center",
  gap: 12,
};

const secondaryBtn = {
  background: "#eef2f7",
  border: "none",
  color: "#111827",
  borderRadius: 12,
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 900,
};

const dangerBtn = {
  background: "#e13421",
  border: "none",
  color: "#fff",
  borderRadius: 12,
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 900,
};

export default Sidebar;