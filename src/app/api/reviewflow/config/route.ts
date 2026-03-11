import { NextRequest, NextResponse } from 'next/server';
import { getReviewFlowConfig, updateReviewFlowConfig } from '@/lib/reviewflow';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ristoranteId = searchParams.get('ristoranteId');

    if (!ristoranteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: ristoranteId' },
        { status: 400 }
      );
    }

    const config = await getReviewFlowConfig(ristoranteId);

    if (!config) {
      return NextResponse.json(
        { error: 'ReviewFlow configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('ReviewFlow config GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get ReviewFlow configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { configId, updates } = body;

    if (!configId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: configId and updates' },
        { status: 400 }
      );
    }

    await updateReviewFlowConfig(configId, updates);

    return NextResponse.json({
      success: true,
      message: 'ReviewFlow configuration updated successfully',
    });
  } catch (error: any) {
    console.error('ReviewFlow config POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ReviewFlow configuration' },
      { status: 500 }
    );
  }
}
