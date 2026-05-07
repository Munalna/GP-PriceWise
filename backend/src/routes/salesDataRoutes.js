import express from 'express';
import { importSalesData, getSalesAnalytics } from '../controllers/salesDataController.js';

const router = express.Router();

// مسار استيراد بيانات المبيعات
router.post('/import', importSalesData);

// مسار جلب إحصائيات الداشبورد
router.get('/analytics', getSalesAnalytics);

export default router;