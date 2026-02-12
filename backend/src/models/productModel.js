import { supabase } from '../config/supabase.js';

// جلب البيانات
export const getAllProducts = async (userId) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
};

// جلب المكونات
export const getVariableComponentsList = async (userId) => {
  const { data, error } = await supabase
    .from('variable_components')
    .select('*')
    .eq('owner_id', userId);

  if (error) throw error;
  return data || [];
};

// إضافة قسم
export const createCategory = async (name, userId) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, user_id: userId }])
    .select();

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
      user_id: userId
    }])
    .select();

  if (error) throw error;
  return data[0];
};


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
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};