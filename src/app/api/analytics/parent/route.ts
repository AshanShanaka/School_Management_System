/**
 * API Route: Get parent's children analytics
 * Accessible by: Parent (own children only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getParentChildAnalytics } from '@/lib/performanceAnalyticsService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only parents can access this endpoint
    if (user.role !== 'parent') {
      return NextResponse.json({ error: 'Forbidden: Parents only' }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();

    // Get analytics for all children
    const childrenAnalytics = await getParentChildAnalytics(user.id);

    return NextResponse.json({
      success: true,
      mlApiStatus: mlApiAvailable ? 'online' : 'offline',
      data: childrenAnalytics,
    });
  } catch (error) {
    console.error('Error fetching parent children analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
