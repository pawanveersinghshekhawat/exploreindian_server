// server/middleware/multer.js

import multer from 'multer';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';

// 1. Define __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Points to: /findincity/Server/middleware

// 🚨 CRITICAL FIX: The destination path is now inside the Server's 'public' folder.
// Path goes up one level (..) to /Server, then into /public/images
const DESTINATION_FOLDER = path.join(__dirname, '..', 'public', 'images');

// 🚨 DEBUG: Log the path Multer will use 
console.log(`Multer Destination Path: ${DESTINATION_FOLDER}`);

// 4. Ensure the directory exists (CRITICAL)
if (!fs.existsSync(DESTINATION_FOLDER)) {
    fs.mkdirSync(DESTINATION_FOLDER, { recursive: true });
    console.log(`✅ Multer directory created at: ${DESTINATION_FOLDER}`);
}
// ----------------------------------------------------

// Configure the storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use the new, correct path inside the Server/public directory
        cb(null, DESTINATION_FOLDER); 
    },
    filename: (req, file, cb) => {
        // Filename generation
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Create the 'upload' Multer instance
const upload = multer({ storage: storage });

// Export the middleware
export default upload.single('image');