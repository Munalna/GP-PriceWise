import React, { useState, useEffect } from "react";

// --- محاكاة جلب البيانات ---
const mockFetchCategories = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Hot Drinks",
          rules: [],
          products: [
            { id: 101, name: "Cappuccino", rules: [], components: "Coffee Beans, Milk", vCost: "8.50", bCost: "12.30", cPrice: "18.00", rPrice: "19.00", compPrice: "17.50" },
            { id: 102, name: "Latte", rules: [], components: "Coffee Beans, Milk", vCost: "9.20", bCost: "13.10", cPrice: "20.00", rPrice: "21.00", compPrice: "19.00" }
          ]
        },
        {
          id: 2,
          name: "Salads",
          rules: [],
          products: [
            { id: 201, name: "Caesar Salad", rules: [], components: "Lettuce", vCost: "15.00", bCost: "21.50", cPrice: "35.00", rPrice: "36.00", compPrice: "32.00" }
          ]
        }
      ]);
    }, 500);
  });

function Products() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showProdRulesModal, setShowProdRulesModal] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  // حقول الإضافة الجديدة
  const [newProdName, setNewProdName] = useState("");
  const [newProdComponents, setNewProdComponents] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [newCatName, setNewCatName] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempSelectedRules, setTempSelectedRules] = useState([]);

  useEffect(() => {
    mockFetchCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  // --- وظائف الحفظ والإضافة ---

  // 1. إضافة قسم جديد (من داخل المودال)
  const handleAddNewCategory = () => {
    if (!newCatName) return;
    const newCategory = {
      id: Date.now(),
      name: newCatName,
      rules: [],
      products: []
    };
    setCategories([...categories, newCategory]);
    setNewCatName("");
    setShowCategoryInput(false);
  };

  // 2. إضافة منتج جديد
  const handleSaveProduct = () => {
    if (!newProdName || !selectedCatId) {
        alert("Please enter name and select category");
        return;
    }

    const newProduct = {
      id: Date.now(),
      name: newProdName,
      rules: [],
      components: newProdComponents,
      vCost: "0.00", bCost: "0.00", cPrice: "0.00", rPrice: "0.00", compPrice: "0.00"
    };

    setCategories(categories.map(cat => 
      cat.id.toString() === selectedCatId.toString() 
      ? { ...cat, products: [...cat.products, newProduct] } 
      : cat
    ));

    setShowAddModal(false);
    setNewProdName("");
    setNewProdComponents("");
    setSelectedCatId("");
  };

  // 3. تعديل منتج (تحديث الأرقام فرونت أند)
  const handleUpdateProduct = () => {
    setCategories(categories.map(cat => ({
      ...cat,
      products: cat.products.map(p => 
        p.id === selectedProduct.id ? selectedProduct : p
      )
    })));
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (prodId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setCategories(categories.map(cat => ({
        ...cat,
        products: cat.products.filter(p => p.id !== prodId)
      })));
    }
  };

  const handleCheckboxChange = (rule) => {
    setTempSelectedRules(prev =>
      prev.includes(rule) ? prev.filter(r => r !== rule) : [...prev, rule]
    );
  };

  const saveCatRules = () => {
    setCategories(categories.map(cat => 
      cat.id === selectedCategory.id ? { ...cat, rules: tempSelectedRules } : cat
    ));
    setShowRulesModal(false);
  };

  const saveProdRules = () => {
    setCategories(categories.map(cat => ({
      ...cat,
      products: cat.products.map(p => 
        p.id === selectedProduct.id ? { ...p, rules: tempSelectedRules } : p
      )
    })));
    setShowProdRulesModal(false);
  };

  if (loading) return <div style={{padding: "50px", textAlign: "center"}}>Loading Products...</div>;

  return (
    <div style={pageContainer}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: "28px", color: "#333", margin: 0 }}>Products Management</h1>
        <button style={btnPrimary} onClick={() => setShowAddModal(true)}>+ Add Product</button>
      </div>

      {categories.map(cat => (
        <div key={cat.id} style={categoryCard}>
          <div style={categoryHeader}>
            <div>
              <h2 style={{ fontSize: "20px", color: "#5b2d89", margin: 0 }}>{cat.name}</h2>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                {cat.rules.map((rule, idx) => (
                  <span key={idx} style={orangeBadgeSmall}>{rule}</span>
                ))}
              </div>
            </div>
            <button style={btnWarning} onClick={() => { setSelectedCategory(cat); setTempSelectedRules(cat.rules); setShowRulesModal(true); }}>
              <span style={{marginRight: "5px"}}>🔗</span> Assign Rules
            </button>
          </div>

          {cat.products.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={thStyle}>Product Name</th>
                  <th style={thStyle}>Components</th>
                  <th style={thStyle}>Variable Cost</th>
                  <th style={thStyle}>Base Cost</th>
                  <th style={thStyle}>Current Price</th>
                  <th style={thStyle}>Recommended Price</th>
                  <th style={thStyle}>Competitor Price</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cat.products.map(prod => (
                  <tr key={prod.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: "bold" }}>{prod.name}</div>
                      {prod.rules.map((r, i) => ( <div key={i} style={blueBadgeSmall}>{r}</div> ))}
                    </td>
                    <td style={tdStyle}>{prod.components}</td>
                    <td style={tdStyle}>{prod.vCost} SAR</td>
                    <td style={tdStyle}>{prod.bCost} SAR</td>
                    <td style={tdStyle}>{prod.cPrice} SAR</td>
                    <td style={{ ...tdStyle, color: "#27ae60", fontWeight: "bold" }}>{prod.rPrice} SAR</td>
                    <td style={tdStyle}>{prod.compPrice} SAR</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={actionBtnBlue} onClick={() => { setSelectedProduct(prod); setTempSelectedRules(prod.rules); setShowProdRulesModal(true); }}>🔗</button>
                        <button style={actionBtnOrange} onClick={() => { setSelectedProduct(prod); setShowEditModal(true); }}>✏️</button>
                        <button style={actionBtnRed} onClick={() => handleDeleteProduct(prod.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "30px", color: "#999", fontStyle: "italic" }}>No products yet</div>
          )}
        </div>
      ))}

      {/* --- Add Product Modal --- */}
      {showAddModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ color: "#5b2d89" }}>Add Product</h2>
            <div style={inputGroup}>
              <label style={labelStyle}>Product Name</label>
              <input 
                type="text" 
                placeholder="Enter product name" 
                style={inputField} 
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
              />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Components</label>
              <input 
                type="text" 
                placeholder="e.g., Coffee Beans, Milk" 
                style={inputField} 
                value={newProdComponents}
                onChange={(e) => setNewProdComponents(e.target.value)}
              />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Category</label>
              <select 
                style={inputField} 
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {!showCategoryInput ? (
                <button style={btnLink} onClick={() => setShowCategoryInput(true)}>+ Add New Category</button>
              ) : (
                <div style={{ marginTop: "10px", display: "flex", gap: "5px" }}>
                  <input 
                    type="text" 
                    placeholder="Category Name" 
                    style={inputField} 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button style={{...btnPrimary, padding: "5px 10px"}} onClick={handleAddNewCategory}>Add</button>
                </div>
              )}
            </div>
            <div style={modalFooter}>
              <button style={btnCancel} onClick={() => {setShowAddModal(false); setShowCategoryInput(false);}}>Cancel</button>
              <button style={btnPrimary} onClick={handleSaveProduct}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Product Modal (المعدل لحفظ الأرقام) --- */}
      {showEditModal && selectedProduct && (
        <div style={modalOverlay}>
          <div style={modalContentLarge}>
            <h2 style={{ color: "#5b2d89", marginBottom: "20px" }}>Edit Product: {selectedProduct.name}</h2>
            <div style={gridTwoCols}>
              <div style={inputGroup}>
                <label style={labelStyle}>Product Name</label>
                <input type="text" value={selectedProduct.name} style={inputField} 
                  onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Components</label>
                <input type="text" value={selectedProduct.components} style={inputField} 
                  onChange={(e) => setSelectedProduct({...selectedProduct, components: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Variable Cost (SAR)</label>
                <input type="text" value={selectedProduct.vCost} style={inputField} 
                  onChange={(e) => setSelectedProduct({...selectedProduct, vCost: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Base Cost (SAR)</label>
                <input type="text" value={selectedProduct.bCost} style={inputField} 
                  onChange={(e) => setSelectedProduct({...selectedProduct, bCost: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Current Price (SAR)</label>
                <input type="text" value={selectedProduct.cPrice} style={inputField} 
                  onChange={(e) => setSelectedProduct({...selectedProduct, cPrice: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Competitor Price (SAR)</label>
                <input type="text" value={selectedProduct.compPrice} style={inputField} 
                  onChange={(e) => setSelectedProduct({...selectedProduct, compPrice: e.target.value})} />
              </div>
            </div>
            <div style={modalFooter}>
              <button style={btnCancel} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button style={btnPrimary} onClick={handleUpdateProduct}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Rules Modals --- */}
      {(showRulesModal || showProdRulesModal) && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{fontSize: "20px"}}>Assign Pricing Rules</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px"}}>
              {pricingRules.map((rule, i) => (
                <div key={i} style={ruleCard(tempSelectedRules.includes(rule.title))} onClick={() => handleCheckboxChange(rule.title)}>
                  <input type="checkbox" checked={tempSelectedRules.includes(rule.title)} readOnly />
                  <div style={{marginLeft: "10px"}}>
                    <div style={{fontWeight: "bold", fontSize: "14px"}}>{rule.title}</div>
                    <div style={{fontSize: "12px", color: "#888"}}>{rule.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={modalFooter}>
              <button style={btnCancel} onClick={() => {setShowRulesModal(false); setShowProdRulesModal(false);}}>Cancel</button>
              <button style={btnPrimary} onClick={showRulesModal ? saveCatRules : saveProdRules}>Assign Rules</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pricingRules = [
  { title: "Minimum 30% Margin", desc: "Minimum Margin • 30%" },
  { title: "Round to Nearest 5", desc: "Rounding • 5 SAR" },
  { title: "Max Price Cap", desc: "Maximum Price • 50 SAR" }
];


const pageContainer = { padding: "40px", backgroundColor: "#f4f7f9", minHeight: "100vh" };
const headerStyle = { display: "flex", justifyContent: "space-between", marginBottom: "30px" };
const categoryCard = { backgroundColor: "white", borderRadius: "12px", padding: "24px", marginBottom: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" };
const categoryHeader = { display: "flex", justifyContent: "space-between", borderBottom: "2px solid #5b2d89", paddingBottom: "15px", marginBottom: "20px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "12px", textAlign: "left", fontSize: "13px", color: "#777", borderBottom: "1px solid #eee" };
const tdStyle = { padding: "12px", fontSize: "14px", borderBottom: "1px solid #f9f9f9" };
const btnPrimary = { backgroundColor: "#2d1b4e", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const btnWarning = { backgroundColor: "#f39c12", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" };
const btnCancel = { backgroundColor: "#f1f1f1", color: "#333", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const btnLink = { background: "none", border: "none", color: "#5b2d89", cursor: "pointer", fontWeight: "bold", marginTop: "10px" };
const actionBtnBase = { border: "none", color: "white", padding: "6px", borderRadius: "6px", cursor: "pointer", width: "30px" };
const actionBtnBlue = { ...actionBtnBase, backgroundColor: "#3498db" };
const actionBtnOrange = { ...actionBtnBase, backgroundColor: "#f39c12" };
const actionBtnRed = { ...actionBtnBase, backgroundColor: "#e74c3c" };
const orangeBadgeSmall = { backgroundColor: "#f39c12", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" };
const blueBadgeSmall = { backgroundColor: "#3498db", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", marginTop: "4px", display: "inline-block" };
const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContent = { backgroundColor: "white", padding: "30px", borderRadius: "15px", width: "500px" };
const modalContentLarge = { ...modalContent, width: "700px" };
const modalFooter = { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "30px" };
const gridTwoCols = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const inputGroup = { marginBottom: "15px" };
const labelStyle = { display: "block", marginBottom: "8px", fontWeight: "bold" };
const inputField = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" };
const ruleCard = (isSelected) => ({
  display: "flex", alignItems: "center", padding: "15px", borderRadius: "10px", border: isSelected ? "2px solid #5b2d89" : "1px solid #eee", cursor: "pointer", backgroundColor: isSelected ? "#f9f6ff" : "white"
});

export default Products;