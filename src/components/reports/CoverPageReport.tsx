import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, G, Image } from '@react-pdf/renderer';

interface ReportProps {
  year?: string;
  companyName?: string;
  preparedBy?: string;
  presentedTo?: string;
  phone?: string;
  email?: string;
  reportType?: 'annual' | 'financial' | 'membership' | 'custom';
}

// Professional PDF styles matching the reference design
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#f5f5f5',
    padding: 0,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  
  // Main container
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  
  // Logo container in red section
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: 30,
    alignItems: 'center',
  },
  
  // Logo circle with TAG logo
  logoCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  logoImage: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  
  // Company name in red section
  companyNameContainer: {
    alignItems: 'center',
  },
  
  companyName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 2,
  },
  
  // Curved frame container
  curvedFrame: {
    position: 'absolute',
    top: '20%',
    left: 0,
    width: '65%',
    height: '72%',
  },
  
  // Year and title section (right side)
  titleSection: {
    position: 'absolute',
    top: 60,
    right: 40,
    alignItems: 'flex-end',
  },
  
  yearText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2E3440',
    marginBottom: 5,
    letterSpacing: -2,
  },
  
  reportTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#D34127',
    textAlign: 'right',
    lineHeight: 1.1,
  },
  
  // Info section (bottom right)
  infoSection: {
    position: 'absolute',
    bottom: 120,
    right: 40,
    alignItems: 'flex-end',
  },
  
  infoGroup: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E3440',
    marginBottom: 3,
  },
  
  infoValue: {
    fontSize: 11,
    color: '#666666',
    fontStyle: 'italic',
  },
  
  // Red footer bar
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 55,
    backgroundColor: '#D34127',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 40,
  },
  
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
  },
  
  contactIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  
  contactIconText: {
    fontSize: 10,
    color: '#D34127',
  },
  
  contactText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

// Lotus/Church Symbol Component
const LotusSymbol = () => (
  <Svg viewBox="0 0 100 100" style={{ width: 40, height: 40 }}>
    {/* Center petal */}
    <Path
      d="M50 10 Q55 35 50 50 Q45 35 50 10"
      fill="#ffffff"
    />
    {/* Left petal */}
    <Path
      d="M30 25 Q45 40 50 50 Q35 45 30 25"
      fill="#ffffff"
    />
    {/* Right petal */}
    <Path
      d="M70 25 Q55 40 50 50 Q65 45 70 25"
      fill="#ffffff"
    />
    {/* Far left petal */}
    <Path
      d="M15 40 Q35 50 50 50 Q30 55 15 40"
      fill="#ffffff"
    />
    {/* Far right petal */}
    <Path
      d="M85 40 Q65 50 50 50 Q70 55 85 40"
      fill="#ffffff"
    />
    {/* Base/stem */}
    <Path
      d="M40 55 Q50 70 60 55 Q55 60 50 75 Q45 60 40 55"
      fill="#ffffff"
    />
  </Svg>
);

// Red diagonal shape SVG (top-left)
const RedDiagonalShape = () => (
  <Svg viewBox="0 0 300 400" style={{ position: 'absolute', top: 0, left: 0, width: 250, height: 350 }}>
    <Path
      d="M0 0 L250 0 L250 180 Q200 280 100 320 L0 350 Z"
      fill="#D34127"
    />
  </Svg>
);

// Curved frame SVG with dark border effect
const CurvedFrameSvg = () => (
  <Svg viewBox="0 0 400 600" style={{ width: '100%', height: '100%' }}>
    {/* Outer dark curved border */}
    <Path
      d="M0 0 L0 600 L380 600 Q380 400 320 200 Q280 100 200 60 L200 0 Z"
      fill="#2a3845"
      strokeWidth={0}
    />
    {/* Inner darker area (city image simulation) */}
    <Path
      d="M0 30 L0 570 L340 570 Q340 380 290 200 Q260 120 190 90 L190 30 Z"
      fill="#1a2530"
      strokeWidth={0}
    />
    {/* Building silhouettes simulation */}
    <G>
      {/* Building 1 */}
      <Path d="M40 400 L40 570 L80 570 L80 400 Z" fill="#2a3845" opacity={0.8} />
      {/* Building 2 - taller */}
      <Path d="M90 300 L90 570 L140 570 L140 300 Z" fill="#222d38" opacity={0.9} />
      {/* Building 3 */}
      <Path d="M150 350 L150 570 L200 570 L200 350 Z" fill="#2a3845" opacity={0.85} />
      {/* Building 4 - tallest */}
      <Path d="M210 250 L210 570 L260 570 L260 250 Z" fill="#1e2832" opacity={0.9} />
      {/* Building 5 */}
      <Path d="M270 380 L270 570 L310 570 L310 380 Z" fill="#2a3845" opacity={0.8} />
    </G>
    {/* Windows simulation */}
    <G fill="#3d5a73" opacity={0.4}>
      {/* Windows for building 2 */}
      <Path d="M100 320 L100 330 L120 330 L120 320 Z" />
      <Path d="M100 350 L100 360 L120 360 L120 350 Z" />
      <Path d="M100 380 L100 390 L120 390 L120 380 Z" />
      {/* Windows for building 4 */}
      <Path d="M220 280 L220 290 L240 290 L240 280 Z" />
      <Path d="M220 310 L220 320 L240 320 L240 310 Z" />
      <Path d="M220 340 L220 350 L240 350 L240 340 Z" />
      <Path d="M220 370 L220 380 L240 380 L240 370 Z" />
    </G>
  </Svg>
);

// Modern Cover Page Component
const CoverPage: React.FC<ReportProps> = ({ 
  year = '2025',
  companyName = 'FILADELFIA\nCHURCH',
  preparedBy = 'Church Leadership Team',
  presentedTo = 'Church Board & Members',
  phone = '+255 123-456-789',
  email = 'info@filadelfiacc.org',
  reportType = 'annual'
}) => {
  
  // Determine report title based on type
  const getReportTitle = () => {
    switch (reportType) {
      case 'annual':
        return ['ANNUAL', 'REPORT'];
      case 'financial':
        return ['FINANCIAL', 'REPORT'];
      case 'membership':
        return ['MEMBERSHIP', 'REPORT'];
      default:
        return ['CHURCH', 'REPORT'];
    }
  };
  
  const reportTitleLines = getReportTitle();
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        
        {/* Red diagonal section (top-left) */}
        <RedDiagonalShape />
        
        {/* Logo and company name */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image src="/tag-logo.png" style={styles.logoImage} />
          </View>
          <View style={styles.companyNameContainer}>
            {companyName.split('\n').map((line, index) => (
              <Text key={index} style={styles.companyName}>{line}</Text>
            ))}
          </View>
        </View>
        
        {/* Curved dark frame with city image area */}
        <View style={styles.curvedFrame}>
          <CurvedFrameSvg />
        </View>
        
        {/* Year and Report Title (right side) */}
        <View style={styles.titleSection}>
          <Text style={styles.yearText}>{year}</Text>
          {reportTitleLines.map((line, index) => (
            <Text key={index} style={styles.reportTitle}>{line}</Text>
          ))}
        </View>
        
        {/* Prepared By / Presented To section */}
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
        
        {/* Red footer with contact info */}
        <View style={styles.footer}>
          <View style={styles.contactContainer}>
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
