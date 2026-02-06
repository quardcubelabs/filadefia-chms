import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// AI Insights interface
interface AIInsightsData {
  executiveSummary?: string;
  highlights?: string[];
  areasForAttention?: string[];
  recommendation?: string;
  rawInsights?: string;
}

// Professional PDF styles for FCC Report
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    paddingBottom: 60,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D34127',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#718096',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerChurch: {
    fontSize: 8,
    color: '#D34127',
    fontWeight: 'bold',
  },
  // Section styles
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D34127',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D34127',
    paddingBottom: 3,
    textTransform: 'uppercase',
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 6,
    marginTop: 8,
  },
  subSubTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 4,
    marginTop: 6,
  },
  // Text
  bodyText: {
    fontSize: 9,
    color: '#4a5568',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  smallText: {
    fontSize: 8,
    color: '#718096',
    lineHeight: 1.4,
  },
  // Statistics grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  statCard: {
    width: '23%',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  statCardWide: {
    width: '31%',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  statCardHalf: {
    width: '48%',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D34127',
    marginBottom: 2,
  },
  statValueGreen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38a169',
    marginBottom: 2,
  },
  statValueRed: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 7,
    color: '#718096',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Table styles
  table: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D34127',
    padding: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableHeaderCellRight: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 6,
    minHeight: 28,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 6,
    minHeight: 28,
    backgroundColor: '#f7fafc',
  },
  tableRowTotal: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 6,
    minHeight: 28,
    backgroundColor: '#edf2f7',
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    color: '#4a5568',
  },
  tableCellBold: {
    flex: 1,
    fontSize: 8,
    color: '#2d3748',
    fontWeight: 'bold',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 8,
    color: '#4a5568',
    textAlign: 'right',
  },
  tableCellRightBold: {
    flex: 1,
    fontSize: 8,
    color: '#2d3748',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 8,
    color: '#4a5568',
    textAlign: 'center',
  },
  // List styles
  list: {
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  listBullet: {
    width: 5,
    height: 5,
    backgroundColor: '#D34127',
    borderRadius: 2.5,
    marginTop: 3,
    marginRight: 8,
  },
  listBulletGreen: {
    width: 5,
    height: 5,
    backgroundColor: '#38a169',
    borderRadius: 2.5,
    marginTop: 3,
    marginRight: 8,
  },
  listBulletAmber: {
    width: 5,
    height: 5,
    backgroundColor: '#d69e2e',
    borderRadius: 2.5,
    marginTop: 3,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 9,
    color: '#4a5568',
    lineHeight: 1.4,
  },
  listNumber: {
    width: 16,
    fontSize: 8,
    color: '#D34127',
    fontWeight: 'bold',
  },
  // Highlight boxes
  highlightBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  successBox: {
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#ebf8ff',
    border: '1px solid #90cdf4',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D34127',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 9,
    color: '#4a5568',
    lineHeight: 1.5,
  },
  // AI Insights styles
  aiSection: {
    marginBottom: 18,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f5f3ff',
    padding: 10,
    borderRadius: 6,
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  aiSubtitle: {
    fontSize: 7,
    color: '#9333ea',
    marginLeft: 8,
  },
  aiBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e9d5ff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  aiBoxGreen: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  aiBoxAmber: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  aiBoxBlue: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  aiBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiBoxText: {
    fontSize: 8,
    color: '#4a5568',
    lineHeight: 1.5,
  },
  // Two-column layout
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#a0aec0',
  },
  pageNumber: {
    fontSize: 7,
    color: '#a0aec0',
  },
  // Separator
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 10,
  },
});

interface MainReportProps {
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
    jumuiyas?: Array<{
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
    }>;
    departmentStats?: Array<{
      id: string;
      name: string;
      swahiliName?: string;
      leader?: { name: string; email?: string; phone?: string };
      memberCount: number;
      activeMembers: number;
      inactiveMembers?: number;
      totalIncome?: number;
      totalExpenses?: number;
      netAmount?: number;
      recentEvents: number;
    }>;
    membershipStats?: {
      activeMembers: number;
      newMembersThisMonth: number;
      membersByStatus: Record<string, number>;
      membersByDepartment: Array<{ name: string; count: number }>;
      totalMembers: number;
    };
    financialStats?: {
      totalIncome: number;
      totalExpenses: number;
      netAmount: number;
      monthlyIncome: number;
      incomeByType: Array<{ type: string; amount: number }>;
      monthlyTrends: Array<{ month: string; income: number; expenses: number }>;
    };
    eventStats?: {
      totalEvents: number;
      upcomingEvents: number;
      completedEvents: number;
      averageAttendance: number;
      eventsByType: Array<{ type: string; count: number }>;
    };
    attendanceStats?: {
      totalSessions: number;
      totalPresent: number;
      totalAbsent: number;
      averageAttendanceRate: number;
      attendanceByType: Array<{ type: string; sessions: number; presentCount: number; rate: number }>;
      recentSessions: Array<{ id: string; date: string; type: string; presentCount: number; totalMembers: number; rate: number }>;
    };
    monthlyTrends?: Array<{ month: string; members: number; income: number; expenses: number; attendance: number }>;
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

// Format currency in TZS
const formatTZS = (amount: number): string => {
  return 'TZS ' + new Intl.NumberFormat('en-TZ').format(Math.round(amount));
};

// Format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Get period label in Swahili
const getPeriodLabel = (period?: string): string => {
  switch (period) {
    case 'weekly': return 'Wiki';
    case 'monthly': return 'Mwezi';
    case 'quarterly': return 'Robo Mwaka';
    case 'yearly': return 'Mwaka';
    default: return 'Kipindi';
  }
};

// Determine detail level based on period
const isFullReport = (period?: string): boolean => {
  return period === 'yearly' || period === undefined;
};

const isQuarterlyOrMore = (period?: string): boolean => {
  return period === 'yearly' || period === 'quarterly' || period === undefined;
};

// Page Header Component
const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.headerRight}>
      <Text style={styles.headerChurch}>Filadelfia Christian Centre</Text>
      <Text style={[styles.smallText, { fontSize: 7 }]}>Tanzania Assemblies of God</Text>
    </View>
  </View>
);

