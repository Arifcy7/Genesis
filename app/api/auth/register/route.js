// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';
import { rateLimit } from '@/middleware/auth';

export async function POST(request) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimit(`register-${clientIP}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    await connectDB();
    const { name, email, password } = await request.json();

    // Input validation
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: password // Let the pre-save hook handle hashing
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please sign in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}