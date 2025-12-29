import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('Members API called:', request.url);
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not configured');
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY) {
      console.error('NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const departmentId = searchParams.get('department_id');
    const includeAttendanceStats = searchParams.get('include_attendance_stats') === 'true';
    
    console.log('API Parameters:', { status, departmentId, includeAttendanceStats });

    let query = supabase
      .from('members')
      .select('id, first_name, last_name, member_number, phone, email, photo_url, status');
    
    // Only filter by status if it's provided and not 'all'
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    query = query.order('first_name', { ascending: true });

    if (departmentId) {
      // First get the member IDs from department_members
      const { data: departmentMembers, error: deptError } = await supabase
        .from('department_members')
        .select('member_id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (deptError) {
        console.error('Error fetching department members:', deptError);
        return NextResponse.json({ error: deptError.message }, { status: 500 });
      }

      // Extract the member IDs
      const memberIds = departmentMembers?.map(dm => dm.member_id) || [];
      
      // Filter members by the department member IDs
      if (memberIds.length > 0) {
        query = query.in('id', memberIds);
      } else {
        // No members in this department, return empty result
        return NextResponse.json({ data: [] });
      }
    }

    let { data, error } = await query;
    
    console.log('Initial query result:', { 
      dataLength: data?.length, 
      error: error?.message, 
      errorCode: error?.code 
    });

    // If RLS blocks direct access, try RPC function
    if (error && (error.message.includes('policy') || error.code === 'PGRST301' || error.message.includes('JWT'))) {
      console.log('Direct member access failed, trying RPC function...');
      try {
        const rpcParams = departmentId ? { dept_id: departmentId } : {};
        const rpcResult = await supabase.rpc('get_members', rpcParams);
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError) {
        console.error('RPC function also failed:', rpcError);
        error = rpcError as any;
      }
    }

    if (error) {
      console.error('Error fetching members:', error);
      
      // If members table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ 
          data: [],
          message: 'Members table not found. Please set up the members in your database.'
        });
      }
      
      // If RLS policy issue
      if (error.message.includes('policy') || error.code === 'PGRST301' || error.message.includes('JWT')) {
        return NextResponse.json({ 
          error: 'Database access denied due to RLS policies.',
          details: error.message,
          suggestion: 'Run the complete_attendance_setup.sql script in your database.'
        }, { status: 401 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let membersWithStats = data || [];

    // If attendance stats are requested, fetch them for each member
    if (includeAttendanceStats && membersWithStats.length > 0) {
      console.log('Fetching attendance stats for', membersWithStats.length, 'members');
      try {
        const memberIds = membersWithStats.map(m => m.id);
        
        // Get attendance stats for all members
        const { data: attendanceStats, error: statsError } = await supabase
          .from('attendance')
          .select(`
            member_id,
            present,
            date,
            attendance_type
          `)
          .in('member_id', memberIds)
          .order('date', { ascending: false });
        
        console.log('Attendance records found:', attendanceStats?.length, 'Error:', statsError?.message);

        if (statsError) {
          console.log('Attendance stats error:', statsError.message);
          // If attendance table doesn't exist, continue without stats
          if (statsError.message.includes('attendance') && statsError.message.includes('not find')) {
            console.log('attendance table not found, returning members without stats');
          }
        } else if (attendanceStats) {
          // Calculate stats for each member
          const memberStatsMap = new Map();
          
          attendanceStats.forEach(record => {
            if (!memberStatsMap.has(record.member_id)) {
              memberStatsMap.set(record.member_id, {
                total_sessions: 0,
                present_count: 0,
                absent_count: 0,
                last_attendance_date: null,
                streak: { current: 0, type: 'absent' },
                recent_records: []
              });
            }
            
            const stats = memberStatsMap.get(record.member_id);
            stats.total_sessions++;
            
            if (record.present) {
              stats.present_count++;
            } else {
              stats.absent_count++;
            }
            
            // Track last attendance date
            if (!stats.last_attendance_date || new Date(record.date) > new Date(stats.last_attendance_date)) {
              stats.last_attendance_date = record.date;
            }
            
            // Add to recent records for streak calculation
            stats.recent_records.push({
              date: record.date,
              present: record.present
            });
          });

          // Calculate final stats and streaks for each member
          memberStatsMap.forEach((stats, memberId) => {
            // Calculate attendance rate
            stats.attendance_rate = stats.total_sessions > 0 
              ? (stats.present_count / stats.total_sessions) * 100 
              : 0;

            // Calculate current streak
            stats.recent_records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (stats.recent_records.length > 0) {
              const latestRecord = stats.recent_records[0];
              stats.streak.type = latestRecord.present ? 'present' : 'absent';
              stats.streak.current = 1;
              
              // Count consecutive records of the same type
              for (let i = 1; i < stats.recent_records.length; i++) {
                if (stats.recent_records[i].present === latestRecord.present) {
                  stats.streak.current++;
                } else {
                  break;
                }
              }
            }

            // Clean up temporary data
            delete stats.recent_records;
          });

          // Attach stats to members
          membersWithStats = membersWithStats.map(member => ({
            ...member,
            stats: memberStatsMap.get(member.id) || {
              total_sessions: 0,
              present_count: 0,
              absent_count: 0,
              attendance_rate: 0,
              last_attendance_date: null,
              streak: { current: 0, type: 'absent' }
            }
          }));
        }
      } catch (statsError) {
        console.error('Error calculating attendance stats:', statsError);
        // Continue without stats if there's an error
      }
    }

    console.log('Returning', membersWithStats.length, 'members with stats');
    return NextResponse.json({ data: membersWithStats });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
