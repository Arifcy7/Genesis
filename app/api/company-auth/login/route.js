// app/api/company-auth/login/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Company from '@/models/company';
import { companyRateLimit } from '@/middleware/companyAuth';

export async function POST(request) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (companyRateLimit(`company-login-${clientIP}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    await connectDB();
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // Find company and explicitly select password
    const company = await Company.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true
    }).select('+password');
    
    if (!company) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordMatch = await company.comparePassword(password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await Company.findByIdAndUpdate(company._id, { lastLogin: new Date() });

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'companyId',
      value: company._id.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
      sameSite: 'strict'
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        profilePicture: company.profilePicture
      }
    });

  } catch (error) {
    console.error('Company login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
