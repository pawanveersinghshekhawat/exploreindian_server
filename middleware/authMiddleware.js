// authMiddleware.js (FINAL, CLEAN & OPTIMIZED)

import jwt from 'jsonwebtoken';
import AdminConfig from '../models/AdminConfig.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Extract token from headers or cookies.
 */
const extractToken = (req) => {
    let token = null;

    // 1. Authorization: Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Cookies fallback (adminToken / userToken)
    if (!token && req.cookies) {
        token = req.cookies.adminToken || req.cookies.userToken;
    }

    // 3. Filter out invalid placeholders
    if (token) {
        const lower = String(token).toLowerCase();
        if (lower === 'null' || lower === 'undefined' || lower.trim() === '') {
            return null;
        }
    }

    return token;
};

/**
 * General Authentication Middleware
 * (Validates both User & Admin)
 */
const auth = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            message: 'Not authorized. Token missing or invalid.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Try User
        let entity = await User.findById(decoded.id).select('-password');
        let role = 'user';

        // Try Admin
        if (!entity) {
            entity = await AdminConfig.findById(decoded.id).select('-password');
            role = 'admin';
        }

        // No matching account
        if (!entity) {
            return res.status(401).json({
                message: 'Not authorized. User/Admin not found.'
            });
        }

        // Attach to req
        req.user = {
            _id: entity._id,
            role,
            ...entity.toObject()
        };

        next();

    } catch (error) {
        console.error("Auth Error:", error.message);
        return res.status(401).json({
            message: 'Not authorized. Token invalid or expired.'
        });
    }
};

/**
 * Admin-Only Route Protection
 */
const admin = (req, res, next) => {
    if (req.user?.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        message: 'Access denied. Admin privileges required.'
    });
};

export { auth, admin };
