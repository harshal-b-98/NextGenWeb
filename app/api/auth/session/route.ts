/**
 * Auth Session API
 *
 * Returns the current authenticated user session
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 1: Foundation
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
