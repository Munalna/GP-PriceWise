import React, { useState, useEffect } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getAIPriceRecommendation, checkMarketProduct } from "../services/analyticsService";
import { ChartColumnDecreasing } from "lucide-react";
import { CiLink, CiEdit } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import { RiAlertLine } from "react-icons/ri";

const API_URL = "/api/products";
function Products() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

const { data: categories = [], isLoading: loadingCats } = useQuery({
  queryKey: ["products", userId],
 queryFn: () => api.get("/products").then((r) => Array.isArray(r.data) ? r.data : []),
  enabled: !!userId,
  staleTime: 1000 * 60 * 60,
});

const { data: varComponents = [], isLoading: loadingVC } = useQuery({
  queryKey: ["varComponents", userId],
  queryFn: () => api.get("/products/var-components").then((r) => Array.isArray(r.data) ? r.data : []),
  enabled: !!userId,
  staleTime: 1000 * 60 * 60,
});

  const { data: pricingRules = [] } = useQuery({
    queryKey: ["pricingRules", userId],
    queryFn: () => api.get("/pricing-rules").then(r => r.data),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60 , // 1 hour
  });

  const loading = loadingCats || loadingVC;

const categoryRefs = React.useRef({});
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [aiRecommendedPrices, setAiRecommendedPrices] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showEditCategoryInput, setShowEditCategoryInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [marketCheck, setMarketCheck] = useState(null);
  const [componentSearch, setComponentSearch] = useState("");
  const [newProd, setNewProd] = useState({ name: "", components: [], category_id: "" });
  const [newCatName, setNewCatName] = useState("");
  const [editCatName, setEditCatName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tempSelectedRules, setTempSelectedRules] = useState([]);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
 const [categoryToDelete, setCategoryToDelete] = useState(null);
 const [productToDelete, setProductToDelete] = useState(null);
  const [feedback, setFeedback] = useState({
  type: "",
  message: "",
  location: "",
});
const FEEDBACK_DURATION = 5000;

const showFeedback = (type, message, location) => {
  
  setFeedback({ type, message, location });

  setTimeout(() => {
    setFeedback({ type: "", message: "", location: "" });
  }, FEEDBACK_DURATION);
};

const [categoryFeedback, setCategoryFeedback] = useState({
  type: "",
  message: "",
});

const showCategoryFeedback = (type, message) => {
  setCategoryFeedback({ type, message });

  setTimeout(() => {
    setCategoryFeedback({ type: "", message: "" });
  }, FEEDBACK_DURATION);
};

useEffect(() => {
  if (!feedback.location) return;
  const el = document.getElementById(feedback.location);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}, [feedback.location, feedback.message]);


  const calculateAvg = (prices) => {
    if (!prices || !Array.isArray(prices) || prices.length === 0) return "0.00";
    const validPrices = prices.map((p) => Number(p)).filter((p) => !isNaN(p));
    if (validPrices.length === 0) return "0.00";
    const sum = validPrices.reduce((acc, val) => acc + val, 0);
    return (sum / validPrices.length).toFixed(2);
  };

  const formatNum = (val) => parseFloat(Number(val).toFixed(4)).toString();

  const handleCheckMarketProduct = async (name) => {
    if (!name || name.trim().length < 2) { setMarketCheck(null); return; }
    try {
      const result = await checkMarketProduct(name);
      setMarketCheck(result);
    } catch (err) { console.error("Market check error:", err); }
  };

  const calculateTotalVcost = (prodComponents) => {
    if (!prodComponents || !Array.isArray(prodComponents)) return 0;
    return prodComponents.reduce((sum, item) => {
      const dbInfo = varComponents.find((c) => c.name === item.name);
      const unitCost = dbInfo ? Number(dbInfo.cost_per_unit) : 0;
      return sum + unitCost * (Number(item.qty) || 0);
    }, 0);
  };

  const filteredComponents = varComponents.filter((comp) =>
    comp.name.toLowerCase().includes(componentSearch.toLowerCase())
  );

  const parseComponents = (compData) => {
    if (!compData) return [];
    if (Array.isArray(compData)) return compData;
    try { return JSON.parse(compData); } catch (e) { return []; }
  };

 const handleAnalyzePricing = async (productId) => {
  setRiskLoading(true);
  setRiskResult(null);
  setError("");
  setShowRiskModal(true);

  try {
    const result = await getAIPriceRecommendation(productId);

    setRiskResult(result.data);

    if (result.data?.ai?.recommended_price) {
      setAiRecommendedPrices((prev) => ({
        ...prev,
        [productId]: result.data.ai.recommended_price,
      }));
    }
  } catch (err) {
    setError(
      err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to analyze product pricing."
    );
    setShowRiskModal(false);
  } finally {
    setRiskLoading(false);
  }
};

  const toggleComponent = (name, isEdit = false) => {
    const target = isEdit ? selectedProduct : newProd;
    let updatedComps = [...(target.components || [])];
    const index = updatedComps.findIndex((c) => c.name === name);
    if (index > -1) updatedComps = updatedComps.filter((c) => c.name !== name);
    else updatedComps.push({ name, qty: 1 });
    if (isEdit) setSelectedProduct({ ...selectedProduct, components: updatedComps });
    else setNewProd({ ...newProd, components: updatedComps });
  };

  const updateQty = (name, val, isEdit = false) => {
  const target = isEdit ? selectedProduct : newProd;

  let newValue = val;

  if (val !== "") {
    newValue = Math.max(0, Number(val));
  }

  const updatedComps = target.components.map((c) =>
    c.name === name ? { ...c, qty: newValue } : c
  );

  if (isEdit) {
    setSelectedProduct({ ...selectedProduct, components: updatedComps });
  } else {
    setNewProd({ ...newProd, components: updatedComps });
  }
};

