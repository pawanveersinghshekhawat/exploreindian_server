// server/server.js - UPDATED FOR COMPLETE PRODUCT SYSTEM
import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import AdminConfig from "./models/AdminConfig.js";

// Routes
import adminRoutes from "./routes/admin.js";
import productRoutes from "./routes/products.js";
import formRoutes from "./routes/form.js";
import authRoutes from "./routes/auth.js";

const app = express();

// -------------------------------
// 1. CORS + Middleware
// -------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' })); // Increased for image data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// -------------------------------
// 2. ✅ STATIC IMAGE DIRECTORY - PERFECT FOR YOUR MULTER
// -------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "public", "images");

// ✅ Auto-create folder if missing
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created upload directory:", uploadDir);
}

// ✅ Serve images publicly → http://localhost:5000/images/filename.jpg
app.use("/images", express.static(uploadDir));

// ✅ Health check endpoint for image folder
app.get("/api/health/images", (req, res) => {
  res.json({ 
    imagesFolder: uploadDir,
    exists: fs.existsSync(uploadDir),
    readable: fs.accessSync(uploadDir, fs.constants.R_OK)
  });
});

// -------------------------------
// 3. ✅ ADMIN SEED WITH BETTER LOGGING
// -------------------------------
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASS;

    if (!adminEmail || !adminPassword) {
      console.log("⚠️  ADMIN_EMAIL or ADMIN_PASS missing in .env");
      console.log("   Add to .env: ADMIN_EMAIL=admin@example.com ADMIN_PASS=yourpassword");
      return;
    }

    const existing = await AdminConfig.findOne({ email: adminEmail });

    if (existing) {
      console.log("✅ Admin already exists:", existing.email);
      return;
    }

    const hashed = await bcrypt.hash(adminPassword, 12); // Stronger salt

    await AdminConfig.create({
      email: adminEmail,
      password: hashed,
      isAdmin: true,
    });

    console.log("🎉 Default admin created:", adminEmail);
    // console.log("   Login at: http://localhost:5173/admin/login");
  } catch (err) {
    console.error("❌ Seed admin error:", err.message);
  }
};

// -------------------------------
// 4. ✅ ENHANCED DB CONNECTION
// -------------------------------
const startServer = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully!");
    
    await seedAdmin();
    
    // -------------------------------
    // 5. ROUTES - PERFECT ORDER
    // -------------------------------
    app.get("/", (req, res) => {
      res.json({ 
        message: "MarketPrime API 🚀", 
        status: "running",
        products: "/api/products",
        admin: "/api/admin",
        docs: "https://localhost:5000/api/health"
      });
    });

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || "development"
      });
    });

    // REST API Routes
    app.use("/api/admin", adminRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);  // ✅ Your product routes here
    app.use("/api/forms", formRoutes);

    // -------------------------------
    // 6. 404 HANDLER
    // -------------------------------
    app.use("*", (req, res) => {
      res.status(404).json({ 
        message: `Route ${req.originalUrl} not found`,
        available: ["/api/products", "/api/admin", "/api/auth"]
      });
    });

    // -------------------------------
    // 7. GLOBAL ERROR HANDLER
    // -------------------------------
    app.use((err, req, res, next) => {
      console.error("🚨 Global Error:", err.message);
      console.error("Stack:", err.stack);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 3MB per image.' });
      }
      
      if (err.message.includes('Only image files')) {
        return res.status(400).json({ message: err.message });
      }
      
      res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Server Error'
      });
    });

    // -------------------------------
    // 8. START SERVER
    // -------------------------------
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
     
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
