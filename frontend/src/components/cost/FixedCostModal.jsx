import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

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

    onSave({
      name: name.trim(),
      amount: numeric,
      period,
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">
          {initialValue ? "Edit Fixed Cost" : "Add Fixed Cost"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Name <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Monthly Rent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Amount (SAR) <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            placeholder="e.g., 15000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label className="fw-semibold">
            Period <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Form.Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          {initialValue ? "Save Changes" : "Save"}
        </Button>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FixedCostModal;
