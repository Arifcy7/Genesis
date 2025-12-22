// app/api/company/fetch-news/route.js
import { NextResponse } from 'next/server';
import { requireCompanyAuth } from '@/middleware/companyAuth';

export async function POST(request) {
  try {
    const authResult = await requireCompanyAuth(request);

    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { company, companyId } = authResult;

    // Parse user-provided analysis options
    const body = await request.json().catch(() => ({}));
    const analysisPeriod = body?.analysisPeriod || 'today';
    const competitors = Array.isArray(body?.competitors) ? body.competitors : undefined;

    // Call Python backend to trigger news analysis with options
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/company/fetch-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: companyId,
          analysisPeriod,
          competitors
        })
      });

      if (response.ok) {
        const result = await response.json();

        return NextResponse.json({
          success: true,
          message: 'News analysis completed successfully',
          company: {
            id: company._id,
            name: company.name
          },
          result: result
        });
      } else {
        const errorData = await response.json().catch(() => ({}));

        return NextResponse.json({
          success: false,
          error: errorData.detail || 'Failed to fetch news from backend service',
        }, { status: 500 });
      }
    } catch (backendError) {
      console.error('Backend connection error:', backendError);

      return NextResponse.json({
        success: false,
        error: 'News analysis service is currently unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Fetch news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger news analysis.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger news analysis.' },
    { status: 405 }
  );
}