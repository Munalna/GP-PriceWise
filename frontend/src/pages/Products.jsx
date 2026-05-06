import React, { useState, useEffect, useCallback } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { supabase } from "../client";
import api from "../services/api";
import { getAIPriceRecommendation, checkMarketProduct } from "../services/analyticsService";

const API_URL = "http://localhost:3000/api/products";

function Products() {
  const [categories, setCategories] = useState([]);
  const [varComponents, setVarComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");

  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [aiRecommendedPrices, setAiRecommendedPrices] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [marketCheck, setMarketCheck] = useState(null);
  const [componentSearch, setComponentSearch] = useState("");

  const [newProd, setNewProd] = useState({
    name: "",
    components: [],
    category_id: "",
  });

  const [newCatName, setNewCatName] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tempSelectedRules, setTempSelectedRules] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);

  const calculateAvg = (prices) => {
    if (!prices || !Array.isArray(prices) || prices.length === 0) return "0.00";
    const validPrices = prices.map((p) => Number(p)).filter((p) => !isNaN(p));
    if (validPrices.length === 0) return "0.00";
    const sum = validPrices.reduce((acc, val) => acc + val, 0);
    return (sum / validPrices.length).toFixed(2);
  };

 const handleCheckMarketProduct = async (name) => {
  if (!name || name.trim().length < 2) {
    setMarketCheck(null);
    return;
  }

  try {
    const result = await checkMarketProduct(name);
    setMarketCheck(result);
  } catch (err) {
    console.error("Market check error:", err);
  }
};

