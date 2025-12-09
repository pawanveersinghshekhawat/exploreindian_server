// models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    age: {
      type: String,
      default: 'Not specified',
    },

    hourly_rate: {
      type: Number,
      default: 0,
    },

    night_rate: {
      type: Number,
      default: 0,
    },

    phone_no: {
      type: String,
      required: true,
    },

    whatsapp_no: {
      type: String,
      default: '',
    },

    fantasies: {
      type: [String],
      default: [],
    },

    services: {
      type: [String],
      default: [],
    },

    availability: {
      type: String,
      default: 'Available',
    },

    verified: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true, 
    },



    reviews: {
      type: Number,
      default: 0,
    },

    // proper image length 2–3
    images: {
      type: [String],
      default: []
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    createdByRole: {
      type: String,
      enum: ['User', 'Admin'],
      required: true,
    },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);
export default Product;
