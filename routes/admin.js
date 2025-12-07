// backend/routes/adminRoutes.js

import express from "express";
import { logoutAdmin, adminLogin, verifyAdminAuth} from "../controllers/adminController.js";
// import { protectAdminRoute } from "../middleware/authMiddleware.js"; // Middleware needed for production

const router = express.Router();

router.post("/login", adminLogin);
router.get("/verify", verifyAdminAuth);

// Add protectAdminRoute middleware here for actual security:
// router.put("/update", protectAdminRoute, updateAdminCredentials); 
// router.put("/update", ); // Using without middleware for quick testing

router.post("/logout", logoutAdmin);


export default router;