import React, { useState } from "react";
import { Container, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const { data: fixedCosts = [], isLoading: loadingFixed } = useQuery({
    queryKey: ["fixedCosts"],
    queryFn: fetchFixedCosts,
    staleTime: 1000 * 60 * 5,
  });

  const { data: components = [], isLoading: loadingVars } = useQuery({
    queryKey: ["varComponents"],
    queryFn: fetchVariableComponents,
    staleTime: 1000 * 60 * 5,
  });

  const loading = loadingFixed || loadingVars;

  const invalidateFixed = () => queryClient.invalidateQueries({ queryKey: ["fixedCosts"] });
  const invalidateVars  = () => queryClient.invalidateQueries({ queryKey: ["varComponents"] });

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
                await createFixedCost(payload);
                await invalidateFixed();
              }}
              onEdit={async (id, payload) => {
                await updateFixedCost(id, payload);
                await invalidateFixed();
              }}
              onDelete={async (id) => {
                await deleteFixedCost(id);
                await invalidateFixed();
              }}
            />
          </Col>

          <Col xs={12} lg={6}>
            <VariableComponentsSection
              items={components}
              onAdd={async (payload) => {
                await createVariableComponent(payload);
                await invalidateVars();
              }}
              onEdit={async (id, payload) => {
                await updateVariableComponent(id, payload);
                await invalidateVars();
              }}
              onDelete={async (id) => {
                await deleteVariableComponent(id);
                await invalidateVars();
              }}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Costs;