// app/api/company/update-profile/route.js
import { NextResponse } from 'next/server';
import { requireCompanyAuth } from '@/middleware/companyAuth';
import connectDB from '@/lib/mongodb';
import Company from '@/models/company';

export async function PUT(request) {
  try {
    const authResult = await requireCompanyAuth(request);

    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { company } = authResult;
    await connectDB();

    const { name, email } = await request.json();

    // Input validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
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

    // Check if email is already taken by another company
    if (email.toLowerCase().trim() !== company.email) {
      const existingCompany = await Company.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: company._id }
      });

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      company._id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      message: 'Company profile updated successfully',
      company: {
        id: updatedCompany._id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        profilePicture: updatedCompany.profilePicture,
        createdAt: updatedCompany.createdAt,
        lastLogin: updatedCompany.lastLogin
      }
    });

  } catch (error) {
    console.error('Company profile update error:', error);
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
