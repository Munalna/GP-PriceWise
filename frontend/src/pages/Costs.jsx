import React, { useState, useEffect } from "react";
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

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    if (!successMsg) return;

    const timer = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  useEffect(() => {
    if (!errorMsg) return;

    const timer = setTimeout(() => setErrorMsg(""), 5000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  useEffect(() => {
    if (!successMsg && !errorMsg) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [successMsg, errorMsg]);

  const {
    data: fixedCosts = [],
    isLoading: loadingFixed,
    error: fixedCostsError,
  } = useQuery({
    queryKey: ["fixedCosts"],
    queryFn: fetchFixedCosts,
    staleTime: 1000 * 60 * 60,
  });

  const {
    data: components = [],
    isLoading: loadingVars,
    error: variableComponentsError,
  } = useQuery({
    queryKey: ["varComponents"],
    queryFn: fetchVariableComponents,
    staleTime: 1000 * 60 * 60,
  });

  const loading = loadingFixed || loadingVars;
  const error =
    fixedCostsError?.message || variableComponentsError?.message || "";

  const invalidateFixed = () =>
    queryClient.invalidateQueries({ queryKey: ["fixedCosts"] });

  const invalidateVars = () =>
    queryClient.invalidateQueries({ queryKey: ["varComponents"] });

  const getErrorMessage = (err, fallback) => {
    return (
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      fallback
    );
  };

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

      {successMsg && (
        <div style={styles.successBox}>
          <span>✓ {successMsg}</span>
          <button
            style={styles.dismissBtn}
            onClick={() => setSuccessMsg("")}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

   {(error || errorMsg) && (
  <div style={styles.errorBox}>
    <span>{errorMsg || error}</span>
    <button
      style={styles.errorCloseBtn}
      onClick={() => setErrorMsg("")}
      type="button"
    >
      ✕
    </button>
  </div>
)}
      {loading ? (
        <div style={styles.loadingRow}>
          <Spinner animation="border" size="sm" />
          <span>Loading costs...</span>
        </div>
      ) : (
        <>
          <div style={styles.filterRow}>
            <button
              style={
                viewMode === "all" ? styles.filterBtnActive : styles.filterBtn
              }
              onClick={() => setViewMode("all")}
              type="button"
            >
              All
            </button>

            <button
              style={
                viewMode === "fixed"
                  ? styles.filterBtnActive
                  : styles.filterBtn
              }
              onClick={() => setViewMode("fixed")}
              type="button"
            >
              Fixed Costs
            </button>

            <button
              style={
                viewMode === "variable"
                  ? styles.filterBtnActive
                  : styles.filterBtn
              }
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
                  try {
                    setErrorMsg("");
                    setSuccessMsg("");

                    await createFixedCost(payload);
                    await invalidateFixed();

                    setSuccessMsg(
                      `"${payload.name}" was created successfully.`
                    );
                  } catch (err) {
                    setSuccessMsg("");
                    setErrorMsg(
                      getErrorMessage(
                        err,
                        "Fixed cost name already exists."
                      )
                    );
                  }
                }}
                onEdit={async (id, payload) => {
                  try {
                    setErrorMsg("");
                    setSuccessMsg("");

                    await updateFixedCost(id, payload);
                    await invalidateFixed();

                    setSuccessMsg(
                      `"${payload.name}" was updated successfully.`
                    );
                  } catch (err) {
                    setSuccessMsg("");
                    setErrorMsg(
                      getErrorMessage(
                        err,
                        "Fixed cost name already exists."
                      )
                    );
                  }
                }}
                onDelete={async (id) => {
                  try {
                    setErrorMsg("");
                    setSuccessMsg("");

                    await deleteFixedCost(id);
                    await invalidateFixed();

                    setSuccessMsg("Fixed cost was deleted successfully.");
                  } catch (err) {
                    setSuccessMsg("");
                    setErrorMsg(
                      getErrorMessage(err, "Failed to delete fixed cost.")
                    );
                  }
                }}
              />
            )}

            {(viewMode === "all" || viewMode === "variable") && (
              <VariableComponentsSection
                items={components}
                onAdd={async (payload) => {
                  try {
                    setErrorMsg("");
                    setSuccessMsg("");

                    await createVariableComponent(payload);
                    await invalidateVars();

                    setSuccessMsg(
                      `"${payload.name}" was created successfully.`
                    );
                  } catch (err) {
                    setSuccessMsg("");
                    setErrorMsg(
                      getErrorMessage(
                        err,
                        "Component name already exists."
                      )
                    );
                  }
                }}
                onEdit={async (id, payload) => {
                  try {
                    setErrorMsg("");
                    setSuccessMsg("");

                    await updateVariableComponent(id, payload);
                    await invalidateVars();

                    setSuccessMsg(
                      `"${payload.name}" was updated successfully.`
                    );
                  } catch (err) {
                    setSuccessMsg("");
                    setErrorMsg(
                      getErrorMessage(
                        err,
                        "Component name already exists."
                      )
                    );
                  }
                }}
                onDelete={async (id) => {
                  try {
                    setErrorMsg("");
                    setSuccessMsg("");

                    await deleteVariableComponent(id);
                    await invalidateVars();

                    setSuccessMsg(
                      "Variable component was deleted successfully."
                    );
                  } catch (err) {
                    setSuccessMsg("");
                    setErrorMsg(
                      getErrorMessage(
                        err,
                        "Failed to delete variable component."
                      )
                    );
                  }
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

  successBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    padding: "10px 14px",
    borderRadius: 12,
    marginBottom: 12,
    fontWeight: 600,
    fontSize: 14,
  },

  errorBox: {
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  color: "#9f1239",
  padding: "12px 14px",
  borderRadius: 12,
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  fontWeight: 700,
},

errorCloseBtn: {
  border: "none",
  background: "transparent",
  color: "#9f1239",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 16,
},

  dismissBtn: {
    border: "none",
    background: "transparent",
    color: "#15803d",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 14,
    padding: "0 4px",
  },
};

export default Costs;