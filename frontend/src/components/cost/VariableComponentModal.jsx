import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";

const RECIPE_UNITS = ["gram", "ml", "item"];

const PURCHASE_UNITS = {
  ml: ["ml", "liter", "gallon"],
  gram: ["gram", "kg"],
  item: ["item"],
};

function convertToRecipeUnit(quantity, purchaseUnit, recipeUnit) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return 0;

  if (recipeUnit === "ml") {
    if (purchaseUnit === "ml") return qty;
    if (purchaseUnit === "liter") return qty * 1000;
    if (purchaseUnit === "gallon") return qty * 3785.41;
  }

  if (recipeUnit === "gram") {
    if (purchaseUnit === "gram") return qty;
    if (purchaseUnit === "kg") return qty * 1000;
  }

  if (recipeUnit === "item") return qty;

  return qty;
}

const VariableComponentModal = ({ show, onHide, onSave, initialValue }) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("gram");
  const [purchaseUnit, setPurchaseUnit] = useState("gram");
  const [totalCostPaid, setTotalCostPaid] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setName(initialValue.name || "");
      setUnit(initialValue.unit || "gram");
      setPurchaseUnit(initialValue.purchase_unit || initialValue.unit || "gram");
      setTotalCostPaid(String(initialValue.total_cost_paid ?? ""));
      setTotalQuantity(
        String(
          initialValue.total_quantity_original ??
            initialValue.total_quantity ??
            ""
        )
      );
    } else {
      setName("");
      setUnit("gram");
      setPurchaseUnit("gram");
      setTotalCostPaid("");
      setTotalQuantity("");
    }

    setError("");
  }, [initialValue, show]);

  useEffect(() => {
    const allowed = PURCHASE_UNITS[unit] || [];
    if (!allowed.includes(purchaseUnit)) {
      setPurchaseUnit(allowed[0]);
    }
  }, [unit, purchaseUnit]);

  if (!show) return null;

  const convertedQuantity = convertToRecipeUnit(
    totalQuantity,
    purchaseUnit,
    unit
  );

  const calculatedCostPerUnit =
    totalCostPaid && convertedQuantity > 0
      ? Number(totalCostPaid) / convertedQuantity
      : 0;

  const handleSubmit = () => {
    setError("");

    if (
      !name.trim() ||
      !unit ||
      !purchaseUnit ||
      totalCostPaid === "" ||
      totalQuantity === ""
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const cost = Number(totalCostPaid);
    const originalQty = Number(totalQuantity);

    if (Number.isNaN(cost) || cost < 0) {
      setError("Total cost must be a valid non-negative number.");
      return;
    }

    if (Number.isNaN(originalQty) || originalQty <= 0) {
      setError("Total quantity must be greater than 0.");
      return;
    }

    if (convertedQuantity <= 0) {
      setError("Converted quantity is invalid.");
      return;
    }

    onSave({
      name: name.trim(),
      unit,
      purchase_unit: purchaseUnit,
      total_cost_paid: cost,
      total_quantity: Number(convertedQuantity.toFixed(4)),
      cost_per_unit: Number((cost / convertedQuantity).toFixed(6)),
      cost: Number((cost / convertedQuantity).toFixed(6)),
});
  };

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <h2 style={modalTitle}>
            {initialValue ? "Edit Variable Component" : "Add Variable Component"}
          </h2>
          <button style={closeBtn} onClick={onHide}>
            ×
          </button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <label style={labelStyle}>
          Component Name <span style={requiredStar}>*</span>
        </label>
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g., Milk"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={labelStyle}>
          Recipe Unit <span style={requiredStar}>*</span>
        </label>
        <select
          style={inputStyle}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          {RECIPE_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <p style={helpText}>
          This is the unit used later in product recipes, like ml milk or gram coffee.
        </p>

        <label style={labelStyle}>
          Total Cost Paid (SAR) <span style={requiredStar}>*</span>
        </label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          placeholder="e.g., 630"
          value={totalCostPaid}
          onChange={(e) => setTotalCostPaid(e.target.value)}
        />

        <label style={labelStyle}>
          Purchased Quantity <span style={requiredStar}>*</span>
        </label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          placeholder="e.g., 30"
          value={totalQuantity}
          onChange={(e) => setTotalQuantity(e.target.value)}
        />

        <label style={labelStyle}>
          Purchase Unit <span style={requiredStar}>*</span>
        </label>
        <select
          style={inputStyle}
          value={purchaseUnit}
          onChange={(e) => setPurchaseUnit(e.target.value)}
        >
          {(PURCHASE_UNITS[unit] || []).map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Calculated Cost Per Unit</label>
        <input
          style={{ ...inputStyle, backgroundColor: "#eef1f6" }}
          disabled
          value={
            calculatedCostPerUnit > 0
              ? `${calculatedCostPerUnit.toFixed(6)} SAR per ${unit}`
              : ""
          }
        />

        <p style={helpText}>
          Converted quantity:{" "}
          {convertedQuantity ? convertedQuantity.toFixed(2) : 0} {unit}
        </p>

        <div style={footerStyle}>
          <button style={cancelBtn} onClick={onHide}>
            Cancel
          </button>
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
  width: "700px",
  maxWidth: "90vw",
  maxHeight: "88vh",
  overflowY: "auto",
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

const helpText = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "-8px",
  marginBottom: "16px",
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
export default VariableComponentModal;