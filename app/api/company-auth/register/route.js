// app/api/company-auth/register/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/company';
import { companyRateLimit } from '@/middleware/companyAuth';

export async function POST(request) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (companyRateLimit(`company-register-${clientIP}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    await connectDB();
    const { name, email, password, officialWebsite } = await request.json();

    // Input validation
    if (!name?.trim() || !email?.trim() || !password || !officialWebsite?.trim()) {
      return NextResponse.json(
        { error: 'Please provide company name, email, password, and official website' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedWebsite = officialWebsite.trim();

    // Validate website URL format
    const urlRegex = /^https?:\/\/.+\..+/;
    if (!urlRegex.test(trimmedWebsite)) {
      return NextResponse.json(
        { error: 'Please provide a valid website URL (e.g., https://example.com)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ email: trimmedEmail });
    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company account with this email already exists' },
        { status: 409 }
      );
    }

    // Create new company (password will be hashed by pre-save hook)
    const company = await Company.create({
      name: trimmedName,
      email: trimmedEmail,
      password: password, // Let the pre-save hook handle hashing
      officialWebsite: trimmedWebsite
    });

    return NextResponse.json({
      success: true,
      message: 'Company account created successfully! Please sign in.',
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        officialWebsite: company.officialWebsite
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Company registration error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A company account with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
