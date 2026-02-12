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
              <th>Unit</th>
              <th>Cost per Unit (SAR)</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr><td colSpan="4" className="text-center text-muted py-4">No components added yet.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.unit}</td>
                  <td>{Number(c.cost_per_unit).toFixed(4)}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => { setEditing(c); setShowModal(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setDeleting(c)}
                    >
                      Delete
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
