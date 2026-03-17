import { supabase } from '../config/supabase.js';

// جلب البيانات مع دمج الجداول لضمان حساب المتوسط 
export const getAllProducts = async (userId) => {
  // 1. جلب الفئات والمنتجات الخاصة بالمستخدم
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*, products(*)')
    .eq('user_id', userId);

  if (error) throw error;

  // 2. جلب البيانات للتأكد من شمولية البيانات
  const [res1, res2] = await Promise.all([
    supabase.from('marketdataset').select('itemname, price'),
    supabase.from('market_dataset').select('product_name, price')
  ]);

  const marketData1 = res1.data || [];
  const marketData2 = res2.data || [];

  // 3. دمج ومعالجة البيانات
  const processedCategories = categories.map(cat => ({
    ...cat,
    products: (cat.products || []).map(prod => {
      const searchName = prod.name?.trim().toLowerCase();

      // البحث في الجدول الأول (itemname)
      const prices1 = marketData1
        .filter(item => item.itemname?.trim().toLowerCase() === searchName)
        .map(item => Number(item.price));

      // البحث في الجدول الثاني (product_name)
      const prices2 = marketData2
        .filter(item => item.product_name?.trim().toLowerCase() === searchName)
        .map(item => Number(item.price));

      // دمج كل الأسعار المتاحة من المصدرين
      const allRelatedPrices = [...prices1, ...prices2];

      return {
        ...prod,
        competitors_prices: allRelatedPrices
      };
    })
  }));

  return processedCategories || [];
};

// جلب المكونات
export const getVariableComponentsList = async (userId) => {
  const { data, error } = await supabase.from('variable_components').select('*').eq('owner_id', userId);
  if (error) throw error;
  return data || [];
};

// إضافة قسم
export const createCategory = async (name, userId) => {
  const { data, error } = await supabase.from('categories').insert([{ name, user_id: userId }]).select();
  if (error) throw error;
  return data[0];
};

// إضافة منتج
export const createProduct = async (p, userId) => {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: p.name,
      category_id: p.category_id,
      components: p.components,
      user_id: userId,
      comp_price: p.comp_price || "0.00"
    }])
    .select();
  if (error) throw error;
  return data[0];
};

// تحديث منتج
export const updateProductById = async (id, updates, userId) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: updates.name,
      components: updates.components,
      c_price: updates.c_price,
      comp_price: updates.comp_price,
      b_cost: updates.b_cost
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select();
  if (error) throw error;
  return data[0];
};

// حذف منتج
export const deleteProductById = async (id, userId) => {
  const { error } = await supabase.from('products').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
};