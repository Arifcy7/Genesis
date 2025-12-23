// app/api/company/update-profile-picture/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Readable } from 'stream';
import connectDB from '@/lib/mongodb';
import Company from '@/models/company';
import { v2 as cloudinary } from 'cloudinary';

// Validate environment variables on startup
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const UPLOAD_FOLDER = 'aiml-club/company-profile-pictures';

// Upload function using Cloudinary's upload API
const uploadToCloudinary = async (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDER,
        public_id: `company_profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        resource_type: 'auto',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { format: 'webp' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        max_file_size: MAX_FILE_SIZE
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error(`Upload failed: ${error.message}`));
        }
        resolve(result);
      }
    );
    
    try {
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    } catch (error) {
      reject(new Error(`Stream processing failed: ${error.message}`));
    }
  });
};

// Delete old image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
    
    const urlParts = imageUrl.split('/');
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    
    if (versionIndex === -1) return;
    
    const pathAfterVersion = urlParts.slice(versionIndex + 1);
    const fileWithExtension = pathAfterVersion.join('/');
    const publicId = fileWithExtension.replace(/\.[^/.]+$/, '');
    
    await cloudinary.uploader.destroy(publicId);
    console.log('Old company image deleted successfully');
  } catch (error) {
    console.error('Error deleting old company image:', error);
  }
};

// Validate file helper
const validateFile = (file) => {
  if (!file) {
    throw new Error('No image file provided');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image size must be less than 5MB');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP, and GIF images are allowed');
  }
};

export async function POST(request) {
  try {
    // Get company ID from cookies
    const cookieStore = await cookies();
    const companyId = cookieStore.get('companyId')?.value;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify company exists
    const existingCompany = await Company.findById(companyId).select('-password');
    if (!existingCompany || !existingCompany.isActive) {
      return NextResponse.json(
        { error: 'Company not found. Please log in again.' },
        { status: 404 }
      );
    }

    // Get and validate form data
    const formData = await request.formData();
    const file = formData.get('profilePicture');

    // Validate file
    validateFile(file);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload new image to Cloudinary
    console.log('Uploading company image to Cloudinary...');
    const uploadResult = await uploadToCloudinary(buffer, file.name);
    
    if (!uploadResult?.secure_url) {
      throw new Error('Failed to upload image to cloud storage');
    }
    
    const newImageUrl = uploadResult.secure_url;
    console.log('Company image uploaded successfully:', newImageUrl);

    // Update company profile in database
    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { 
        profilePicture: newImageUrl,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    if (!updatedCompany) {
      throw new Error('Failed to update company profile');
    }

    // Delete old profile picture (async, don't wait)
    if (existingCompany.profilePicture && existingCompany.profilePicture !== newImageUrl) {
      deleteFromCloudinary(existingCompany.profilePicture).catch(console.error);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Company profile picture updated successfully',
      profilePicture: newImageUrl,
      company: {
        id: updatedCompany._id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        profilePicture: updatedCompany.profilePicture,
        updatedAt: updatedCompany.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update company profile picture error:', error);
    
    if (error.message.includes('Authentication required') || 
        error.message.includes('Company not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (error.message.includes('No image file') ||
        error.message.includes('File must be') ||
        error.message.includes('Image size') ||
        error.message.includes('Only JPG')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.http_code || error.message.includes('Upload failed')) {
      return NextResponse.json(
        { error: 'Image upload failed. Please try again.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}

// Handle unsupported HTTP methods
const methodNotAllowed = () => NextResponse.json(
  { error: 'Method not allowed. Use POST to upload profile picture.' },
  { status: 405 }
);

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const PATCH = methodNotAllowed;
