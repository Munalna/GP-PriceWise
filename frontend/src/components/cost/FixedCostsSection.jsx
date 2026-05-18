import React, { useMemo, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import FixedCostModal from "./FixedCostModal";
import ConfirmModal from "./ConfirmModal";

const periodToMonthlyFactor = (period) => {
  if (period === "Monthly") return 1;
  if (period === "Quarterly") return 1 / 3;
  if (period === "Yearly") return 1 / 12;
  return 1;
};

const FixedCostsSection = ({ items, onAdd, onEdit, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const monthlyTotal = useMemo(() => {
    return (items || []).reduce((sum, c) => {
      const amount = Number(c.amount || 0);
      return sum + amount * periodToMonthlyFactor(c.period);
    }, 0);
  }, [items]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.sectionTitle}>Fixed Costs</h3>
          <div style={styles.metaRow}>
            <span>Total monthly:</span>
            <span style={styles.badge}>{monthlyTotal.toFixed(2)} SAR</span>
          </div>
        </div>

        <button
          style={styles.primaryBtn}
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          type="button"
        >
          + Add Fixed Cost
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Period</th>
              <th style={{ ...styles.th, textAlign: "center", width: 150 }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {(items || []).length === 0 ? (
              <tr>
                <td colSpan={4} style={styles.emptyCell}>
                  No fixed costs added yet.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td style={styles.tdName}>{c.name}</td>
                  <td style={styles.td}>{Number(c.amount).toFixed(2)} SAR</td>
                  <td style={styles.td}>{c.period}</td>
                  <td style={{ ...styles.td, textAlign: "center", width: 150 }}>
                    <div style={styles.actions}>
                      <button
                        style={styles.iconBtn}
                        onClick={() => {
                          setEditing(c);
                          setShowModal(true);
                        }}
                        type="button"
                        title="Edit"
                      >
                        <CiEdit size={18} strokeWidth={0.8} />
                      </button>

                      <button
                        style={{ ...styles.iconBtn, background: "#e13421" }}
                        onClick={() => setDeleting(c)}
                        type="button"
                        title="Delete"
                      >
                        <FaRegTrashAlt size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FixedCostModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialValue={editing}
        onSave={async (payload) => {
          if (editing) await onEdit(editing.id, payload);
          else await onAdd(payload);
          setShowModal(false);
        }}
      />

      <ConfirmModal
        show={!!deleting}
        title="Delete Fixed Cost"
        message={`Delete "${deleting?.name}"? This action cannot be undone.`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          await onDelete(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
};

const styles = {
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #eef2f7",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
  },
  metaRow: {
    marginTop: 6,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#6b7280",
    fontSize: 13,
  },
  badge: {
    background: "#ede9fe",
    color: "#382372",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  primaryBtn: {
    background: "#382372",
    border: "none",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    textAlign: "left",
    padding: "12px",
    fontSize: 13,
    color: "#475569",
    fontWeight: 900,
    borderBottom: "1px solid #eef2f7",
  },
  td: {
    padding: "14px 12px",
    fontSize: 14,
    color: "#111827",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },
  tdName: {
    padding: "14px 12px",
    fontSize: 14,
    color: "#111827",
    fontWeight: 800,
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },
  emptyCell: {
    padding: 18,
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  iconBtn: {
    width: 38,
    height: 38,
    minWidth: 38,
    minHeight: 38,
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    borderRadius: 8,
    padding: 0,
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
};

export default FixedCostsSection;