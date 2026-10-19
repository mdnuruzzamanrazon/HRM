import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../uploads/tasks');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate clean, safe unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginal);
    const baseName = path.basename(sanitizedOriginal, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed submission formats:
// PDF, Word (doc/docx), Images (jpg, jpeg, png, webp), Excel (xls, xlsx), Text, ZIP
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx|jpg|jpeg|png|webp|xls|xlsx|txt|zip|csv/i;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  if (extName) {
    return cb(null, true);
  }
  
  cb(new Error(`Unsupported file type: ${path.extname(file.originalname)}. Allowed formats: PDF, DOC, DOCX, JPG, PNG, WEBP, XLS, XLSX, ZIP, TXT.`));
};

export const taskUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10 // Max 10 files per submission
  },
  fileFilter
});

export const getUploadDirectory = () => uploadDir;
