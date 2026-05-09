import React, { useMemo, useState } from "react";
import { Card, Button, Table, Badge } from "react-bootstrap";
import VariableComponentModal from "./VariableComponentModal";
import ConfirmModal from "./ConfirmModal";

const VariableComponentsSection = ({ items, onAdd, onEdit, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const count = useMemo(() => (items || []).length, [items]);

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex align-items-center justify-content-between">
        <div>
          <h5 className="mb-0 fw-bold">Variable Cost Components</h5>
          <small className="text-muted">Total components:</small>{" "}
          <Badge bg="secondary">{count}</Badge>
        </div>

        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          + Add Component
        </Button>
      </Card.Header>

      <Card.Body>
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Total Cost Paid</th>
              <th>Total Quantity</th>
              <th>Unit</th>
              <th>Cost per Unit</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {count === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No components added yet.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{Number(c.total_cost_paid || 0).toFixed(2)} SAR</td>
                  <td>{Number(c.total_quantity || 0).toFixed(2)}</td>
                  <td>{c.unit}</td>
                  <td>
                    {Number(c.cost_per_unit || 0).toFixed(6)} SAR per {c.unit}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="me-2"
                      onClick={() => setDeleting(c)}
                    >
                      Delete
                    </Button>

                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        setEditing(c);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card.Body>

      <VariableComponentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialValue={editing}
        onSave={async (payload) => {
          if (editing) await onEdit(editing.id, payload);
          else await onAdd(payload);

          setShowModal(false);
        }}
      />

      <ConfirmModal
        show={!!deleting}
        title="Delete Variable Component"
        message={`Delete "${deleting?.name}"? This action cannot be undone.`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          await onDelete(deleting.id);
          setDeleting(null);
        }}
      />
    </Card>
  );
};

export default VariableComponentsSection;