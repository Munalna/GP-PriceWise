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

function getImportPeriodDays(importPeriod) {
    const normalized = String(importPeriod || '').trim().toLowerCase();

    if (normalized === 'daily') return 1;
    if (normalized === 'weekly') return 7;
    if (normalized === 'monthly') return 30;

    return null;
}

function buildSyntheticPeriodDates(rowCount, importPeriod) {
    const periodDays = getImportPeriodDays(importPeriod);
    if (!periodDays || rowCount <= 0) return [];

    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - periodDays + 1);

    if (rowCount === 1) {
        return [startDate.toISOString().slice(0, 10)];
    }

    return Array.from({ length: rowCount }, (_, index) => {
        const offset = Math.round((index * (periodDays - 1)) / (rowCount - 1));
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + offset);
        return date.toISOString().slice(0, 10);
    });
}

function cleanSalesRows(mappedData, importPeriod = null) {
    const syntheticDates = buildSyntheticPeriodDates(mappedData.length, importPeriod);

    return mappedData
        .map((row, index) => ({
            product_name: normalizeProductName(row.product_name ?? row.productName),
            quantity: toNumber(row.quantity),
            total_price: toNumber(row.total_price ?? row.totalPrice),
            sale_date: syntheticDates[index] || toSaleDate(row.sale_date ?? row.saleDate),
        }))
        .filter((row) => row.product_name);
}

function uniqueProductNamesFromRows(rows) {
    return [
        ...new Map(rows.map((row) => [productKey(row.product_name), row.product_name])).values(),
    ];
}

function validateImportPayload(mappedData, userId) {
    if (!Array.isArray(mappedData) || mappedData.length === 0) {
        return 'mappedData must be a non-empty array';
    }

    if (!userId || !uuidRegex.test(userId)) {
        return 'Invalid userId. Expected a valid UUID.';
    }

    return null;
}

async function getProductMap(client, userId) {
    const { data: existingProducts, error: productsFetchError } = await client
        .from('products')
        .select('id, name')
        .eq('user_id', userId);

    if (productsFetchError) throw productsFetchError;

    return new Map((existingProducts || []).map((product) => [productKey(product.name), product]));
}

async function findMissingProducts(client, userId, productNames) {
    const productMap = await getProductMap(client, userId);

    return productNames
        .filter((name) => !productMap.has(productKey(name)))
        .map((name) => ({ name }));
}

export const validateSalesProducts = async (req, res) => {
    const { mappedData } = req.body;
    const userId = req.user?.id;
    const payloadError = validateImportPayload(mappedData, userId);

    if (payloadError) {
        return res.status(400).json({ error: payloadError });
    }

    try {
        const client = supabaseAdmin || supabase;
        const cleanedRows = cleanSalesRows(mappedData);

        if (cleanedRows.length === 0) {
            return res.status(400).json({ error: 'No valid rows found. Each row needs a product name.' });
        }

        const missingProducts = await findMissingProducts(
            client,
            userId,
            uniqueProductNamesFromRows(cleanedRows)
        );

        return res.status(200).json({
            hasMissingProducts: missingProducts.length > 0,
            missingProducts,
            missingCount: missingProducts.length,
        });
    } catch (error) {
        console.error('Sales product validation error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const createDraftProducts = async (req, res) => {
    const { productNames, products } = req.body;
    const userId = req.user?.id;
    const namesInput = Array.isArray(productNames) ? productNames : products;

    if (!userId || !uuidRegex.test(userId)) {
        return res.status(400).json({ error: 'Invalid userId. Expected a valid UUID.' });
    }

    if (!Array.isArray(namesInput) || namesInput.length === 0) {
        return res.status(400).json({ error: 'productNames must be a non-empty array' });
    }

    try {
        const client = supabaseAdmin || supabase;
        const names = [
            ...new Map(
                namesInput
                    .map((item) => normalizeProductName(item?.name ?? item))
                    .filter(Boolean)
                    .map((name) => [productKey(name), name])
            ).values(),
        ];

        if (names.length === 0) {
            return res.status(400).json({ error: 'No valid product names were provided.' });
        }

        const missingProducts = await findMissingProducts(client, userId, names);

        if (missingProducts.length === 0) {
            return res.status(200).json({
                message: 'All products already exist.',
                draftedProducts: [],
                draftedCount: 0,
            });
        }

        const draftRows = missingProducts.map((product) => ({
            user_id: userId,
            category_id: null,
            name: product.name,
            components: JSON.stringify([]),
            b_cost: 0,
            c_price: 0,
            comp_price: 0,
            is_new: true,
        }));

        const { data: draftedProducts, error: productInsertError } = await client
            .from('products')
            .insert(draftRows)
            .select('id, name, is_new');

        if (productInsertError) throw productInsertError;

        return res.status(201).json({
            message: 'Draft products created.',
            draftedProducts: draftedProducts || [],
            draftedCount: draftedProducts?.length || 0,
        });
    } catch (error) {
        console.error('Draft product insert error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const importSalesData = async (req, res) => {
    const { mappedData, importPeriod, ignoreMissingProducts = false } = req.body;
    const userId = req.user?.id;
    const payloadError = validateImportPayload(mappedData, userId);

    if (payloadError) {
        return res.status(400).json({ error: payloadError });
    }

    try {
        const client = supabaseAdmin || supabase;
        const cleanedRows = cleanSalesRows(mappedData, importPeriod);

        if (cleanedRows.length === 0) {
            return res.status(400).json({ error: 'No valid rows found. Each row needs a product name.' });
        }

        const uniqueProductNames = uniqueProductNamesFromRows(cleanedRows);
        const productMap = await getProductMap(client, userId);
        const missingProducts = uniqueProductNames
            .filter((name) => !productMap.has(productKey(name)))
            .map((name) => ({ name }));

        if (missingProducts.length > 0 && !ignoreMissingProducts) {
            return res.status(409).json({
                error: 'Unregistered products detected in the file.',
                missingProducts,
                missingCount: missingProducts.length,
            });
        }

        const salesRows = cleanedRows.map((row) => {
            const product = productMap.get(productKey(row.product_name));
            if (!product) return null;

            return {
                user_id: userId,
                product_id: product.id,
                quantity: row.quantity,
                total_price: row.total_price,
                sale_date: row.sale_date,
            };
        }).filter(Boolean);

        if (salesRows.length === 0) {
            return res.status(400).json({
                error: 'No registered products found to import. Add drafts first or use products that already exist.',
                missingProducts,
                missingCount: missingProducts.length,
            });
        }

        const { error: salesDeleteError } = await client
            .from('sales_data')
            .delete()
            .eq('user_id', userId);

        if (salesDeleteError) throw salesDeleteError;

        const { data: insertedSalesRows, error: salesInsertError } = await client
            .from('sales_data')
            .insert(salesRows)
            .select('id');

        if (salesInsertError) throw salesInsertError;

        return res.status(200).json({
            message: 'Sales data imported successfully.',
            importedCount: insertedSalesRows?.length || salesRows.length,
            importPeriod: importPeriod || 'dates',
            newProductsAdded: false,
            newProductsCount: 0,
            newProducts: [],
            skippedProducts: ignoreMissingProducts ? missingProducts : [],
            skippedProductsCount: ignoreMissingProducts ? missingProducts.length : 0,
        });
    } catch (error) {
        console.error('Sales import error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const getSalesAnalytics = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authenticated user is required' });
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
