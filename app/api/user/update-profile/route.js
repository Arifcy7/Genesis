// app/api/user/update-profile/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

export async function PUT(request) {
  try {
    const authResult = await requireAuth(request);

    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    await connectDB();

    const { name, email } = await request.json();

    // Input validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email.toLowerCase().trim() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to update profile.' },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to update profile.' },
    { status: 405 }
  );
}