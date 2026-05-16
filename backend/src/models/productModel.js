import { supabase } from "../config/supabase.js";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuid(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const normalized = String(value).trim();
  return uuidRegex.test(normalized) ? normalized : null;
}

function logSupabaseError(context, error, metadata = {}) {
  if (!error) return;

  console.error(`[Supabase ${context}]`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    metadata,
  });
}

// جلب البيانات مع دمج الجداول لضمان حساب المتوسط + جلب الرولز المرتبطة
export const getAllProducts = async (userId) => {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*, products(*)")
    .eq("user_id", userId);

  if (error) {
    logSupabaseError("getAllProducts.categories", error, { userId });
    throw error;
  }

  const { data: uncategorizedProducts, error: uncategorizedError } =
    await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .is("category_id", null);

  if (uncategorizedError) {
    logSupabaseError("getAllProducts.uncategorizedProducts", uncategorizedError, {
      userId,
    });
    throw uncategorizedError;
  }

  const [res1, res2, assignmentsRes] = await Promise.all([
    supabase.from("marketdataset").select("itemname, price"),
    supabase.from("market_dataset").select("product_name, price"),
    supabase
      .from("pricing_rule_assignments")
      .select(`
        id,
        target_type,
        target_id,
        pricing_rules (
          id,
          name,
          type,
          value
        )
      `)
      .eq("user_id", userId),
  ]);

  if (assignmentsRes.error) {
    logSupabaseError("getAllProducts.pricingRuleAssignments", assignmentsRes.error, {
      userId,
    });
    throw assignmentsRes.error;
  }

  const marketData1 = res1.data || [];
  const marketData2 = res2.data || [];
  const assignments = assignmentsRes.data || [];

  const sourceCategories = [...(categories || [])];

  if ((uncategorizedProducts || []).length > 0) {
    sourceCategories.unshift({
      id: "uncategorized-drafts",
      name: "Uncategorized Drafts",
      user_id: userId,
      products: uncategorizedProducts,
      is_virtual: true,
    });
  }

  const processedCategories = sourceCategories.map((cat) => {
    const categoryRules = assignments
      .filter(
        (assignment) =>
          assignment.target_type === "category" &&
          String(assignment.target_id) === String(cat.id)
      )
      .map((assignment) => assignment.pricing_rules)
      .filter(Boolean);

    return {
      ...cat,
      rules: categoryRules,

      products: (cat.products || []).map((prod) => {
        const searchName = prod.name?.trim().toLowerCase();

        const prices1 = marketData1
          .filter(
            (item) => item.itemname?.trim().toLowerCase() === searchName
          )
          .map((item) => Number(item.price))
          .filter((price) => Number.isFinite(price));

        const prices2 = marketData2
          .filter(
            (item) => item.product_name?.trim().toLowerCase() === searchName
          )
          .map((item) => Number(item.price))
          .filter((price) => Number.isFinite(price));

        const allRelatedPrices = [...prices1, ...prices2];

        const productRules = assignments
          .filter(
            (assignment) =>
              assignment.target_type === "product" &&
              String(assignment.target_id) === String(prod.id)
          )
          .map((assignment) => assignment.pricing_rules)
          .filter(Boolean);

        return {
          ...prod,
          competitors_prices: allRelatedPrices,
          rules: productRules,
        };
      }),
    };
  });

  return processedCategories;
};

// جلب المكونات
export const getVariableComponentsList = async (userId) => {
  const { data, error } = await supabase
    .from("variable_components")
    .select("*")
    .eq("owner_id", userId);

  if (error) throw error;
  return data || [];
};

// حفظ الرولز المرتبطة بمنتج أو كاتيقوري
export const assignPricingRulesToTarget = async (
  userId,
  targetType,
  targetId,
  ruleIds
) => {
  const normalizedTargetType =
    targetType === "products"
      ? "product"
      : targetType === "categories"
      ? "category"
      : targetType;

  const { error: deleteError } = await supabase
    .from("pricing_rule_assignments")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", normalizedTargetType)
    .eq("target_id", targetId);

  if (deleteError) throw deleteError;

  if (!ruleIds || ruleIds.length === 0) return [];

  const rows = ruleIds.map((ruleId) => ({
    user_id: userId,
    rule_id: ruleId,
    target_type: normalizedTargetType,
    target_id: targetId,
  }));

  const { data, error } = await supabase
    .from("pricing_rule_assignments")
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
};

// إضافة قسم
export const createCategory = async (name, userId) => {
  const { data, error } = await supabase
    .from("categories")
    .insert([{ name, user_id: userId }])
    .select();

  if (error) throw error;
  return data[0];
};

// إضافة منتج
export const createProduct = async (p, userId) => {
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name: p.name,
        category_id: p.category_id,
        components: p.components,
        user_id: userId,
        comp_price: p.comp_price || "0.00",
        is_new: p.is_new ?? false,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

// تحديث منتج
export const updateProductById = async (id, updates, userId) => {
  const normalizedCategoryId = normalizeUuid(updates.category_id);

  if (updates.category_id !== undefined && updates.category_id && !normalizedCategoryId) {
    const error = new Error("Invalid category_id. Expected a valid category UUID.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedCategoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", normalizedCategoryId)
      .eq("user_id", userId)
      .maybeSingle();

    if (categoryError) {
      logSupabaseError("updateProductById.categoryLookup", categoryError, {
        productId: id,
        userId,
        categoryId: normalizedCategoryId,
      });
      throw categoryError;
    }

    if (!category) {
      const error = new Error("Category not found for this user.");
      error.statusCode = 400;
      throw error;
    }
  }

  const productUpdates = {
    name: updates.name,
    components: updates.components,
    c_price: updates.c_price,
    comp_price: updates.comp_price,
    r_price: updates.r_price,
    b_cost: updates.b_cost,
  };

  if (normalizedCategoryId !== undefined) {
    productUpdates.category_id = normalizedCategoryId;
  }

  if (updates.is_new !== undefined) {
    productUpdates.is_new = updates.is_new;
  }

  if (
    normalizedCategoryId &&
    updates.b_cost !== undefined &&
    Number(updates.b_cost) >= 0
  ) {
    productUpdates.is_new = false;
  }

  Object.keys(productUpdates).forEach((key) => {
    if (productUpdates[key] === undefined) {
      delete productUpdates[key];
    }
  });

  const { data, error } = await supabase
    .from("products")
    .update(productUpdates)
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) {
    logSupabaseError("updateProductById.productUpdate", error, {
      productId: id,
      userId,
      payload: productUpdates,
    });
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error(
      "Product update returned no rows. Check product ownership or Supabase RLS policy."
    );
    error.statusCode = 404;
    console.error("[Supabase updateProductById.noRows]", {
      productId: id,
      userId,
      payload: productUpdates,
    });
    throw error;
  }

  return data[0];
};

// تحديث السعر الموصى به بعد التحليل
export const updateRecommendedPriceById = async (
  id,
  userId,
  recommendedPrice
) => {
  const { data, error } = await supabase
    .from("products")
    .update({ r_price: recommendedPrice })
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) throw error;
  return data[0];
};

// حذف منتج
export const deleteProductById = async (id, userId) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
};

// تعديل اسم الكاتيقوري
export const updateCategoryById = async (id, name, userId) => {
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) throw error;
  return data[0];
};

// حذف الكاتيقوري فقط إذا فاضية
export const deleteCategoryById = async (id, userId) => {
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", id)
    .eq("user_id", userId);

  if (productsError) throw productsError;

  if (products && products.length > 0) {
    const error = new Error("Cannot delete category while it has products.");
    error.statusCode = 400;
    throw error;
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
};
