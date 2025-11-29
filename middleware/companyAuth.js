// middleware/companyAuth.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Company from '@/models/company';

export async function requireCompanyAuth(request) {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get('companyId')?.value;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Verify company exists in database
    await connectDB();
    const company = await Company.findById(companyId).select('-password');
    
    if (!company || !company.isActive) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: 'Company not found. Please log in again.' },
        { status: 401 }
      );

      response.cookies.set({
        name: 'companyId',
        value: '',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict'
      });

      return response;
    }

    return { company, companyId };
  } catch (error) {
    console.error('Company auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Rate limiting helper
const rateLimitMap = new Map();

export function companyRateLimit(identifier, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = identifier;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  const record = rateLimitMap.get(key);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return false;
  }
  
  if (record.count >= limit) {
    return true;
  }
  
  record.count++;
  return false;
}
