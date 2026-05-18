import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
  fetchPricingRules,
  assignSeasonRules,
} from "../services/seasonService";
import ConfirmModal from "../components/cost/ConfirmModal";
import { CiLink, CiEdit } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";

const normalize = (row) => ({
  id: row?.id,
  name: row?.season_name ?? "",
  startDate: row?.start_date ?? "",
  endDate: row?.end_date ?? "",
  active: row?.is_active ?? false,
  rules: row?.rules || [],
});

/* ─────────────────────────────────────────────
   Derive status purely from dates — no DB flag
───────────────────────────────────────────── */
function getSeasonStatus(season) {
  if (!season.startDate || !season.endDate) return "upcoming";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(season.startDate);
  const end = new Date(season.endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today > end) return "passed";
  if (today >= start && today <= end) return "active";
  return "upcoming";
}

const STATUS_CONFIG = {
  active: { label: "Active", bg: "#1f9d55" },
  passed: { label: "Passed", bg: "#914d16" },
 passed: { label: "Passed", bg: "#656a74" },
  //passed: { label: "Passed", bg: "#b45309" },
  upcoming: { label: "Upcoming", bg: "#b45309" },
  //upcoming: { label: "Upcoming", bg: "#451991" },
  //upcoming: { label: "Upcoming", bg: "#7c3aed" },
  //upcoming: { label: "Upcoming", bg: "#cdb411" },
  //upcoming: { label: "Upcoming", bg: "#2563eb"},
};

const STATUS_ORDER = { active: 0, upcoming: 1, passed: 2 };

function normalizeRuleType(type) {
  return String(type || "").trim().toLowerCase();
}

function getRuleDisplayName(type) {
  const ruleType = normalizeRuleType(type);

  if (ruleType === "profit margin") return "Profit Margin Rule";
  if (ruleType === "minimum margin") return "Minimum Margin Protection";
  if (ruleType === "maximum price") return "Maximum Price Limit";
  if (ruleType === "rounding") return "Rounding Rule";

  return type || "Pricing Rule";
}

function getRuleDisplayValue(rule) {
  if (
    !rule ||
    rule.value === "" ||
    rule.value === null ||
    rule.value === undefined
  ) {
    return "-";
  }

  const ruleType = normalizeRuleType(rule.type);
  const value = Number(rule.value);

  if (ruleType === "rounding" && Number.isFinite(value)) {
    if (value === 0) return "0.00 — round to whole SAR";
    if (value === 0.5) return "0.50 — price ends with .50";
    if (value === 0.99) return "0.99 — price ends with .99";
    return value.toFixed(2);
  }

  if (ruleType === "maximum price" && Number.isFinite(value)) {
    return `${value.toFixed(2)} SAR`;
  }

  if (
    (ruleType === "profit margin" || ruleType === "minimum margin") &&
    Number.isFinite(value)
  ) {
    return `${value}%`;
  }

  return String(rule.value);
}

