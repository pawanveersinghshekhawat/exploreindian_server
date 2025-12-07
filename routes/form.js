// routes/formRoutes.js
import express from "express";
import { createForm, getForms, getFormById, updateFormStatus } from "../controllers/formController.js";
import { auth, admin } from '../middleware/authMiddleware.js'; // <-- Import changed

const router = express.Router();

router.post("/create", auth, createForm);
router.get("/", getForms);
router.get("/:id", getFormById);
router.patch("/:id/status", auth, updateFormStatus);

export default router;
