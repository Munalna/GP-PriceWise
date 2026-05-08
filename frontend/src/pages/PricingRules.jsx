import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../services/pricingRuleService";

const normalize = (row) => ({
  id: row?.id,
  name: row?.name ?? "",
  type: row?.type ?? "",
  value: row?.value ?? "",
  createdAt: row?.created_at ?? "",
});

export default function PricingRules() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pricingRules"] });

  const { data: rules = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ["pricingRules"],
    queryFn: async () => {
      const data = await getPricingRules();
      return Array.isArray(data) ? data.map(normalize) : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const error = fetchError?.response?.data?.message || fetchError?.message || "";

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [rules]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (rule) => { setEditing(rule); setShowModal(true); };

  const onSave = async ({ name, type, value }) => {
    try {
      if (!editing) {
        await createPricingRule({ name, type, value });
      } else {
        await updatePricingRule(editing.id, { name, type, value });
      }
      await invalidate();
      setShowModal(false);
      setEditing(null);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Save failed");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this pricing rule?")) return;
    try {
      await deletePricingRule(id);
      await invalidate();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Pricing Rules</h2>
          <p style={styles.subtitle}>
            Manage pricing rules (name, type, value).
          </p>
        </div>

        <button style={styles.primaryBtn} onClick={openCreate} type="button">
          + Create Rule
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span style={{ fontWeight: 800 }}>Request failed:</span> {error}
          <button style={styles.retryBtn} onClick={invalidate} type="button">
            Retry
          </button>
        </div>
      )}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span>Loading pricing rules...</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rule Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Created At</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyCell}>
                      No pricing rules yet. Click <b>Create Rule</b>.
                    </td>
                  </tr>
                ) : (
                  sortedRules.map((rule) => (
                    <tr key={rule.id} style={styles.tr}>
                      <td style={styles.tdName}>{rule.name || "-"}</td>
                      <td style={styles.td}>{rule.type || "-"}</td>
                      <td style={styles.td}>{rule.value ?? "-"}</td>
                      <td style={styles.td}>
                        {rule.createdAt
                          ? new Date(rule.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actions}>
                          <button
                            style={styles.iconBtn}
                            onClick={() => openEdit(rule)}
                            type="button"
                          >
                            ✏️
                          </button>
                          <button
                            style={{ ...styles.iconBtn, background: "#ef4444" }}
                            onClick={() => onDelete(rule.id)}
                            type="button"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <PricingRuleModal
          initial={editing || { name: "", type: "profit margin", value: "" }}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function PricingRuleModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial.name || "");
  const [type, setType] = useState(initial.type || "profit margin");
  const [value, setValue] = useState(initial.value ?? "");

  const submit = () => {
    if (!name.trim()) return alert("Rule name required");
    if (!type.trim()) return alert("Rule type required");
    if (value === "" || value === null) return alert("Value required");
    if (Number(value) < 0) return alert("Value cannot be negative");

    onSave({
      name: name.trim(),
      type: type.trim(),
      value: Number(value),
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0 }}>
            {initial?.id ? "Update Rule" : "Create Rule"}
          </h3>
          <button style={styles.closeBtn} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Rule Name</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ramadan Margin"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Rule Type</label>
          <select
            style={styles.input}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="minimum margin">minimum margin</option>
            <option value="maximum price">maximum price</option>
            <option value="rounding">rounding</option>
            <option value="profit margin">profit margin</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Value</label>
          <input
            style={styles.input}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., 10"
            min="0"
            step="0.01"
          />
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.secondaryBtn} onClick={onClose} type="button">
            Cancel
          </button>
          <button style={styles.primaryBtn} onClick={submit} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 22, maxWidth: 1100 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  title: { margin: 0, fontSize: 34, fontWeight: 900, color: "#111827" },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 14 },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #eef2f7",
  },

  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontSize: 13,
    color: "#475569",
    fontWeight: 900,
    borderBottom: "1px solid #eef2f7",
  },
  tr: { borderBottom: "1px solid #eef2f7" },
  td: {
    padding: "14px 12px",
    fontSize: 14,
    color: "#111827",
    borderBottom: "1px solid #eef2f7",
  },
  tdName: {
    padding: "14px 12px",
    fontSize: 14,
    color: "#111827",
    fontWeight: 800,
    borderBottom: "1px solid #eef2f7",
  },
  emptyCell: {
    padding: 18,
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
  },

  actions: { display: "flex", justifyContent: "center", gap: 10 },
  iconBtn: {
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  primaryBtn: {
    background: "#382372",
    border: "none",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 8px 18px rgba(56,35,114,0.22)",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    background: "#eef2f7",
    border: "none",
    color: "#111827",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 900,
  },

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
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  closeBtn: {
    border: "none",
    background: "#eef2f7",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },

  field: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 },
  label: { fontSize: 13, fontWeight: 900, color: "#374151" },
  input: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 12px",
    fontSize: 14,
    outline: "none",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },

  loadingRow: { display: "flex", alignItems: "center", gap: 10, color: "#475569" },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid #cbd5e1",
    borderTopColor: "#382372",
    animation: "spin 0.8s linear infinite",
  },

  errorBox: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  retryBtn: {
    border: "none",
    background: "#9f1239",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
};