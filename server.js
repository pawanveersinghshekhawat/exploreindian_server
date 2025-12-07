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
app.use(express.json());
app.use(cookieParser());

// -------------------------------
// 2. STATIC IMAGE DIRECTORY FIX
// -------------------------------

// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your real upload folder (Multer must save here!)
const uploadDir = path.join(__dirname, "public", "images");

// Auto-create folder if missing
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  // console.log("📁 Created upload directory:", uploadDir);
}

// Serve images publicly → http://localhost:5000/images/filename.jpg
app.use("/images", express.static(uploadDir));


// -------------------------------
// 3. ADMIN SEED FIX
// -------------------------------
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASS;

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ ADMIN_EMAIL or ADMIN_PASS missing in .env");
      return;
    }

    const existing = await AdminConfig.findOne({ email: adminEmail });

    if (existing) {
      // console.log("ℹ️ Admin already exists:", existing.email);
      return;
    }

    const hashed = await bcrypt.hash(adminPassword, 10);

    await AdminConfig.create({
      email: adminEmail,
      password: hashed,
      isAdmin: true,
    });

    // console.log("✅ Default admin created:", adminEmail);
  } catch (err) {
    console.error("❌ Seed admin error:", err.message);
  }
};

// Connect DB then seed admin
connectDB().then(seedAdmin);

// -------------------------------
// 4. ROUTES
// -------------------------------
app.get("/", (req, res) => res.send("MarketPrime API running"));

// REST routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/forms", formRoutes);

// -------------------------------
// 5. SERVER START
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
