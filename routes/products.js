// server/routes/products.js - COMPLETE FIXED VERSION
import express from 'express';
const router = express.Router();

import { 
    createProduct, 
    getAllProducts, 
    getPendingProducts,
    getProductById,
    updateProductStatus,
    getApprovedProducts, 
    updateProduct, 
    deleteProduct 
} from '../controllers/productController.js';
import { multipleImages } from '../middleware/multer.js'; // ✅ CORRECT IMPORT
import { auth, admin } from '../middleware/authMiddleware.js';

// Public routes
router.route('/').get(getApprovedProducts);
router.route('/approved').get(getApprovedProducts);

// Admin routes
router.route('/admin/all').get(auth, admin, getAllProducts);
router.route('/admin/pending').get(auth, admin, getPendingProducts);

// ✅ FIXED: multipleImages for file uploads
router.post('/create', auth, multipleImages, createProduct);
router.route('/:id')
    .get(getProductById)
    .put(auth, multipleImages, updateProduct)  // ✅ multipleImages
    .delete(auth, deleteProduct);

// Admin status update
router.patch('/admin/status/:id', auth, admin, updateProductStatus);

export default router;
