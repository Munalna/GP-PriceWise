import React from "react";
import { RiAlertLine } from "react-icons/ri";

const ConfirmModal = ({
  show,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Delete",
}) => {
  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.alertIcon}>
          <RiAlertLine size={38} />
        </div>

        <h3 style={styles.title}>{title}</h3>

        <p style={styles.message}>{message}</p>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onCancel} type="button">
            Cancel
          </button>

          <button style={styles.deleteBtn} onClick={onConfirm} type="button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },

  modal: {
    width: 350,
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
  },

  alertIcon: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    background: "#fff4e5",
    color: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },

  title: {
    margin: "0 0 10px",
    fontSize: 20,
    fontWeight: 900,
    color: "#382372",
  },

  message: {
    color: "#666",
    fontSize: 14,
    marginBottom: 25,
  },

  footer: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
  },

  cancelBtn: {
    background: "#f0f0f0",
    color: "#666",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
  },

  deleteBtn: {
    background: "#e13421",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
  },
};

export default ConfirmModal;