function getUniqueIds(ids = []) {
  return [...new Set(ids.filter(Boolean))];
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function Seasons() {
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [tempSelectedRules, setTempSelectedRules] = useState([]);
  const [initialAssignedRuleIds, setInitialAssignedRuleIds] = useState([]);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (!successMsg) return;

    const timer = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["seasons"] });

  const { data: seasons = [], isLoading: loading } = useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const data = await fetchSeasons();
      return Array.isArray(data) ? data.map(normalize) : [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: pricingRules = [] } = useQuery({
    queryKey: ["pricingRules"],
    queryFn: () => fetchPricingRules().then((d) => (Array.isArray(d) ? d : [])),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Sort: Active → Upcoming → Passed, then by start date within each group
  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => {
      const sa = STATUS_ORDER[getSeasonStatus(a)];
      const sb = STATUS_ORDER[getSeasonStatus(b)];

      if (sa !== sb) return sa - sb;

      return new Date(a.startDate || 0) - new Date(b.startDate || 0);
    });
  }, [seasons]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (season) => {
    setEditing(season);
    setShowModal(true);
  };

  const openRulesModal = (season) => {
    const assignedRuleIds = getUniqueIds(
      (season.rules || []).map((rule) => rule.id)
    );

    setSelectedSeason(season);
    setTempSelectedRules(assignedRuleIds);
    setInitialAssignedRuleIds(assignedRuleIds);
    setShowRulesModal(true);
  };

  const closeRulesModal = () => {
    setShowRulesModal(false);
    setSelectedSeason(null);
    setTempSelectedRules([]);
    setInitialAssignedRuleIds([]);
  };

  const saveSeasonRules = async () => {
    if (!selectedSeason) return;

    try {
      const uniqueRuleIds = getUniqueIds(tempSelectedRules);

      await assignSeasonRules(selectedSeason.id, uniqueRuleIds);
      await invalidate();

      closeRulesModal();
      setSuccessMsg("Pricing rules assigned successfully.");
    } catch (e) {
      alert(e.message || "Failed to assign rules");
    }
  };

  const onSave = async ({ name, startDate, endDate }) => {
    try {
      if (!editing) {
        await createSeason({ name, startDate, endDate });
        setSuccessMsg(`"${name}" was created successfully.`);
      } else {
        await updateSeason(editing.id, { name, startDate, endDate });
        setSuccessMsg(`"${name}" was updated successfully.`);
      }

      await invalidate();

      setShowModal(false);
      setEditing(null);
    } catch (e) {
      alert(e.message || "Save failed");
    }
  };

  const onDeleteConfirmed = async () => {
    if (!deleteTarget) return;

    const seasonName = deleteTarget.name;

    try {
      await deleteSeason(deleteTarget.id);
      await invalidate();
      setSuccessMsg(`"${seasonName}" was deleted successfully.`);
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Seasons</h2>
          <p style={styles.subtitle}>
            Manage seasonal periods, pricing rules, dates, and status.
          </p>
        </div>

        <button style={styles.primaryBtn} onClick={openCreate} type="button">
          + Create Season
        </button>
      </div>

      {successMsg && (
        <div style={styles.successBox}>
          <span>✓ {successMsg}</span>
          <button
            style={styles.dismissBtn}
            onClick={() => setSuccessMsg("")}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <span style={{ fontWeight: 800 }}>Request failed:</span> {error}
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
                  <th style={{ ...styles.th, textAlign: "center" }}>
                    Pricing Rules
                  </th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedSeasons.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.emptyCell}>
                      No seasons yet. Click <b>Create Season</b>.
                    </td>
                  </tr>
                ) : (
                  sortedSeasons.map((season) => {
                    const status = getSeasonStatus(season);
                    const { label, bg } = STATUS_CONFIG[status];
                    const isPassed = status === "passed";

                    return (
                      <tr key={season.id} style={styles.tr}>
                        <td style={styles.tdName}>{season.name || "-"}</td>
                        <td style={styles.td}>{season.startDate || "-"}</td>
                        <td style={styles.td}>{season.endDate || "-"}</td>

                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <div style={styles.ruleBadges}>
                            {(season.rules || []).length > 0 ? (
                              season.rules.map((rule) => (
                                <span key={rule.id} style={styles.ruleBadge}>
                                  {rule.name}
                                </span>
                              ))
                            ) : (
                              <span style={styles.noRules}>No rules</span>
                            )}
                          </div>
                        </td>

                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span style={{ ...styles.badge, background: bg }}>
                            {label}
                          </span>
                        </td>

                       <td style={{ ...styles.td, textAlign: "center" }}>
  <div style={styles.actions}>
    {!isPassed && (
      <button
        //style={{ ...styles.iconBtn, background: "#382372" }}
        style={{ ...styles.iconBtn, background: "#1273b4" }}
        onClick={() => openRulesModal(season)}
        type="button"
        title="Assign Rules"
      >
        <CiLink size={18} strokeWidth={0.8} />
      </button>
    )}

    <button
      style={styles.iconBtn}
      onClick={() => openEdit(season)}
      type="button"
      title="Edit Season"
    >
      <CiEdit size={18} strokeWidth={0.8} />
    </button>

    <button
      style={{ ...styles.iconBtn, background: "#e13421", }}
      onClick={() => setDeleteTarget(season)}
      type="button"
      title="Delete Season"
    >
      <FaRegTrashAlt size={13} />
    </button>
  </div>
</td>
                      </tr>
                    );
                  })
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

      {showRulesModal && selectedSeason && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>
                Assign Rules to {selectedSeason.name}
              </h3>
              <button style={styles.closeBtn} onClick={closeRulesModal} type="button">
                ✕
              </button>
            </div>

            <div style={styles.rulesList}>
              {pricingRules.length > 0 ? (
                pricingRules.map((rule) => {
                  const isSelected = tempSelectedRules.includes(rule.id);
                  const wasAlreadyAssigned = initialAssignedRuleIds.includes(
                    rule.id
                  );
                  const willBeRemoved = wasAlreadyAssigned && !isSelected;

                  return (
                    <div
                      key={rule.id}
                      style={styles.ruleOption(
                        isSelected,
                        wasAlreadyAssigned,
                        willBeRemoved
                      )}
                      onClick={() => {
                        setTempSelectedRules((prev) => {
                          if (prev.includes(rule.id)) {
                            return prev.filter((id) => id !== rule.id);
                          }

                          return getUniqueIds([...prev, rule.id]);
                        });
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />

                      <div style={styles.ruleOptionContent}>
                        <div style={{ fontWeight: 900 }}>{rule.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {getRuleDisplayName(rule.type)} •{" "}
                          {getRuleDisplayValue(rule)}
                        </div>
                      </div>

                      {wasAlreadyAssigned && isSelected && (
                        <span style={styles.alreadyAssignedBadge}>
                          Already assigned
                        </span>
                      )}

                      {willBeRemoved && (
                        <span style={styles.willRemoveBadge}>Will remove</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#6b7280" }}>No pricing rules found.</p>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.secondaryBtn}
                onClick={closeRulesModal}
                type="button"
              >
                Cancel
              </button>
              <button
                style={styles.primaryBtn}
                onClick={saveSeasonRules}
                type="button"
              >
                Assign Rules
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Season"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={onDeleteConfirmed}
        confirmText="Delete"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Create / Edit Modal
───────────────────────────────────────────── */
function SeasonModal({ initial, onClose, onSave }) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [name, setName] = useState(initial.name || "");
  const [startDate, setStartDate] = useState(initial.startDate || "");
  const [endDate, setEndDate] = useState(initial.endDate || "");
  const [formError, setFormError] = useState("");

  const willBePassed = endDate && endDate < todayStr;

  const submit = () => {
    setFormError("");

    if (!name.trim()) return setFormError("Season name is required.");
    if (!startDate) return setFormError("Start date is required.");
    if (!endDate) return setFormError("End date is required.");
    if (endDate <= startDate) {
      return setFormError("End date must be after the start date.");
    }

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
          <label style={styles.label}>
            Season Name <span style={styles.requiredStar}>*</span>
          </label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ramadan Special"
          />
        </div>

        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>
              Start Date <span style={styles.requiredStar}>*</span>
            </label>
            <input
              style={styles.input}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              End Date <span style={styles.requiredStar}>*</span>
            </label>
            <input
              style={styles.input}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {willBePassed && (
          <div style={styles.passedWarning}>
            ⚠️ The end date is in the past — this season will be saved as{" "}
            <strong>Passed</strong>.
          </div>
        )}

        {formError && <div style={styles.formError}>{formError}</div>}

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

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = {
  page: { padding: 22, maxWidth: 1200 },
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

  ruleBadges: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  ruleBadge: {
    background: "#ede9fe",
    color: "#382372",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  noRules: {
    color: "#9ca3af",
    fontSize: 13,
    fontStyle: "italic",
  },

 actions: {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
},

iconBtn: {
  width: 38,
  height: 38,
  minWidth: 38,
  maxWidth: 38,
  minHeight: 38,
  maxHeight: 38,
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
  lineHeight: 1,
  flex: "0 0 38px",
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

  rulesList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 12,
  },
  ruleOption: (isSelected, wasAlreadyAssigned, willBeRemoved) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    border: isSelected ? "2px solid #382372" : "1px solid #e5e7eb",
    borderRadius: 12,
    cursor: "pointer",
    background: willBeRemoved
      ? "#fff7ed"
      : isSelected
      ? "#f5f3ff"
      : wasAlreadyAssigned
      ? "#f9fafb"
      : "#fff",
  }),
  ruleOptionContent: {
    flex: 1,
    minWidth: 0,
  },
  alreadyAssignedBadge: {
    background: "#ede9fe",
    color: "#382372",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  willRemoveBadge: {
    background: "#ffedd5",
    color: "#9a3412",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
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

  passedWarning: {
    marginTop: 10,
    padding: "10px 14px",
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
  },

  formError: {
    marginTop: 10,
    padding: "10px 14px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    padding: "10px 14px",
    borderRadius: 12,
    marginBottom: 12,
    fontWeight: 600,
    fontSize: 14,
  },
  dismissBtn: {
    border: "none",
    background: "transparent",
    color: "#15803d",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 14,
    padding: "0 4px",
  },

  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#475569",
  },
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

  requiredStar: {
    color: "#e74c3c",
    fontWeight: "bold",
  },
};