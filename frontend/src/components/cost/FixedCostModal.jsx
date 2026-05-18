import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";

const PERIODS = ["Monthly", "Quarterly", "Yearly"];

const FixedCostModal = ({ show, onHide, onSave, initialValue }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("Monthly");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setName(initialValue.name || "");
      setAmount(String(initialValue.amount ?? ""));
      setPeriod(initialValue.period || "Monthly");
    } else {
      setName("");
      setAmount("");
      setPeriod("Monthly");
    }
    setError("");
  }, [initialValue, show]);

  if (!show) return null;

  const handleSubmit = () => {
    setError("");

    if (!name.trim() || amount === "" || !period) {
      setError("Please fill in all fields.");
      return;
    }

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric < 0) {
      setError("Amount must be a valid non-negative number.");
      return;
    }

    onSave({ name: name.trim(), amount: numeric, period });
  };

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <h2 style={modalTitle}>
            {initialValue ? "Edit Fixed Cost" : "Add Fixed Cost"}
          </h2>
          <button style={closeBtn} onClick={onHide}>×</button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <label style={labelStyle}>Name <span style={requiredStar}>*</span></label>
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g., Monthly Rent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={labelStyle}>Amount (SAR) <span style={requiredStar}>*</span></label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          placeholder="e.g., 15000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label style={labelStyle}>Period <span style={requiredStar}>*</span></label>
        <select
          style={inputStyle}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <div style={footerStyle}>
          <button style={cancelBtn} onClick={onHide}>Cancel</button>
          <button style={saveBtn} onClick={handleSubmit}>
            {initialValue ? "Save Changes" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 24, 39, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalBox = {
  width: "620px",
  maxWidth: "90vw",
  background: "#fff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "22px",
};

const modalTitle = {
  fontSize: "30px",
  fontWeight: "800",
  color: "#111827",
  margin: 0,
};

const closeBtn = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  border: "none",
  background: "#eef1f6",
  fontSize: "28px",
  lineHeight: "1",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  fontSize: "15px",
  fontWeight: "800",
  color: "#374151",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  height: "48px",
  border: "1px solid #dfe3ea",
  borderRadius: "12px",
  padding: "0 14px",
  fontSize: "16px",
  marginBottom: "16px",
  boxSizing: "border-box",
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "14px",
};

const saveBtn = {
  background: "#382372",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 22px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
};

const cancelBtn = {
  background: "#eef1f6",
  color: "#111827",
  border: "none",
  borderRadius: "12px",
  padding: "12px 22px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
};

const requiredStar = {
  color: "#e13421",
  marginLeft: "4px",
};
export default FixedCostModal;