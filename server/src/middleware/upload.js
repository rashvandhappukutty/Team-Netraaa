import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../uploads/evidence');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Map extensions to evidence categories
export function detectEvidenceCategory(mimeType = '', extension = '') {
  const ext = extension.toLowerCase().replace('.', '');
  const mime = mimeType.toLowerCase();

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'svg', 'gif'].includes(ext)
  ) {
    return 'IMAGE';
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'm4v'].includes(ext)
  ) {
    return 'VIDEO';
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac', 'wma'].includes(ext)
  ) {
    return 'AUDIO';
  }

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('text') ||
    mime.includes('csv') ||
    mime.includes('sheet') ||
    mime.includes('json') ||
    ['pdf', 'docx', 'doc', 'txt', 'csv', 'xlsx', 'xls', 'log', 'json', 'xml', 'rtf'].includes(ext)
  ) {
    return 'DOCUMENT';
  }

  return 'OTHER';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe filename with timestamp prefix and sanitized original name
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePrefix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniquePrefix}_${sanitized}`);
  }
});

// Allowable file extensions
const ALLOWED_EXTENSIONS = [
  'pdf', 'docx', 'doc', 'txt', 'csv', 'xlsx', 'xls', 'log', 'json',
  'jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'svg', 'gif',
  'mp4', 'mov', 'avi', 'mkv', 'webm',
  'mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (.${ext}). Only forensic documents, images, audio, and video formats are permitted.`), false);
  }
};

export const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max per evidence item in MVP
  }
});
