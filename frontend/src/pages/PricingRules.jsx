import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChartColumnDecreasing } from "lucide-react";
import { CiLink, CiEdit } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import { RiAlertLine } from "react-icons/ri";
import {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../services/pricingRuleService";

const RULE_TYPE_CONFIG = {
  "profit margin": {
    label: "Profit Margin Rule",
    valueLabel: "Target Profit Margin (%)",
    unit: "%",
    inputType: "select",
    options: [10, 15, 20, 25, 30, 35, 40, 50, 60],
    defaultValue: 30,
    helperText:
      "Sets the target profit margin used when calculating the recommended price.",
  },
  "minimum margin": {
    label: "Minimum Margin Protection",
    valueLabel: "Minimum Allowed Margin (%)",
    unit: "%",
    inputType: "select",
    options: [5, 10, 15, 20, 25, 30, 35, 40, 50],
    defaultValue: 25,
    helperText:
      "Prevents the system from recommending a price below this profit margin.",
  },
  "maximum price": {
    label: "Maximum Price Limit",
    valueLabel: "Maximum Allowed Price (SAR)",
    unit: "SAR",
    inputType: "number",
    defaultValue: "",
    placeholder: "e.g., 25.00",
    helperText:
      "The recommended price will not exceed this amount.",
  },
  rounding: {
    label: "Rounding Rule",
    valueLabel: "Price Ending",
    unit: "",
    inputType: "select",
    options: [0, 0.5, 0.99],
    defaultValue: 0.99,
    helperText:
      "Controls how the final recommended price is rounded, such as ending with .99 or .50.",
  },
};

function getRuleConfig(type) {
  return RULE_TYPE_CONFIG[String(type || "").toLowerCase()] || null;
}

function getRuleLabel(type) {
  return getRuleConfig(type)?.label || type || "-";
}

function getRuleUnit(type) {
  return getRuleConfig(type)?.unit || "";
}

function getDefaultRuleValue(type) {
  return getRuleConfig(type)?.defaultValue ?? "";
}

function formatRoundingOption(value) {
  const numericValue = Number(value);

  if (numericValue === 0) {
    return "0.00 — round to whole SAR";
  }

  if (numericValue === 0.5) {
    return "0.50 — price ends with .50";
  }

  if (numericValue === 0.99) {
    return "0.99 — price ends with .99";
  }

  return Number(value).toFixed(2);
}

function formatOptionValue(option, type) {
  const ruleType = String(type || "").toLowerCase();

  if (ruleType === "rounding") {
    return formatRoundingOption(option);
  }

  if (ruleType === "maximum price") {
    return `${Number(option).toFixed(2)} SAR`;
  }

  return `${option}%`;
}

function formatRuleValue(type, value) {
  if (value === "" || value === null || value === undefined) return "-";

  const ruleType = String(type || "").toLowerCase();
  const numericValue = Number(value);

  if (ruleType === "rounding" && Number.isFinite(numericValue)) {
    return formatRoundingOption(numericValue);
  }

  if (ruleType === "maximum price" && Number.isFinite(numericValue)) {
    return `${numericValue.toFixed(2)} SAR`;
  }

  if (
    (ruleType === "profit margin" || ruleType === "minimum margin") &&
    Number.isFinite(numericValue)
  ) {
    return `${numericValue}%`;
  }

  const unit = getRuleUnit(type);
  return unit ? `${value}${unit}` : value;
}

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!successMsg) return;

    const timer = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["pricingRules"] });

  const {
    data: rules = [],
    isLoading: loading,
    error: fetchError,
  } = useQuery({
    queryKey: ["pricingRules"],
    queryFn: async () => {
      const data = await getPricingRules();
      return Array.isArray(data) ? data.map(normalize) : [];
    },
    staleTime: 1000 * 60 * 60 , // 1 hour
  });

  const error =
    fetchError?.response?.data?.message ||
    fetchError?.response?.data?.error ||
    fetchError?.message ||
    "";

  const sortedRules = useMemo(() => {
    return [...rules].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [rules]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (rule) => {
    setEditing(rule);
    setShowModal(true);
  };

 const onSave = async ({ name, type, value }) => {
  try {
    if (!editing) {
      await createPricingRule({ name, type, value });
      setSuccessMsg(`"${name}" was created successfully.`);
    } else {
      await updatePricingRule(editing.id, { name, type, value });
      setSuccessMsg(`"${name}" was updated successfully.`);
    }

    await invalidate();
    setShowModal(false);
    setEditing(null);
  } catch (e) {
    alert(
      e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Save failed"
    );
  }
};

  const onDelete = async () => {
  if (!deleteTarget) return;

  const ruleName = deleteTarget.name;

  try {
    await deletePricingRule(deleteTarget.id);
    await invalidate();
    setSuccessMsg(`"${ruleName}" was deleted successfully.`);
    setDeleteTarget(null);
  } catch (e) {
    alert(
      e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Delete failed"
    );
  }
};

  return (
  <div style={styles.page}>
    <div style={styles.headerRow}>
      <div>
        <h2 style={styles.title}>Pricing Rules</h2>
        <p style={styles.subtitle}>
          Manage pricing rules that guide recommended price calculations.
        </p>
      </div>

      <button style={styles.primaryBtn} onClick={openCreate} type="button">
        + Create Rule
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
          <span>
            <span style={{ fontWeight: 800 }}>Request failed:</span> {error}
          </span>
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
                  <th style={{ ...styles.th, textAlign: "center" }}>
                    Actions
                  </th>
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
                      <td style={styles.td}>{getRuleLabel(rule.type)}</td>
                      <td style={styles.td}>
                        {formatRuleValue(rule.type, rule.value)}
                      </td>
                      <td style={styles.td}>
                        {rule.createdAt
                          ? new Date(rule.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                     <td style={{ ...styles.td, textAlign: "center", width: 150 }}>
                        <div style={styles.actions}>
                           <button
  style={styles.iconBtn}
  onClick={() => openEdit(rule)}
  type="button"
>
  <CiEdit size={18} strokeWidth={0.8} />
</button>

<button
  style={{ ...styles.iconBtn, background: "#e13421" }}
  onClick={() => setDeleteTarget(rule)}
  type="button"
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
        )}
      </div>

      {deleteTarget && (
  <div style={styles.overlay}>
    <div style={styles.confirmModal}>
      <div style={styles.alertIcon}>
        <RiAlertLine size={38} />
      </div>

      <h3 style={styles.confirmTitle}>Delete pricing rule?</h3>

      <p style={styles.confirmText}>
        This action cannot be undone. Rule "{deleteTarget.name}" will be permanently removed.
      </p>

      <div style={styles.confirmFooter}>
        <button
          style={styles.secondaryBtn}
          onClick={() => setDeleteTarget(null)}
          type="button"
        >
          Cancel
        </button>

        <button
          style={{ ...styles.primaryBtn, background: "#e13421" }}
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

      {showModal && (
        <PricingRuleModal
          initial={editing || { name: "", type: "profit margin", value: 30 }}
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
  const initialType = initial.type || "profit margin";

  const [name, setName] = useState(initial.name || "");
  const [type, setType] = useState(initialType);
  const [value, setValue] = useState(
    initial.value !== "" && initial.value !== null && initial.value !== undefined
      ? initial.value
      : getDefaultRuleValue(initialType)
  );
  const [formError, setFormError] = useState("");
  const config = getRuleConfig(type);

  const handleTypeChange = (newType) => {
    setType(newType);
    setValue(getDefaultRuleValue(newType));
  };

  const submit = () => {
  setFormError("");

  if (!name.trim()) return setFormError("Rule name is required.");
  if (!type.trim()) return setFormError("Rule type is required.");

  if (value === "" || value === null || value === undefined) {
    return setFormError("Rule value is required.");
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return setFormError("Value must be a valid number.");
  }

  if (type === "profit margin" || type === "minimum margin") {
    if (numericValue <= 0 || numericValue >= 100) {
      return setFormError("Margin value must be greater than 0 and less than 100.");
    }
  }

  if (type === "maximum price") {
    if (numericValue <= 0) {
      return setFormError("Maximum price must be greater than 0.");
    }

    if (numericValue > 9999) {
      return setFormError("Maximum price is too high.");
    }

    if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
      return setFormError("Maximum price can have up to two decimal places only.");
    }
  }

  if (type === "rounding") {
    const allowedRoundingValues = [0, 0.5, 0.99];

    if (!allowedRoundingValues.includes(numericValue)) {
      return setFormError("Rounding value must be 0.00, 0.50, or 0.99.");
    }
  }

  onSave({
    name: name.trim(),
    type: type.trim(),
    value: numericValue,
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
          <label style={styles.label}>
  Rule Name <span style={styles.requiredStar}>*</span>
</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ramadan Profit Margin"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
  Rule Type <span style={styles.requiredStar}>*</span>
</label>
          <select
            style={styles.input}
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {Object.entries(RULE_TYPE_CONFIG).map(([ruleValue, ruleConfig]) => (
              <option key={ruleValue} value={ruleValue}>
                {ruleConfig.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
  {config?.valueLabel || "Value"} <span style={styles.requiredStar}>*</span>
</label>

          {config?.inputType === "select" ? (
            <select
              style={styles.input}
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
            >
              {config.options.map((option) => (
                <option key={option} value={String(option)}>
                  {formatOptionValue(option, type)}
                </option>
              ))}
            </select>
          ) : (
            <div style={styles.valueInputWrap}>
              <input
                style={{ ...styles.input, paddingRight: 62, width: "100%" }}
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config?.placeholder || "e.g., 25.00"}
                min="0.01"
                max="9999"
                step="0.01"
              />
              <span style={styles.valueUnit}>{getRuleUnit(type)}</span>
            </div>
          )}

          {config?.helperText && (
            <small style={styles.helperText}>{config.helperText}</small>
          )}
        </div>

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

const styles = {
  page: { padding: 22 },
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
  helperText: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 1.5,
  },
  input: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },

  valueInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  valueUnit: {
    position: "absolute",
    right: 14,
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
    pointerEvents: "none",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
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

  confirmModal: {
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

confirmTitle: {
  margin: "0 0 10px",
  fontSize: 20,
  fontWeight: 900,
  color: "#382372",
},

confirmText: {
  color: "#666",
  fontSize: 14,
  marginBottom: 25,
},

confirmFooter: {
  display: "flex",
  justifyContent: "center",
  gap: 12,
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

requiredStar: {
  color: "#e74c3c",
  fontWeight: "bold",
},

};