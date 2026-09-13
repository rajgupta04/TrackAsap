import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// Allowed mimetypes and extensions
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.doc', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp'];

  if (ALLOWED_MIMES.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload a PDF, DOC, DOCX, TXT, MD, or image file.'), false);
  }
};

// 10 MB file size limit (matching Cloudinary free tier allowance)
export const hubUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

export const determineFileType = (mimetype = '', filename = '') => {
  const ext = path.extname(filename).toLowerCase();
  if (mimetype.includes('pdf') || ext === '.pdf') return 'pdf';
  if (
    mimetype.includes('word') ||
    mimetype.includes('officedocument') ||
    mimetype.startsWith('text/') ||
    ['.doc', '.docx', '.txt', '.md'].includes(ext)
  ) return 'doc';
  if (mimetype.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image';
  return 'other';
};

export const uploadToCloudinaryOrLocal = async (file) => {
  if (!file || !file.buffer) return null;

  const fileType = determineFileType(file.mimetype, file.originalname);
  const isImage = fileType === 'image';
  const resourceType = isImage ? 'image' : 'raw';
  const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const publicId = `hub_${Date.now()}_${cleanOriginalName}`;

  // Try Cloudinary first if credentials exist
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'trackasap/hub',
            resource_type: resourceType,
            public_id: publicId,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(file.buffer).pipe(stream);
      });

      return {
        fileUrl: cloudinaryResult.secure_url,
        fileName: file.originalname,
        fileSize: cloudinaryResult.bytes || file.size,
        fileType,
        mimeType: file.mimetype,
      };
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to local disk storage:', cloudErr.message);
    }
  }

  // Local storage fallback
  try {
    const uploadDir = path.join(process.cwd(), 'uploads', 'hub');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeFilename = `${Date.now()}-${cleanOriginalName}`;
    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, file.buffer);

    return {
      fileUrl: `/uploads/hub/${safeFilename}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType,
      mimeType: file.mimetype,
    };
  } catch (localErr) {
    console.error('Local fallback storage failed:', localErr);
    throw new Error('Failed to store uploaded file');
  }
};
