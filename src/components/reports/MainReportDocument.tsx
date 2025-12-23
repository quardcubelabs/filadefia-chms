import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Professional PDF styles for main report content
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  
  // Header section with minimal branding
  header: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
  },
  
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 5,
  },
  
  headerSubtitle: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
  },
  
  // Section styles
  section: {
    marginBottom: 25,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e31e24',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e31e24',
    paddingBottom: 4,
  },
  
  sectionContent: {
    color: '#2d3748',
  },
  
  // Statistics grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  
  statCard: {
    width: '48%',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 15,
    marginRight: '2%',
    marginBottom: 10,
  },
  
  statCardLast: {
    width: '48%',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e31e24',
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 10,
    color: '#718096',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  
  // Table styles
  table: {
    marginBottom: 15,
    border: '1px solid #e2e8f0',
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 10,
  },
  
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2d3748',
    textTransform: 'uppercase',
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 10,
    minHeight: 35,
  },
  
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#4a5568',
    textAlign: 'left',
  },
  
  tableCellCenter: {
    flex: 1,
    fontSize: 9,
    color: '#4a5568',
    textAlign: 'center',
  },
  
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    color: '#4a5568',
    textAlign: 'right',
  },
  
  // List styles
  list: {
    marginBottom: 15,
  },
  
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  
  listBullet: {
    width: 6,
    height: 6,
    backgroundColor: '#e31e24',
    borderRadius: 3,
    marginTop: 4,
    marginRight: 10,
  },
  
  listText: {
    flex: 1,
    fontSize: 10,
    color: '#4a5568',
    lineHeight: 1.4,
  },
  
  // Highlight boxes
  highlightBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  
  highlightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e31e24',
    marginBottom: 8,
  },
  
  highlightText: {
    fontSize: 10,
    color: '#4a5568',
    lineHeight: 1.5,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  
  footerText: {
    fontSize: 8,
    color: '#a0aec0',
  },
  
  pageNumber: {
    fontSize: 8,
    color: '#a0aec0',
  },
});

interface MainReportProps {
  reportData: {
    totalMembers?: number;
    activeMembers?: number;
    totalFinances?: number;
    totalEvents?: number;
    activeAnnouncements?: number;
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
}

// Main Report Content Component
const MainReport: React.FC<MainReportProps> = ({ reportData, reportType }) => {
  const currentYear = new Date().getFullYear();
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US');
  };
  
