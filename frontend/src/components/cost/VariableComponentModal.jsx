import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

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

  if (recipeUnit === "item") {
    return qty;
  }

  return qty;
}

const VariableComponentModal = ({ show, onHide, onSave, initialValue }) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("gram"); // recipe unit
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
      setTotalQuantity(String(initialValue.total_quantity_original ?? initialValue.total_quantity ?? ""));
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

  const convertedQuantity = convertToRecipeUnit(totalQuantity, purchaseUnit, unit);

  const calculatedCostPerUnit =
    totalCostPaid && convertedQuantity > 0
      ? Number(totalCostPaid) / convertedQuantity
      : 0;

  const handleSubmit = () => {
    setError("");

    if (!name.trim() || !unit || !purchaseUnit || totalCostPaid === "" || totalQuantity === "") {
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
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">
          {initialValue ? "Edit Variable Component" : "Add Variable Component"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Component Name <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Milk"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Recipe Unit <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {RECIPE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            This is the unit used later in product recipes, like ml milk or gram coffee.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Total Cost Paid (SAR) <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            placeholder="e.g., 630"
            value={totalCostPaid}
            onChange={(e) => setTotalCostPaid(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Purchased Quantity <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            placeholder="e.g., 30"
            value={totalQuantity}
            onChange={(e) => setTotalQuantity(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Purchase Unit <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Select
            value={purchaseUnit}
            onChange={(e) => setPurchaseUnit(e.target.value)}
          >
            {(PURCHASE_UNITS[unit] || []).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label className="fw-semibold">
            Calculated Cost Per Unit
          </Form.Label>
          <Form.Control
            disabled
            value={
              calculatedCostPerUnit > 0
                ? `${calculatedCostPerUnit.toFixed(6)} SAR per ${unit}`
                : ""
            }
          />
          <Form.Text className="text-muted">
            Converted quantity: {convertedQuantity ? convertedQuantity.toFixed(2) : 0} {unit}
          </Form.Text>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          {initialValue ? "Save Changes" : "Save"}
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VariableComponentModal;