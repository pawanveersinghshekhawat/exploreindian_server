// productController.js (UPDATED TO MATCH PRODUCT MODEL)
import Product from '../models/Product.js';


// @desc    Create a new product (Auth Required)
// @route   POST /api/products/create
// @access  Private (User or Admin)
const createProduct = async (req, res) => {
    const { 
        name, description, age, hourly_rate, night_rate, phone_no, whatsapp_no, 
        fantasies, services, availability, city, state 
    } = req.body;
    
    // Check if at least one image was uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'At least one product image is required.' });
    }
    
    // Store image paths as array of relative URLs
    const imagePaths = req.files.map(file => `/images/${file.filename}`);
    
    // Determine the user's role
    const isAdmin = req.user && req.user.role === 'admin';
    const status = isAdmin ? 'Approved' : 'Pending';
    const createdByRole = isAdmin ? 'Admin' : 'User';

    // Validate required fields
    if (!name || !description || !city || !state || !phone_no) {
        return res.status(400).json({ message: 'Please fill all required fields: name, description, city, state, phone_no.' });
    }

    try {
        const newProduct = new Product({
            name,
            description,
            age,
            hourly_rate: hourly_rate || 0,
            night_rate: night_rate || 0,
            phone_no,
            whatsapp_no: whatsapp_no || '',
            fantasies: fantasies || [],
            services: services || [],
            availability: availability || 'Available',
            city,
            state,
            images: imagePaths,  // ✅ FIXED: Use 'images' array instead of 'image'
            owner: req.user._id,
            createdByRole,
            status,
            verified: false,
            featured: false,
            rating: 0,
            reviews: 0
        });

        const product = await newProduct.save();
        
        res.status(201).json({ 
            message: 'Product created successfully.',
            product,
            status
        });

    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ message: 'Server error during product creation.' });
    }
};


// @desc    Get all products (Admin Only, includes Pending)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({})
            .populate('owner', 'name email role')
            .sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Server error fetching all products.' });
    }
};


// @desc    Get approved products (Public)
// @route   GET /api/products/approved
// @access  Public
const getApprovedProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: 'Approved' })
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching approved products:', error);
        res.status(500).json({ message: 'Server error fetching approved products.' });
    }
};


// @desc    Get pending products (Admin Only)
// @route   GET /api/products/pending
// @access  Private/Admin
const getPendingProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: 'Pending' })
            .sort({ createdAt: 1 })
            .populate('owner', 'name email role');
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in getPendingProducts:', error);
        res.status(500).json({ message: 'Server error fetching pending products.' });
    }
};


// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('owner', 'name email phone_no');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error in getProductById:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching product.' });
    }
};


// @desc    Update product status (Admin Only)
// @route   PATCH /api/products/:id/status
// @access  Private/Admin
const updateProductStatus = async (req, res) => {
    const { status } = req.body;
    const productId = req.params.id;

    if (!status) {
        return res.status(400).json({ message: 'Status field is required.' });
    }
    
    const allowedStatuses = ['Pending', 'Approved', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value. Must be Pending, Approved, or Rejected.' });
    }

    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { status },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.status(200).json({ 
            message: `Status updated to ${status}`, 
            product 
        });

    } catch (error) {
        console.error('Error in updateProductStatus:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }
        res.status(500).json({ message: 'Server error updating status.' });
    }
};


// @desc    Update a product (Auth Required - Owner or Admin)
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
    const productId = req.params.id;
    const updates = req.body;
    
    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
        updates.images = req.files.map(file => `/images/${file.filename}`);
    }

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Authorization check
        const isOwner = product.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this product.' });
        }

        // Prevent non-admins from changing status
        if (!isAdmin && updates.status) {
            delete updates.status;
        }

        // Update allowed fields
        const allowedUpdates = [
            'name', 'description', 'age', 'hourly_rate', 'night_rate', 'phone_no', 
            'whatsapp_no', 'fantasies', 'services', 'availability', 'city', 'state', 'images'
        ];
        
        const filteredUpdates = {};
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        Object.assign(product, filteredUpdates);
        const updatedProduct = await product.save();
        
        res.status(200).json(updatedProduct);

    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({ message: 'Server error during product update.' });
    }
};


// @desc    Delete a product (Auth Required - Owner or Admin)
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
    const productId = req.params.id;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Authorization check
        const isOwner = product.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this product.' });
        }

        await Product.findByIdAndDelete(productId);
        res.status(200).json({ message: 'Product deleted successfully.' });

    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({ message: 'Server error during product deletion.' });
    }
};

export {
    createProduct,
    getAllProducts,
    getApprovedProducts,
    getPendingProducts,
    getProductById,
    updateProduct,
    updateProductStatus,
    deleteProduct
};
