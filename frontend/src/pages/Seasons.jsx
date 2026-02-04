import React, { useMemo, useState } from "react";
import { Card, Table, Button, Badge } from "react-bootstrap";

const initialSeasons = [
  {
    id: 1,
    name: "Ramadan Special",
    startDate: "2025-03-01",
    endDate: "2025-03-30",
    status: "Active",
    pricingRules: ["Minimum 30% Margin", "Round to Nearest 5", "Max Price Cap"],
  },
  {
    id: 2,
    name: "Summer Sale",
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    status: "Inactive",
    pricingRules: ["Round to Nearest 5"],
  },
  {
    id: 3,
    name: "Winter Promotion",
    startDate: "2025-12-01",
    endDate: "2026-02-28",
    status: "Inactive",
    pricingRules: [],
  },
];

export default function Seasons() {
  const [seasons, setSeasons] = useState(initialSeasons);

  const sorted = useMemo(() => {
    // Active أول ثم ترتيب بالتاريخ
    return [...seasons].sort((a, b) => {
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (a.status !== "Active" && b.status === "Active") return 1;
      return new Date(a.startDate) - new Date(b.startDate);
    });
  }, [seasons]);

  const handleCreate = () => {
    // مؤقت: بعدين تسوين Modal / صفحة Create
    const next = {
      id: Date.now(),
      name: "New Season",
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      status: "Inactive",
      pricingRules: ["Round to Nearest 5"],
    };
    setSeasons((prev) => [next, ...prev]);
  };

  const handleEdit = (season) => {
    alert(`Edit: ${season.name}`);
  };

  const handleAssignRules = (season) => {
    alert(`Assign pricing rules: ${season.name}`);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this season?")) return;
    setSeasons((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="page-title m-0">Seasons</h2>

        <Button className="btn-primary d-flex align-items-center gap-2" onClick={handleCreate}>
          <span className="fw-bold" style={{ fontSize: 18, lineHeight: 0 }}>+</span>
          Create Season
        </Button>
      </div>

      {/* Card + Table */}
      <Card className="shadow-sm border-0">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <span className="fw-semibold text-muted">Manage seasonal periods</span>
        </Card.Header>

        <Card.Body>
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Season Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th className="text-center">Status</th>
                  <th>Pricing Rules</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.name}</td>
                    <td>{s.startDate}</td>
                    <td>{s.endDate}</td>

                    <td className="text-center">
                      {s.status === "Active" ? (
                        <Badge bg="success" className="px-3 py-2 rounded-2">
                          Active
                        </Badge>
                      ) : (
                        <Badge bg="secondary" className="px-3 py-2 rounded-2">
                          Inactive
                        </Badge>
                      )}
                    </td>

                    <td>
                      {s.pricingRules?.length ? (
                        <div className="pw-chips">
                          {s.pricingRules.map((r, idx) => (
                            <span key={idx} className="pw-chip">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted fst-italic">None</span>
                      )}
                    </td>

                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="pw-action-btn blue"
                          title="Assign Rules"
                          onClick={() => handleAssignRules(s)}
                        >
                          <i className="bi bi-link-45deg"></i>
                        </button>

                        <button
                          className="pw-action-btn orange"
                          title="Edit"
                          onClick={() => handleEdit(s)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          className="pw-action-btn red"
                          title="Delete"
                          onClick={() => handleDelete(s.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                      No seasons yet. Click <b>Create Season</b>.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}