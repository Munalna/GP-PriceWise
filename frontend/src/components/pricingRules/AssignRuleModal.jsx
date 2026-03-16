import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Table } from "react-bootstrap";

const AssignRuleModal = ({
  show,
  onHide,
  rule,
  assignments,
  loading,
  onAdd,
  onDelete,
}) => {
  const [targetType, setTargetType] = useState("season");
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setError("");
      setTargetType("season");
      setTargetId("");
    }
  }, [show]);

  const handleAdd = async () => {
    setError("");

    if (!targetId.trim()) {
      return setError("Target ID is required.");
    }

    await onAdd(targetType, targetId.trim());
    setTargetId("");
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Assign Rule: {rule?.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex gap-2 align-items-end flex-wrap mb-3">
          <Form.Group style={{ minWidth: 200 }}>
            <Form.Label>Target Type</Form.Label>
            <Form.Select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              disabled={loading}
            >
              <option value="season">Season</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
            </Form.Select>
          </Form.Group>

          <Form.Group style={{ minWidth: 260, flex: 1 }}>
            <Form.Label>Target ID</Form.Label>
            <Form.Control
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Paste season/category/product id"
              disabled={loading}
            />
          </Form.Group>

          <Button onClick={handleAdd} disabled={loading}>
            + Assign
          </Button>
        </div>

        <div className="border rounded">
          <Table responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Target Type</th>
                <th>Target ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments?.length ? (
                assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.target_type}</td>
                    <td>{a.target_id}</td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDelete(a.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-3">
                    No assignments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignRuleModal;