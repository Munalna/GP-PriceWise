import React, { useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
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
  const [viewMode, setViewMode] = useState("all");

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

  const invalidateFixed = () =>
    queryClient.invalidateQueries({ queryKey: ["fixedCosts"] });

  const invalidateVars = () =>
    queryClient.invalidateQueries({ queryKey: ["varComponents"] });

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Cost Management</h2>
          <p style={styles.subtitle}>
            Manage fixed costs and variable components used in product pricing.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div style={styles.loadingRow}>
          <Spinner animation="border" size="sm" />
          <span>Loading costs...</span>
        </div>
      ) : (
        <>
  <div style={styles.filterRow}>
    <button
      style={viewMode === "all" ? styles.filterBtnActive : styles.filterBtn}
      onClick={() => setViewMode("all")}
      type="button"
    >
      All
    </button>

    <button
      style={viewMode === "fixed" ? styles.filterBtnActive : styles.filterBtn}
      onClick={() => setViewMode("fixed")}
      type="button"
    >
      Fixed Costs
    </button>

    <button
      style={viewMode === "variable" ? styles.filterBtnActive : styles.filterBtn}
      onClick={() => setViewMode("variable")}
      type="button"
    >
      Variable Components
    </button>
  </div>

  <div style={styles.grid}>
    {(viewMode === "all" || viewMode === "fixed") && (
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
    )}

    {(viewMode === "all" || viewMode === "variable") && (
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
    )}
  </div>
</>
      
      )}
    </div>
  );
};

const styles = {
  page: {
    padding: 22,
    maxWidth: 1200,
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },

  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 900,
    color: "#111827",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },

 grid: {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 20,
  alignItems: "start",
},

  filterRow: {
  display: "flex",
  gap: 10,
  marginBottom: 16,
  flexWrap: "wrap",
},

filterBtn: {
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#382372",
  borderRadius: 999,
  padding: "9px 16px",
  cursor: "pointer",
  fontWeight: 900,
},

filterBtnActive: {
  border: "1px solid #382372",
  background: "#382372",
  color: "#fff",
  borderRadius: 999,
  padding: "9px 16px",
  cursor: "pointer",
  fontWeight: 900,
},

  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#475569",
  },
};

export default Costs;