const handleAddNewCategory = async () => {
  setCategoryFeedback({ type: "", message: "" });

  if (!newCatName.trim()) {
    showCategoryFeedback("danger", "Category name is required.");
    return;
  }

  try {
    const res = await api.post("/products/categories", {
      name: newCatName.trim(),
    });

    await invalidate();

    setNewProd((prev) => ({
      ...prev,
      category_id: res.data?.id || prev.category_id,
    }));

    setNewCatName("");
    showCategoryFeedback("success", "Category added successfully.");
  } catch (err) {
    showCategoryFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error adding category."
    );
  }
};

const handleSaveProduct = async () => {
  setFeedback({ type: "", message: "", location: "" });

  if (!newProd.name.trim()) return showFeedback("danger", "Product name is required.", "add-product-modal");
  if (!newProd.category_id) return showFeedback("danger", "Category is required.", "add-product-modal");
  if (!newProd.components?.length) return showFeedback("danger", "At least one component is required.", "add-product-modal");

  if (newProd.components.some((c) => Number(c.qty) <= 0)) {
    return showFeedback("danger", "Each selected component must have a quantity greater than 0.", "add-product-modal");
  }

  const addedProductCategoryId = newProd.category_id;

  try {
    await api.post("/products", {
      ...newProd,
      components: JSON.stringify(newProd.components),
      v_cost: calculateTotalVcost(newProd.components).toString(),
      b_cost: "0.00",
      c_price: "0.00",
      comp_price: "0.00",
    });

    setShowAddModal(false);
    setNewProd({ name: "", components: [], category_id: "" });
    setMarketCheck(null);

    showFeedback("success", "Product added successfully.", `category-${addedProductCategoryId}`);

    setTimeout(async () => {
      await invalidate();
    }, 800);
  } catch (err) {
    showFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error saving product.",
      "add-product-modal"
    );
  }
};

const handleUpdateProduct = async () => {
  setFeedback({ type: "", message: "", location: "" });

  if (!selectedProduct.name?.trim()) return showFeedback("danger", "Product name is required.", "edit-product-modal");
  if (selectedProduct.c_price === "" || selectedProduct.c_price == null) return showFeedback("danger", "Current price is required.", "edit-product-modal");
  if (Number(selectedProduct.c_price) < 0) return showFeedback("danger", "Current price cannot be negative.", "edit-product-modal");

  if (selectedProduct.components?.some((c) => Number(c.qty) <= 0)) {
    return showFeedback("danger", "Each selected component must have a quantity greater than 0.", "edit-product-modal");
  }

  const updatedProductCategoryId = selectedProduct.category_id;

  try {
    await api.put(`/products/${selectedProduct.id}`, {
      ...selectedProduct,
      components: JSON.stringify(selectedProduct.components),
      v_cost: calculateTotalVcost(selectedProduct.components).toString(),
      c_price: selectedProduct.c_price,
      comp_price: selectedProduct.comp_price,
      b_cost: selectedProduct.b_cost,
    });

    setShowEditModal(false);

    showFeedback("success", "Product updated successfully.", `category-${updatedProductCategoryId}`);

    setTimeout(async () => {
      await invalidate();
    }, 800);
  } catch (err) {
    showFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error updating product.",
      "edit-product-modal"
    );
  }
};

