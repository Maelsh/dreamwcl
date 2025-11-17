const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Ensure uploads directory exists
const ensureUploadDir = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        throw new ApiError('فشل في إنشاء مجلد الرفع', 500);
    }
};

// Configure storage based on storage type
const getStorage = (storageType = 'local') => {
    switch (storageType) {
        case 's3':
            return require('./s3-storage');
        default:
            return multer.diskStorage({
                destination: async (req, file, cb) => {
                    const uploadPath = path.join(__dirname, '../../uploads', file.fieldname);
                    await ensureUploadDir(uploadPath);
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const ext = path.extname(file.originalname);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                }
            });
    }
};

// File filter for different file types
const createFileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        // Check MIME type
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ApiError(`نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}`), false);
        }
    };
};

// Default upload configurations
const uploadConfigs = {
    avatar: {
        storage: getStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
            files: 1
        },
        fileFilter: createFileFilter([
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ])
    },
    document: {
        storage: getStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 5
        },
        fileFilter: createFileFilter([
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ])
    },
    image: {
        storage: getStorage(),
        limits: {
            fileSize: 8 * 1024 * 1024, // 8MB
            files: 3
        },
        fileFilter: createFileFilter([
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp'
        ])
    },
    video: {
        storage: getStorage(),
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
            files: 1
        },
        fileFilter: createFileFilter([
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo'
        ])
    }
};

// Create upload middleware
const createUploadMiddleware = (configName, storageType = 'local') => {
    const config = uploadConfigs[configName];
    if (!config) {
        throw new ApiError(`تكوين الرفع غير معروف: ${configName}`, 400);
    }

    const storage = getStorage(storageType);
    const upload = multer({
        storage: storage,
        limits: config.limits,
        fileFilter: config.fileFilter
    });

    return upload;
};

// Image processing utilities
const processImage = async (filePath, options = {}) => {
    const {
        width = null,
        height = null,
        fit = 'cover',
        quality = 90,
        format = null,
        withoutEnlargement = true
    } = options;

    try {
        let image = sharp(filePath);
        
        // Resize if dimensions provided
        if (width || height) {
            image = image.resize(width, height, {
                fit,
                withoutEnlargement
            });
        }
        
        // Convert format if specified
        if (format) {
            const supportedFormats = ['jpeg', 'png', 'webp', 'avif', 'gif'];
            if (supportedFormats.includes(format.toLowerCase())) {
                image = image.toFormat(format.toLowerCase());
            }
        }
        
        // Set quality for formats that support it
        if (['jpeg', 'png', 'webp'].includes(format?.toLowerCase())) {
            image = image.jpeg({ quality }).png({ quality }).webp({ quality });
        }
        
        return await image.toBuffer();
    } catch (error) {
        logger.error('Image processing failed', {
            filePath,
            error: error.message
        });
        throw new ApiError('فشل في معالجة الصورة', 500);
    }
};

// Generate different image sizes
const generateImageSizes = async (filePath, sizes = {}) => {
    const defaultSizes = {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 }
    };

    const finalSizes = { ...defaultSizes, ...sizes };
    const results = {};

    for (const [sizeName, dimensions] of Object.entries(finalSizes)) {
        try {
            const processedBuffer = await processImage(filePath, {
                ...dimensions,
                format: 'webp',
                quality: sizeName === 'thumbnail' ? 80 : 90
            });
            
            results[sizeName] = {
                buffer: processedBuffer,
                size: processedBuffer.length,
                dimensions
            };
        } catch (error) {
            logger.error(`Failed to generate ${sizeName} image`, {
                filePath,
                error: error.message
            });
        }
    }

    return results;
};

