import { NextRequest, NextResponse } from 'next/server';
import { getReviewStats, getReviewRequests } from '@/lib/reviewflow';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ristoranteId = searchParams.get('ristoranteId');
    const includeRequests = searchParams.get('includeRequests') === 'true';

    if (!ristoranteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: ristoranteId' },
        { status: 400 }
      );
    }

    const stats = await getReviewStats(ristoranteId);

    const response: { success: boolean; stats: typeof stats; requests?: any[] } = {
      success: true,
      stats,
    };

    if (includeRequests) {
      const requests = await getReviewRequests(ristoranteId, 50);
      response.requests = requests;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('ReviewFlow stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get ReviewFlow stats' },
      { status: 500 }
    );
  }
}
