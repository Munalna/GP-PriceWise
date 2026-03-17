import React, { useEffect, useState } from "react";
import { Container, Alert, Spinner, Row, Col } from "react-bootstrap";

import FixedCostsSection from "../components/cost/FixedCostsSection";
import VariableComponentsSection from "../components/cost/VariableComponentsSection";

import {
  fetchFixedCosts,
  createFixedCost,
  updateFixedCost,
  deleteFixedCost,
  fetchVariableComponents,
  createVariableComponent,
  updateVariableComponent,
  deleteVariableComponent,
} from "../services/costService";

const Costs = () => {
  const [loading, setLoading] = useState(true);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [components, setComponents] = useState([]);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [fixed, vars] = await Promise.all([
        fetchFixedCosts(),
        fetchVariableComponents(),
      ]);
      setFixedCosts(fixed);
      setComponents(vars);
    } catch (e) {
      setError(e.message || "Failed to load costs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <Container fluid className="p-0">
      <h2 className="page-title mb-4">Cost Management</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Loading...</span>
        </div>
      ) : (
        <Row className="g-4 align-items-start">
          <Col xs={12} lg={6}>
            <FixedCostsSection
              items={fixedCosts}
              onAdd={async (payload) => {
                const created = await createFixedCost(payload);
                setFixedCosts((prev) => [created, ...prev]);
              }}
              onEdit={async (id, payload) => {
                const updated = await updateFixedCost(id, payload);
                setFixedCosts((prev) =>
                  prev.map((x) => (x.id === id ? updated : x))
                );
              }}
              onDelete={async (id) => {
                await deleteFixedCost(id);
                setFixedCosts((prev) => prev.filter((x) => x.id !== id));
              }}
            />
          </Col>

          <Col xs={12} lg={6}>
            <VariableComponentsSection
              items={components}
              onAdd={async (payload) => {
                const created = await createVariableComponent(payload);
                setComponents((prev) => [created, ...prev]);
              }}
              onEdit={async (id, payload) => {
                const updated = await updateVariableComponent(id, payload);
                setComponents((prev) =>
                  prev.map((x) => (x.id === id ? updated : x))
                );
              }}
              onDelete={async (id) => {
                await deleteVariableComponent(id);
                setComponents((prev) => prev.filter((x) => x.id !== id));
              }}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Costs;
