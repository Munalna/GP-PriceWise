import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

const UNITS = ["SAR per gram", "SAR per ml", "SAR per item"];

const VariableComponentModal = ({ show, onHide, onSave, initialValue }) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [costPerUnit, setCostPerUnit] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setName(initialValue.name || "");
      setUnit(initialValue.unit || UNITS[0]);
      setCostPerUnit(String(initialValue.cost_per_unit ?? ""));
    } else {
      setName("");
      setUnit(UNITS[0]);
      setCostPerUnit("");
    }
    setError("");
  }, [initialValue, show]);

  const handleSubmit = () => {
    setError("");

    if (!name.trim() || costPerUnit === "" || !unit) {
      setError("Please fill in all fields.");
      return;
    }
    const numeric = Number(costPerUnit);
    if (Number.isNaN(numeric) || numeric < 0) {
      setError("Cost per unit must be a valid non-negative number.");
      return;
    }

    onSave({
      name: name.trim(),
      unit,
      cost_per_unit: numeric,
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
          <Form.Label className="fw-semibold">Component Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Milk"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Measurement Unit</Form.Label>
          <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label className="fw-semibold">Cost per Unit (SAR)</Form.Label>
          <Form.Control
            type="number"
            step="0.0001"
            placeholder="e.g., 0.02"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>
          {initialValue ? "Save Changes" : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VariableComponentModal;
