import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

const TYPE_OPTIONS = [
  { value: "minimum_margin", label: "Minimum Margin (%)" },
  { value: "profit_margin", label: "Profit Margin (%)" },
  { value: "maximum_price", label: "Maximum Price" },
  { value: "rounding", label: "Rounding" },
];

const getValueHint = (type) => {
  switch (type) {
    case "minimum_margin":
    case "profit_margin":
      return "Enter percentage (e.g. 20)";
    case "maximum_price":
      return "Enter max price";
    case "rounding":
      return "Enter rounding step (e.g. 0.5 or 1)";
    default:
      return "";
  }
};

const PricingRuleModal = ({ show, onHide, initial, onSubmit, loading }) => {
  const isEdit = !!initial?.id;

  const [name, setName] = useState("");
  const [type, setType] = useState("minimum_margin");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setError("");
      setName(initial?.name || "");
      setType(initial?.type || "minimum_margin");
      setValue(
        initial?.value !== undefined && initial?.value !== null
          ? String(initial.value)
          : ""
      );
    }
  }, [show, initial]);

  const hint = useMemo(() => getValueHint(type), [type]);

  const handleSave = async () => {
    setError("");

    if (!name.trim()) return setError("Rule name is required.");
    if (!type) return setError("Rule type is required.");
    if (value === "") return setError("Rule value is required.");

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return setError("Value must be a number.");

    if ((type === "minimum_margin" || type === "profit_margin") && numeric < 0) {
      return setError("Percentage cannot be negative.");
    }

    if (type === "rounding" && numeric <= 0) {
      return setError("Rounding step must be greater than 0.");
    }

    await onSubmit({
      name: name.trim(),
      type,
      value: numeric,
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Rule Name</Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Minimum 25% margin"
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Rule Type</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Value</Form.Label>
            <Form.Control
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={hint}
              disabled={loading}
            />
            <Form.Text className="text-muted">{hint}</Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {isEdit ? "Save Changes" : "Create Rule"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PricingRuleModal;