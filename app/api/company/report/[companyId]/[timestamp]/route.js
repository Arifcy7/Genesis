// app/api/company/report/[companyId]/[timestamp]/route.js
import { NextResponse } from 'next/server';
import { requireCompanyAuth } from '@/middleware/companyAuth';

export async function GET(request, { params }) {
  try {
    const authResult = await requireCompanyAuth(request);

    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { companyId } = authResult;
    
    // Await params as they're async in Next.js 15+
    const awaitedParams = await params;
    const { companyId: requestedCompanyId, timestamp } = awaitedParams;

    // Ensure both IDs are strings for comparison
    const authCompanyId = String(companyId);
    const reqCompanyId = String(requestedCompanyId);

    console.log('Report Auth Check:', {
      authCompanyId,
      reqCompanyId,
      match: authCompanyId === reqCompanyId
    });

    // Verify the company is requesting their own report
    if (authCompanyId !== reqCompanyId) {
      console.error('Company ID mismatch:', { authCompanyId, reqCompanyId });
      return NextResponse.json(
        { error: 'Unauthorized access to report' },
        { status: 403 }
      );
    }

    // Call Python backend to get specific report
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(
        `${backendUrl}/api/company/report/${authCompanyId}/${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const reportData = await response.json();
        return NextResponse.json(reportData);
      } else {
        console.error('Backend report fetch failed:', await response.text());
        return NextResponse.json(
          { error: 'Failed to fetch report' },
          { status: response.status }
        );
      }
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json(
        { error: 'Report service is currently unavailable' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