const confirmDelete = async () => {
  if (!productIdToDelete) return;

  setFeedback({ type: "", message: "", location: "" });

  const deletedProductCategoryId = categories
    .flatMap((cat) =>
      (cat.products || []).map((prod) => ({
        productId: prod.id,
        categoryId: cat.id,
      }))
    )
    .find((item) => item.productId === productIdToDelete)?.categoryId;

  try {
    await api.delete(`/products/${productIdToDelete}`);

    setShowDeleteConfirm(false);
    setProductIdToDelete(null);
    setProductToDelete(null);

    showFeedback(
      "success",
      "Product deleted successfully.",
      `category-${deletedProductCategoryId}`
    );

    setTimeout(async () => {
      await invalidate();
    }, 1200);
  } catch (err) {
    setShowDeleteConfirm(false);
    setProductToDelete(null);

    showFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error deleting product.",
      `category-${deletedProductCategoryId}`
    );
  }
};

const handleSaveRules = async () => {
  const targetType = selectedProduct ? "products" : "categories";
  const targetId = selectedProduct ? selectedProduct.id : selectedCategory.id;

  try {
    await api.put(`/products/${targetType}/${targetId}/rules`, {
      rules: tempSelectedRules,
    });

    if (selectedProduct) await handleAnalyzePricing(selectedProduct.id);

    setShowRulesModal(false);

    showFeedback(
      "success",
      "Pricing rules assigned successfully.",
      selectedProduct ? `category-${selectedProduct.category_id}` : `category-${selectedCategory.id}`
    );

    setTimeout(async () => {
      await invalidate();
    }, 800);
  } catch (err) {
    showFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error saving rules.",
      selectedProduct ? `category-${selectedProduct.category_id}` : `category-${selectedCategory.id}`
    );
  }
};


/*
const handleRenameCategory = async (cat) => {
  const newName = prompt("Enter new category name:", cat.name);
  if (!newName?.trim()) return;

  setFeedback({ type: "", message: "", location: "" });

  try {
    await api.put(`/products/categories/${cat.id}`, {
      name: newName.trim(),
    });

    showFeedback("success", "Category updated successfully.", `category-${cat.id}`);

    setTimeout(async () => {
      await invalidate();
    }, 800);
  } catch (err) {
    showFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error updating category.",
      `category-${cat.id}`
    );
  }
}; */

const handleRenameCategory = (cat) => {
  setSelectedCategory(cat);
  setEditCatName(cat.name || "");
  setShowEditCategoryInput(true);
};

const handleDeleteCategory = async () => {
  if (!categoryToDelete) return;

  const cat = categoryToDelete;

  setFeedback({ type: "", message: "", location: "" });

  try {
    await api.delete(`/products/categories/${cat.id}`);

    setShowCategoryDeleteConfirm(false);
    setCategoryToDelete(null);

    showFeedback("success", "Category deleted successfully.", `category-${cat.id}`);

    setTimeout(async () => {
      await invalidate();
    }, 1200);
  } catch (err) {
    setShowCategoryDeleteConfirm(false);
    showFeedback(
      "danger",
      err.response?.data?.error || err.message || "Error deleting category.",
      `category-${cat.id}`
    );
  }
};
  const getComponentUnit = (name) => {
  const comp = varComponents.find((c) => c.name === name);
  return comp?.unit || "";
};

const getComponentCostPerUnit = (name) => {
  const comp = varComponents.find((c) => c.name === name);
  return Number(comp?.cost_per_unit || 0);
};

