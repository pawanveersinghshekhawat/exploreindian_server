import express from 'express';
import { signup, login, logout, getUser ,verifyUserAuth } from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);      // Fixed: was register
router.post('/login', login);
router.post('/logout', logout);
router.get('/user', auth, getUser);
router.get("/verify", verifyUserAuth);


router.get("/me", auth, (req, res) => {
    res.json({ success: true, user: req.user });
});

export default router;
