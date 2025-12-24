import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch attendance statistics
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // weekly, monthly, quarterly, yearly
    const departmentId = searchParams.get('department_id');
    const attendanceType = searchParams.get('type');

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate date ranges based on period
    let startDate: string;
    let endDate: string = now.toISOString().split('T')[0];

    switch (period) {
      case 'weekly':
        const today = new Date();
        const currentDay = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - currentDay); // Start from Sunday
        startDate = weekStart.toISOString().split('T')[0];
        break;
      case 'quarterly':
        const quarterStart = new Date(currentYear, Math.floor((currentMonth - 1) / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        break;
      case 'yearly':
        startDate = `${currentYear}-01-01`;
        break;
      default: // monthly
        startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    }

    // Base attendance query
    let attendanceQuery = supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (attendanceType) {
      attendanceQuery = attendanceQuery.eq('attendance_type', attendanceType);
    }

    // Get total members for percentage calculations
    let membersQuery = supabase
      .from('members')
      .select('id')
      .eq('status', 'active');

    if (departmentId) {
      // Filter attendance by department members
      const { data: deptMembers } = await supabase
        .from('department_members')
        .select('member_id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      const memberIds = deptMembers?.map(dm => dm.member_id) || [];
      
      if (memberIds.length > 0) {
        attendanceQuery = attendanceQuery.in('member_id', memberIds);
        membersQuery = membersQuery.in('id', memberIds);
      }
    }

    // Execute queries
    const [attendanceResult, membersResult] = await Promise.all([
      attendanceQuery,
      membersQuery
    ]);

    if (attendanceResult.error || membersResult.error) {
      console.error('Query error:', attendanceResult.error || membersResult.error);
      return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 });
    }

    const attendanceRecords = attendanceResult.data || [];
    const totalMembers = membersResult.data?.length || 0;

    // Calculate overall statistics - for weekly, show unique present members across all sessions
    let presentCount, absentCount, totalRecords, attendanceRate;
    
    if (period === 'weekly') {
      // For weekly stats, count unique members who attended any session
      const uniquePresentMembers = new Set(
        attendanceRecords.filter(a => a.present).map(a => a.member_id)
      );
      const uniqueAllMembers = new Set(attendanceRecords.map(a => a.member_id));
      
      presentCount = uniquePresentMembers.size;
      totalRecords = Math.max(uniqueAllMembers.size, totalMembers); // Use total members if higher
      absentCount = totalRecords - presentCount;
      attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
    } else {
      // For other periods, use total attendance records
      presentCount = attendanceRecords.filter(a => a.present).length;
      absentCount = attendanceRecords.filter(a => !a.present).length;
      totalRecords = presentCount + absentCount;
      attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
    }

    // Get attendance by date and type for sessions
    const attendanceByDateAndType = attendanceRecords.reduce((acc: any, record) => {
      const key = `${record.date}_${record.attendance_type}`;
      if (!acc[key]) {
        acc[key] = { 
          date: record.date,
          attendance_type: record.attendance_type,
          present: 0, 
          absent: 0 
        };
      }
      if (record.present) {
        acc[key].present++;
      } else {
        acc[key].absent++;
      }
      return acc;
    }, {});

    // Convert to array for charts - includes attendance_type for sessions
    const dateStats = Object.values(attendanceByDateAndType).map((stats: any) => ({
      date: stats.date,
      attendance_type: stats.attendance_type,
      present: stats.present,
      absent: stats.absent,
      total: stats.present + stats.absent,
      percentage: stats.present + stats.absent > 0 ? (stats.present / (stats.present + stats.absent)) * 100 : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    console.log('Sessions calculation:', {
      period,
      totalAttendanceRecords: attendanceRecords.length,
      uniqueSessionsCount: dateStats.length,
      sessions: dateStats.map(s => ({ date: s.date, type: s.attendance_type }))
    });

    // Legacy format for backward compatibility
    const attendanceByDate = attendanceRecords.reduce((acc: any, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0 };
      }
      if (record.present) {
        acc[date].present++;
      } else {
        acc[date].absent++;
      }
      return acc;
    }, {});

    // Get attendance trend by service type and date
    const trendByDateAndType = attendanceRecords.reduce((acc: any, record) => {
      const date = record.date;
      const type = record.attendance_type;
      
      if (!acc[date]) {
        acc[date] = {};
      }
      
      if (!acc[date][type]) {
        acc[date][type] = { present: 0, total: 0 };
      }
      
      acc[date][type].total++;
      if (record.present) {
        acc[date][type].present++;
      }
      
      return acc;
    }, {});

    // Convert to array and add percentage for each service type
    const trendData = Object.entries(trendByDateAndType)
      .map(([date, types]: [string, any]) => {
        const data: any = { date };
        
        // Church services (Sunday + Midweek)
        const churchServices = (types.sunday_service || { present: 0, total: 0 });
        const midweekServices = (types.midweek_fellowship || { present: 0, total: 0 });
        const churchTotal = churchServices.total + midweekServices.total;
        const churchPresent = churchServices.present + midweekServices.present;
        data.church_services = churchTotal > 0 ? (churchPresent / churchTotal) * 100 : 0;
        
        // Department meetings
        const deptMeetings = types.department_meeting || { present: 0, total: 0 };
        data.department_meetings = deptMeetings.total > 0 ? (deptMeetings.present / deptMeetings.total) * 100 : 0;
        
        // Zone meetings (special events used as zone meetings)
        const specialEvents = types.special_event || { present: 0, total: 0 };
        data.zone_meetings = specialEvents.total > 0 ? (specialEvents.present / specialEvents.total) * 100 : 0;
        
        return data;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get attendance by type
    const attendanceByType = attendanceRecords.reduce((acc: any, record) => {
      const type = record.attendance_type;
      if (!acc[type]) {
        acc[type] = { present: 0, absent: 0 };
      }
      if (record.present) {
        acc[type].present++;
      } else {
        acc[type].absent++;
      }
      return acc;
    }, {});

    // Get top attending members
    const memberAttendance = attendanceRecords.reduce((acc: any, record) => {
      const memberId = record.member_id;
      if (!acc[memberId]) {
        acc[memberId] = { present: 0, total: 0 };
      }
      acc[memberId].total++;
      if (record.present) {
        acc[memberId].present++;
      }
      return acc;
    }, {});

    // Get member details for top attendees
    const memberIds = Object.keys(memberAttendance);
    const { data: members } = await supabase
      .from('members')
      .select('id, first_name, last_name, member_number, photo_url')
      .in('id', memberIds);

    const topAttendees = members?.map(member => {
      const stats = memberAttendance[member.id];
      return {
        ...member,
        attendance_rate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
        total_sessions: stats.total,
        present_count: stats.present
      };
    }).sort((a, b) => b.attendance_rate - a.attendance_rate).slice(0, 10) || [];

    // Calculate weekly trend for attendance rate comparison
    let weeklyTrend = 0;
    if (period === 'weekly') {
      // Get previous week's data for comparison
      const previousWeekStart = new Date(startDate);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(startDate);
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
      
      // Query previous week's attendance
      let prevWeekQuery = supabase
        .from('attendance')
        .select('*')
        .gte('date', previousWeekStart.toISOString().split('T')[0])
        .lte('date', previousWeekEnd.toISOString().split('T')[0]);
        
      if (attendanceType) {
        prevWeekQuery = prevWeekQuery.eq('attendance_type', attendanceType);
      }
      if (departmentId) {
        const { data: deptMembers } = await supabase
          .from('department_members')
          .select('member_id')
          .eq('department_id', departmentId)
          .eq('is_active', true);
        const memberIds = deptMembers?.map(dm => dm.member_id) || [];
        if (memberIds.length > 0) {
          prevWeekQuery = prevWeekQuery.in('member_id', memberIds);
        }
      }
      
      try {
        const { data: prevWeekRecords } = await prevWeekQuery;
        if (prevWeekRecords && prevWeekRecords.length > 0) {
          const prevWeekPresentMembers = new Set(
            prevWeekRecords.filter(a => a.present).map(a => a.member_id)
          );
          const prevWeekRate = totalMembers > 0 ? (prevWeekPresentMembers.size / totalMembers) * 100 : 0;
          weeklyTrend = attendanceRate - prevWeekRate;
        }
      } catch (error) {
        console.error('Error calculating weekly trend:', error);
        weeklyTrend = 0;
      }
    }

    const statistics = {
      overview: {
        totalMembers,
        presentCount,
        absentCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalSessions: dateStats.length,
        period: period,
        weeklyTrend: Math.round(weeklyTrend * 100) / 100
      },
      dateStats,
      trendData,
      typeStats: Object.entries(attendanceByType).map(([type, stats]: [string, any]) => ({
        type,
        present: stats.present,
        absent: stats.absent,
        total: stats.present + stats.absent,
        percentage: stats.present + stats.absent > 0 ? (stats.present / (stats.present + stats.absent)) * 100 : 0
      })),
      topAttendees,
      period: {
        type: period,
        startDate,
        endDate
      }
    };

    return NextResponse.json({ data: statistics });
  } catch (error) {
    console.error('Unexpected error in attendance stats:', error);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && error.stack ? error.stack : 'No stack trace';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorDetails,
      url: request.url
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}