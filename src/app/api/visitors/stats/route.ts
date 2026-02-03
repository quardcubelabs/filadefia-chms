import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch visitor stats
export async function GET(request: NextRequest) {
  try {
    // Use service role to bypass RLS
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const monthEnd = now.toISOString().split('T')[0];

    // Get all visitors
    const { data: allVisitors, error: allError } = await supabase
      .from('visitors')
      .select('id, visited_date, converted, followed_up', { count: 'exact' });

    if (allError) throw allError;

    // Get this month's visitors
    const { data: thisMonthVisitors, count: monthCount } = await supabase
      .from('visitors')
      .select('id', { count: 'exact' })
      .gte('visited_date', monthStart)
      .lte('visited_date', monthEnd);

    // Calculate stats
    const total = allVisitors?.length || 0;
    const converted = allVisitors?.filter(v => v.converted).length || 0;
    const followedUp = allVisitors?.filter(v => v.followed_up).length || 0;
    const newThisMonth = monthCount || 0;
    const notFollowedUp = total - followedUp;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_visitors: total,
        new_this_month: newThisMonth,
        converted,
        followed_up: followedUp,
        not_followed_up: notFollowedUp,
        conversion_rate: parseFloat(conversionRate.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Error fetching visitor stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
