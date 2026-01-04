import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';
const MODEL = 'qwen/qwen-2.5-vl-7b-instruct:free';

interface ReportData {
  reportType: string;
  totalMembers?: number;
  activeMembers?: number;
  newMembers?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  totalEvents?: number;
  upcomingEvents?: number;
  completedEvents?: number;
  totalDepartments?: number;
  totalZones?: number;
  attendanceRate?: number;
  periodStart?: string;
  periodEnd?: string;
  departmentStats?: Array<{
    name: string;
    memberCount: number;
    totalIncome?: number;
    totalExpenses?: number;
  }>;
  zoneStats?: Array<{
    name: string;
    memberCount: number;
    totalIncome?: number;
  }>;
  financialTrends?: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

function buildPrompt(data: ReportData): string {
  const reportTypeDescriptions: Record<string, string> = {
    'comprehensive': 'Comprehensive Church Report',
    'financial': 'Financial Report',
    'membership': 'Membership Report',
    'attendance': 'Attendance Report',
    'departments': 'Departments Report',
    'zones': 'Zones/Jumuiya Report',
    'events': 'Events Report'
  };

  const reportTitle = reportTypeDescriptions[data.reportType] || 'Church Report';
  
  let prompt = `You are a professional church administrator assistant. Generate a professional executive summary and insights for a ${reportTitle} for "The Apostolic Gospel Church" (TAG Church).

Based on the following data, write:
1. A brief executive summary (2-3 sentences)
2. Key highlights and achievements (3-4 bullet points)
3. Areas for attention or improvement (2-3 bullet points)
4. A brief recommendation or outlook (1-2 sentences)

Keep the tone professional, positive, and constructive. Use clear language appropriate for church leadership.

REPORT DATA:
- Report Period: ${data.periodStart || 'N/A'} to ${data.periodEnd || 'N/A'}
`;

  if (data.totalMembers !== undefined) {
    prompt += `\nMEMBERSHIP:
- Total Members: ${data.totalMembers}
- Active Members: ${data.activeMembers || 'N/A'}
- New Members This Period: ${data.newMembers || 'N/A'}`;
  }

  if (data.totalIncome !== undefined || data.totalExpenses !== undefined) {
    prompt += `\n\nFINANCIAL:
- Total Income: TZS ${(data.totalIncome || 0).toLocaleString()}
- Total Expenses: TZS ${(data.totalExpenses || 0).toLocaleString()}
- Net Amount: TZS ${(data.netAmount || 0).toLocaleString()}`;
  }

  if (data.totalEvents !== undefined) {
    prompt += `\n\nEVENTS:
- Total Events: ${data.totalEvents}
- Upcoming Events: ${data.upcomingEvents || 0}
- Completed Events: ${data.completedEvents || 0}`;
  }

  if (data.attendanceRate !== undefined) {
    prompt += `\n\nATTENDANCE:
- Average Attendance Rate: ${data.attendanceRate}%`;
  }

  if (data.totalDepartments !== undefined) {
    prompt += `\n\nDEPARTMENTS:
- Total Active Departments: ${data.totalDepartments}`;
  }

  if (data.departmentStats && data.departmentStats.length > 0) {
    prompt += `\n- Top Departments by Members: ${data.departmentStats.slice(0, 3).map(d => `${d.name} (${d.memberCount})`).join(', ')}`;
  }

  if (data.totalZones !== undefined) {
    prompt += `\n\nZONES/JUMUIYA:
- Total Active Zones: ${data.totalZones}`;
  }

  if (data.zoneStats && data.zoneStats.length > 0) {
    prompt += `\n- Zones Overview: ${data.zoneStats.slice(0, 3).map(z => `${z.name} (${z.memberCount} members)`).join(', ')}`;
  }

  if (data.financialTrends && data.financialTrends.length > 0) {
    const totalTrendIncome = data.financialTrends.reduce((sum, t) => sum + t.income, 0);
    const totalTrendExpenses = data.financialTrends.reduce((sum, t) => sum + t.expenses, 0);
    prompt += `\n\nFINANCIAL TRENDS:
- Period Income Total: TZS ${totalTrendIncome.toLocaleString()}
- Period Expenses Total: TZS ${totalTrendExpenses.toLocaleString()}`;
  }

  prompt += `\n\nPlease generate the professional report insights now. Format your response with clear headers using ** for bold.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData } = body as { reportData: ReportData };

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(reportData);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fcc-chms.vercel.app',
        'X-Title': 'FCC Church Management System'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional church administrator assistant specializing in generating insightful reports for church leadership. Your responses should be professional, constructive, and appropriate for a church context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate insights', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      insights,
      model: MODEL
    });

  } catch (error: any) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
