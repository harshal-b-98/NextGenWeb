/**
 * Conversion Goals API
 * Phase 4.4: Conversion & Lead Tools
 *
 * CRUD endpoints for conversion goals.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConversionService } from '@/lib/leads';
import type { ConversionGoalInput } from '@/lib/leads/conversion-service';

/**
 * GET /api/conversions/goals
 * List conversion goals for a website
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const websiteId = searchParams.get('websiteId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!websiteId) {
      return NextResponse.json(
        { success: false, error: 'Website ID is required' },
        { status: 400 }
      );
    }

    const conversionService = createConversionService();
    const goals = await conversionService.getGoals(websiteId, activeOnly);

    return NextResponse.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversions/goals
 * Create a new conversion goal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const input: ConversionGoalInput = await request.json();

    // Validation
    if (!input.name || !input.type || !input.websiteId) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and website ID are required' },
        { status: 400 }
      );
    }

    const validTypes = [
      'form_submission',
      'page_view',
      'click',
      'scroll_depth',
      'time_on_page',
      'custom_event',
    ];

    if (!validTypes.includes(input.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid goal type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const conversionService = createConversionService();
    const goal = await conversionService.createGoal(input);

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Failed to create goal' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: goal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/conversions/goals
 * Update a conversion goal
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId, ...updates } = await request.json();

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const conversionService = createConversionService();
    const goal = await conversionService.updateGoal(goalId, updates);

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Failed to update goal' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversions/goals
 * Delete a conversion goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const conversionService = createConversionService();
    const success = await conversionService.deleteGoal(goalId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete goal' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
