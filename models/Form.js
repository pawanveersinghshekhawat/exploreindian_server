// models/Form.js
import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  phone_no: { type: String, required: true, maxlength: 15 },
  location: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  user_email: { type: String, required: true },
  user_name: { type: String, required: true },
  status: { type: String, enum: ["pending", "contacted", "closed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Form", formSchema);
