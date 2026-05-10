import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import api from "../../services/api";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCategoryId(categoryId) {
  if (!categoryId) return "";
  return String(categoryId).trim();
}

export default function ProductForm({
  product,
  categories = [],
  onSaved,
  onCancel,
  onCategoryCreated,
}) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    b_cost: "0",
    c_price: "0",
    comp_price: "0",
    components: [],
    is_new: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!product) return;

    let components = product.components || [];
    if (typeof components === "string") {
      try {
        components = JSON.parse(components);
      } catch (parseError) {
        console.error("Failed to parse product components:", parseError, product);
        components = [];
      }
    }

    setFormData({
      name: product.name || "",
      category_id: normalizeCategoryId(product.category_id),
      b_cost: product.b_cost ?? "0",
      c_price: product.c_price ?? "0",
      comp_price: product.comp_price ?? "0",
      components: Array.isArray(components) ? components : [],
      is_new: Boolean(product.is_new),
    });
  }, [product]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      setError("");
      const { data: category } = await api.post("/products/categories", { name });
      setLocalCategories((current) => [...current, category]);
      setFormData((current) => ({ ...current, category_id: category.id }));
      setNewCategoryName("");
      setShowCategoryInput(false);
      if (onCategoryCreated) onCategoryCreated(category);
    } catch (categoryError) {
      console.error("ProductForm category create error:", {
        message: categoryError.message,
        response: categoryError.response?.data,
        status: categoryError.response?.status,
      });
      setError(
        categoryError.response?.data?.error ||
          categoryError.message ||
          "Failed to create category."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const productId = product?.id || product?.product_id;
    const categoryId = normalizeCategoryId(formData.category_id);

    if (!productId || !uuidRegex.test(String(productId))) {
      setError("Invalid product id.");
      console.error("ProductForm invalid product id:", { productId, product });
      return;
    }

    if (!categoryId || !uuidRegex.test(categoryId)) {
      setError("Please select a valid category.");
      console.error("ProductForm invalid category_id:", {
        categoryId,
        selectedValue: formData.category_id,
        categories,
      });
      return;
    }

    if (!Array.isArray(formData.components) || formData.components.length === 0) {
      setError("At least one component is required.");
      console.error("ProductForm missing components:", {
        productId,
        components: formData.components,
      });
      return;
    }

    const payload = {
      product_id: productId,
      name: formData.name.trim(),
      category_id: categoryId,
      b_cost: Number(formData.b_cost) || 0,
      c_price: Number(formData.c_price) || 0,
      comp_price: Number(formData.comp_price) || 0,
      components: JSON.stringify(formData.components || []),
      is_new: false,
    };

    try {
      setSaving(true);
      console.log("ProductForm update payload:", payload);

      const { data } = await api.put(`/products/${productId}`, payload);

      console.log("ProductForm update succeeded:", data);
      if (onSaved) onSaved(data);
    } catch (submitError) {
      console.error("ProductForm submit error:", {
        message: submitError.message,
        response: submitError.response?.data,
        status: submitError.response?.status,
        payload,
      });
      setError(
        submitError.response?.data?.error ||
          submitError.message ||
          "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Product Name</Form.Label>
        <Form.Control
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Category</Form.Label>
        <Form.Select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
        >
          <option value="">Select category</option>
          {localCategories
            .filter((category) => !category.is_virtual)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </Form.Select>
        {!showCategoryInput ? (
          <Button
            className="mt-2"
            size="sm"
            type="button"
            variant="outline-primary"
            onClick={() => setShowCategoryInput(true)}
          >
            + New Category
          </Button>
        ) : (
          <div className="d-flex gap-2 mt-2">
            <Form.Control
              placeholder="Enter category name..."
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <Button type="button" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Base Cost</Form.Label>
        <Form.Control
          min="0"
          name="b_cost"
          type="number"
          value={formData.b_cost}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Current Price</Form.Label>
        <Form.Control
          min="0"
          name="c_price"
          type="number"
          value={formData.c_price}
          onChange={handleChange}
        />
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving && <Spinner animation="border" className="me-2" size="sm" />}
          Save Product
        </Button>
      </div>
    </Form>
  );
}
