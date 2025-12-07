// backend/controllers/adminController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/AdminConfig.js"; // Replace with your actual path/model

const JWT_SECRET = process.env.JWT_SECRET;

// --- Helper function for setting/clearing the cookie ---
const cookieOptions = {
    httpOnly: true,
    // Adjust this for your local development environment
    secure: process.env.NODE_ENV === "production", // Should be false in development
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Should be 'lax' in development
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

// --- Admin Login ---
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: admin._id.toString(), isAdmin: true },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Set the HTTP-only cookie (This is the secure part)
        res.cookie("adminToken", token, cookieOptions);

        // Send back the token and email for the client-side context state
        res.json({ success: true, message: "Login successful", token, email: admin.email, isAdmin: true, id: admin._id });

    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --- Admin Verification (/admin/verify) ---
export const verifyAdminAuth = (req, res) => {
    const token = req.cookies?.adminToken; 
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Not authenticated", isAdmin: false });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || !decoded?.isAdmin) {
            return res.status(401).json({ success: false, message: "Invalid or expired token", isAdmin: false });
        }
        
        // Token is valid and Admin is confirmed
        res.json({ success: true, id: decoded.id, isAdmin: true, message: "Session verified" });
    });
};

// --- Admin Logout ---
export const logoutAdmin = (_req, res) => {
    try {
        // Clear the HTTP-only cookie
        res.clearCookie("adminToken", { 
            ...cookieOptions,
            expires: new Date(0) 
        });
        
        res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Logout error" });
    }
};