// Page Footer Component
const PageFooter = ({ pageNum }: { pageNum: number }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Filadelfia Christian Centre - Kanisa la TAG, Goba Tegeta</Text>
    <Text style={styles.footerText}>Generated: {new Date().toLocaleDateString()}</Text>
    <Text style={styles.pageNumber}>Page {pageNum}</Text>
  </View>
);

// ===========================
// MAIN REPORT COMPONENT
// ===========================
const MainReport: React.FC<MainReportProps> = ({ reportData, reportType, reportPeriod, startDate, endDate, aiInsights }) => {
  const currentYear = new Date().getFullYear();
  const period = reportPeriod || 'yearly';
  const periodLabel = getPeriodLabel(period);

  // Calculate derived values
  const totalIncome = reportData.totalIncome || reportData.financialStats?.totalIncome || 0;
  const totalExpenses = reportData.totalExpenses || reportData.financialStats?.totalExpenses || 0;
  const netIncome = totalIncome - totalExpenses;
  const totalMembers = reportData.totalMembers || reportData.membershipStats?.totalMembers || 0;
  const activeMembers = reportData.activeMembers || reportData.membershipStats?.activeMembers || 0;
  const departments = reportData.departmentStats || [];
  const zones = reportData.jumuiyas || [];
  const incomeByType = reportData.financialStats?.incomeByType || [];
  const monthlyTrends = reportData.financialStats?.monthlyTrends || [];

  // Categorize finances
  const offerings = incomeByType.find(i => i.type === 'offering')?.amount || reportData.totalOfferings || 0;
  const tithes = incomeByType.find(i => i.type === 'tithe')?.amount || reportData.totalTithes || 0;
  const donations = incomeByType.filter(i => ['donation', 'project', 'pledge', 'mission'].includes(i.type)).reduce((sum, i) => sum + i.amount, 0);

  // Determine which sections to show based on report type
  const showMembership = ['membership', 'comprehensive'].includes(reportType);
  const showFinancial = ['financial', 'comprehensive'].includes(reportType);
  const showEvents = ['events', 'comprehensive'].includes(reportType);
  const showAttendance = ['attendance', 'comprehensive'].includes(reportType);
  const showDepartments = ['departments', 'comprehensive'].includes(reportType);
  const showZones = ['zones', 'comprehensive'].includes(reportType);
  const showAll = reportType === 'comprehensive';

  let pageNum = 1;

  return (
    <>
      {/* =====================================================
          PAGE 1: EXECUTIVE SUMMARY / MUHTASARI WA UTENDAJI
          ===================================================== */}
      <Page size="A4" style={styles.page}>
        <PageHeader
          title={'1. MUHTASARI WA UTENDAJI - Executive Summary'}
          subtitle={'Taarifa ya ' + periodLabel + ' - ' + (startDate ? formatDate(startDate) + ' hadi ' + formatDate(endDate || '') : currentYear.toString())}
        />

        {/* Key Statistics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Takwimu Muhimu / Key Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalMembers}</Text>
              <Text style={styles.statLabel}>Wanachama / Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activeMembers}</Text>
              <Text style={styles.statLabel}>Wanaohudhurio / Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{departments.length}</Text>
              <Text style={styles.statLabel}>Idara / Departments</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{zones.length}</Text>
              <Text style={styles.statLabel}>Zoni / Zones</Text>
            </View>
          </View>

          {/* Financial Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCardWide}>
              <Text style={styles.statValueGreen}>{formatTZS(totalIncome)}</Text>
              <Text style={styles.statLabel}>Makusanyo / Total Income</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statValueRed}>{formatTZS(totalExpenses)}</Text>
              <Text style={styles.statLabel}>Matumizi / Total Expenses</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={netIncome >= 0 ? styles.statValueGreen : styles.statValueRed}>{formatTZS(netIncome)}</Text>
              <Text style={styles.statLabel}>Salio / Net Balance</Text>
            </View>
          </View>

          {/* Events and Attendance Quick Stats */}
          {(reportData.eventStats || reportData.attendanceStats) && (
            <View style={styles.statsGrid}>
              {reportData.eventStats && (
                <>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{reportData.eventStats.totalEvents}</Text>
                    <Text style={styles.statLabel}>Matukio / Events</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{reportData.eventStats.completedEvents}</Text>
                    <Text style={styles.statLabel}>Yaliyokamilika / Done</Text>
                  </View>
                </>
              )}
              {reportData.attendanceStats && (
                <>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{reportData.attendanceStats.totalSessions}</Text>
                    <Text style={styles.statLabel}>Vikao / Sessions</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{reportData.attendanceStats.averageAttendanceRate.toFixed(0)}%</Text>
                    <Text style={styles.statLabel}>Mahudhurio / Attendance</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Financial Health Box */}
        <View style={netIncome >= 0 ? styles.successBox : styles.highlightBox}>
          <Text style={styles.highlightTitle}>Hali ya Fedha / Financial Health</Text>
          <Text style={styles.highlightText}>
            {'Salio: ' + formatTZS(netIncome) + (netIncome >= 0 ? ' - Hali nzuri ya kifedha (Positive position)' : ' - Inahitaji umakini (Needs attention)')}
          </Text>
          <Text style={[styles.smallText, { marginTop: 4 }]}>
            {'Sadaka/Offerings: ' + formatTZS(offerings) + ' | Mafungu/Tithes: ' + formatTZS(tithes) + ' | Machangizo/Contributions: ' + formatTZS(donations)}
          </Text>
        </View>

        {/* AI Insights Section */}
        {aiInsights && (aiInsights.executiveSummary || aiInsights.highlights?.length || aiInsights.areasForAttention?.length || aiInsights.recommendation) && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiTitle}>AI-Generated Insights</Text>
              <Text style={styles.aiSubtitle}>Powered by Qwen AI</Text>
            </View>
            {aiInsights.executiveSummary && (
              <View style={styles.aiBox}>
                <Text style={[styles.aiBoxTitle, { color: '#6b21a8' }]}>Executive Summary</Text>
                <Text style={styles.aiBoxText}>{aiInsights.executiveSummary}</Text>
              </View>
            )}
            {aiInsights.highlights && aiInsights.highlights.length > 0 && (
              <View style={styles.aiBoxGreen}>
                <Text style={[styles.aiBoxTitle, { color: '#166534' }]}>Key Highlights</Text>
                {aiInsights.highlights.map((h, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.listBulletGreen} />
                    <Text style={styles.aiBoxText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}
            {aiInsights.areasForAttention && aiInsights.areasForAttention.length > 0 && (
              <View style={styles.aiBoxAmber}>
                <Text style={[styles.aiBoxTitle, { color: '#b45309' }]}>Areas for Attention</Text>
                {aiInsights.areasForAttention.map((a, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.listBulletAmber} />
                    <Text style={styles.aiBoxText}>{a}</Text>
                  </View>
                ))}
              </View>
            )}
            {aiInsights.recommendation && (
              <View style={styles.aiBoxBlue}>
                <Text style={[styles.aiBoxTitle, { color: '#1d4ed8' }]}>Recommendations</Text>
                <Text style={styles.aiBoxText}>{aiInsights.recommendation}</Text>
              </View>
            )}
            {!aiInsights.executiveSummary && !aiInsights.highlights?.length && !aiInsights.areasForAttention?.length && !aiInsights.recommendation && aiInsights.rawInsights && (
              <View style={styles.aiBox}>
                <Text style={[styles.aiBoxTitle, { color: '#6b21a8' }]}>Analysis</Text>
                <Text style={styles.aiBoxText}>{aiInsights.rawInsights}</Text>
              </View>
            )}
          </View>
        )}

        <PageFooter pageNum={pageNum++} />
      </Page>

      {/* =====================================================
          PAGE 2: MEMBERSHIP / TAARIFA YA WANACHAMA
          ===================================================== */}
      {(showMembership || showAll) && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="2. TAARIFA YA WANACHAMA - Membership Report" subtitle={'Hali ya Uanachama kwa ' + periodLabel} />

          {/* Membership Overview Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Muhtasari wa Uanachama / Membership Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalMembers}</Text>
                <Text style={styles.statLabel}>Jumla / Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueGreen}>{activeMembers}</Text>
                <Text style={styles.statLabel}>Hai / Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueRed}>{reportData.inactiveMembers || 0}</Text>
                <Text style={styles.statLabel}>Siyo Hai / Inactive</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.newMembers || reportData.membershipStats?.newMembersThisMonth || 0}</Text>
                <Text style={styles.statLabel}>Wapya / New</Text>
              </View>
            </View>
          </View>

          {/* Members by Department Table */}
          {reportData.membershipStats?.membersByDepartment && reportData.membershipStats.membersByDepartment.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Wanachama kwa Idara / Members by Department</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Idara / Department</Text>
                  <Text style={styles.tableHeaderCellRight}>Idadi / Count</Text>
                  <Text style={styles.tableHeaderCellRight}>% ya Jumla</Text>
                </View>
                {reportData.membershipStats.membersByDepartment.map((dept, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={dept.name}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                    <Text style={[styles.tableCellBold, { flex: 3 }]}>{dept.name}</Text>
                    <Text style={styles.tableCellRight}>{dept.count}</Text>
                    <Text style={styles.tableCellRight}>{((dept.count / (totalMembers || 1)) * 100).toFixed(1)}%</Text>
                  </View>
                ))}
                <View style={styles.tableRowTotal}>
                  <Text style={[styles.tableCellBold, { flex: 0.5 }]}></Text>
                  <Text style={[styles.tableCellBold, { flex: 3 }]}>JUMLA / TOTAL</Text>
                  <Text style={styles.tableCellRightBold}>{reportData.membershipStats.membersByDepartment.reduce((s, d) => s + d.count, 0)}</Text>
                  <Text style={styles.tableCellRightBold}>100%</Text>
                </View>
              </View>
            </View>
          )}

          {/* Members by Status */}
          {reportData.membershipStats?.membersByStatus && Object.keys(reportData.membershipStats.membersByStatus).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Wanachama kwa Hali / Members by Status</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Hali / Status</Text>
                  <Text style={styles.tableHeaderCellRight}>Idadi / Count</Text>
                  <Text style={styles.tableHeaderCellRight}>% ya Jumla</Text>
                </View>
                {Object.entries(reportData.membershipStats.membersByStatus).map(([status, count], index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={status}>
                    <Text style={[styles.tableCellBold, { flex: 3, textTransform: 'capitalize' }]}>{status}</Text>
                    <Text style={styles.tableCellRight}>{count}</Text>
                    <Text style={styles.tableCellRight}>{((count / (totalMembers || 1)) * 100).toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Member listing (top 20) - for full reports only */}
          {isFullReport(period) && reportData.members && reportData.members.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Orodha ya Wanachama / Member Directory (Top 20)</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Jina / Name</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Idara / Dept</Text>
                  <Text style={styles.tableHeaderCell}>Hali / Status</Text>
                </View>
                {reportData.members.slice(0, 20).map((member, idx) => (
                  <View style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={member.id}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{member.first_name + ' ' + member.last_name}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{member.department_name || 'Unassigned'}</Text>
                    <Text style={styles.tableCell}>{member.is_active ? 'Active' : 'Inactive'}</Text>
                  </View>
                ))}
              </View>
              {reportData.members.length > 20 && (
                <Text style={[styles.smallText, { textAlign: 'center', marginTop: 4 }]}>
                  {'... na wanachama ' + (reportData.members.length - 20) + ' zaidi / and ' + (reportData.members.length - 20) + ' more members'}
                </Text>
              )}
            </View>
          )}

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}

      {/* =====================================================
          PAGE 3: FINANCIAL REPORT / TAARIFA YA FEDHA
          ===================================================== */}
      {(showFinancial || showAll) && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="3. TAARIFA YA FEDHA - Financial Report" subtitle={'Taarifa ya Kifedha kwa ' + periodLabel} />

          {/* Financial Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3.1 Muhtasari wa Fedha / Financial Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCardWide}>
                <Text style={styles.statValueGreen}>{formatTZS(totalIncome)}</Text>
                <Text style={styles.statLabel}>Makusanyo / Collections</Text>
              </View>
              <View style={styles.statCardWide}>
                <Text style={styles.statValueRed}>{formatTZS(totalExpenses)}</Text>
                <Text style={styles.statLabel}>Matumizi / Expenses</Text>
              </View>
              <View style={styles.statCardWide}>
                <Text style={netIncome >= 0 ? styles.statValueGreen : styles.statValueRed}>{formatTZS(netIncome)}</Text>
                <Text style={styles.statLabel}>Salio / Balance</Text>
              </View>
            </View>
          </View>

          {/* Income Breakdown / Makusanyo */}
          <View style={styles.section}>
            <Text style={styles.subSectionTitle}>3.1.1 Makusanyo / Collections Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Aina ya Makusanyo / Collection Type</Text>
                <Text style={styles.tableHeaderCellRight}>Kiasi / Amount (TZS)</Text>
                <Text style={styles.tableHeaderCellRight}>% ya Jumla</Text>
              </View>
              {incomeByType.length > 0 ? (
                <>
                  {incomeByType.map((item, index) => {
                    const typeNames: Record<string, string> = {
                      'tithe': 'Mafungu ya Kumi / Tithes',
                      'offering': 'Sadaka / Offerings',
                      'donation': 'Machangizo / Donations',
                      'project': 'Miradi / Projects',
                      'pledge': 'Ahadi / Pledges',
                      'mission': 'Misheni / Missions',
                    };
                    return (
                      <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={item.type}>
                        <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                        <Text style={[styles.tableCellBold, { flex: 3 }]}>{typeNames[item.type] || item.type}</Text>
                        <Text style={styles.tableCellRight}>{formatTZS(item.amount)}</Text>
                        <Text style={styles.tableCellRight}>{((item.amount / (totalIncome || 1)) * 100).toFixed(1)}%</Text>
                      </View>
                    );
                  })}
                  <View style={styles.tableRowTotal}>
                    <Text style={[styles.tableCellBold, { flex: 0.5 }]}></Text>
                    <Text style={[styles.tableCellBold, { flex: 3 }]}>JUMLA YA MAKUSANYO / TOTAL COLLECTIONS</Text>
                    <Text style={styles.tableCellRightBold}>{formatTZS(totalIncome)}</Text>
                    <Text style={styles.tableCellRightBold}>100%</Text>
                  </View>
                </>
              ) : (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {'Sadaka/Offerings: ' + formatTZS(offerings) + ' | Mafungu/Tithes: ' + formatTZS(tithes)}
                  </Text>
                  <Text style={styles.tableCellRight}>{formatTZS(totalIncome)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Monthly Trends */}
          {monthlyTrends.length > 0 && isQuarterlyOrMore(period) && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>3.1.2 Mwenendo wa Kila Mwezi / Monthly Trends</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Mwezi / Month</Text>
                  <Text style={styles.tableHeaderCellRight}>Mapato / Income</Text>
                  <Text style={styles.tableHeaderCellRight}>Matumizi / Expenses</Text>
                  <Text style={styles.tableHeaderCellRight}>Salio / Net</Text>
                </View>
                {monthlyTrends.map((trend, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={trend.month}>
                    <Text style={[styles.tableCellBold, { flex: 2 }]}>{trend.month}</Text>
                    <Text style={[styles.tableCellRight, { color: '#38a169' }]}>{formatTZS(trend.income)}</Text>
                    <Text style={[styles.tableCellRight, { color: '#e53e3e' }]}>{formatTZS(trend.expenses)}</Text>
                    <Text style={styles.tableCellRight}>{formatTZS(trend.income - trend.expenses)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Transaction History */}
          {reportData.finances && reportData.finances.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>3.2 Historia ya Miamala / Transaction History (Recent 25)</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tarehe</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Maelezo / Description</Text>
                  <Text style={styles.tableHeaderCell}>Aina / Type</Text>
                  <Text style={styles.tableHeaderCellRight}>Kiasi / Amount</Text>
                </View>
                {reportData.finances.slice(0, 25).map((f, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={f.id}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(f.date)}</Text>
                    <Text style={[styles.tableCell, { flex: 2.5 }]}>{f.description}</Text>
                    <Text style={styles.tableCell}>{f.type === 'income' ? 'Mapato' : 'Matumizi'}</Text>
                    <Text style={[styles.tableCellRight, { color: f.type === 'income' ? '#38a169' : '#e53e3e' }]}>
                      {(f.type === 'income' ? '+' : '-') + formatTZS(Math.abs(f.amount))}
                    </Text>
                  </View>
                ))}
              </View>
              {reportData.finances.length > 25 && (
                <Text style={[styles.smallText, { textAlign: 'center', marginTop: 4 }]}>
                  {'... na miamala ' + (reportData.finances.length - 25) + ' zaidi / and ' + (reportData.finances.length - 25) + ' more transactions'}
                </Text>
              )}
            </View>
          )}

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}

      {/* =====================================================
          PAGE 4: DEPARTMENT REPORTS / TAARIFA ZA IDARA
          ===================================================== */}
      {(showDepartments || showAll) && departments.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="4. TAARIFA ZA IDARA - Department Reports" subtitle={'Utendaji wa Idara kwa ' + periodLabel} />

          {/* Department Summary Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Muhtasari wa Idara / Department Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Idara / Dept</Text>
                <Text style={styles.tableHeaderCellRight}>Wanachama</Text>
                <Text style={styles.tableHeaderCellRight}>Hai/Active</Text>
                <Text style={styles.tableHeaderCellRight}>Mapato/Income</Text>
                <Text style={styles.tableHeaderCellRight}>Matumizi/Exp</Text>
                <Text style={styles.tableHeaderCellRight}>Salio/Net</Text>
              </View>
              {departments.map((dept, index) => (
                <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={dept.id}>
                  <Text style={[styles.tableCell, { flex: 0.4 }]}>{index + 1}</Text>
                  <Text style={[styles.tableCellBold, { flex: 2 }]}>{dept.name}{dept.swahiliName ? ' (' + dept.swahiliName + ')' : ''}</Text>
                  <Text style={styles.tableCellRight}>{dept.memberCount}</Text>
                  <Text style={styles.tableCellRight}>{dept.activeMembers}</Text>
                  <Text style={[styles.tableCellRight, { color: '#38a169' }]}>{formatTZS(dept.totalIncome || 0)}</Text>
                  <Text style={[styles.tableCellRight, { color: '#e53e3e' }]}>{formatTZS(dept.totalExpenses || 0)}</Text>
                  <Text style={styles.tableCellRight}>{formatTZS(dept.netAmount || 0)}</Text>
                </View>
              ))}
              <View style={styles.tableRowTotal}>
                <Text style={[styles.tableCellBold, { flex: 0.4 }]}></Text>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>JUMLA / TOTAL</Text>
                <Text style={styles.tableCellRightBold}>{departments.reduce((s, d) => s + d.memberCount, 0)}</Text>
                <Text style={styles.tableCellRightBold}>{departments.reduce((s, d) => s + d.activeMembers, 0)}</Text>
                <Text style={[styles.tableCellRightBold, { color: '#38a169' }]}>{formatTZS(departments.reduce((s, d) => s + (d.totalIncome || 0), 0))}</Text>
                <Text style={[styles.tableCellRightBold, { color: '#e53e3e' }]}>{formatTZS(departments.reduce((s, d) => s + (d.totalExpenses || 0), 0))}</Text>
                <Text style={styles.tableCellRightBold}>{formatTZS(departments.reduce((s, d) => s + (d.netAmount || 0), 0))}</Text>
              </View>
            </View>
          </View>

          {/* Individual Department Details - for quarterly+ reports */}
          {isQuarterlyOrMore(period) && departments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Maelezo ya Kila Idara / Department Details</Text>
              {departments.map((dept, index) => (
                <View key={dept.id} style={{ marginBottom: 10 }}>
                  <Text style={styles.subSubTitle}>{(index + 1) + '. ' + dept.name + (dept.swahiliName ? ' (' + dept.swahiliName + ')' : '')}</Text>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <View style={styles.listItem}>
                        <View style={styles.listBullet} />
                        <Text style={styles.listText}>{'Kiongozi/Leader: ' + (dept.leader?.name || 'N/A')}</Text>
                      </View>
                      <View style={styles.listItem}>
                        <View style={styles.listBullet} />
                        <Text style={styles.listText}>{'Wanachama/Members: ' + dept.memberCount + ' (Hai/Active: ' + dept.activeMembers + ')'}</Text>
                      </View>
                    </View>
                    <View style={styles.col}>
                      <View style={styles.listItem}>
                        <View style={styles.listBulletGreen} />
                        <Text style={styles.listText}>{'Mapato/Income: ' + formatTZS(dept.totalIncome || 0)}</Text>
                      </View>
                      <View style={styles.listItem}>
                        <View style={styles.listBulletAmber} />
                        <Text style={styles.listText}>{'Matumizi/Exp: ' + formatTZS(dept.totalExpenses || 0)}</Text>
                      </View>
                    </View>
                  </View>
                  {index < departments.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          )}

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}

      {/* =====================================================
          PAGE 5: ZONE REPORTS / TAARIFA ZA ZONI
          ===================================================== */}
      {(showZones || showAll) && zones.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="5. TAARIFA ZA ZONI - Zone Reports" subtitle={'Utendaji wa Zoni kwa ' + periodLabel} />

          {/* Zone Summary Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Muhtasari wa Zoni / Zone Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Jina la Zoni / Zone</Text>
                <Text style={styles.tableHeaderCellRight}>Wanachama</Text>
                <Text style={styles.tableHeaderCellRight}>Hai/Active</Text>
                <Text style={styles.tableHeaderCellRight}>Mapato/Income</Text>
                <Text style={styles.tableHeaderCellRight}>Matumizi/Exp</Text>
                <Text style={styles.tableHeaderCellRight}>Matukio/Events</Text>
              </View>
              {zones.map((zone, index) => (
                <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={zone.id}>
                  <Text style={[styles.tableCell, { flex: 0.4 }]}>{index + 1}</Text>
                  <Text style={[styles.tableCellBold, { flex: 2 }]}>{zone.name}{zone.swahiliName ? ' (' + zone.swahiliName + ')' : ''}</Text>
                  <Text style={styles.tableCellRight}>{zone.memberCount}</Text>
                  <Text style={styles.tableCellRight}>{zone.activeMembers}</Text>
                  <Text style={[styles.tableCellRight, { color: '#38a169' }]}>{formatTZS(zone.totalIncome || 0)}</Text>
                  <Text style={[styles.tableCellRight, { color: '#e53e3e' }]}>{formatTZS(zone.totalExpenses || 0)}</Text>
                  <Text style={styles.tableCellRight}>{zone.recentEvents}</Text>
                </View>
              ))}
              <View style={styles.tableRowTotal}>
                <Text style={[styles.tableCellBold, { flex: 0.4 }]}></Text>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>JUMLA / TOTAL</Text>
                <Text style={styles.tableCellRightBold}>{zones.reduce((s, z) => s + z.memberCount, 0)}</Text>
                <Text style={styles.tableCellRightBold}>{zones.reduce((s, z) => s + z.activeMembers, 0)}</Text>
                <Text style={[styles.tableCellRightBold, { color: '#38a169' }]}>{formatTZS(zones.reduce((s, z) => s + (z.totalIncome || 0), 0))}</Text>
                <Text style={[styles.tableCellRightBold, { color: '#e53e3e' }]}>{formatTZS(zones.reduce((s, z) => s + (z.totalExpenses || 0), 0))}</Text>
                <Text style={styles.tableCellRightBold}>{zones.reduce((s, z) => s + z.recentEvents, 0)}</Text>
              </View>
            </View>
          </View>

          {/* Zone Details - for quarterly+ reports */}
          {isQuarterlyOrMore(period) && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Maelezo ya Kila Zoni / Zone Details</Text>
              {zones.map((zone, index) => (
                <View key={zone.id} style={{ marginBottom: 8 }}>
                  <Text style={styles.subSubTitle}>{(index + 1) + '. Zoni ya ' + zone.name}</Text>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <View style={styles.listItem}>
                        <View style={styles.listBullet} />
                        <Text style={styles.listText}>{'Kiongozi/Leader: ' + (zone.leader || 'N/A')}</Text>
                      </View>
                      <View style={styles.listItem}>
                        <View style={styles.listBullet} />
                        <Text style={styles.listText}>{'Wanachama: ' + zone.memberCount + ' (Hai: ' + zone.activeMembers + ')'}</Text>
                      </View>
                    </View>
                    <View style={styles.col}>
                      <View style={styles.listItem}>
                        <View style={styles.listBulletGreen} />
                        <Text style={styles.listText}>{'Mapato: ' + formatTZS(zone.totalIncome || 0)}</Text>
                      </View>
                      <View style={styles.listItem}>
                        <View style={styles.listBulletAmber} />
                        <Text style={styles.listText}>{'Matumizi: ' + formatTZS(zone.totalExpenses || 0)}</Text>
                      </View>
                    </View>
                  </View>
                  {index < zones.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          )}

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}

      {/* =====================================================
          PAGE 6: ATTENDANCE / TAARIFA YA MAHUDHURIO
          ===================================================== */}
      {(showAttendance || showAll) && reportData.attendanceStats && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="6. TAARIFA YA MAHUDHURIO - Attendance Report" subtitle={'Mahudhurio kwa ' + periodLabel} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Muhtasari wa Mahudhurio / Attendance Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.attendanceStats.totalSessions}</Text>
                <Text style={styles.statLabel}>Vikao / Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueGreen}>{reportData.attendanceStats.totalPresent}</Text>
                <Text style={styles.statLabel}>Waliohudhuria / Present</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueRed}>{reportData.attendanceStats.totalAbsent}</Text>
                <Text style={styles.statLabel}>Wasiohud. / Absent</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.attendanceStats.averageAttendanceRate.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Wastani / Avg Rate</Text>
              </View>
            </View>
          </View>

          {/* Attendance by Type */}
          {reportData.attendanceStats.attendanceByType.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Mahudhurio kwa Aina / Attendance by Type</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Aina / Type</Text>
                  <Text style={styles.tableHeaderCellRight}>Vikao / Sessions</Text>
                  <Text style={styles.tableHeaderCellRight}>Waliohudhuria / Present</Text>
                  <Text style={styles.tableHeaderCellRight}>Kiwango / Rate</Text>
                </View>
                {reportData.attendanceStats.attendanceByType.map((item, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={item.type}>
                    <Text style={[styles.tableCellBold, { flex: 2, textTransform: 'capitalize' }]}>{item.type}</Text>
                    <Text style={styles.tableCellRight}>{item.sessions}</Text>
                    <Text style={styles.tableCellRight}>{item.presentCount}</Text>
                    <Text style={styles.tableCellRight}>{item.rate.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent Sessions */}
          {reportData.attendanceStats.recentSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Vikao vya Hivi Karibuni / Recent Sessions</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Tarehe / Date</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Aina / Type</Text>
                  <Text style={styles.tableHeaderCellRight}>Waliohudhuria</Text>
                  <Text style={styles.tableHeaderCellRight}>Jumla</Text>
                  <Text style={styles.tableHeaderCellRight}>Kiwango</Text>
                </View>
                {reportData.attendanceStats.recentSessions.slice(0, 15).map((session, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={session.id}>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDate(session.date)}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5, textTransform: 'capitalize' }]}>{session.type}</Text>
                    <Text style={styles.tableCellRight}>{session.presentCount}</Text>
                    <Text style={styles.tableCellRight}>{session.totalMembers}</Text>
                    <Text style={styles.tableCellRight}>{session.rate.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}

      {/* =====================================================
          PAGE 7: EVENTS / TAARIFA YA MATUKIO
          ===================================================== */}
      {(showEvents || showAll) && reportData.eventStats && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="7. TAARIFA YA MATUKIO - Events Report" subtitle={'Matukio kwa ' + periodLabel} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Muhtasari wa Matukio / Events Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.eventStats.totalEvents}</Text>
                <Text style={styles.statLabel}>Jumla / Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueGreen}>{reportData.eventStats.completedEvents}</Text>
                <Text style={styles.statLabel}>Yaliyomalizika / Done</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.eventStats.upcomingEvents}</Text>
                <Text style={styles.statLabel}>Yajayo / Upcoming</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.eventStats.averageAttendance}</Text>
                <Text style={styles.statLabel}>Wastani / Avg Attend.</Text>
              </View>
            </View>
          </View>

          {/* Events by Type */}
          {reportData.eventStats.eventsByType.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Matukio kwa Aina / Events by Type</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Aina ya Tukio / Event Type</Text>
                  <Text style={styles.tableHeaderCellRight}>Idadi / Count</Text>
                  <Text style={styles.tableHeaderCellRight}>% ya Jumla</Text>
                </View>
                {reportData.eventStats.eventsByType.map((item, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={item.type}>
                    <Text style={[styles.tableCellBold, { flex: 3, textTransform: 'capitalize' }]}>{item.type}</Text>
                    <Text style={styles.tableCellRight}>{item.count}</Text>
                    <Text style={styles.tableCellRight}>{((item.count / (reportData.eventStats?.totalEvents || 1)) * 100).toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Event Details */}
          {reportData.events && reportData.events.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subSectionTitle}>Orodha ya Matukio / Event Details</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tarehe</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Tukio / Event</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Mahali / Location</Text>
                  <Text style={styles.tableHeaderCell}>Idara / Dept</Text>
                </View>
                {reportData.events.slice(0, 20).map((event, idx) => (
                  <View style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={event.id}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(event.date)}</Text>
                    <Text style={[styles.tableCell, { flex: 2.5 }]}>{event.title}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{event.location || 'Kanisani'}</Text>
                    <Text style={styles.tableCell}>{event.department_name || 'General'}</Text>
                  </View>
                ))}
              </View>
              {reportData.events.length > 20 && (
                <Text style={[styles.smallText, { textAlign: 'center', marginTop: 4 }]}>
                  {'... na matukio ' + (reportData.events.length - 20) + ' zaidi'}
                </Text>
              )}
            </View>
          )}

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}

      {/* =====================================================
          PAGE 8: APPENDICES / VIAMBATISHO (Annual/Quarterly only)
          ===================================================== */}
      {showAll && isQuarterlyOrMore(period) && (
        <Page size="A4" style={styles.page}>
          <PageHeader title="VIAMBATISHO - Appendices" subtitle="Takwimu za Ziada na Muhtasari" />

          {/* Appendix 1: Financial by Department */}
          {departments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kiambatisho 1: Fedha kwa Idara / Financial Summary by Department</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Idara / Department</Text>
                  <Text style={styles.tableHeaderCellRight}>Mapato / Income</Text>
                  <Text style={styles.tableHeaderCellRight}>Matumizi / Expenses</Text>
                  <Text style={styles.tableHeaderCellRight}>Salio / Net</Text>
                </View>
                {departments.map((dept, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={'fin-dept-' + dept.id}>
                    <Text style={[styles.tableCellBold, { flex: 2.5 }]}>{dept.name}</Text>
                    <Text style={[styles.tableCellRight, { color: '#38a169' }]}>{formatTZS(dept.totalIncome || 0)}</Text>
                    <Text style={[styles.tableCellRight, { color: '#e53e3e' }]}>{formatTZS(dept.totalExpenses || 0)}</Text>
                    <Text style={styles.tableCellRightBold}>{formatTZS(dept.netAmount || 0)}</Text>
                  </View>
                ))}
                <View style={styles.tableRowTotal}>
                  <Text style={[styles.tableCellBold, { flex: 2.5 }]}>JUMLA / TOTAL</Text>
                  <Text style={[styles.tableCellRightBold, { color: '#38a169' }]}>{formatTZS(departments.reduce((s, d) => s + (d.totalIncome || 0), 0))}</Text>
                  <Text style={[styles.tableCellRightBold, { color: '#e53e3e' }]}>{formatTZS(departments.reduce((s, d) => s + (d.totalExpenses || 0), 0))}</Text>
                  <Text style={styles.tableCellRightBold}>{formatTZS(departments.reduce((s, d) => s + (d.netAmount || 0), 0))}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Appendix 2: Financial by Zone */}
          {zones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kiambatisho 2: Fedha kwa Zoni / Financial Summary by Zone</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Zoni / Zone</Text>
                  <Text style={styles.tableHeaderCellRight}>Wanachama</Text>
                  <Text style={styles.tableHeaderCellRight}>Mapato / Income</Text>
                  <Text style={styles.tableHeaderCellRight}>Matumizi / Expenses</Text>
                </View>
                {zones.map((zone, index) => (
                  <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={'fin-zone-' + zone.id}>
                    <Text style={[styles.tableCellBold, { flex: 2.5 }]}>{zone.name}</Text>
                    <Text style={styles.tableCellRight}>{zone.memberCount}</Text>
                    <Text style={[styles.tableCellRight, { color: '#38a169' }]}>{formatTZS(zone.totalIncome || 0)}</Text>
                    <Text style={[styles.tableCellRight, { color: '#e53e3e' }]}>{formatTZS(zone.totalExpenses || 0)}</Text>
                  </View>
                ))}
                <View style={styles.tableRowTotal}>
                  <Text style={[styles.tableCellBold, { flex: 2.5 }]}>JUMLA / TOTAL</Text>
                  <Text style={styles.tableCellRightBold}>{zones.reduce((s, z) => s + z.memberCount, 0)}</Text>
                  <Text style={[styles.tableCellRightBold, { color: '#38a169' }]}>{formatTZS(zones.reduce((s, z) => s + (z.totalIncome || 0), 0))}</Text>
                  <Text style={[styles.tableCellRightBold, { color: '#e53e3e' }]}>{formatTZS(zones.reduce((s, z) => s + (z.totalExpenses || 0), 0))}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Appendix 3: Members by Zone */}
          {zones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kiambatisho 3: Wanachama kwa Zoni / Members by Zone</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Zoni / Zone</Text>
                  <Text style={styles.tableHeaderCellRight}>Jumla / Total</Text>
                  <Text style={styles.tableHeaderCellRight}>Hai / Active</Text>
                  <Text style={styles.tableHeaderCellRight}>% ya Kanisa</Text>
                </View>
                {zones.map((zone, index) => {
                  const totalZoneMembers = zones.reduce((s, z) => s + z.memberCount, 0);
                  return (
                    <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={'mem-zone-' + zone.id}>
                      <Text style={[styles.tableCell, { flex: 0.4 }]}>{index + 1}</Text>
                      <Text style={[styles.tableCellBold, { flex: 2.5 }]}>{zone.name}</Text>
                      <Text style={styles.tableCellRight}>{zone.memberCount}</Text>
                      <Text style={styles.tableCellRight}>{zone.activeMembers}</Text>
                      <Text style={styles.tableCellRight}>{((zone.memberCount / (totalZoneMembers || 1)) * 100).toFixed(1)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Report Conclusion */}
          <View style={styles.infoBox}>
            <Text style={[styles.highlightTitle, { color: '#2b6cb0' }]}>Hitimisho / Conclusion</Text>
            <Text style={styles.highlightText}>
              {'Taarifa hii imeandaliwa kwa uangalifu mkubwa ili kutoa picha halisi ya utendaji wa kanisa kwa ' + periodLabel.toLowerCase() + ' huu. '}
              {'Kanisa la Filadelfia linaendelea kukua na kuendelea na huduma zake kwa jamii kupitia idara ' + departments.length + ' na zoni ' + zones.length + ' zilizopo. '}
              {'Tunamshukuru Mungu kwa neema yake na tunaamini kwamba atazidi kulibariki kanisa.'}
            </Text>
            <Text style={[styles.smallText, { marginTop: 6, fontStyle: 'italic' }]}>
              {'This report was carefully prepared to reflect the true performance of the church for this ' + periodLabel.toLowerCase() + ' period. '}
              {'May God continue to bless Filadelfia Christian Centre.'}
            </Text>
          </View>

          <PageFooter pageNum={pageNum++} />
        </Page>
      )}
    </>
  );
};

// Document wrapper
export const MainReportDocument: React.FC<MainReportProps> = (props) => {
  return (
    <Document>
      <MainReport {...props} />
    </Document>
  );
};

// Pages component for use in combined documents
export const MainReportPages: React.FC<MainReportProps> = (props) => {
  return <MainReport {...props} />;
};

export default MainReportDocument;
