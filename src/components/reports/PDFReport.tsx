import React from 'react';
import { Document } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { CoverPageComponent } from './CoverPageReport';
import { MainReportPages } from './MainReportDocument';

// AI Insights interface
interface AIInsightsData {
  executiveSummary?: string;
  highlights?: string[];
  areasForAttention?: string[];
  recommendation?: string;
  rawInsights?: string;
}

// Zone data interface
interface ZoneData {
  id: string;
  name: string;
  swahiliName?: string;
  leader?: string;
  memberCount: number;
  activeMembers: number;
  inactiveMembers?: number;
  recentEvents: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
}

// Department data interface
interface DepartmentData {
  id: string;
  name: string;
  swahiliName?: string;
  leader?: {
    name: string;
    email?: string;
    phone?: string;
  };
  memberCount: number;
  activeMembers: number;
  inactiveMembers?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  recentEvents: number;
}

interface PDFReportProps {
  reportData: {
    totalMembers?: number;
    activeMembers?: number;
    inactiveMembers?: number;
    newMembers?: number;
    totalIncome?: number;
    totalExpenses?: number;
    netAmount?: number;
    totalOfferings?: number;
    totalTithes?: number;
    averageAttendance?: number;
    totalEvents?: number;
    totalFinances?: number;
    activeAnnouncements?: number;
    jumuiyas?: ZoneData[];
    departmentStats?: DepartmentData[];
    membershipStats?: {
      activeMembers: number;
      newMembersThisMonth: number;
      membersByStatus: Record<string, number>;
      membersByDepartment: Array<{
        name: string;
        count: number;
      }>;
      totalMembers: number;
    };
    financialStats?: {
      totalIncome: number;
      totalExpenses: number;
      netAmount: number;
      monthlyIncome: number;
      incomeByType: Array<{
        type: string;
        amount: number;
      }>;
      monthlyTrends: Array<{
        month: string;
        income: number;
        expenses: number;
      }>;
    };
    eventStats?: {
      totalEvents: number;
      upcomingEvents: number;
      completedEvents: number;
      averageAttendance: number;
      eventsByType: Array<{
        type: string;
        count: number;
      }>;
    };
    attendanceStats?: {
      totalSessions: number;
      totalPresent: number;
      totalAbsent: number;
      averageAttendanceRate: number;
      attendanceByType: Array<{
        type: string;
        sessions: number;
        presentCount: number;
        rate: number;
      }>;
      recentSessions: Array<{
        id: string;
        date: string;
        type: string;
        presentCount: number;
        totalMembers: number;
        rate: number;
      }>;
    };
    monthlyTrends?: Array<{
      month: string;
      members: number;
      income: number;
      expenses: number;
      attendance: number;
    }>;
    members?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      department_name?: string;
      is_active?: boolean;
      created_at?: string;
    }>;
    finances?: Array<{
      id: string;
      description: string;
      amount: number;
      type: 'income' | 'expense';
      date: string;
      category?: string;
      department_name?: string;
    }>;
    events?: Array<{
      id: string;
      title: string;
      description?: string;
      date: string;
      location?: string;
      department_name?: string;
    }>;
    announcements?: Array<{
      id: string;
      title: string;
      message?: string;
      is_priority?: boolean;
      created_at?: string;
      department_name?: string;
    }>;
  };
  reportType: string;
  reportPeriod?: string;
  startDate?: string;
  endDate?: string;
  aiInsights?: AIInsightsData;
}

// Combined Document with Cover Page + Main Report
const PDFReport: React.FC<PDFReportProps> = ({ reportData, reportType, reportPeriod, startDate, endDate, aiInsights }) => {
  return (
    <Document>
      <CoverPageComponent
        reportType={reportType}
        reportPeriod={reportPeriod}
        periodStart={startDate}
        periodEnd={endDate}
      />
      <MainReportPages
        reportData={reportData}
        reportType={reportType}
        reportPeriod={reportPeriod}
        startDate={startDate}
        endDate={endDate}
        aiInsights={aiInsights}
      />
    </Document>
  );
};

// Utility functions for generating PDF blobs
export const generateCombinedReportBlob = async (
  reportData: PDFReportProps['reportData'],
  reportType: string,
  startDate?: string,
  endDate?: string,
  aiInsights?: AIInsightsData,
  reportPeriod?: string
): Promise<Blob> => {
  const doc = pdf(
    <PDFReport
      reportData={reportData}
      reportType={reportType}
      reportPeriod={reportPeriod}
      startDate={startDate}
      endDate={endDate}
      aiInsights={aiInsights}
    />
  );
  return await doc.toBlob();
};

export const generateCoverPageBlob = async (reportType: string, reportPeriod?: string, startDate?: string, endDate?: string): Promise<Blob> => {
  const doc = pdf(
    <Document>
      <CoverPageComponent reportType={reportType} reportPeriod={reportPeriod} periodStart={startDate} periodEnd={endDate} />
    </Document>
  );
  return await doc.toBlob();
};

export const generateMainReportBlob = async (
  reportData: PDFReportProps['reportData'],
  reportType: string,
  startDate?: string,
  endDate?: string,
  aiInsights?: AIInsightsData,
  reportPeriod?: string
): Promise<Blob> => {
  const doc = pdf(
    <Document>
      <MainReportPages
        reportData={reportData}
        reportType={reportType}
        reportPeriod={reportPeriod}
        startDate={startDate}
        endDate={endDate}
        aiInsights={aiInsights}
      />
    </Document>
  );
  return await doc.toBlob();
};

export { CoverPageComponent } from './CoverPageReport';
export { MainReportPages } from './MainReportDocument';
export type { AIInsightsData, PDFReportProps };

export default PDFReport;
