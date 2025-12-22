// app/api/company/dashboard/route.js
import { NextResponse } from 'next/server';
import { requireCompanyAuth } from '@/middleware/companyAuth';

export async function GET(request) {
  try {
    const authResult = await requireCompanyAuth(request);

    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { company, companyId } = authResult;

    // Call Python backend to get analytics data
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/company/dashboard/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const analyticsData = await response.json();

        return NextResponse.json({
          success: true,
          company: {
            id: company._id.toString(),
            name: company.name,
            email: company.email,
            officialWebsite: company.officialWebsite,
            profilePicture: company.profilePicture,
            createdAt: company.createdAt,
            lastLogin: company.lastLogin
          },
          analytics: analyticsData
        });
      } else {
        // If backend fails, return basic company data
        console.error('Backend analytics failed:', await response.text());

        return NextResponse.json({
          success: true,
          company: {
            id: company._id.toString(),
            name: company.name,
            email: company.email,
            officialWebsite: company.officialWebsite,
            profilePicture: company.profilePicture,
            createdAt: company.createdAt,
            lastLogin: company.lastLogin
          },
          analytics: {
            has_data: false,
            message: "Analytics service unavailable. Please try again later."
          }
        });
      }
    } catch (backendError) {
      console.error('Backend connection error:', backendError);

      // Return basic company data if backend is unreachable
      return NextResponse.json({
        success: true,
        company: {
          id: company._id.toString(),
          name: company.name,
          email: company.email,
          officialWebsite: company.officialWebsite,
          profilePicture: company.profilePicture,
          createdAt: company.createdAt,
          lastLogin: company.lastLogin
        },
        analytics: {
          has_data: false,
          message: "Analytics service is currently unavailable."
        }
      });
    }

  } catch (error) {
    console.error('Get company dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch dashboard data.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch dashboard data.' },
    { status: 405 }
  );
}