// Validate image file
const validateImage = async (filePath) => {
    try {
        const metadata = await sharp(filePath).metadata();
        
        // Check image dimensions
        if (metadata.width < 100 || metadata.height < 100) {
            throw new ApiError('الصورة صغيرة جداً. الحد الأدنى 100x100 بكسل', 400);
        }
        
        if (metadata.width > 4000 || metadata.height > 4000) {
            throw new ApiError('الصورة كبيرة جداً. الحد الأقصى 4000x4000 بكسل', 400);
        }
        
        // Check if image is corrupted
        if (!metadata.format) {
            throw new ApiError('ملف الصورة تالف أو غير مدعوم', 400);
        }
        
        return {
            isValid: true,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                channels: metadata.channels,
                density: metadata.density
            }
        };
    } catch (error) {
        logger.error('Image validation failed', {
            filePath,
            error: error.message
        });
        return {
            isValid: false,
            error: error.message
        };
    }
};

// Clean up temporary files
const cleanupFiles = async (filePaths) => {
    const cleanupPromises = filePaths.map(async (filePath) => {
        try {
            await fs.unlink(filePath);
            logger.info('Temporary file cleaned up', { filePath });
        } catch (error) {
            logger.warn('Failed to clean up file', {
                filePath,
                error: error.message
            });
        }
    });
    
    await Promise.allSettled(cleanupPromises);
};

// Get file info
const getFileInfo = async (filePath) => {
    try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath);
        const basename = path.basename(filePath, ext);
        
        return {
            filename: basename,
            extension: ext.toLowerCase(),
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            path: filePath
        };
    } catch (error) {
        throw new ApiError('فشل في الحصول على معلومات الملف', 500);
    }
};

// Generate secure filename
const generateSecureFilename = (originalName, userId = null, prefix = '') => {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const userPart = userId ? `${userId}-` : '';
    
    const sanitizedBaseName = baseName
        .replace(/[^a-zA-Z0-9أ-ي]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `${prefix}${userPart}${sanitizedBaseName}-${timestamp}-${random}${ext}`;
};

// Extract file metadata
const extractMetadata = async (filePath, mimeType) => {
    const info = await getFileInfo(filePath);
    
    let metadata = { ...info };
    
    // Add image-specific metadata
    if (mimeType.startsWith('image/')) {
        try {
            const sharpMetadata = await sharp(filePath).metadata();
            metadata.image = {
                width: sharpMetadata.width,
                height: sharpMetadata.height,
                format: sharpMetadata.format,
                channels: sharpMetadata.channels,
                density: sharpMetadata.density,
                hasAlpha: sharpMetadata.hasAlpha,
                isProgressive: sharpMetadata.isProgressive,
                orientation: sharpMetadata.orientation
            };
        } catch (error) {
            logger.warn('Failed to extract image metadata', {
                filePath,
                error: error.message
            });
        }
    }
    
    return metadata;
};

// Middleware for handling multiple file uploads
const createMultiUploadMiddleware = (configName, storageType = 'local', fieldNames = []) => {
    const config = uploadConfigs[configName];
    if (!config) {
        throw new ApiError(`تكوين الرفع غير معروف: ${configName}`, 400);
    }

    const storage = getStorage(storageType);
    
    // Create upload instance
    const upload = multer({
        storage: storage,
        limits: config.limits,
        fileFilter: config.fileFilter
    });

    // Create middleware for each field
    const middlewares = {};
    fieldNames.forEach(fieldName => {
        middlewares[fieldName] = upload.single(fieldName);
    });

    return middlewares;
};

// S3 Storage Helper (placeholder)
const s3Storage = {
    upload: async (file, key, bucket = null) => {
        // This would implement S3 upload logic
        // For now, return a placeholder
        return {
            key,
            url: `https://s3.amazonaws.com/${bucket}/${key}`,
            bucket,
            location: `s3://${bucket}/${key}`
        };
    },
    
    delete: async (key, bucket = null) => {
        // This would implement S3 delete logic
        return { deleted: true, key };
    }
};

module.exports = {
    createUploadMiddleware,
    createMultiUploadMiddleware,
    processImage,
    generateImageSizes,
    validateImage,
    cleanupFiles,
    getFileInfo,
    generateSecureFilename,
    extractMetadata,
    s3Storage,
    uploadConfigs
};