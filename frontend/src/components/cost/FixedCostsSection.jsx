import React, { useMemo, useState } from "react";
import { Card, Button, Table, Badge } from "react-bootstrap";
import FixedCostModal from "./FixedCostModal";
import ConfirmModal from "./ConfirmModal";

const periodToMonthlyFactor = (period) => {
  if (period === "Monthly") return 1;
  if (period === "Quarterly") return 1 / 3;
  if (period === "Yearly") return 1 / 12;
  return 1;
};

const FixedCostsSection = ({ items, onAdd, onEdit, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const monthlyTotal = useMemo(() => {
    return (items || []).reduce((sum, c) => {
      const amount = Number(c.amount || 0);
      return sum + amount * periodToMonthlyFactor(c.period);
    }, 0);
  }, [items]);

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="d-flex align-items-center justify-content-between">
        <div>
          <h5 className="mb-0 fw-bold">Fixed Costs</h5>
          <small className="text-muted">Total (normalized monthly):</small>{" "}
          <Badge bg="secondary">{monthlyTotal.toFixed(2)} SAR</Badge>
        </div>
        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          + Add Fixed Cost
        </Button>
      </Card.Header>

      <Card.Body>
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Amount (SAR)</th>
              <th>Period</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).length === 0 ? (
              <tr><td colSpan="4" className="text-center text-muted py-4">No fixed costs added yet.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{Number(c.amount).toFixed(2)}</td>
                  <td>{c.period}</td>
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

      <FixedCostModal
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
        title="Delete Fixed Cost"
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

export default FixedCostsSection;
