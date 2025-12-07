// productController.js (FINAL CORRECTED VERSION with createdByRole)

import Product from '../models/Product.js';
// Import other necessary modules like file system functions (if needed for file cleanup)
// import fs from 'fs'; 

// @desc    Create a new product (Auth Required)
// @route   POST /api/products/create
// @access  Private (User or Admin)
const createProduct = async (req, res) => {
    // req.user is populated by the 'auth' middleware
    const { name, description, age, state, city, phone_no, whatsapp_no } = req.body;
    
    // Check if the file was successfully uploaded by multer
    if (!req.file) {
        return res.status(400).json({ message: 'Product image is required.' });
    }
    
    // 🚨 FIX: Set the image path to the relative URL path for database storage
    const imagePath = `/images/${req.file.filename}`; 

    // Determine the user's role
    const isAdmin = req.user && req.user.role === 'admin';

    // Set the product status and the creator role based on isAdmin
    const status = isAdmin ? 'Approved' : 'Pending';
    const createdByRole = isAdmin ? 'Admin' : 'User'; // 🚨 NEW FIELD LOGIC

    if (!name || !description || !state || !city || !phone_no) {
        // If data is missing, clean up the uploaded file before sending error response
        // Note: Use req.file.path (absolute path) for fs.unlinkSync, not imagePath (relative URL)
        // if (req.file.path) fs.unlinkSync(req.file.path); 
        return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    try {
        const newProduct = new Product({
            name,
            description,
            age,
            state,
            city,
            phone_no,
            whatsapp_no,
            image: imagePath,
            owner: req.user._id, // Assign the authenticated user's ID as owner
            createdByRole: createdByRole, // 🚨 Set the creator's role
            status: status,
        });

        const product = await newProduct.save();
        
        // Respond with 201 Created
        res.status(201).json({ 
            message: 'Product created successfully.',
            product: product,
            status: status // Inform the frontend about the determined status
        });

    } catch (error) {
        console.error('Product creation error:', error);
        // If save fails, clean up the uploaded file
        // if (req.file && req.file.path) fs.unlinkSync(req.file.path); // Uncomment with fs import
        res.status(500).json({ message: 'Server error during product creation.' });
    }
};

// @desc    Get all products (Admin Only, includes Pending)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    // 'auth' and 'admin' middleware ensure req.user is an admin here.
    try {
        // Includes the 'createdByRole' field now
        const products = await Product.find({}).populate('owner', 'name email');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching all products.' });
    }
};

// @desc    Get approved products (Public)
// @route   GET /api/products
// @access  Public

const getPendingProducts = async (req, res) => {
    try {
        // Fetch only PENDING posts, sorted by oldest first for priority review.
        const products = await Product.find({ status: 'Pending' })
            .sort({ createdAt: 1 })
            .populate('owner', 'name email role'); // Added 'role' to population
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in getPendingProducts:', error);
        res.status(500).json({ message: 'Server error fetching pending products.' });
    }
};


const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('owner', 'name email phone_no');

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error in getProductById:', error);
        if (error instanceof mongoose.CastError) {
             return res.status(400).json({ message: 'Invalid product ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching product.' });
    }
};

const updateProductStatus = async (req, res) => {
    const { status } = req.body;
    const productId = req.params.id;

    if (!status) {
        return res.status(400).json({ message: 'Status field is required.' });
    }
    
    // Ensure the status is one of the allowed enum values
    const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Done'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { status: status },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.status(200).json({ message: `Status updated to ${status}`, product });

    } catch (error) {
        console.error('Error in updateProductStatus:', error);
        if (error instanceof mongoose.CastError) {
             return res.status(400).json({ message: 'Invalid product ID format.' });
        }
        res.status(500).json({ message: 'Server error updating status.' });
    }
};

const getApprovedProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: 'Approved' }).populate('owner', 'name email');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching approved products.' });
    }
};


// @desc    Update a product (Auth Required - Owner or Admin)
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
    // req.user is populated by the 'auth' middleware
    const productId = req.params.id;
    const updates = req.body;
    
    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // --- AUTHORIZATION CHECK ---
        const isOwner = product.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this product.' });
        }

        // Prevent non-admins from manually setting status to Approved
        if (!isAdmin && updates.status && updates.status !== product.status) {
            // If the user is not an admin, they cannot change the status field
            delete updates.status; 
        }

        // Handle image update if you add logic for it later (currently not supported here)

        // Update the product fields
        Object.assign(product, updates);
        
        const updatedProduct = await product.save();
        res.json(updatedProduct);

    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({ message: 'Server error during product update.' });
    }
};


// @desc    Delete a product (Auth Required - Owner or Admin)
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
    // req.user is populated by the 'auth' middleware
    const productId = req.params.id;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // --- AUTHORIZATION CHECK ---
        const isOwner = product.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this product.' });
        }

        // Optional: Implement file cleanup here (delete image from storage)
        // if (product.image && product.image.startsWith('/images/')) {
        //     // You would need to construct the absolute path here, e.g.,
        //     // const absolutePath = path.join(process.cwd(), 'server', product.image); 
        //     // fs.unlinkSync(absolutePath);
        // }

        await Product.deleteOne({ _id: productId });
        res.json({ message: 'Product removed successfully.' });

    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({ message: 'Server error during product deletion.' });
    }
};


export {
    createProduct,
    getAllProducts,
    getApprovedProducts,
    updateProduct,
    deleteProduct,

    getPendingProducts, // <-- Export new function
    getProductById, // <-- Export new function
    updateProductStatus // <-- Export new function
};