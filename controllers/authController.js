// controllers/userAuthController.js

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// --- Cookie Options (same style as Admin) ---
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// ---------------------------------------------
// SIGNUP
// ---------------------------------------------
export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hash });

        res.status(201).json({ success: true, message: "User registered successfully" });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------------------------------------
// LOGIN
// ---------------------------------------------
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ success: false, message: "Wrong password" });

        const token = jwt.sign(
            { id: user._id, isUser: true },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Set httpOnly cookie
        res.cookie("userToken", token, cookieOptions);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------------------------------------
// VERIFY USER SESSION (like admin verify)
// ---------------------------------------------
export const verifyUserAuth = async (req, res) => {
    const token = req.cookies?.userToken;

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authenticated", isUser: false });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || !decoded?.id) {
            return res.status(401).json({ success: false, message: "Invalid or expired token", isUser: false });
        }

        res.json({
            success: true,
            id: decoded.id,
            isUser: true,
            message: "Session verified"
        });
    });
};

// ---------------------------------------------
// LOGOUT
// ---------------------------------------------
export const logout = (req, res) => {
    res.clearCookie("userToken", {
        ...cookieOptions,
        expires: new Date(0)
    });

    res.json({ success: true, message: "Logged out successfully" });
};


export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
