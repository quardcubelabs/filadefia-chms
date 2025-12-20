import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface ReportProps {
  year?: string;
  companyName?: string;
  preparedBy?: string;
  presentedTo?: string;
  phone?: string;
  email?: string;
  reportType?: string;
}

// Professional PDF styles adapted from the modern design
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  
  // Cover page layout
  coverPage: {
    width: '100%',
    height: '100vh',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  
  // Background texture overlay
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    backgroundColor: '#f8f8f8',
  },
  
  // Left red header section (40% width with angled cut)
  leftHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '40%',
    height: '46%',
    backgroundColor: '#D34127',
    paddingTop: 50,
    paddingLeft: 30,
    paddingRight: 30,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  
  // Company logo/symbol
  logoSymbol: {
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  
  logoText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Company name styling
  companyName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 3,
    lineHeight: 1.2,
  },
  
  // Curved dark frame overlay
  darkFrame: {
    position: 'absolute',
    top: '22%',
    left: 0,
    width: '63%',
    height: '68%',
    borderWidth: 26,
    borderColor: '#2E3440',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  
  // City/content image area
  contentImage: {
    position: 'absolute',
    top: '37%',
    left: 0,
    width: '55%',
    height: '55%',
    backgroundColor: '#4a5568',
    opacity: 0.8,
  },
  
  // Main title section (positioned top right)
  titleSection: {
    position: 'absolute',
    top: '9%',
    right: '8%',
    alignItems: 'flex-end',
  },
  
  // Year text - large and prominent
  yearText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2E3440',
    marginBottom: 10,
  },
  
  // Annual report title - red color
  reportTitle: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#D34127',
    lineHeight: 0.95,
  },
  
  // Info section (bottom right)
  infoSection: {
    position: 'absolute',
    bottom: '18%',
    right: '9%',
    alignItems: 'flex-end',
  },
  
  // Info group styling
  infoGroup: {
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E3440',
    marginBottom: 4,
  },
  
  infoValue: {
    fontSize: 12,
    color: '#666666',
  },
  
  // Footer section with contact info
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '9%',
    backgroundColor: '#D34127',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 40,
    paddingLeft: '28%',
  },
  
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 32,
  },
  
  contactIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  contactIconText: {
    fontSize: 8,
    color: '#D34127',
  },
  
  contactText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

// Modern Cover Page Component
const CoverPage: React.FC<ReportProps> = ({ 
  year = '2025',
  companyName = 'TAG CHURCH',
  preparedBy = 'Church Management Team',
  presentedTo = 'Board of Directors',
  phone = '+1 (555) TAG-CHURCH',
  email = 'info@tagchurch.org',
  reportType = 'Annual Report'
}) => {
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        
        {/* Background texture overlay */}
        <View style={styles.backgroundTexture} />
        
        {/* Left Red Header with angled cut */}
        <View style={styles.leftHeader}>
          {/* Company Logo/Symbol */}
          <View style={styles.logoSymbol}>
            <Text style={styles.logoText}>⛪</Text>
          </View>
          
          {/* Company Name - split into multiple lines */}
          {companyName.split(' ').map((word, index) => (
            <Text key={index} style={styles.companyName}>{word}</Text>
          ))}
        </View>
        
        {/* Curved Dark Frame */}
        <View style={styles.darkFrame} />
        
        {/* City/Content Image Area */}
        <View style={styles.contentImage} />
        
        {/* Main Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.yearText}>{year}</Text>
          <Text style={styles.reportTitle}>ANNUAL</Text>
          <Text style={styles.reportTitle}>REPORT</Text>
        </View>
        
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Prepared By :</Text>
            <Text style={styles.infoValue}>{preparedBy}</Text>
          </View>
          
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Presented To :</Text>
            <Text style={styles.infoValue}>{presentedTo}</Text>
          </View>
        </View>
        
        {/* Footer with Contact Info */}
        <View style={styles.footer}>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>📞</Text>
              </View>
              <Text style={styles.contactText}>{phone}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>✉</Text>
              </View>
              <Text style={styles.contactText}>{email}</Text>
            </View>
          </View>
        </View>
        
      </View>
    </Page>
  );
};

// Cover Page Document Component
export const CoverPageReport: React.FC<ReportProps> = (props) => {
  return (
    <Document>
      <CoverPage {...props} />
    </Document>
  );
};

// Export individual page component for use in combined documents
export const CoverPageComponent: React.FC<ReportProps> = (props) => {
  return <CoverPage {...props} />;
};

export default CoverPageReport;