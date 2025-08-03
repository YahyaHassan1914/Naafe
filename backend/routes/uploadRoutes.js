import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure multer for memory storage (we'll upload to ImgBB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload single image to ImgBB
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No image file provided'
        }
      });
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    
    // Upload to ImgBB
    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('key', process.env.IMGBB_API_KEY);

    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!imgbbResponse.ok) {
      throw new Error('Failed to upload to ImgBB');
    }

    const imgbbData = await imgbbResponse.json();
    
    if (!imgbbData.success) {
      throw new Error(imgbbData.error?.message || 'ImgBB upload failed');
    }

    res.json({
      success: true,
      data: {
        imageUrl: imgbbData.data.url,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to upload image'
      }
    });
  }
});

export default router; 