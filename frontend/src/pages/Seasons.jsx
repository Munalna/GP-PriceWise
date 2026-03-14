import React, { useEffect, useMemo, useState } from "react";
import {
  fetchSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
} from "../services/seasonService";

export default function Seasons() {
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

 const normalize = (row) => ({
  id: row?.id,
  name: row?.season_name ?? "",
  startDate: row?.start_date ?? "",
  endDate: row?.end_date ?? "",
  active: row?.is_active ?? false,
});

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchSeasons();
      const arr = Array.isArray(data) ? data : [];
      setSeasons(arr.map(normalize));
    } catch (e) {
      setError(e.message || "Failed to load seasons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return new Date(a.startDate || 0) - new Date(b.startDate || 0);
    });
  }, [seasons]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setShowModal(true);
  };

  const onSave = async ({ name, startDate, endDate }) => {
    try {
      if (!editing) {
        const created = await createSeason({ name, startDate, endDate });
        setSeasons((prev) => [...prev, normalize(created)]);
      } else {
        const updated = await updateSeason(editing.id, { name, startDate, endDate });
        setSeasons((prev) => prev.map((x) => (x.id === editing.id ? normalize(updated) : x)));
      }
      setShowModal(false);
      setEditing(null);
    } catch (e) {
      alert(e.message || "Save failed");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this season?")) return;
    try {
      await deleteSeason(id);
      setSeasons((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Seasons</h2>
          <p style={styles.subtitle}>
            Manage seasonal periods (name, dates, status).
          </p>
        </div>

        <button style={styles.primaryBtn} onClick={openCreate} type="button">
          + Create Season
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span style={{ fontWeight: 800 }}>Request failed:</span> {error}
          <button style={styles.retryBtn} onClick={load} type="button">
            Retry
          </button>
        </div>
      )}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span>Loading seasons...</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Season Name</th>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedSeasons.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyCell}>
                      No seasons yet. Click <b>Create Season</b>.
                    </td>
                  </tr>
                ) : (
                  sortedSeasons.map((s) => (
                    <tr key={s.id} style={styles.tr}>
                      <td style={styles.tdName}>{s.name || "-"}</td>
                      <td style={styles.td}>{s.startDate || "-"}</td>
                      <td style={styles.td}>{s.endDate || "-"}</td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <span
                          style={{
                            ...styles.badge,
                            background: s.active ? "#1f9d55" : "#475569",
                          }}
                        >
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actions}>
                          <button style={styles.iconBtn} onClick={() => openEdit(s)} type="button">
                            ✏️
                          </button>
                          <button
                            style={{ ...styles.iconBtn, background: "#ef4444" }}
                            onClick={() => onDelete(s.id)}
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
        <SeasonModal
          initial={editing || { name: "", startDate: "", endDate: "" }}
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

function SeasonModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial.name || "");
  const [startDate, setStartDate] = useState(initial.startDate || "");
  const [endDate, setEndDate] = useState(initial.endDate || "");

  const submit = () => {
    if (!name.trim()) return alert("Season name required");
    if (!startDate) return alert("Start date required");
    if (!endDate) return alert("End date required");
    if (new Date(endDate) < new Date(startDate))
      return alert("End date must be after start date");
    onSave({ name: name.trim(), startDate, endDate });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0 }}>
            {initial?.id ? "Update Season" : "Create Season"}
          </h3>
          <button style={styles.closeBtn} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Season Name</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ramadan Special"
          />
        </div>

        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Start Date</label>
            <input
              style={styles.input}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>End Date</label>
            <input
              style={styles.input}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
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

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    borderRadius: 999,
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    minWidth: 86,
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
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

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