  // Calculate financial summaries
  const totalIncome = reportData.finances?.filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0) || 0;
  
  const totalExpenses = reportData.finances?.filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0) || 0;
  
  const netIncome = totalIncome - totalExpenses;
  
  return (
    <>
      {/* Page 1: Executive Summary and Membership */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Church Management System - {reportType}</Text>
          <Text style={styles.headerSubtitle}>Annual Report {currentYear}</Text>
        </View>
        
        {/* Executive Summary - Show for comprehensive only or in combo with other types */}
        {(reportType === 'comprehensive' || reportType === 'membership' || reportType === 'financial' || reportType === 'attendance') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <View style={styles.statsGrid}>
              {(reportType === 'comprehensive' || reportType === 'membership') && (
                <>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{reportData.totalMembers || 0}</Text>
                    <Text style={styles.statLabel}>Total Members</Text>
                  </View>
                  <View style={styles.statCardLast}>
                    <Text style={styles.statValue}>{reportData.activeMembers || 0}</Text>
                    <Text style={styles.statLabel}>Active Members</Text>
                  </View>
                </>
              )}
              {(reportType === 'comprehensive' || reportType === 'financial') && (
                <>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{formatCurrency(totalIncome)}</Text>
                    <Text style={styles.statLabel}>Total Income</Text>
                  </View>
                  <View style={styles.statCardLast}>
                    <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
                    <Text style={styles.statLabel}>Total Expenses</Text>
                  </View>
                </>
              )}
              {reportType === 'comprehensive' && (
                <>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{reportData.totalEvents || 0}</Text>
                    <Text style={styles.statLabel}>Events Held</Text>
                  </View>
                  <View style={styles.statCardLast}>
                    <Text style={styles.statValue}>{reportData.activeAnnouncements || 0}</Text>
                    <Text style={styles.statLabel}>Active Announcements</Text>
                  </View>
                </>
              )}
            </View>
            
            {(reportType === 'comprehensive' || reportType === 'financial') && (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Financial Health</Text>
                <Text style={styles.highlightText}>
                  Net Income: {formatCurrency(netIncome)} | 
                  {netIncome >= 0 ? ' Positive financial position' : ' Requires financial attention'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Membership Overview - Only show for membership and comprehensive reports */}
        {(reportType === 'membership' || reportType === 'comprehensive') && reportData.members && reportData.members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membership Overview</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Name</Text>
                <Text style={styles.tableHeaderCell}>Email</Text>
                <Text style={styles.tableHeaderCell}>Department</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
              </View>
              {reportData.members.slice(0, 15).map((member) => (
                <View style={styles.tableRow} key={member.id}>
                  <Text style={styles.tableCell}>
                    {member.first_name} {member.last_name}
                  </Text>
                  <Text style={styles.tableCell}>
                    {member.email || 'N/A'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {member.department_name || 'Unassigned'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              ))}
            </View>
            {reportData.members.length > 15 && (
              <Text style={[styles.footerText, { textAlign: 'center', marginTop: 10 }]}>
                ... and {reportData.members.length - 15} more members
              </Text>
            )}
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>The Apostolic Gospel Church - Generated on {new Date().toLocaleDateString()}</Text>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>
        
        {/* Page 2: Financial Details - Only show for financial and comprehensive reports */}
        {(reportType === 'financial' || reportType === 'comprehensive') && reportData.finances && reportData.finances.length > 0 && (
          <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Financial Report Details</Text>
            <Text style={styles.headerSubtitle}>Transaction History {currentYear}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(totalIncome)}</Text>
                <Text style={styles.statLabel}>Total Income</Text>
              </View>
              <View style={styles.statCardLast}>
                <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
                <Text style={styles.statLabel}>Total Expenses</Text>
              </View>
            </View>
            
            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>Net Financial Position</Text>
              <Text style={styles.highlightText}>
                Net Income: {formatCurrency(netIncome)}
                {netIncome >= 0 ? ' - Church maintains a positive financial position' : ' - Immediate attention required for financial stability'}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Description</Text>
                <Text style={styles.tableHeaderCell}>Type</Text>
                <Text style={styles.tableHeaderCell}>Amount</Text>
              </View>
              {reportData.finances?.slice(0, 20).map((finance) => (
                <View style={styles.tableRow} key={finance.id}>
                  <Text style={styles.tableCell}>
                    {formatDate(finance.date)}
                  </Text>
                  <Text style={styles.tableCell}>
                    {finance.description}
                  </Text>
                  <Text style={styles.tableCellCenter}>
                    {finance.type === 'income' ? 'Income' : 'Expense'}
                  </Text>
                  <Text style={[styles.tableCellRight, {
                    color: finance.type === 'income' ? '#38a169' : '#e53e3e'
                  }]}>
                    {finance.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(finance.amount))}
                  </Text>
                </View>
              ))}
            </View>
            {(reportData.finances?.length || 0) > 20 && (
              <Text style={[styles.footerText, { textAlign: 'center', marginTop: 10 }]}>
                ... and {(reportData.finances?.length || 0) - 20} more transactions
              </Text>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>The Apostolic Gospel Church - Generated on {new Date().toLocaleDateString()}</Text>
            <Text style={styles.pageNumber}>Page 2</Text>
          </View>
        </Page>
        )}
        
        {/* Page 3: Events and Activities - Only show for comprehensive reports */}
        {reportType === 'comprehensive' && reportData.events && reportData.events.length > 0 && (
          <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Events and Activities</Text>
            <Text style={styles.headerSubtitle}>Annual Event Summary {currentYear}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reportData.events.length}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </View>
              <View style={styles.statCardLast}>
                <Text style={styles.statValue}>{reportData.activeAnnouncements || 0}</Text>
                <Text style={styles.statLabel}>Active Announcements</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Event Title</Text>
                <Text style={styles.tableHeaderCell}>Location</Text>
                <Text style={styles.tableHeaderCell}>Department</Text>
              </View>
              {reportData.events.slice(0, 15).map((event) => (
                <View style={styles.tableRow} key={event.id}>
                  <Text style={styles.tableCell}>
                    {formatDate(event.date)}
                  </Text>
                  <Text style={styles.tableCell}>
                    {event.title}
                  </Text>
                  <Text style={styles.tableCell}>
                    {event.location || 'TBA'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {event.department_name || 'General'}
                  </Text>
                </View>
              ))}
            </View>
            {reportData.events.length > 15 && (
              <Text style={[styles.footerText, { textAlign: 'center', marginTop: 10 }]}>
                ... and {reportData.events.length - 15} more events
              </Text>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>The Apostolic Gospel Church - Generated on {new Date().toLocaleDateString()}</Text>
            <Text style={styles.pageNumber}>Page 3</Text>
          </View>
        </Page>
        )}
    </>
  );
};

// Main Report Document Component
export const MainReportDocument: React.FC<MainReportProps> = ({ reportData, reportType }) => {
  return (
    <Document>
      <MainReport reportData={reportData} reportType={reportType} />
    </Document>
  );
};

// Export individual pages component for use in combined documents
export const MainReportPages: React.FC<MainReportProps> = ({ reportData, reportType }) => {
  return <MainReport reportData={reportData} reportType={reportType} />;
};

export default MainReportDocument;