import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define types for the report data
interface ReportData {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembers: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  totalOfferings: number;
  totalTithes: number;
  averageAttendance: number;
  totalEvents: number;
  jumuiyas: any[];
  monthlyTrends: Array<{
    month: string;
    members: number;
    income: number;
    expenses: number;
    attendance: number;
  }>;
  membershipStats: {
    activeMembers: number;
    newMembersThisMonth: number;
    membersByStatus: Record<string, number>;
    membersByDepartment: Array<{
      name: string;
      count: number;
    }>;
    totalMembers: number;
  };
  financialStats: {
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
  eventStats: {
    totalEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    averageAttendance: number;
    eventsByType: Array<{
      type: string;
      count: number;
    }>;
  };
  departmentStats: Array<{
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
    recentTransactions?: number;
    transactionCount?: number;
  }>;
}

interface PDFReportProps {
  reportData: ReportData;
  reportType: string;
  startDate: string;
  endDate: string;
}

// Professional PDF styles matching the image design
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  
  // Cover page layout exactly matching the image
  coverPage: {
    width: '100%',
    height: '100vh',
    flexDirection: 'row',
    position: 'relative',
  },
  
  // Left red sidebar (40% width like in the image)
  leftSidebar: {
    width: '40%',
    backgroundColor: '#dc2626',
    padding: 40,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  
  // Logo section at the top
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Lotus/flower logo pattern (simplified)
  logoPattern1: {
    width: 20,
    height: 20,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    position: 'absolute',
    top: 15,
  },
  
  logoPattern2: {
    width: 30,
    height: 6,
    backgroundColor: '#dc2626',
    borderRadius: 3,
    position: 'absolute',
    top: 37,
  },
  
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 10,
  },
  
  logoSubtext: {
    color: '#ffffff',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  
  // Right content area (60% width)
  rightContent: {
    width: '60%',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    paddingTop: 80,
    paddingRight: 50,
    paddingLeft: 50,
  },
  
  // Curved design element (like in image)
  curvedElement: {
    position: 'absolute',
    top: 120,
    left: -60,
    width: 250,
    height: 180,
    backgroundColor: '#374151',
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    opacity: 0.8,
    transform: 'rotate(10deg)',
  },
  
  // City skyline background (simplified)
  cityBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  
  building1: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    width: 25,
    height: 100,
    backgroundColor: '#374151',
    opacity: 0.3,
  },
  
  building2: {
    position: 'absolute',
    bottom: 0,
    left: 70,
    width: 35,
    height: 140,
    backgroundColor: '#374151',
    opacity: 0.2,
  },
  
  building3: {
    position: 'absolute',
    bottom: 0,
    right: 60,
    width: 30,
    height: 120,
    backgroundColor: '#374151',
    opacity: 0.25,
  },
  
  // Highway/road effect
  roadEffect: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#4b5563',
    opacity: 0.1,
  },
  
  // Main text content (matching image layout)
  yearText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 1,
    marginTop: 80,
  },
  
  reportTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'right',
    marginBottom: 10,
    letterSpacing: 3,
  },
  
  reportSubtitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'right',
    letterSpacing: 3,
  },
  
  // Bottom information section
  bottomSection: {
    position: 'absolute',
    bottom: 100,
    right: 50,
    left: 300,
  },
  
  preparedBySection: {
    marginBottom: 20,
  },
  
  presentedToSection: {
    marginBottom: 25,
  },
  
  labelText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  
  valueText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  
  // Contact section at bottom
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  contactIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#dc2626',
    marginRight: 6,
    borderRadius: 2,
  },
  
  contactText: {
    fontSize: 9,
    color: '#6b7280',
  },
  
  // Content pages
  contentPage: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  
  pageHeader: {
    borderBottomWidth: 3,
    borderBottomColor: '#dc2626',
    paddingBottom: 15,
    marginBottom: 35,
  },
  
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  
  pageSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  
  section: {
    marginBottom: 30,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#dc2626',
    paddingLeft: 15,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  
  statCard: {
    width: '48%',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 15,
    marginRight: '2%',
    borderRadius: 8,
  },
  
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  tableHeaderRow: {
    backgroundColor: '#fee2e2',
  },
  
  tableCell: {
    padding: 12,
    flex: 1,
    fontSize: 11,
  },
  
  tableHeaderCell: {
    padding: 12,
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
});

