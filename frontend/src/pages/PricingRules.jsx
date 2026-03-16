import React, { useEffect, useMemo, useState } from "react";
import { Container, Alert, Button, Spinner, Table, Badge } from "react-bootstrap";

import PricingRuleModal from "../components/pricingRules/PricingRuleModal";
import AssignRuleModal from "../components/pricingRules/AssignRuleModal";

import {
  fetchPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  fetchRuleAssignments,
  addRuleAssignment,
  deleteRuleAssignment,
} from "../services/pricingRulesService";

const typeLabel = (t) => {
  switch (t) {
    case "minimum_margin":
      return "Minimum Margin";
    case "profit_margin":
      return "Profit Margin";
    case "maximum_price":
      return "Maximum Price";
    case "rounding":
      return "Rounding";
    default:
      return t;
  }
};

const PricingRules = () => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [rules, setRules] = useState([]);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const loadRules = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await fetchPricingRules();
      setRules(data);
    } catch (e) {
      setError(e.message || "Failed to load pricing rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const openAdd = () => {
    setEditingRule(null);
    setShowRuleModal(true);
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  };

  const openAssign = async (rule) => {
    setSelectedRule(rule);
    setShowAssignModal(true);
    setBusy(true);
    setError("");

    try {
      const list = await fetchRuleAssignments(rule.id);
      setAssignments(list);
    } catch (e) {
      setError(e.message || "Failed to load assignments.");
    } finally {
      setBusy(false);
    }
  };

  const totalRules = useMemo(() => rules.length, [rules]);

  return (
    <Container fluid className="p-0">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-1">Pricing Rules</h2>
          <div className="text-muted">
            Total rules: <Badge bg="secondary">{totalRules}</Badge>
          </div>
        </div>

        <Button onClick={openAdd} disabled={loading}>
          + Add Rule
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="border rounded bg-white">
          <Table responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length ? (
                rules.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{typeLabel(r.type)}</td>
                    <td>
                      {r.value}
                      {(r.type === "minimum_margin" || r.type === "profit_margin") ? " %" : ""}
                    </td>
                    <td className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEdit(r)}
                        disabled={busy}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => openAssign(r)}
                        disabled={busy}
                      >
                        Assign
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={busy}
                        onClick={async () => {
                          if (!window.confirm("Delete this rule?")) return;

                          setBusy(true);
                          setError("");

                          try {
                            await deletePricingRule(r.id);
                            setRules((prev) => prev.filter((x) => x.id !== r.id));
                          } catch (e) {
                            setError(e.message || "Failed to delete rule.");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No pricing rules yet. Click Add Rule.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      <PricingRuleModal
        show={showRuleModal}
        onHide={() => setShowRuleModal(false)}
        initial={editingRule}
        loading={busy}
        onSubmit={async (payload) => {
          setBusy(true);
          setError("");

          try {
            if (editingRule?.id) {
              const updated = await updatePricingRule(editingRule.id, payload);
              setRules((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            } else {
              const created = await createPricingRule(payload);
              setRules((prev) => [created, ...prev]);
            }

            setShowRuleModal(false);
          } catch (e) {
            setError(e.message || "Failed to save rule.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <AssignRuleModal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        rule={selectedRule}
        assignments={assignments}
        loading={busy}
        onAdd={async (target_type, target_id) => {
          setBusy(true);
          setError("");

          try {
            const created = await addRuleAssignment(selectedRule.id, target_type, target_id);
            setAssignments((prev) => [created, ...prev]);
          } catch (e) {
            setError(e.message || "Failed to assign rule.");
          } finally {
            setBusy(false);
          }
        }}
        onDelete={async (assignmentId) => {
          if (!window.confirm("Remove this assignment?")) return;

          setBusy(true);
          setError("");

          try {
            await deleteRuleAssignment(assignmentId);
            setAssignments((prev) => prev.filter((x) => x.id !== assignmentId));
          } catch (e) {
            setError(e.message || "Failed to delete assignment.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </Container>
  );
};

export default PricingRules;