import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
    createDraftProducts,
    importSalesData,
    getSalesAnalytics,
    validateSalesProducts,
} from '../controllers/salesDataController.js';

const router = express.Router();

router.use(protect);

// مسار استيراد بيانات المبيعات
router.post('/validate-products', validateSalesProducts);
router.post('/draft-products', createDraftProducts);
router.post('/import', importSalesData);

// مسار جلب إحصائيات الداشبورد
router.get('/analytics', getSalesAnalytics);

export default router;