// Professional Cover Page matching the image exactly
const CoverPage: React.FC<{ reportType: string }> = ({ reportType }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        {/* Left Red Sidebar */}
        <View style={styles.leftSidebar}>
          <View style={styles.logoSection}>
            {/* Church Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoPattern1} />
              <View style={styles.logoPattern2} />
            </View>
            
            <Text style={styles.logoText}>FILADELFIA</Text>
            <Text style={styles.logoText}>CHURCH</Text>
            <Text style={styles.logoSubtext}>Tanzania Assemblies of God</Text>
          </View>
        </View>
        
        {/* Right Content Area */}
        <View style={styles.rightContent}>
          {/* Background Design Elements */}
          <View style={styles.curvedElement} />
          <View style={styles.cityBackground} />
          <View style={styles.building1} />
          <View style={styles.building2} />
          <View style={styles.building3} />
          <View style={styles.roadEffect} />
          
          {/* Main Content Text */}
          <Text style={styles.yearText}>{currentYear}</Text>
          <Text style={styles.reportTitle}>ANNUAL</Text>
          <Text style={styles.reportSubtitle}>REPORT</Text>
          
          {/* Bottom Information Section */}
          <View style={styles.bottomSection}>
            <View style={styles.preparedBySection}>
              <Text style={styles.labelText}>Prepared By :</Text>
              <Text style={styles.valueText}>Church Administration</Text>
            </View>
            
            <View style={styles.presentedToSection}>
              <Text style={styles.labelText}>Presented To :</Text>
              <Text style={styles.valueText}>Church Leadership & Members</Text>
            </View>
            
            <View style={styles.contactSection}>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon} />
                <Text style={styles.contactText}>+255-123-456-789</Text>
              </View>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon} />
                <Text style={styles.contactText}>info@filadelfiaag.com</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Page>
  );
};

