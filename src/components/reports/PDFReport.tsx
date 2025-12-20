import React from 'react';
import { Document, pdf } from '@react-pdf/renderer';
import CoverPage from './CoverPageReport';
import MainReportDocument, { MainReportPages } from './MainReportDocument';

interface PDFReportProps {
  reportData: {
    totalMembers?: number;
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
  startDate?: string;
  endDate?: string;
}

// Combined Document with Cover Page + Main Report
const PDFReport: React.FC<PDFReportProps> = ({ reportData, reportType, startDate, endDate }) => {
  return (
    <Document>
      {/* Import the cover page component */}
      <CoverPage reportType={reportType as 'annual' | 'financial' | 'membership' | 'custom'} />
      {/* Import the main report component */}
      <MainReportPages reportData={reportData} reportType={reportType} />
    </Document>
  );
};

// Utility functions for generating PDF blobs
export const generateCombinedReportBlob = async (reportData: PDFReportProps['reportData'], reportType: string, startDate?: string, endDate?: string): Promise<Blob> => {
  const doc = <PDFReport reportData={reportData} reportType={reportType} startDate={startDate} endDate={endDate} />;
  return await pdf(doc).toBlob();
};

export const generateCoverPageBlob = async (reportType: string): Promise<Blob> => {
  const doc = (
    <Document>
      <CoverPage reportType={reportType as 'annual' | 'financial' | 'membership' | 'custom'} />
    </Document>
  );
  return await pdf(doc).toBlob();
};

export const generateMainReportBlob = async (reportData: PDFReportProps['reportData'], reportType: string, startDate?: string, endDate?: string): Promise<Blob> => {
  const doc = <MainReportDocument reportData={reportData} reportType={reportType} />;
  return await pdf(doc).toBlob();
};

// Export the separate components for independent use
export { default as CoverPage } from './CoverPageReport';
export { MainReportDocument } from './MainReportDocument';

export default PDFReport;