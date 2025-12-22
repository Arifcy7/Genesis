// app/api/company-auth/company/route.js
import { NextResponse } from 'next/server';
import { requireCompanyAuth } from '@/middleware/companyAuth';

export async function GET(request) {
  try {
    const authResult = await requireCompanyAuth(request);
    
    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { company } = authResult;

    return NextResponse.json({
      success: true,
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        officialWebsite: company.officialWebsite,
        profilePicture: company.profilePicture,
        createdAt: company.createdAt,
        lastLogin: company.lastLogin
      }
    });

  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch company data.' },
    { status: 405 }
  );
}
  