// Enhanced Membership Statistics Page
const MembershipPage: React.FC<{ reportData: ReportData }> = ({ reportData }) => (
  <Page size="A4" style={styles.contentPage}>
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>Membership Overview</Text>
      <Text style={styles.pageSubtitle}>Complete analysis of church membership statistics and trends</Text>
    </View>
    
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Membership Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.membershipStats?.totalMembers || reportData.totalMembers || 0}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.membershipStats?.activeMembers || reportData.activeMembers || 0}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.membershipStats?.newMembersThisMonth || reportData.newMembers || 0}</Text>
          <Text style={styles.statLabel}>New This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.inactiveMembers || 0}</Text>
          <Text style={styles.statLabel}>Inactive Members</Text>
        </View>
      </View>
    </View>

    {reportData.membershipStats?.membersByDepartment && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members by Department</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={styles.tableHeaderCell}>Department</Text>
            <Text style={styles.tableHeaderCell}>Member Count</Text>
            <Text style={styles.tableHeaderCell}>Percentage</Text>
          </View>
          {reportData.membershipStats.membersByDepartment.map((dept, index) => {
            const percentage = reportData.membershipStats?.totalMembers 
              ? ((dept.count / reportData.membershipStats.totalMembers) * 100).toFixed(1)
              : '0';
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{dept.name}</Text>
                <Text style={styles.tableCell}>{dept.count}</Text>
                <Text style={styles.tableCell}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    )}
  </Page>
);

// Enhanced Financial Statistics Page
const FinancialPage: React.FC<{ reportData: ReportData }> = ({ reportData }) => (
  <Page size="A4" style={styles.contentPage}>
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>Financial Overview</Text>
      <Text style={styles.pageSubtitle}>Comprehensive financial performance and stewardship analysis</Text>
    </View>
    
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Financial Summary</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>TSh {(reportData.financialStats?.totalIncome || reportData.totalIncome || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Income</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>TSh {(reportData.financialStats?.totalExpenses || reportData.totalExpenses || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>TSh {(reportData.financialStats?.netAmount || reportData.netAmount || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Net Amount</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>TSh {(reportData.totalOfferings || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Offerings</Text>
        </View>
      </View>
    </View>

    {reportData.financialStats?.incomeByType && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income Sources</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={styles.tableHeaderCell}>Income Type</Text>
            <Text style={styles.tableHeaderCell}>Amount (TSh)</Text>
            <Text style={styles.tableHeaderCell}>Percentage</Text>
          </View>
          {reportData.financialStats.incomeByType.map((income, index) => {
            const percentage = reportData.financialStats?.totalIncome 
              ? ((income.amount / reportData.financialStats.totalIncome) * 100).toFixed(1)
              : '0';
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{income.type}</Text>
                <Text style={styles.tableCell}>{income.amount.toLocaleString()}</Text>
                <Text style={styles.tableCell}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    )}
  </Page>
);

// Enhanced Events and Attendance Page
const EventsPage: React.FC<{ reportData: ReportData }> = ({ reportData }) => (
  <Page size="A4" style={styles.contentPage}>
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>Events & Activities</Text>
      <Text style={styles.pageSubtitle}>Event participation, attendance patterns, and ministry activities</Text>
    </View>
    
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Event Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.eventStats?.totalEvents || reportData.totalEvents || 0}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(reportData.eventStats?.averageAttendance || reportData.averageAttendance || 0)}</Text>
          <Text style={styles.statLabel}>Average Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.eventStats?.upcomingEvents || 0}</Text>
          <Text style={styles.statLabel}>Upcoming Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {reportData.totalMembers && reportData.averageAttendance
              ? Math.round((reportData.averageAttendance / reportData.totalMembers) * 100)
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Participation Rate</Text>
        </View>
      </View>
    </View>

    {reportData.eventStats?.eventsByType && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events by Type</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={styles.tableHeaderCell}>Event Type</Text>
            <Text style={styles.tableHeaderCell}>Count</Text>
            <Text style={styles.tableHeaderCell}>Percentage</Text>
          </View>
          {reportData.eventStats.eventsByType.map((event, index) => {
            const percentage = reportData.eventStats?.totalEvents
              ? ((event.count / reportData.eventStats.totalEvents) * 100).toFixed(1)
              : '0';
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{event.type}</Text>
                <Text style={styles.tableCell}>{event.count}</Text>
                <Text style={styles.tableCell}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    )}
  </Page>
);

// Enhanced Departments Page
const DepartmentsPage: React.FC<{ reportData: ReportData }> = ({ reportData }) => (
  <Page size="A4" style={styles.contentPage}>
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>Department Overview</Text>
      <Text style={styles.pageSubtitle}>Ministry departments, leadership, and member engagement</Text>
    </View>
    
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Department Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.departmentStats?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Departments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportData.departmentStats?.filter(dept => dept.activeMembers > 0).length || 0}</Text>
          <Text style={styles.statLabel}>Active Departments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {reportData.departmentStats?.reduce((sum, dept) => sum + dept.memberCount, 0) || 0}
          </Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {reportData.departmentStats?.reduce((sum: number, dept: any) => sum + dept.activeMembers, 0) || 0}
          </Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>
      </View>
    </View>

    {reportData.departmentStats && reportData.departmentStats.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Department Details</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={styles.tableHeaderCell}>Department</Text>
            <Text style={styles.tableHeaderCell}>Total Members</Text>
            <Text style={styles.tableHeaderCell}>Active Members</Text>
            <Text style={styles.tableHeaderCell}>Leader</Text>
          </View>
          {reportData.departmentStats.map((dept, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{dept.name}</Text>
              <Text style={styles.tableCell}>{dept.memberCount}</Text>
              <Text style={styles.tableCell}>{dept.activeMembers}</Text>
              <Text style={styles.tableCell}>{dept.leader?.name || 'TBD'}</Text>
            </View>
          ))}
        </View>
      </View>
    )}
  </Page>
);

// Main PDF Document Component
export const PDFReport: React.FC<PDFReportProps> = ({ 
  reportData, 
  reportType, 
  startDate, 
  endDate 
}) => {
  return (
    <Document>
      {/* Cover Page */}
      <CoverPage reportType={reportType} />
      
      {/* Content Pages based on report type */}
      {(reportType === 'membership' || reportType === 'comprehensive') && (
        <MembershipPage reportData={reportData} />
      )}
      
      {(reportType === 'financial' || reportType === 'comprehensive') && (
        <FinancialPage reportData={reportData} />
      )}
      
      {(reportType === 'attendance' || reportType === 'events' || reportType === 'comprehensive') && (
        <EventsPage reportData={reportData} />
      )}
      
      {(reportType === 'jumuiya' || reportType === 'departments' || reportType === 'comprehensive') && (
        <DepartmentsPage reportData={reportData} />
      )}
    </Document>
  );
};

export default PDFReport;