const componentHelpText =
  "Select the ingredients used in ONE product recipe, then enter the amount used. Example: 180 ml milk, 18 gram coffee beans, 15 ml syrup, 1 cup.";

  return (<div style={pageContainer}>
  <div style={headerStyle}>
    <div>
      <h1 style={mainTitle}>Products Management</h1>
      <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
        Manage your products, components, pricing, and categories.
      </p>
    </div>
    <button
      style={btnMainAdd}
      onClick={() => {
        setModalError("");
        setShowAddModal(true);
      }}
    >
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
           <div key={cat.id} id={`category-${cat.id}`} style={categoryCard}>

  <div style={categoryHeader}>
    <div>
  <div style={categoryTitleRow}>
    <h2 style={catTitleText}>{cat.name}</h2>

    <button
      style={categoryEditBtn}
      disabled={cat.is_virtual}
      onClick={() => {
        if (!cat.is_virtual) handleRenameCategory(cat);
      }}
      title="Rename Category"
    >
      <CiEdit size={19} strokeWidth={0.8} style={{ display: "block" }} />
    </button>

    <button
      style={categoryDeleteBtn}
      disabled={cat.is_virtual}
      onClick={() => {
        if (!cat.is_virtual) {
          setCategoryToDelete(cat);
          setShowCategoryDeleteConfirm(true);
        }
      }}
      title="Delete Category"
    >
      <FaRegTrashAlt size={14} style={{ transform: "translateY(-2px)" }} />
    </button>
  </div>

  {showEditCategoryInput && selectedCategory?.id === cat.id && (
    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
      <input
        style={{ ...inputFieldCustom, marginBottom: 0, maxWidth: "260px" }}
        value={editCatName}
        onChange={(e) => setEditCatName(e.target.value)}
        placeholder="Enter category name"
      />
<button
        style={{ ...btnCancelCustom, padding: "8px 14px" }}
        onClick={() => {
          setShowEditCategoryInput(false);
          setSelectedCategory(null);
          setEditCatName("");
        }}
      >
        Cancel
      </button>
      <button
  style={{ ...btnSaveCustom, padding: "8px 14px" }}
  onClick={async () => {
    const trimmedName = editCatName.trim();
    const currentName = cat.name.trim();

    if (!trimmedName) {
      showFeedback("danger", "Category name is required.", `category-${cat.id}`);
      return;
    }

    if (trimmedName === currentName) {
      showFeedback("warning", "No changes detected.", `category-${cat.id}`);
      return;
    }

    try {
      await api.put(`/products/categories/${cat.id}`, {
        name: trimmedName,
      });

      setShowEditCategoryInput(false);
      setSelectedCategory(null);
      setEditCatName("");

      showFeedback("success", "Category updated successfully.", `category-${cat.id}`);

      setTimeout(async () => {
        await invalidate();
      }, 800);
    } catch (err) {
      showFeedback(
        "danger",
        err.response?.data?.error || err.message || "Error updating category.",
        `category-${cat.id}`
      );
    }
  }}
>
  Save
</button>

      
    </div>
  )}

  <div style={badgeRow}>
    {(cat.rules || []).map((rule, idx) => (
      <span key={idx} style={orangeBadgeSmall}>
        {rule.name}
      </span>
    ))}
  </div>
</div>

  <button
  style={{
    ...btnAssignRules,
    opacity: cat.is_virtual ? 0.5 : 1,
    cursor: cat.is_virtual ? "not-allowed" : "pointer",
  }}
  disabled={cat.is_virtual}
  onClick={() => {
    if (cat.is_virtual) return;
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setTempSelectedRules((cat.rules || []).map((rule) => rule.id));
    setShowRulesModal(true);
  }}
>
  <CiLink size={20} strokeWidth={0.8} style={{ marginRight: "6px" }} />
  Assign Rules
</button>
                </div>

 {feedback.location === `category-${cat.id}` && (

    <Alert

      variant={feedback.type}

      onClose={() => setFeedback({ type: "", message: "", location: "" })}

      dismissible

      style={getFeedbackStyle(feedback.type)}

    >

      {feedback.message}

    </Alert>

  )}
  {cat.products && cat.products.length > 0 ? (

                  <div style={tableScrollWrap}>

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
                     {[...cat.products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((prod) => {
                        const comps = parseComponents(prod.components);
                        return (
                          <tr key={prod.id}>
                            <td style={tdStyle}>
                              <div style={productNameRow}>
                                <span style={prodNameText}>{prod.name}</span>
                                {prod.is_new && (
                                  <span
                                    style={draftWarningBadge}
                                    title="Action required: Please complete product components and details."
                                  >
                                    <i className="bi bi-exclamation-triangle-fill" />
                                    Action required
                                  </span>
                                )}
                              </div>
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
                                      <div key={i} style={recipeRowMini}>
  <span style={recipeNameMini}>{c.name}</span>
  <span style={recipeQtyMini}>
    {c.qty} {getComponentUnit(c.name)}
  </span>
</div>
                                    ))
                                  : "—"}
                              </div>
                            </td>

                            <td style={tdStyle}>
                              {formatNum(calculateTotalVcost(comps))} SAR
                            </td>
                            <td style={tdStyle}>{formatNum(prod.b_cost)} SAR</td>
                            <td style={tdStyle}>{formatNum(prod.c_price)} SAR</td>
                            <td
                              style={{
                                ...tdStyle,
                                color: "#27ae60",
                                fontWeight: "bold",
                              }}
                            >
                              {aiRecommendedPrices[prod.id]
  ? `${formatNum(aiRecommendedPrices[prod.id])} SAR`
  : prod.r_price
  ? `${formatNum(prod.r_price)} SAR`
  : "Analyze"}
                            </td>
                            
                            <td
                              style={{
                                ...tdStyle,
                                color: "#5b2d89",
                                fontWeight: "600",
                              }}
                            >
                             {Number(calculateAvg(prod.competitors_prices)) === 0 ? (
  <span className="help-icon" style={competitorZeroHint}>
    0.00 SAR
    <span className="tooltip" style={competitorTooltipBox}>
      No matching product was found in the market dataset.
      <br />
      The competitor average is shown as 0 SAR.
    </span>
  </span>
) : (
  <span>
    {calculateAvg(prod.competitors_prices)} SAR
  </span>
)}
                            </td>

                        <td style={tdStyle}>
  <div style={actionGroup}>
    <button
  style={actionBtnPurple}
  disabled={riskLoading}
  title="Analyze Pricing"
  onClick={() => handleAnalyzePricing(prod.id)}
>
  <ChartColumnDecreasing size={16} />
</button>

    <button
      style={actionBtnBlue}
      title="Assign Rules"
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
      <CiLink size={18} strokeWidth={0.8} />
    </button>

    <button
      style={actionBtnOrange}
      title="Edit Product"
      onClick={() => {
        setSelectedProduct({
          ...prod,
          components: comps,
        });
        setModalError("");
        setEditCatName("");
        setShowEditCategoryInput(false);
        setShowEditModal(true);
      }}
    >
      <CiEdit size={18} strokeWidth={0.8} />
    </button>

    <button
      style={actionBtnRed}
      title="Delete Product"
      onClick={() => {
        setProductIdToDelete(prod.id);
        setProductToDelete(prod);
        setShowDeleteConfirm(true);
      }}
    >
      <FaRegTrashAlt size={13} />
    </button>
  </div>
</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
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
{showRiskModal && (
  <div style={modalOverlay}>
    <div style={riskModalContent}>
      <h2 style={modalTitleCustom}>Pricing Risk Analysis</h2>

      {riskLoading && (
        <div style={riskLoadingBox}>
          <Spinner animation="border" size="sm" variant="primary" />
          <div>
            <strong>Analyzing pricing risk...</strong>
            <p style={{ margin: 0 }}>
              PriceWise is calculating costs, rules, market position, and AI recommendation.
            </p>
          </div>
        </div>
      )}

      {!riskLoading && riskResult && (
        <>
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
            <p><strong>Current Price:</strong> {formatNum(riskResult.product.current_price)} SAR</p>
<p><strong>Base Cost:</strong> {formatNum(riskResult.cost.base_cost)} SAR</p>
<p><strong>Component Cost:</strong> {formatNum(riskResult.cost.component_cost)} SAR</p>
<p><strong>Competitor Average:</strong> {formatNum(riskResult.market.competitor_average_price)} SAR</p>
<p><strong>Applied Margin:</strong> {riskResult.analysis.applied_margin}%</p>
<p><strong>Profit Per Unit:</strong> {formatNum(riskResult.analysis.profit_per_unit)} SAR</p>
           
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
        </>
      )}

      <div style={modalFooterCustom}>
        <button
          style={btnCancelCustom}
          onClick={() => {
            setShowRiskModal(false);
            setRiskResult(null);
            setRiskLoading(false);
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
           <div
  style={{
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#fff4e5",
    color: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  }}
>
  <RiAlertLine size={38} />
</div>
            <h3
              style={{
                ...modalTitleCustom,
                fontSize: "20px",
                marginBottom: "10px",
              }}
            >
              Delete Product?
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "25px",
              }}
            >
              This action cannot be undone. Product "{productToDelete?.name}" will be permanently removed.
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

 {showCategoryDeleteConfirm && categoryToDelete && (

        <div style={modalOverlay}>

          <div

            style={{

              ...modalContentCustom,

              width: "350px",

              textAlign: "center",

            }}

          >

            <div

              style={{

                width: "70px",

                height: "70px",

                borderRadius: "50%",

                background: "#fff4e5",

                color: "#f59e0b",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                margin: "0 auto 16px",

              }}

            >

              <RiAlertLine size={38} />

            </div>

            <h3 style={{ ...modalTitleCustom, fontSize: "20px", marginBottom: "10px" }}>

              Delete category?

            </h3>

            <p style={{ color: "#666", fontSize: "14px", marginBottom: "25px" }}>

              This action cannot be undone. Category "{categoryToDelete.name}" will be permanently removed.

            </p>

            <div style={{ ...modalFooterCustom, justifyContent: "center" }}>

              <button

                style={{ ...btnCancelCustom, padding: "10px 20px" }}

                onClick={() => {

                  setShowCategoryDeleteConfirm(false);

                  setCategoryToDelete(null);

                }}

              >

                Cancel

              </button>

              <button

                style={{

                  ...btnSaveCustom,

                  backgroundColor: "#e13421",

                  padding: "10px 20px",

                }}

                onClick={handleDeleteCategory}

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

            {feedback.location === "add-product-modal" && (
  <Alert
    variant={feedback.type}
    onClose={() => setFeedback({ type: "", message: "", location: "" })}
    dismissible
   style={getFeedbackStyle(feedback.type)}
  >
    {feedback.message}
  </Alert>
)}

            {modalError && (
              <Alert
                variant="danger"
                onClose={() => setModalError("")}
                dismissible
                style={formAlertStyle}
              >
                {modalError}
              </Alert>
            )}

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

  <span className="help-icon" style={helpIcon}>
  ?
  <span className="tooltip" style={tooltipBox}>
    Select the ingredients used in ONE product recipe, then enter the amount used.
    <br />
    Example: 180 ml milk, 18 gram coffee beans, 15 ml syrup, 1 cup.
  </span>
</span>

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
        <div key={comp.name} style={selectedRecipeChip}>
  <span style={selectedRecipeName}>{comp.name}</span>

  <input
    type="number"
    min="1"
    style={recipeQtyInput}
    value={comp.qty}
    onChange={(e) => updateQty(comp.name, e.target.value, false)}
  />

  <span style={recipeUnitText}>
    {getComponentUnit(comp.name)}
  </span>

  <button
    type="button"
    style={removeRecipeChipBtn}
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
                {categories
                  .filter((c) => !c.is_virtual)
                  .map((c) => (
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
  <>
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

    {categoryFeedback.message && (
  <div style={{ marginTop: "10px" }}>
    <Alert
      variant={categoryFeedback.type}
      onClose={() => setCategoryFeedback({ type: "", message: "" })}
      dismissible
      style={getFeedbackStyle(categoryFeedback.type)}
    >
      {categoryFeedback.message}
    </Alert>
  </div>
)}
  </>
)}


            </div>

            <div style={modalFooterCustom}>
             
              <button
                style={btnCancelCustom}
                onClick={() => {
                  setShowAddModal(false);
                  setModalError("");
                }}
              >
                Cancel
              </button>
               <button style={btnSaveCustom} onClick={handleSaveProduct}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div style={modalOverlay}>
          <div style={modalContentLarge}>
            <h2 style={modalTitleCustom}>Edit: {selectedProduct.name}</h2>

{feedback.location === "edit-product-modal" && (
  <Alert
    variant={feedback.type}
    onClose={() => setFeedback({ type: "", message: "", location: "" })}
    dismissible
    style={getFeedbackStyle(feedback.type)}
  >
    {feedback.message}
  </Alert>
)}
{
/*
{feedback.location === "edit-product-modal" && (
  <Alert
    variant={feedback.type}
    onClose={() => setFeedback({ type: "", message: "", location: "" })}
    dismissible
    style={inlineAlertStyle}
  >
    {feedback.message}
  </Alert>
)}
*/}

            {modalError && (
              <Alert
                variant="danger"
                onClose={() => setModalError("")}
                dismissible
                style={formAlertStyle}
              >
                {modalError}
              </Alert>
            )}

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
  <label style={labelStyle}>
    Components <span style={requiredStar}>*</span>
  <span className="help-icon" style={helpIcon}>
  ?
  <span className="tooltip" style={tooltipBox}>
    Select the ingredients used in ONE product recipe, then enter the amount used.
    <br />
    Example: 180 ml milk, 18 gram coffee beans, 15 ml syrup, 1 cup.
  </span>
</span>
  </label>

  <div style={compSelectionGrid}>
    {varComponents.map((comp) => {
      const isSelected = selectedProduct.components?.find(
        (c) => c.name === comp.name
      );

      return (
        <div key={comp.id} style={recipeComponentCard(isSelected)}>
          <div
            onClick={() => toggleComponent(comp.name, true)}
            style={recipeComponentName(isSelected)}
          >
            {comp.name}
          </div>

          {isSelected && (
            <>
              <input
                type="number"
                min="1"
                style={recipeQtyInput}
                value={isSelected.qty}
                onChange={(e) =>
                  updateQty(comp.name, e.target.value, true)
                }
              />

              <span style={recipeUnitText}>
                {comp.unit}
              </span>
            </>
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
                <label style={labelStyle}>
                  Category <span style={requiredStar}>*</span>
                </label>
                <select
                  style={inputFieldCustom}
                  value={selectedProduct.category_id || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter((c) => !c.is_virtual)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>

                {!showEditCategoryInput ? (
                  <button
                    style={btnLink}
                    onClick={() => setShowEditCategoryInput(true)}
                  >
                    + New Category
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                    <input
                      style={{ ...inputFieldCustom, marginBottom: 0 }}
                      placeholder="Enter Category Name..."
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                    />
                    <button
                      style={{
                        ...btnMainAdd,
                        padding: "5px 15px",
                        marginLeft: 0,
                      }}
                      onClick={() => handleAddNewCategory("edit")}
                    >
                      Add
                    </button>
                  </div>
                )}
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
             
              <button
                style={btnCancelCustom}
                onClick={() => {
                  setShowEditModal(false);
                  setModalError("");
                  setEditCatName("");
                  setShowEditCategoryInput(false);
                }}
              >
                Cancel
              </button>
               <button style={btnSaveCustom} onClick={handleUpdateProduct}>
                Save Changes
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
             
              <button
                style={btnCancelCustom}
                onClick={() => setShowRulesModal(false)}
              >
                Cancel
              </button>
               <button style={btnSaveCustom} onClick={handleSaveRules}>
                Assign Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



const pageContainer = {
  padding: "22px",
  maxWidth: 1200,
  backgroundColor: "transparent",
  minHeight: "100vh",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

const mainTitle = {

  fontSize: "34px",

  color: "#111827",

  fontWeight: "900",

  margin: 0,

};

const btnMainAdd = {
  backgroundColor: "#382372",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "900",
  fontSize: "17px",
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
  overflow: "visible",
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
  color: "#382372",
  fontWeight: "900",
  margin: 0,
};

const btnAssignRules = {
  backgroundColor: "#1273b4",
  color: "white",
  border: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  alignSelf: "center",   // ← prevents vertical stretching
  height: "fit-content", // ← extra safety net
};

const tableStyle = {

  width: "100%",
  borderCollapse: "collapse",
};
const tableScrollWrap = {
  width: "100%",
  overflowX: "visible",
  overflowY: "visible",
  paddingBottom: "8px",
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
  backgroundColor: "#1273b4",
  color: "white",
  fontSize: "10px",
  padding: "3px 8px",
  borderRadius: "5px",
  fontWeight: "bold",
};

const blueBadgeSmall = {
  backgroundColor: "#1273b4",
  color: "white",
  fontSize: "10px",
  padding: "3px 8px",
  borderRadius: "5px",
  marginTop: "5px",
  display: "inline-block",
};

const productNameRow = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const draftWarningBadge = {
  alignItems: "center",
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "999px",
  color: "#9a3412",
  display: "inline-flex",
  fontSize: "11px",
  fontWeight: "800",
  gap: "5px",
  lineHeight: 1,
  padding: "5px 8px",
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
  gap: "10px",
  alignItems: "center",
};

const actionBtnBase = {
  border: "none",
  color: "white",
  width: "38px",
  height: "38px",
  minWidth: "38px",
  maxWidth: "38px",
  minHeight: "38px",
  maxHeight: "38px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  padding: 0,
  lineHeight: 1,
  boxSizing: "border-box",
  flex: "0 0 38px",
};

const actionBtnPurple = {
  ...actionBtnBase,
  backgroundColor: "#5b2d89",
};

const actionBtnBlue = {
  ...actionBtnBase,
  backgroundColor: "#1273b4",
};

const actionBtnOrange = {
  ...actionBtnBase,
  backgroundColor: "#f59e0b",
};

const actionBtnRed = {
  ...actionBtnBase,
  backgroundColor: "#e13421",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
  zIndex: 1000,
};

const categoryTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const categoryEditBtn = {
  border: "none",
  backgroundColor: "#f59e0b",
  color: "white",
  width: "30px",
  height: "30px",
  borderRadius: "6px",
  cursor: "pointer",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const categoryDeleteBtn = {
  border: "none",
  backgroundColor: "#e13421",
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
  width: "760px",
  maxWidth: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalContentLarge = {
  ...modalContentCustom,
  width: "980px",
  maxWidth: "92vw",
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

const formAlertStyle = {
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "18px",
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

const recipeRowMini = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  padding: "4px 0",
  borderBottom: "1px dashed #eee",
  minWidth: "180px",
};

const recipeNameMini = {
  color: "#2d1b4e",
  fontWeight: "700",
  fontSize: "12px",
};

const recipeQtyMini = {
  color: "#666",
  fontWeight: "700",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const selectedRecipeChip = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#f9f6ff",
  border: "2px solid #5b2d89",
  color: "#2d1b4e",
  padding: "8px",
  borderRadius: "12px",
  fontWeight: "700",
};

const selectedRecipeName = {
  backgroundColor: "#5b2d89",
  color: "white",
  padding: "8px 12px",
  borderRadius: "9px",
  whiteSpace: "nowrap",
};

const removeRecipeChipBtn = {
  border: "none",
  backgroundColor: "transparent",
  color: "#5b2d89",
  fontSize: "18px",
  cursor: "pointer",
  lineHeight: "1",
  fontWeight: "900",
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

const helpIcon = {
  marginLeft: "6px",
  backgroundColor: "#eee",
  color: "#5b2d89",
  borderRadius: "50%",
  padding: "2px 7px",
  fontSize: "12px",
  cursor: "help",
  fontWeight: "bold",
  position: "relative",
};

const tooltipBox = {
  visibility: "hidden",
  opacity: 0,
  position: "absolute",
  left: 24,
  top: -8,
  width: 360,
  background: "#111827",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.6,
  zIndex: 10000,
  transition: "opacity 0.2s ease",
};

const removeChipBtn = {
  border: "none",
  backgroundColor: "transparent",
  color: "white",
  fontSize: "18px",
  cursor: "pointer",
  lineHeight: "1",
};

const competitorPriceHint = {
  position: "relative",
  cursor: "help",
  fontWeight: "700",
};

const competitorZeroHint = {
  position: "relative",
  cursor: "help",
  color: "#e67e22",
  fontWeight: "700",
};

const competitorTooltipBox = {
  visibility: "hidden",
  opacity: 0,
  position: "absolute",
  right: 0,
  top: 28,
  width: 260,
  background: "#111827",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.6,
  zIndex: 10000,
  transition: "opacity 0.2s ease",
};

const recipeComponentCard = (isSelected) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px",
  borderRadius: "12px",
  border: isSelected ? "2px solid #5b2d89" : "1px solid #ddd",
  backgroundColor: isSelected ? "#f9f6ff" : "#fff",
});

const recipeComponentName = (isSelected) => ({
  padding: "8px 12px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "700",
  backgroundColor: isSelected ? "#5b2d89" : "#f9f9f9",
  color: isSelected ? "#fff" : "#777",
  whiteSpace: "nowrap",
});

const recipeQtyInput = {
  width: "70px",
  padding: "7px",
  borderRadius: "8px",
  border: "2px solid #5b2d89",
  textAlign: "center",
  fontWeight: "bold",
};

const recipeUnitText = {
  fontSize: "12px",
  color: "#5b2d89",
  fontWeight: "800",
};

const requiredStar = {
  color: "#e74c3c",
  fontWeight: "bold",
};

const inlineAlertStyle = {
  marginBottom: "16px",
  borderRadius: "10px",
  fontWeight: "600",
};

const riskLoadingBox = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  backgroundColor: "#f9f6ff",
  borderLeft: "5px solid #5b2d89",
  padding: "18px",
  borderRadius: "14px",
  color: "#2d1b4e",
  fontSize: "14px",
};

const getFeedbackStyle = (type) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  background: type === "danger" ? "#fff1f2" : type === "warning" ? "#fffbeb" : "#f0fdf4",
  border:
    type === "danger"
      ? "1px solid #fecdd3"
      : type === "warning"
      ? "1px solid #fcd34d"
      : "1px solid #bbf7d0",
  color:
    type === "danger"
      ? "#9f1239"
      : type === "warning"
      ? "#92400e"
      : "#15803d",
  padding: "10px 14px",
  borderRadius: 12,
  marginBottom: 12,
  fontWeight: 600,
  fontSize: 14,
});




export default Products;
