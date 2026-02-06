import React from 'react';
import { Page, Text, View, StyleSheet, Svg, Path, G } from '@react-pdf/renderer';

interface ReportProps {
  year?: string;
  companyName?: string;
  preparedBy?: string;
  presentedTo?: string;
  phone?: string;
  email?: string;
  reportType?: string;
  periodStart?: string;
  periodEnd?: string;
  reportPeriod?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#D34127',
  },
  headerSection: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  crossContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D34127',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  orgName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E3440',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 4,
  },
  orgSubName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D34127',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagLine: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 2,
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: '#D34127',
    marginTop: 15,
    marginBottom: 15,
  },
  titleSection: {
    position: 'absolute',
    top: 230,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  reportMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E3440',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  reportSubTitle: {
    fontSize: 16,
    color: '#D34127',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  periodBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginTop: 10,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 9,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  periodText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E3440',
  },
  yearText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#D34127',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: -2,
    opacity: 0.15,
  },
  infoSection: {
    position: 'absolute',
    bottom: 140,
    left: 40,
    right: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoGroup: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: '#2E3440',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#D34127',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 15,
  },
  cornerDecor: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  mottoText: {
    fontSize: 10,
    color: '#D34127',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
});

const CrossSymbol = () => (
  <Svg viewBox="0 0 50 50" style={{ width: 35, height: 35 }}>
    <Path d="M22 5 L28 5 L28 20 L43 20 L43 26 L28 26 L28 45 L22 45 L22 26 L7 26 L7 20 L22 20 Z" fill="#ffffff" />
  </Svg>
);

const CornerDecor = ({ position }: { position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' }) => {
  const rotation: Record<string, string> = {
    topLeft: '0',
    topRight: '90',
    bottomLeft: '270',
    bottomRight: '180',
  };
  const transformStr = 'rotate(' + rotation[position] + ', 30, 30)';
  return (
    <Svg viewBox="0 0 60 60" style={{ width: 40, height: 40 }}>
      <G transform={transformStr}>
        <Path d="M0 0 L20 0 L20 3 L3 3 L3 20 L0 20 Z" fill="#D34127" opacity={0.3} />
      </G>
    </Svg>
  );
};

const CoverPage: React.FC<ReportProps> = ({
  year,
  preparedBy = 'Baraza la Wazee',
  presentedTo = 'Washirika wa Kanisa',
  email = 'info@filadelfiacc.org',
  reportType = 'annual',
  periodStart,
  periodEnd,
  reportPeriod,
}) => {
  const currentYear = year || new Date().getFullYear().toString();

  const getReportTitle = () => {
    switch (reportType) {
      case 'annual': return 'TAARIFA YA MWAKA';
      case 'financial': return 'TAARIFA YA FEDHA';
      case 'membership': return 'TAARIFA YA WANACHAMA';
      case 'weekly': return 'TAARIFA YA WIKI';
      case 'monthly': return 'TAARIFA YA MWEZI';
      case 'quarterly': return 'TAARIFA YA ROBO MWAKA';
      case 'attendance': return 'TAARIFA YA MAHUDHURIO';
      case 'events': return 'TAARIFA YA MATUKIO';
      case 'zones': return 'TAARIFA YA ZONI';
      case 'departments': return 'TAARIFA YA IDARA';
      case 'comprehensive': return 'TAARIFA KAMILI YA KANISA';
      default: return 'TAARIFA YA KANISA';
    }
  };

  const getReportSubtitle = () => {
    switch (reportType) {
      case 'annual': return 'Annual Church Report';
      case 'financial': return 'Financial Report';
      case 'membership': return 'Membership Report';
      case 'weekly': return 'Weekly Report';
      case 'monthly': return 'Monthly Report';
      case 'quarterly': return 'Quarterly Report';
      case 'attendance': return 'Attendance Report';
      case 'events': return 'Events Report';
      case 'zones': return 'Zone Report';
      case 'departments': return 'Department Report';
      case 'comprehensive': return 'Comprehensive Church Report';
      default: return 'Church Report';
    }
  };

  const getPeriodText = () => {
    if (periodStart && periodEnd) {
      const start = new Date(periodStart);
      const end = new Date(periodEnd);
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return fmt(start) + ' - ' + fmt(end);
    }
    if (reportPeriod) {
      switch (reportPeriod) {
        case 'weekly': return 'Weekly Period';
        case 'monthly': return 'Monthly Period';
        case 'quarterly': return 'Quarterly Period';
        case 'yearly': return 'Januari - Desemba ' + currentYear;
        default: return 'Kipindi cha Utekelezaji: ' + currentYear;
      }
    }
    return 'Januari - Desemba ' + currentYear;
  };

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        <View style={styles.topBand} />
        <View style={[styles.cornerDecor, { top: 15, left: 15 }]}>
          <CornerDecor position="topLeft" />
        </View>
        <View style={[styles.cornerDecor, { top: 15, right: 15 }]}>
          <CornerDecor position="topRight" />
        </View>
        <View style={styles.headerSection}>
          <View style={styles.crossContainer}>
            <CrossSymbol />
          </View>
          <Text style={styles.orgName}>TANZANIA ASSEMBLIES OF GOD</Text>
          <Text style={styles.orgSubName}>KANISA LA FILADELFIA</Text>
          <Text style={styles.tagLine}>Filadelfia Christian Centre - Goba Tegeta</Text>
          <View style={styles.divider} />
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.reportMainTitle}>{getReportTitle()}</Text>
          <Text style={styles.reportSubTitle}>{getReportSubtitle()}</Text>
          <View style={styles.periodBox}>
            <Text style={styles.periodLabel}>Kipindi cha Utekelezaji</Text>
            <Text style={styles.periodText}>{getPeriodText()}</Text>
          </View>
          <Text style={styles.yearText}>{currentYear}</Text>
          <Text style={styles.mottoText}>MIAKA 13 YA MOTO WA UAMSHO</Text>
        </View>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Imeandaliwa na</Text>
              <Text style={styles.infoValue}>{preparedBy}</Text>
            </View>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Imewasilishwa kwa</Text>
              <Text style={styles.infoValue}>{presentedTo}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Tarehe</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleDateString('sw-TZ', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomAccent} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>TANZANIA ASSEMBLIES OF GOD</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>FILADELFIA CHRISTIAN CENTRE</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>GOBA TEGETA</Text>
        </View>
      </View>
    </Page>
  );
};

export const CoverPageReport: React.FC<ReportProps> = (props) => {
  const { Document } = require('@react-pdf/renderer');
  return (
    <Document>
      <CoverPage {...props} />
    </Document>
  );
};

export const CoverPageComponent: React.FC<ReportProps> = (props) => {
  return <CoverPage {...props} />;
};

export default CoverPageReport;
