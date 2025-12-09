// server/middleware/multer.js - UPDATED FOR MULTIPLE IMAGES
import multer from 'multer';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';

// 1. Define __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🚨 DESTINATION FOLDER: Inside Server's 'public' folder
const DESTINATION_FOLDER = path.join(__dirname, '..', 'public', 'images');

// 🚨 DEBUG: Log the path Multer will use 
console.log(`Multer Destination Path: ${DESTINATION_FOLDER}`);

// 2. Ensure the directory exists (CRITICAL)
if (!fs.existsSync(DESTINATION_FOLDER)) {
    fs.mkdirSync(DESTINATION_FOLDER, { recursive: true });
    console.log(`✅ Multer directory created at: ${DESTINATION_FOLDER}`);
}

// ----------------------------------------------------

// 3. Configure the storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DESTINATION_FOLDER); 
    },
    filename: (req, file, cb) => {
        // ✅ IMPROVED: Better filename generation
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 4. File filter for images only (2-3MB max, images only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
};

// 5. Create different upload configurations
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB per image
        files: 3 // Max 3 images
    },
    fileFilter: fileFilter
});

// ----------------------------------------------------
// ✅ EXPORT MULTIPLE CONFIGURATIONS:

// Single image upload (for backward compatibility)
export const singleImage = upload.single('image');

// Multiple images upload (for your Product model)
export const multipleImages = upload.array('images', 3); // Max 3 images

// Fields upload (if you need multiple fields with files)
export const fieldsUpload = upload.fields([
    { name: 'images', maxCount: 3 }
]);

// Default export for backward compatibility (single image)
export default singleImage;

// ----------------------------------------------------
// 🚨 USAGE IN ROUTES:
// Product creation: router.post('/create', multipleImages, createProduct);
// Product update:  router.put('/:id', multipleImages, updateProduct);
