// models/Product.js (MODIFIED SCHEMA DEFINITION)

import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
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
        default: 'Not specified'
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    phone_no: {
        type: String,
        required: true,
    },
    whatsapp_no: {
        type: String,
        default: ''
    },
    image: {
        type: String, // Path to the uploaded file
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Ya 'AdminConfig' agar aap dono ko allowed rakhte hain
        required: true,
    },
    // 🚨 NEW FIELD: Tracks the role of the user who created the product
    createdByRole: {
        type: String,
        enum: ['User', 'Admin'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    }
}, { timestamps: true });


const Product = mongoose.model('Product', ProductSchema);

export default Product;