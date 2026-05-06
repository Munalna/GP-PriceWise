import { supabase } from "../config/supabase.js";

// جلب البيانات مع دمج الجداول لضمان حساب المتوسط + جلب الرولز المرتبطة
export const getAllProducts = async (userId) => {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*, products(*)")
    .eq("user_id", userId);

  if (error) throw error;

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

  if (assignmentsRes.error) throw assignmentsRes.error;

  const marketData1 = res1.data || [];
  const marketData2 = res2.data || [];
  const assignments = assignmentsRes.data || [];

  const processedCategories = (categories || []).map((cat) => {
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
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

// تحديث منتج
export const updateProductById = async (id, updates, userId) => {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: updates.name,
      components: updates.components,
      c_price: updates.c_price,
      comp_price: updates.comp_price,
      r_price: updates.r_price,
      b_cost: updates.b_cost,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) throw error;
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