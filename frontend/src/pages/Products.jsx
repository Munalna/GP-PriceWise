import React, { useState, useEffect, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_URL = "http://localhost:3000/api/products";

function Products() {
  const [categories, setCategories] = useState([]);
  const [varComponents, setVarComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  const [newProd, setNewProd] = useState({
    name: "", components: [], category_id: ""
  });
  const [newCatName, setNewCatName] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tempSelectedRules, setTempSelectedRules] = useState([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const authHeader = { 'user-id': userId };
      const response = await fetch(API_URL, { headers: authHeader });
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);

      const vcRes = await fetch(`${API_URL}/var-components`, { headers: authHeader });
      const vcData = await vcRes.json();
      setVarComponents(Array.isArray(vcData) ? vcData : []);

      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const getAuthenticatedUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setLoading(false);
        console.error("No active session found. Please login.");
      }
    };
    getAuthenticatedUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

  const calculateTotalVcost = (prodComponents) => {
    if (!prodComponents || !Array.isArray(prodComponents)) return 0;
    return prodComponents.reduce((sum, item) => {
      const dbInfo = varComponents.find(c => c.name === item.name);
      const unitCost = dbInfo ? Number(dbInfo.cost_per_unit) : 0;
      const quantity = Number(item.qty) || 0;
      return sum + (unitCost * quantity);
    }, 0);
  };

  const toggleComponent = (name, isEdit = false) => {
    const target = isEdit ? selectedProduct : newProd;
    let updatedComps = [...(target.components || [])];
    const index = updatedComps.findIndex(c => c.name === name);

    if (index > -1) {
      updatedComps = updatedComps.filter(c => c.name !== name);
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
    
    let updatedComps = target.components.map(c => 
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({ name: newCatName })
      });
      if (res.ok) {
        await loadData();
        setNewCatName("");
        setShowCategoryInput(false);
      }
    } catch (err) { alert("Error adding category"); }
  };

  const handleSaveProduct = async () => {
    if (!newProd.name || !newProd.category_id) return alert("Please fill Name and Category");
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
            ...newProd,
            components: JSON.stringify(newProd.components),
            v_cost: calculateTotalVcost(newProd.components).toString(), 
            b_cost: "0.00", c_price: "0.00", comp_price: "0.00"
        })
      });
      if (res.ok) {
        await loadData();
        setShowAddModal(false);
        setNewProd({ name: "", components: [], category_id: "" });
      }
    } catch (err) { alert("Error saving product"); }
  };

  const handleUpdateProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          ...selectedProduct,
          components: JSON.stringify(selectedProduct.components),
          v_cost: calculateTotalVcost(selectedProduct.components).toString(),
          c_price: selectedProduct.c_price,
          comp_price: selectedProduct.comp_price,
          b_cost: selectedProduct.b_cost // إرسال التكلفة الأساسية الجديدة
        })
      });
      if (res.ok) {
        await loadData(); 
        setShowEditModal(false);
      }
    } catch (err) { alert("Error updating product"); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: { 'user-id': userId }
      });
      if (res.ok) await loadData();
    } catch (err) { alert("Error deleting product"); }
  };

  const handleSaveRules = async () => {
    const targetType = selectedProduct ? "products" : "categories";
    const targetId = selectedProduct ? selectedProduct.id : selectedCategory.id;
    try {
      const res = await fetch(`${API_URL}/${targetType}/${targetId}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({ rules: tempSelectedRules })
      });
      if (res.ok) {
        await loadData();
        setShowRulesModal(false);
      }
    } catch (err) {
      alert("Error saving rules");
    }
  };

  const parseComponents = (compData) => {
    if (!compData) return [];
    if (Array.isArray(compData)) return compData;
    try { return JSON.parse(compData); } catch(e) { return []; }
  };

  if (loading) return <div style={loadingStyle}>Loading...</div>;
  if (!userId) return <div style={loadingStyle}>Please log in to view your products.</div>;

  return (
    <div style={pageContainer}>
      <div style={headerStyle}>
        <h1 style={mainTitle}>Products Management</h1>
        <button style={btnMainAdd} onClick={() => setShowAddModal(true)}>+ Add Product</button>
      </div>

      {categories.length === 0 ? (
        <div style={emptySimpleStyle}>There is no product yet</div>
      ) : (
        categories.map(cat => (
          <div key={cat.id} style={categoryCard}>
            <div style={categoryHeader}>
              <div>
                <h2 style={catTitleText}>{cat.name}</h2>
                <div style={badgeRow}>
                  {(cat.rules || []).map((rule, idx) => <span key={idx} style={orangeBadgeSmall}>{rule}</span>)}
                </div>
              </div>
              <button style={btnAssignRules} onClick={() => { 
                setSelectedCategory(cat); 
                setSelectedProduct(null); 
                setTempSelectedRules(cat.rules || []); 
                setShowRulesModal(true); 
              }}>🔗 Assign Rules</button>
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
                    <th style={thStyle}>Competitor</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.products.map(prod => {
                    const comps = parseComponents(prod.components);
                    return (
                      <tr key={prod.id}>
                        <td style={tdStyle}>
                          <div style={prodNameText}>{prod.name}</div>
                          {(prod.rules || []).map((r, i) => <div key={i} style={blueBadgeSmall}>{r}</div>)}
                        </td>
                        <td style={tdStyle}>
                          <div style={{display:'flex', flexWrap:'wrap', gap:'4px'}}>
                            {comps.length > 0 ? comps.map((c, i) => (
                              <span key={i} style={compBadgeStyle}>{c.name} {c.qty}</span>
                            )) : "—"}
                          </div>
                        </td>
                        <td style={tdStyle}>{calculateTotalVcost(comps)} SAR</td>
                        <td style={tdStyle}>{prod.b_cost} SAR</td>
                        <td style={tdStyle}>{prod.c_price} SAR</td>
                        <td style={{ ...tdStyle, color: "#27ae60", fontWeight: "bold" }}>{prod.r_price} SAR</td>
                        <td style={tdStyle}>{prod.comp_price} SAR</td>
                        <td style={tdStyle}>
                          <div style={actionGroup}>
                            <button style={actionBtnBlue} onClick={() => { 
                              setSelectedProduct({...prod, components: comps}); 
                              setSelectedCategory(null);
                              setTempSelectedRules(prod.rules || []); 
                              setShowRulesModal(true); 
                            }}>🔗</button>
                            <button style={actionBtnOrange} onClick={() => { setSelectedProduct({...prod, components: comps}); setShowEditModal(true); }}>✏️</button>
                            <button style={actionBtnRed} onClick={() => handleDeleteProduct(prod.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div style={emptyPlaceholderText}>No products in this category.</div>
            )}
          </div>
        ))
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div style={modalOverlay}>
          <div style={modalContentCustom}>
            <h2 style={modalTitleCustom}>Add New Product</h2>
            <div style={inputGroup}>
              <label style={labelStyle}>Product Name</label>
              <input style={inputFieldCustom} placeholder="Enter name" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Components</label>
              <div style={compSelectionGrid}>
                {varComponents.map(comp => {
                  const isSelected = newProd.components.find(c => c.name === comp.name);
                  return (
                    <div key={comp.id} style={compItemWrapper}>
                      <div onClick={() => toggleComponent(comp.name, false)} style={isSelected ? activeCompBox : inactiveCompBox}>{comp.name}</div>
                      {isSelected && (
                        <input type="number" min="0" style={qtyInputSmall} value={isSelected.qty} onChange={(e) => updateQty(comp.name, e.target.value, false)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Category</label>
              <select style={inputFieldCustom} value={newProd.category_id} onChange={e => setNewProd({...newProd, category_id: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {!showCategoryInput ? (
                <button style={btnLink} onClick={() => setShowCategoryInput(true)}>+ New Category</button>
              ) : (
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <input style={{...inputFieldCustom, marginBottom: 0}} placeholder="Enter Category Name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                  <button style={{...btnMainAdd, padding: '5px 15px', marginLeft: '0'}} onClick={handleAddNewCategory}>Add</button>
                </div>
              )}
            </div>
            <div style={modalFooterCustom}>
              <button style={btnCancelCustom} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={btnSaveCustom} onClick={handleSaveProduct}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && selectedProduct && (
        <div style={modalOverlay}>
          <div style={modalContentLarge}>
            <h2 style={modalTitleCustom}>Edit: {selectedProduct.name}</h2>
            <div style={gridTwoCols}>
              <div style={inputGroup}>
                <label style={labelStyle}>Product Name</label>
                <input style={inputFieldCustom} value={selectedProduct.name} onChange={e => setSelectedProduct({...selectedProduct, name: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Components</label>
                <div style={compSelectionGrid}>
                  {varComponents.map(comp => {
                    const isSelected = selectedProduct.components?.find(c => c.name === comp.name);
                    return (
                      <div key={comp.id} style={compItemWrapper}>
                        <div onClick={() => toggleComponent(comp.name, true)} style={isSelected ? activeCompBox : inactiveCompBox}>{comp.name}</div>
                        {isSelected && (
                          <input type="number" min="0" style={qtyInputSmall} value={isSelected.qty} onChange={(e) => updateQty(comp.name, e.target.value, true)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div style={inputGroup}>
                <label style={labelStyle}>Current Price (SAR)</label>
                <input type="text" placeholder="0.00" style={inputFieldCustom} value={selectedProduct.c_price || ""} onChange={e => setSelectedProduct({...selectedProduct, c_price: e.target.value})} />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Competitor Price (SAR)</label>
                <input type="text" placeholder="0.00" style={inputFieldCustom} value={selectedProduct.comp_price || ""} onChange={e => setSelectedProduct({...selectedProduct, comp_price: e.target.value})} />
              </div>

              {}
              <div style={inputGroup}>
                <label style={labelStyle}>Base Cost (SAR)</label>
                <input 
                  type="text" 
                  placeholder="0.00" 
                  style={inputFieldCustom} 
                  value={selectedProduct.b_cost || ""} 
                  onChange={e => setSelectedProduct({...selectedProduct, b_cost: e.target.value})} 
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Variable Cost</label>
                <input style={{...inputFieldCustom, backgroundColor: '#f9f9f9'}} disabled value={calculateTotalVcost(selectedProduct.components)} />
              </div>
            </div>
            <div style={modalFooterCustom}>
              <button style={btnCancelCustom} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button style={btnSaveCustom} onClick={handleUpdateProduct}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showRulesModal && (
        <div style={modalOverlay}>
          <div style={modalContentCustom}>
            <h2 style={modalTitleCustom}>Pricing Rules</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {pricingRules.map((rule, i) => (
                <div key={i} style={ruleCardStyle(tempSelectedRules.includes(rule.title))} onClick={() => {
                   setTempSelectedRules(prev => prev.includes(rule.title) ? prev.filter(r => r !== rule.title) : [...prev, rule.title]);
                }}>
                  <input type="checkbox" checked={tempSelectedRules.includes(rule.title)} readOnly />
                  <div style={{marginLeft: '10px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '14px'}}>{rule.title}</div>
                    <div style={{fontSize: '11px', color: '#888'}}>{rule.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={modalFooterCustom}>
              <button style={btnCancelCustom} onClick={() => setShowRulesModal(false)}>Cancel</button>
              <button style={btnSaveCustom} onClick={handleSaveRules}>Assign Rules</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pricingRules = [
  { title: "Minimum 30% Margin", desc: "Ensure price stays above 30% profit" },
  { title: "Round to Nearest 5", desc: "Prices like 18.5 become 20.00" },
  { title: "Max Price Cap", desc: "Never exceed 50.00 SAR" }
];

const pageContainer = { padding: "40px", backgroundColor: "#f8f9fc", minHeight: "100vh" };
const headerStyle = { display: "flex", justifyContent: "space-between", marginBottom: "30px", alignItems: "center" };
const mainTitle = { fontSize: "32px", color: "#2d1b4e", fontWeight: "700", margin: 0 };
const btnMainAdd = { backgroundColor: "#2d1b4e", color: "white", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", marginLeft: "100px" };
const emptySimpleStyle = { textAlign: "center", padding: "100px 20px", color: "#a0a0a0", fontSize: "14px", letterSpacing: "0.5px", fontWeight: "500" };
const categoryCard = { backgroundColor: "white", borderRadius: "15px", padding: "25px", marginBottom: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" };
const categoryHeader = { display: "flex", justifyContent: "space-between", borderBottom: "2px solid #5b2d89", paddingBottom: "15px", marginBottom: "20px" };
const catTitleText = { fontSize: "22px", color: "#5b2d89", margin: 0 };
const btnAssignRules = { backgroundColor: "#f39c12", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "12px", color: "#888", fontSize: "13px", borderBottom: "1px solid #eee" };
const tdStyle = { padding: "15px 12px", fontSize: "14px", borderBottom: "1px solid #f9f9f9" };
const badgeRow = { display: "flex", gap: "8px", marginTop: "8px" };
const orangeBadgeSmall = { backgroundColor: "#f39c12", color: "white", fontSize: "10px", padding: "3px 8px", borderRadius: "5px", fontWeight: "bold" };
const blueBadgeSmall = { backgroundColor: "#3498db", color: "white", fontSize: "10px", padding: "3px 8px", borderRadius: "5px", marginTop: "5px", display: "inline-block" };
const compBadgeStyle = { backgroundColor: "#f1f2f6", color: "#555", fontSize: "11px", padding: "3px 8px", borderRadius: "12px", fontWeight: "500", border: "1px solid #e1e2e6" };
const prodNameText = { fontWeight: "600", color: "#2d1b4e" };
const actionGroup = { display: "flex", gap: "8px" };
const actionBtnBase = { border: "none", color: "white", width: "32px", height: "32px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const actionBtnBlue = { ...actionBtnBase, backgroundColor: "#3498db" };
const actionBtnOrange = { ...actionBtnBase, backgroundColor: "#f39c12" };
const actionBtnRed = { ...actionBtnBase, backgroundColor: "#e74c3c" };
const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentCustom = { backgroundColor: "white", padding: "35px", borderRadius: "25px", width: "450px" };
const modalContentLarge = { ...modalContentCustom, width: "750px" };
const modalTitleCustom = { fontSize: "28px", color: "#5b2d89", marginBottom: "25px", fontWeight: "700" };
const inputFieldCustom = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "15px", boxSizing: "border-box" };
const modalFooterCustom = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" };
const btnCancelCustom = { backgroundColor: "#f0f0f0", color: "#666", border: "none", padding: "12px 25px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" };
const btnSaveCustom = { backgroundColor: "#2d1b4e", color: "white", border: "none", padding: "12px 30px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" };
const btnLink = { background: "none", border: "none", color: "#5b2d89", fontWeight: "bold", cursor: "pointer", marginBottom: "10px", display: "block" };
const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "600", color: "#555", fontSize: '13px' };
const gridTwoCols = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const inputGroup = { marginBottom: "15px" };
const emptyPlaceholderText = { textAlign: "center", padding: "40px", color: "#999", fontStyle: "italic", fontSize: "14px" };
const loadingStyle = { textAlign: "center", padding: "100px", fontSize: "20px", color: "#5b2d89" };
const compSelectionGrid = { display: "flex", flexWrap: "wrap", gap: "10px", border: "1px solid #eee", padding: "15px", borderRadius: "12px", maxHeight: "200px", overflowY: "auto" };
const compItemWrapper = { display: "flex", alignItems: "center", gap: "5px" };
const baseCompBox = { padding: "8px 15px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", transition: "0.2s", fontWeight: "500", border: "1px solid #ddd" };
const activeCompBox = { ...baseCompBox, backgroundColor: "#5b2d89", color: "white", borderColor: "#5b2d89" };
const inactiveCompBox = { ...baseCompBox, backgroundColor: "#f9f9f9", color: "#777" };
const qtyInputSmall = { width: "55px", padding: "6px", borderRadius: "6px", border: "2px solid #5b2d89", textAlign: "center", fontWeight: "bold" };
const ruleCardStyle = (isSelected) => ({ display: "flex", alignItems: "center", padding: "12px", borderRadius: "12px", border: isSelected ? "2px solid #5b2d89" : "1px solid #eee", cursor: "pointer", backgroundColor: isSelected ? "#f9f6ff" : "white" });

export default Products;