const loadPricingRules = useCallback(async () => {
  try {
    const { data } = await api.get("/pricing-rules");
    setPricingRules(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error loading pricing rules:", err);
  }
}, []);


  const loadData = useCallback(async () => {
    if (!userId) return;

    setError("");
    setLoading(true);

    try {
      const authHeader = { "user-id": userId };

      const response = await fetch(API_URL, { headers: authHeader });
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);

      const vcRes = await fetch(`${API_URL}/var-components`, {
        headers: authHeader,
      });
      const vcData = await vcRes.json();
      setVarComponents(Array.isArray(vcData) ? vcData : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const getAuthenticatedUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
      } else {
        setLoading(false);
        setError("No active session found. Please login.");
      }
    };

    getAuthenticatedUser();
  }, []);

  useEffect(() => {
  if (userId) {
    loadData();
    loadPricingRules();
  }
}, [userId, loadData, loadPricingRules]);

  const calculateTotalVcost = (prodComponents) => {
    if (!prodComponents || !Array.isArray(prodComponents)) return 0;

    return prodComponents.reduce((sum, item) => {
      const dbInfo = varComponents.find((c) => c.name === item.name);
      const unitCost = dbInfo ? Number(dbInfo.cost_per_unit) : 0;
      const quantity = Number(item.qty) || 0;
      return sum + unitCost * quantity;
    }, 0);
  };

  const filteredComponents = varComponents.filter((comp) =>
  comp.name.toLowerCase().includes(componentSearch.toLowerCase())
);

  const handleAnalyzePricing = async (productId) => {
  setRiskLoading(true);
  setError("");

  try {
    const result = await getAIPriceRecommendation(productId);

    setRiskResult(result.data);
    setShowRiskModal(true);

    if (result.data?.ai?.recommended_price) {
      setAiRecommendedPrices((prev) => ({
        ...prev,
        [productId]: result.data.ai.recommended_price,
      }));
    }
  } catch (err) {
  console.error("Pricing analysis error:", err.response?.data || err.message);

  setError(
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    "Failed to analyze product pricing."
  );
} finally {
  setRiskLoading(false);
}
};

  const toggleComponent = (name, isEdit = false) => {
    const target = isEdit ? selectedProduct : newProd;
    let updatedComps = [...(target.components || [])];
    const index = updatedComps.findIndex((c) => c.name === name);

    if (index > -1) {
      updatedComps = updatedComps.filter((c) => c.name !== name);
    } else {
      updatedComps.push({ name, qty: 1 });
    }

    if (isEdit) {
      setSelectedProduct({ ...selectedProduct, components: updatedComps });
    } else {
      setNewProd({ ...newProd, components: updatedComps });
    }
  };

  const updateQty = (name, val, isEdit = false) => {
    const target = isEdit ? selectedProduct : newProd;
    const intVal = Math.max(0, parseInt(val, 10) || 0);

    const updatedComps = target.components.map((c) =>
      c.name === name ? { ...c, qty: intVal } : c
    );

    if (isEdit) {
      setSelectedProduct({ ...selectedProduct, components: updatedComps });
    } else {
      setNewProd({ ...newProd, components: updatedComps });
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCatName) return;

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-id": userId },
        body: JSON.stringify({ name: newCatName }),
      });

      if (res.ok) {
        await loadData();
        setNewCatName("");
        setShowCategoryInput(false);
      }
    } catch (err) {
      setError("Error adding category");
    }
  };

  const handleSaveProduct = async () => {

  if (!newProd.name.trim()) {

    return setError("Product name is required.");

  }

  if (!newProd.category_id) {

    return setError("Category is required.");

  }

  if (!newProd.components || newProd.components.length === 0) {

    return setError("At least one component is required.");

  }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-id": userId },
        body: JSON.stringify({
          ...newProd,
          components: JSON.stringify(newProd.components),
          v_cost: calculateTotalVcost(newProd.components).toString(),
          b_cost: "0.00",
          c_price: "0.00",
          comp_price: "0.00",
        }),
      });

      if (res.ok) {
        await loadData();
        setShowAddModal(false);
        setNewProd({ name: "", components: [], category_id: "" });
      }
    } catch (err) {
      setError("Error saving product");
    }
  };

   const handleUpdateProduct = async () => {
  if (!selectedProduct.name || !selectedProduct.name.trim()) {
    return setError("Product name is required.");
  }

  if (
    selectedProduct.c_price === "" ||
    selectedProduct.c_price === null ||
    selectedProduct.c_price === undefined
  ) {
    return setError("Current price is required.");
  }

  if (Number(selectedProduct.c_price) < 0) {
    return setError("Current price cannot be negative.");
  }

  try {
    const res = await fetch(`${API_URL}/${selectedProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify({
        ...selectedProduct,
        components: JSON.stringify(selectedProduct.components),
        v_cost: calculateTotalVcost(selectedProduct.components).toString(),
        c_price: selectedProduct.c_price,
        comp_price: selectedProduct.comp_price,
        b_cost: selectedProduct.b_cost,
      }),
    });

    if (res.ok) {
      await loadData();
      setShowEditModal(false);
    }
  } catch (err) {
    setError("Error updating product");
  }
};

  const confirmDelete = async () => {
    if (!productIdToDelete) return;

    try {
      const res = await fetch(`${API_URL}/${productIdToDelete}`, {
        method: "DELETE",
        headers: { "user-id": userId },
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            products: cat.products.filter((p) => p.id !== productIdToDelete),
          }))
        );

        setShowDeleteConfirm(false);
        setProductIdToDelete(null);
      }
    } catch (err) {
      setError("Error deleting product");
    }
  };

  const handleSaveRules = async () => {
    const targetType = selectedProduct ? "products" : "categories";
    const targetId = selectedProduct ? selectedProduct.id : selectedCategory.id;

    try {
      const res = await fetch(`${API_URL}/${targetType}/${targetId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "user-id": userId },
        body: JSON.stringify({ rules: tempSelectedRules }),
      });

      if (res.ok) {
  if (selectedProduct) {
    await handleAnalyzePricing(selectedProduct.id);
  }

  await loadData();
  setShowRulesModal(false);
  alert("Pricing rules assigned successfully.");
}
    } catch (err) {
      setError("Error saving rules");
    }
  };

  const handleRenameCategory = async (cat) => {
  const newName = prompt("Enter new category name:", cat.name);

  if (!newName || !newName.trim()) return;

  try {
    const res = await fetch(`${API_URL}/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error renaming category");
    }

    await loadData();
  } catch (err) {
    setError(err.message);
  }
};

const handleDeleteCategory = async (cat) => {
  const confirmed = window.confirm(`Delete category "${cat.name}"?`);

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_URL}/categories/${cat.id}`, {
      method: "DELETE",
      headers: { "user-id": userId },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error deleting category");
    }

    await loadData();
  } catch (err) {
    setError(err.message);
  }
};

  const parseComponents = (compData) => {
    if (!compData) return [];
    if (Array.isArray(compData)) return compData;

    try {
      return JSON.parse(compData);
    } catch (e) {
      return [];
    }
  };

  return (
    <div style={pageContainer}>
      <div style={headerStyle}>
        <h1 style={mainTitle}>Products Management</h1>
        <button style={btnMainAdd} onClick={() => setShowAddModal(true)}>
          + Add Product
        </button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {loading ? (
        <div
          className="d-flex align-items-center gap-2"
          style={{ padding: "100px", justifyContent: "center" }}
        >
          <Spinner animation="border" size="sm" variant="primary" />
          <span style={{ color: "#5b2d89", fontWeight: "600" }}>
            Loading...
          </span>
        </div>
      ) : (
        <>
          {!userId ? (
            <div style={loadingStyle}>Please log in to view your products.</div>
          ) : categories.length === 0 ? (
            <div style={emptySimpleStyle}>There is no product yet</div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} style={categoryCard}>
  <div style={categoryHeader}>
    <div>
      <div style={categoryTitleRow}>
        <h2 style={catTitleText}>{cat.name}</h2>

        <button
          style={categoryEditBtn}
          onClick={() => handleRenameCategory(cat)}
          title="Rename Category"
        >
          ✏️
        </button>

        <button
          style={categoryDeleteBtn}
          onClick={() => handleDeleteCategory(cat)}
          title="Delete Category"
        >
          🗑️
        </button>
      </div>

      <div style={badgeRow}>
        {(cat.rules || []).map((rule, idx) => (
          <span key={idx} style={orangeBadgeSmall}>
            {rule.name}
          </span>
        ))}
      </div>
    </div>

                  <button
                    style={btnAssignRules}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedProduct(null);
                      setTempSelectedRules((cat.rules || []).map((rule) => rule.id));
                      setShowRulesModal(true);
                    }}
                  >
                    🔗 Assign Rules
                  </button>
                </div>

                {cat.products && cat.products.length > 0 ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Product Name</th>
                        <th style={thStyle}>Components</th>
                        <th style={thStyle}>Variable Cost</th>
                        <th style={thStyle}>Base Cost</th>
                        <th style={thStyle}>Current Price</th>
                        <th style={thStyle}>Recommended</th>
                        <th style={thStyle}>Avg Competitors Price</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {cat.products.map((prod) => {
                        const comps = parseComponents(prod.components);

                        return (
                          <tr key={prod.id}>
                            <td style={tdStyle}>
                              <div style={prodNameText}>{prod.name}</div>
                              {(prod.rules || []).map((r, i) => (
  <div key={r.id || i} style={blueBadgeSmall}>
    {r.name}
  </div>
))}
                            </td>

                            <td style={tdStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "4px",
                                }}
                              >
                                {comps.length > 0
                                  ? comps.map((c, i) => (
                                      <span key={i} style={compBadgeStyle}>
                                        {c.name} {c.qty}
                                      </span>
                                    ))
                                  : "—"}
                              </div>
                            </td>

                            <td style={tdStyle}>
                              {calculateTotalVcost(comps)} SAR
                            </td>
                            <td style={tdStyle}>{prod.b_cost} SAR</td>
                            <td style={tdStyle}>{prod.c_price} SAR</td>
                            <td
                              style={{
                                ...tdStyle,
                                color: "#27ae60",
                                fontWeight: "bold",
                              }}
                            >
                              {aiRecommendedPrices[prod.id]
  ? `${aiRecommendedPrices[prod.id]} SAR`
  : prod.r_price
  ? `${prod.r_price} SAR`
  : "Analyze"}
                            </td>
                            
                            <td
                              style={{
                                ...tdStyle,
                                color: "#5b2d89",
                                fontWeight: "600",
                              }}
                            >
                              {calculateAvg(prod.competitors_prices)} SAR
                            </td>

                            <td style={tdStyle}>
                              <div style={actionGroup}>
                                <button
                                  style={actionBtnPurple}
                                  disabled={riskLoading}
                                  title="Analyze Pricing"
                                  onClick={() => handleAnalyzePricing(prod.id)}
                                >
                                  📊
                                </button>

                                <button
                                  style={actionBtnBlue}
                                  onClick={() => {
                                    setSelectedProduct({
                                      ...prod,
                                      components: comps,
                                    });
                                    setSelectedCategory(null);
                                    setTempSelectedRules((prod.rules || []).map((rule) => rule.id));
                                    setShowRulesModal(true);
                                  }}
                                >
                                  🔗
                                </button>

                                <button
                                  style={actionBtnOrange}
                                  onClick={() => {
                                    setSelectedProduct({
                                      ...prod,
                                      components: comps,
                                    });
                                    setShowEditModal(true);
                                  }}
                                >
                                  ✏️
                                </button>

                                <button
                                  style={actionBtnRed}
                                  onClick={() => {
                                    setProductIdToDelete(prod.id);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={emptyPlaceholderText}>
                    No products in this category.
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {showRiskModal && riskResult && (
        <div style={modalOverlay}>
          <div style={riskModalContent}>
            <h2 style={modalTitleCustom}>Pricing Risk Analysis</h2>

            <div style={riskHeaderBox}>
              <h3 style={riskProductName}>{riskResult.product.name}</h3>
              <span style={riskScoreBadge}>
                Risk Score: {riskResult.analysis.risk_score}
              </span>
            </div>

            {riskResult.ai && (
  <div style={recommendedBox}>
    <strong>AI Recommended Price</strong>
    <h2>{riskResult.ai.recommended_price} SAR</h2>
    <p>{riskResult.ai.reason}</p>
  </div>
)}

            <div style={riskGrid}>
              <div style={riskCard}>
                <strong>Pricing Health</strong>
                <p>{riskResult.analysis.pricing_health}</p>
              </div>

              <div style={riskCard}>
                <strong>Risk Label</strong>
                <p>{riskResult.analysis.risk_label}</p>
              </div>

              <div style={riskCard}>
                <strong>Market Comparison</strong>
                <p>{riskResult.analysis.market_comparison}</p>
              </div>

              <div style={riskCard}>
                <strong>Profit Impact</strong>
                <p>{riskResult.analysis.profit_impact}</p>
              </div>
            </div>

            <div style={riskDetailsBox}>
              <p>
                <strong>Current Price:</strong>{" "}
                {riskResult.product.current_price} SAR
              </p>
              <p>
                <strong>Base Cost:</strong> {riskResult.cost.base_cost} SAR
              </p>
              <p>
                <strong>Component Cost:</strong>{" "}
                {riskResult.cost.component_cost} SAR
              </p>
              <p>
                <strong>Competitor Average:</strong>{" "}
                {riskResult.market.competitor_average_price} SAR
              </p>
              <p>
                <strong>Applied Margin:</strong>{" "}
                {riskResult.analysis.applied_margin}%
              </p>
              <p>
                <strong>Profit Per Unit:</strong>{" "}
                {riskResult.analysis.profit_per_unit} SAR
              </p>
            </div>

            <div style={insightBox}>
              <strong>Pricing Insight</strong>
              <p>{riskResult.analysis.pricing_insight}</p>
            </div>

            {riskResult.ai ? (
  <>
    <div style={insightBox}>
      <strong>AI Risk Explanation</strong>
      <p>{riskResult.ai.risk_explanation}</p>
    </div>

    <div style={insightBox}>
      <strong>AI Margin Safety</strong>
      <p>{riskResult.ai.margin_safety_explanation}</p>
    </div>

    <div style={insightBox}>
      <strong>AI Recommended Action</strong>
      <p>{riskResult.ai.action}</p>
    </div>
  </>
) : (
  <div style={insightBox}>
    <strong>Recommendation</strong>
    <p>{riskResult.analysis.recommendation}</p>
  </div>
)}

            <div style={modalFooterCustom}>
              <button
                style={btnCancelCustom}
                onClick={() => {
                  setShowRiskModal(false);
                  setRiskResult(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={modalOverlay}>
          <div
            style={{
              ...modalContentCustom,
              width: "350px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
            <h3
              style={{
                ...modalTitleCustom,
                fontSize: "20px",
                marginBottom: "10px",
              }}
            >
              Are you sure?
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "25px",
              }}
            >
              This action cannot be undone. The product will be permanently
              removed.
            </p>
            <div style={{ ...modalFooterCustom, justifyContent: "center" }}>
              <button
                style={{ ...btnCancelCustom, padding: "10px 20px" }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...btnSaveCustom,
                  backgroundColor: "#e74c3c",
                  padding: "10px 20px",
                }}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={modalOverlay}>
          <div style={modalContentCustom}>
            <h2 style={modalTitleCustom}>Add New Product</h2>

            <div style={inputGroup}>
              <label style={labelStyle}>

  Product Name <span style={requiredStar}>*</span>

</label>
              <input
  style={inputFieldCustom}
  placeholder="Enter name"
  value={newProd.name}
  onChange={(e) => {
    const value = e.target.value;
    setNewProd({ ...newProd, name: value });
    handleCheckMarketProduct(value);
  }}
/>

{marketCheck && (
  <div
    style={{
      color: marketCheck.exists ? "#27ae60" : "#e67e22",
      fontSize: "13px",
      fontWeight: "600",
      marginTop: "-8px",
      marginBottom: "12px",
    }}
  >
    {marketCheck.exists
      ? "✅ Market data found for this product."
      : "⚠️ No market data found. Competitor average may be 0 SAR."}
  </div>
)}
            </div>

            <div style={inputGroup}>
  <label style={labelStyle}>
  Components <span style={requiredStar}>*</span>
</label>

  <input
  style={inputFieldCustom}
  placeholder="Search component..."
  value={componentSearch}
  onChange={(e) => setComponentSearch(e.target.value)}
/>

<div style={componentDropdown}>
  {filteredComponents.length > 0 ? (
    filteredComponents.map((comp) => (
      <div
        key={comp.id}
        style={componentDropdownItem}
        onClick={() => {
          const alreadySelected = newProd.components.find(
            (c) => c.name === comp.name
          );

          if (!alreadySelected) {
            setNewProd({
              ...newProd,
              components: [...newProd.components, { name: comp.name, qty: 1 }],
            });
          }

          setComponentSearch("");
        }}
      >
        {comp.name}
      </div>
    ))
  ) : (
    <div style={componentDropdownEmpty}>No component found</div>
  )}
</div>
  

  <div style={selectedComponentsBox}>
    {newProd.components.length > 0 ? (
      newProd.components.map((comp) => (
        <div key={comp.name} style={selectedComponentChip}>
          <span>{comp.name}</span>

          <input
            type="number"
            min="1"
            style={qtyInputSmall}
            value={comp.qty}
            onChange={(e) => updateQty(comp.name, e.target.value, false)}
          />

          <button
            style={removeChipBtn}
            onClick={() =>
              setNewProd({
                ...newProd,
                components: newProd.components.filter(
                  (c) => c.name !== comp.name
                ),
              })
            }
          >
            ×
          </button>
        </div>
      ))
    ) : (
      <span style={{ color: "#999", fontSize: "13px" }}>
        No components selected yet.
      </span>
    )}
  </div>
</div>

            <div style={inputGroup}>
              <label style={labelStyle}>
  Category <span style={requiredStar}>*</span>
</label>
              <select
                style={inputFieldCustom}
                value={newProd.category_id}
                onChange={(e) =>
                  setNewProd({ ...newProd, category_id: e.target.value })
                }
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {!showCategoryInput ? (
                <button
                  style={btnLink}
                  onClick={() => setShowCategoryInput(true)}
                >
                  + New Category
                </button>
              ) : (
                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  <input
                    style={{ ...inputFieldCustom, marginBottom: 0 }}
                    placeholder="Enter Category Name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button
                    style={{
                      ...btnMainAdd,
                      padding: "5px 15px",
                      marginLeft: 0,
                    }}
                    onClick={handleAddNewCategory}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div style={modalFooterCustom}>
              <button style={btnSaveCustom} onClick={handleSaveProduct}>
                Save
              </button>
              <button
                style={btnCancelCustom}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div style={modalOverlay}>
          <div style={modalContentLarge}>
            <h2 style={modalTitleCustom}>Edit: {selectedProduct.name}</h2>

            <div style={gridTwoCols}>
              <div style={inputGroup}>
                <label style={labelStyle}>
  Product Name <span style={requiredStar}>*</span>
</label>
                <input
                  style={inputFieldCustom}
                  value={selectedProduct.name}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Components</label>
                <div style={compSelectionGrid}>
                  {varComponents.map((comp) => {
                    const isSelected = selectedProduct.components?.find(
                      (c) => c.name === comp.name
                    );

                    return (
                      <div key={comp.id} style={compItemWrapper}>
                        <div
                          onClick={() => toggleComponent(comp.name, true)}
                          style={isSelected ? activeCompBox : inactiveCompBox}
                        >
                          {comp.name}
                        </div>

                        {isSelected && (
                          <input
                            type="number"
                            min="0"
                            style={qtyInputSmall}
                            value={isSelected.qty}
                            onChange={(e) =>
                              updateQty(comp.name, e.target.value, true)
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>
  Current Price (SAR) <span style={requiredStar}>*</span>
</label>
                <input
                  type="text"
                  placeholder="0.00"
                  style={inputFieldCustom}
                  value={selectedProduct.c_price || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      c_price: e.target.value,
                    })
                  }
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Competitor Price (from Market Dataset)</label>
<input
  type="text"
  style={{ ...inputFieldCustom, backgroundColor: "#f9f9f9" }}
  value="Calculated automatically during pricing analysis"
  disabled
/>
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Base Cost (SAR)</label>
                <input
                  type="text"
                  placeholder="0.00"
                  style={inputFieldCustom}
                  value={selectedProduct.b_cost || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      b_cost: e.target.value,
                    })
                  }
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Variable Cost</label>
                <input
                  style={{ ...inputFieldCustom, backgroundColor: "#f9f9f9" }}
                  disabled
                  value={calculateTotalVcost(selectedProduct.components)}
                />
              </div>
            </div>

            <div style={modalFooterCustom}>
              <button style={btnSaveCustom} onClick={handleUpdateProduct}>
                Save Changes
              </button>
              <button
                style={btnCancelCustom}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRulesModal && (
        <div style={modalOverlay}>
          <div style={modalContentCustom}>
            <h2 style={modalTitleCustom}>Pricing Rules</h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {pricingRules.map((rule) => (
  <div
    key={rule.id}
    style={ruleCardStyle(tempSelectedRules.includes(rule.id))}
    onClick={() => {
      setTempSelectedRules((prev) =>
        prev.includes(rule.id)
          ? prev.filter((id) => id !== rule.id)
          : [...prev, rule.id]
      );
    }}
  >
    <input
      type="checkbox"
      checked={tempSelectedRules.includes(rule.id)}
      readOnly
    />
    <div style={{ marginLeft: "10px" }}>
      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
        {rule.name}
      </div>
      <div style={{ fontSize: "11px", color: "#888" }}>
        {rule.type} - {rule.value}
      </div>
    </div>
  </div>
))}
            </div>

            <div style={modalFooterCustom}>
              <button style={btnSaveCustom} onClick={handleSaveRules}>
                Assign Rules
              </button>
              <button
                style={btnCancelCustom}
                onClick={() => setShowRulesModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



const pageContainer = {
  padding: "40px",
  backgroundColor: "#f8f9fc",
  minHeight: "100vh",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "30px",
  alignItems: "center",
};

const mainTitle = {
  fontSize: "32px",
  color: "#2d1b4e",
  fontWeight: "700",
  margin: 0,
};

const btnMainAdd = {
  backgroundColor: "#2d1b4e",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  marginLeft: "100px",
};

const emptySimpleStyle = {
  textAlign: "center",
  padding: "100px 20px",
  color: "#a0a0a0",
  fontSize: "14px",
  letterSpacing: "0.5px",
  fontWeight: "500",
};

const categoryCard = {
  backgroundColor: "white",
  borderRadius: "15px",
  padding: "25px",
  marginBottom: "30px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
};

const categoryHeader = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "2px solid #5b2d89",
  paddingBottom: "15px",
  marginBottom: "20px",
};

const catTitleText = {
  fontSize: "22px",
  color: "#5b2d89",
  margin: 0,
};

const btnAssignRules = {
  backgroundColor: "#f39c12",
  color: "white",
  border: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "12px",
  color: "#888",
  fontSize: "13px",
  borderBottom: "1px solid #eee",
};

const tdStyle = {
  padding: "15px 12px",
  fontSize: "14px",
  borderBottom: "1px solid #f9f9f9",
};

const badgeRow = {
  display: "flex",
  gap: "8px",
  marginTop: "8px",
};

const orangeBadgeSmall = {
  backgroundColor: "#f39c12",
  color: "white",
  fontSize: "10px",
  padding: "3px 8px",
  borderRadius: "5px",
  fontWeight: "bold",
};

const blueBadgeSmall = {
  backgroundColor: "#3498db",
  color: "white",
  fontSize: "10px",
  padding: "3px 8px",
  borderRadius: "5px",
  marginTop: "5px",
  display: "inline-block",
};

const compBadgeStyle = {
  backgroundColor: "#f1f2f6",
  color: "#555",
  fontSize: "11px",
  padding: "3px 8px",
  borderRadius: "12px",
  fontWeight: "500",
  border: "1px solid #e1e2e6",
};

const prodNameText = {
  fontWeight: "600",
  color: "#2d1b4e",
};

const actionGroup = {
  display: "flex",
  gap: "8px",
};

const actionBtnBase = {
  border: "none",
  color: "white",
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const actionBtnPurple = {
  ...actionBtnBase,
  backgroundColor: "#5b2d89",
};

const actionBtnBlue = {
  ...actionBtnBase,
  backgroundColor: "#3498db",
};

const actionBtnOrange = {
  ...actionBtnBase,
  backgroundColor: "#ffb74d",
};

const actionBtnRed = {
  ...actionBtnBase,
  backgroundColor: "#e74c3c",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const categoryTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const categoryEditBtn = {
  border: "none",
  backgroundColor: "#ffb74d",
  color: "white",
  width: "30px",
  height: "30px",
  borderRadius: "6px",
  cursor: "pointer",
};

const categoryDeleteBtn = {
  border: "none",
  backgroundColor: "#e74c3c",
  color: "white",
  width: "30px",
  height: "30px",
  borderRadius: "6px",
  cursor: "pointer",
};

const modalContentCustom = {
  backgroundColor: "white",
  padding: "35px",
  borderRadius: "25px",
  width: "450px",
};

const modalContentLarge = {
  ...modalContentCustom,
  width: "750px",
};

const riskModalContent = {
  backgroundColor: "white",
  padding: "35px",
  borderRadius: "25px",
  width: "720px",
  maxHeight: "85vh",
  overflowY: "auto",
};

const modalTitleCustom = {
  fontSize: "28px",
  color: "#5b2d89",
  marginBottom: "25px",
  fontWeight: "700",
};

const inputFieldCustom = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  marginBottom: "15px",
  boxSizing: "border-box",
};

const modalFooterCustom = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "20px",
};

const btnCancelCustom = {
  backgroundColor: "#f0f0f0",
  color: "#666",
  border: "none",
  padding: "12px 25px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnSaveCustom = {
  backgroundColor: "#2d1b4e",
  color: "white",
  border: "none",
  padding: "12px 30px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnLink = {
  background: "none",
  border: "none",
  color: "#5b2d89",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "10px",
  display: "block",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "600",
  color: "#555",
  fontSize: "13px",
};

const gridTwoCols = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const inputGroup = {
  marginBottom: "15px",
};

const emptyPlaceholderText = {
  textAlign: "center",
  padding: "40px",
  color: "#999",
  fontStyle: "italic",
  fontSize: "14px",
};

const loadingStyle = {
  textAlign: "center",
  padding: "100px",
  fontSize: "20px",
  color: "#5b2d89",
};

const compSelectionGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  border: "1px solid #eee",
  padding: "15px",
  borderRadius: "12px",
  maxHeight: "200px",
  overflowY: "auto",
};

const compItemWrapper = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

const baseCompBox = {
  padding: "8px 15px",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
  transition: "0.2s",
  fontWeight: "500",
  border: "1px solid #ddd",
};

const activeCompBox = {
  ...baseCompBox,
  backgroundColor: "#5b2d89",
  color: "white",
  borderColor: "#5b2d89",
};

const inactiveCompBox = {
  ...baseCompBox,
  backgroundColor: "#f9f9f9",
  color: "#777",
};

const qtyInputSmall = {
  width: "55px",
  padding: "6px",
  borderRadius: "6px",
  border: "2px solid #5b2d89",
  textAlign: "center",
  fontWeight: "bold",
};

const ruleCardStyle = (isSelected) => ({
  display: "flex",
  alignItems: "center",
  padding: "12px",
  borderRadius: "12px",
  border: isSelected ? "2px solid #5b2d89" : "1px solid #eee",
  cursor: "pointer",
  backgroundColor: isSelected ? "#f9f6ff" : "white",
});

const riskHeaderBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#f9f6ff",
  padding: "18px",
  borderRadius: "15px",
  marginBottom: "20px",
};

const riskProductName = {
  margin: 0,
  color: "#2d1b4e",
  fontSize: "22px",
};

const riskScoreBadge = {
  backgroundColor: "#5b2d89",
  color: "white",
  padding: "8px 14px",
  borderRadius: "20px",
  fontWeight: "bold",
  fontSize: "13px",
};

const riskGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginBottom: "20px",
};

const riskCard = {
  backgroundColor: "#f8f9fc",
  padding: "16px",
  borderRadius: "14px",
  border: "1px solid #eee",
};

const riskDetailsBox = {
  backgroundColor: "#fff",
  border: "1px solid #eee",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "15px",
  fontSize: "14px",
};

const insightBox = {
  backgroundColor: "#f9f6ff",
  borderLeft: "5px solid #5b2d89",
  borderRadius: "12px",
  padding: "15px",
  marginBottom: "15px",
  fontSize: "14px",
};
const recommendedBox = {
  backgroundColor: "#eefaf3",
  borderLeft: "5px solid #27ae60",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "20px",
  color: "#1e5631",
};

const componentDropdown = {
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "10px",
  marginTop: "-8px",
  marginBottom: "12px",
  maxHeight: "150px",
  overflowY: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const componentDropdownItem = {
  padding: "10px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
  color: "#2d1b4e",
  fontWeight: "600",
};

const componentDropdownEmpty = {
  padding: "10px 12px",
  color: "#999",
  fontSize: "13px",
};

const selectedComponentsBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  border: "1px solid #eee",
  padding: "15px",
  borderRadius: "12px",
  minHeight: "65px",
  alignItems: "center",
};

const selectedComponentChip = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#5b2d89",
  color: "white",
  padding: "8px 10px",
  borderRadius: "10px",
  fontWeight: "600",
};

const removeChipBtn = {
  border: "none",
  backgroundColor: "transparent",
  color: "white",
  fontSize: "18px",
  cursor: "pointer",
  lineHeight: "1",
};

const requiredStar = {
  color: "#e74c3c",
  fontWeight: "bold",
};

export default Products;