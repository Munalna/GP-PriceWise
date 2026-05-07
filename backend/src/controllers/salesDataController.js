import { supabase, supabaseAdmin } from '../config/supabase.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeProductName(name) {
    const normalized = String(name || '').trim();
    const invalidNames = new Set(['undefined', 'null', 'nan']);

    return invalidNames.has(normalized.toLowerCase()) ? '' : normalized;
}

function productKey(name) {
    return normalizeProductName(name).toLowerCase();
}

function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function toSaleDate(value) {
    if (!value) return new Date().toISOString().slice(0, 10);

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);

    return date.toISOString().slice(0, 10);
}

export const importSalesData = async (req, res) => {
    const { mappedData, userId } = req.body;

    if (!Array.isArray(mappedData) || mappedData.length === 0) {
        return res.status(400).json({ error: 'mappedData must be a non-empty array' });
    }

    if (!userId || !uuidRegex.test(userId)) {
        return res.status(400).json({ error: 'Invalid userId. Expected a valid UUID.' });
    }

    try {
        const client = supabaseAdmin || supabase;

        const cleanedRows = mappedData
            .map((row) => ({
                product_name: normalizeProductName(row.product_name ?? row.productName),
                quantity: toNumber(row.quantity),
                total_price: toNumber(row.total_price ?? row.totalPrice),
                sale_date: toSaleDate(row.sale_date ?? row.saleDate),
            }))
            .filter((row) => row.product_name);

        if (cleanedRows.length === 0) {
            return res.status(400).json({ error: 'No valid rows found. Each row needs a product name.' });
        }

        const uniqueProductNames = [
            ...new Map(cleanedRows.map((row) => [productKey(row.product_name), row.product_name])).values(),
        ];

        const { data: existingProducts, error: productsFetchError } = await client
            .from('products')
            .select('id, name')
            .eq('user_id', userId);

        if (productsFetchError) throw productsFetchError;

        const productMap = new Map(
            (existingProducts || []).map((product) => [productKey(product.name), product])
        );

        const missingProducts = uniqueProductNames
            .filter((name) => !productMap.has(productKey(name)))
            .map((name) => ({
                user_id: userId,
                name,
                b_cost: 0,
                is_new: true,
            }));

        let insertedProducts = [];

        if (missingProducts.length > 0) {
            const { data: newProducts, error: productInsertError } = await client
                .from('products')
                .insert(missingProducts)
                .select('id, name');

            if (productInsertError) throw productInsertError;

            insertedProducts = newProducts || [];
            insertedProducts.forEach((product) => {
                productMap.set(productKey(product.name), product);
            });
        }

        const salesRows = cleanedRows.map((row) => {
            const product = productMap.get(productKey(row.product_name));

            return {
                user_id: userId,
                product_id: product.id,
                quantity: row.quantity,
                total_price: row.total_price,
                sale_date: row.sale_date,
            };
        });

        const { data: insertedSalesRows, error: salesInsertError } = await client
            .from('sales_data')
            .insert(salesRows)
            .select('id');

        if (salesInsertError) throw salesInsertError;

        return res.status(200).json({
            message: 'Sales data imported successfully.',
            importedCount: insertedSalesRows?.length || salesRows.length,
            newProductsAdded: insertedProducts.length > 0,
            newProductsCount: insertedProducts.length,
            newProducts: insertedProducts.map((product) => ({
                id: product.id,
                name: product.name,
            })),
        });
    } catch (error) {
        console.error('Sales import error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const getSalesAnalytics = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'userId query parameter is required' });
    }

    try {
        const client = supabaseAdmin || supabase;
        const { data: salesRows, error: salesError } = await client
            .from('sales_data')
            .select('quantity, product_id')
            .eq('user_id', userId);

        if (salesError) throw salesError;

        const productIds = [
            ...new Set((salesRows || []).map((row) => row.product_id).filter(Boolean)),
        ];

        let productsById = new Map();

        if (productIds.length > 0) {
            const { data: products, error: productsError } = await client
                .from('products')
                .select('id, name')
                .eq('user_id', userId)
                .in('id', productIds);

            if (productsError) throw productsError;

            productsById = new Map((products || []).map((product) => [product.id, product]));
        }

        const summaryObj = (salesRows || []).reduce((acc, curr) => {
            const product = productsById.get(curr.product_id);
            const name = normalizeProductName(product?.name) || 'Unknown Product';
            const qty = toNumber(curr.quantity);
            acc[name] = (acc[name] || 0) + qty;
            return acc;
        }, {});

        const visualSummary = Object.entries(summaryObj)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity);

        return res.status(200).json(visualSummary);
    } catch (error) {
        console.error('Sales analytics error:', error);
        return res.status(500).json({ error: error.message });
    }
};
