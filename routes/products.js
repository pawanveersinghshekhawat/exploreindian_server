// product.routes.js (FINAL CORRECTED VERSION)

import express from 'express'
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
import uploadMiddleware from '../middleware/multer.js';

// Import the specialized middleware: auth (Authentication) and admin (Authorization)
import { auth, admin } from '../middleware/authMiddleware.js'; // <-- Import changed

// --- Public/General Routes (Read) ---
router.route('/').get(getApprovedProducts); 



router.route('/admin/all').get(auth, admin, getAllProducts); // Get all posts (All Posts tab)
router.route('/admin/pending').get(auth, admin, getPendingProducts); // Get pending posts (User Posts tab)
router.route('/admin/status/:id').put(auth, admin, updateProductStatus);

// --- Shared User/Admin Routes ---
// Product Creation: Both users and admins can create products. 
// We use 'auth' to attach req.user, and the controller will check req.user.role 
// to decide if the status should be 'Approved' (if admin) or 'Pending' (if user).
// Order: Authentication -> File Upload (Multer) -> Controller
router.post('/create', auth, uploadMiddleware, createProduct); // <-- Changed protectAdminRoute to auth

// Update/Delete: Requires authentication. Controller will check if req.user is owner/admin.
router.route('/:id')
    .put(auth,uploadMiddleware, updateProduct) // <-- Changed protect to auth
    .delete(auth, deleteProduct); // <-- Changed protect to auth

// --- Admin-Specific Routes (All products, including Pending) ---
// Requires: 1. Authentication (auth) 2. Role Check (admin)
router.route('/admin/all').get(auth, admin, getAllProducts); // <-- Changed protectAdminRoute to auth, admin

export default router;