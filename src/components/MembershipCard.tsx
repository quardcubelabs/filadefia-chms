'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Button, Alert } from '@/components/ui';
import { CreditCard, Download, Loader2, QrCode } from 'lucide-react';

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  photo_url?: string;
  membership_date: string;
  status: string;
  phone: string;
  email?: string;
}

interface MembershipCardProps {
  member: Member;
  className?: string;
}

export default function MembershipCard({ member, className = '' }: MembershipCardProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCard = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Create PDF (85.6mm x 53.98mm - standard credit card size)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      });

      // Colors
      const tagRed = '#E31E24';
      const tagBlue = '#3B82F6'; // Blue instead of yellow
      const tagBlack = '#000000';
      const tagWhite = '#FFFFFF';
      const tagGray = '#6B7280';

      // Card background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 85.6, 53.98, 'F');

      // Header gradient background (simulated with red rectangle)
      pdf.setFillColor(227, 30, 36); // TAG Red
      pdf.rect(0, 0, 85.6, 18, 'F');

      // Church name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FILADEFIA CHRISTIAN CENTER', 42.8, 6, { align: 'center' });

      // TAG subtitle
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Tanzania Assemblies of God', 42.8, 10, { align: 'center' });

      // Member ID Card text
      pdf.setFontSize(6);
      pdf.text('MEMBER IDENTIFICATION CARD', 42.8, 14, { align: 'center' });

      // Blue accent line
      pdf.setFillColor(59, 130, 246); // Blue
      pdf.rect(0, 18, 85.6, 1, 'F');

      // Member photo placeholder (if photo exists, we'll add it)
      pdf.setFillColor(240, 240, 240);
      pdf.rect(5, 22, 18, 22, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(5, 22, 18, 22, 'S');

      // If photo URL exists, try to load and add it
      if (member.photo_url) {
        try {
          const img = await loadImage(member.photo_url);
          pdf.addImage(img, 'JPEG', 5, 22, 18, 22);
        } catch (err) {
          // If photo fails to load, show initials
          pdf.setTextColor(150, 150, 150);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          const initials = `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;
          pdf.text(initials, 14, 35, { align: 'center' });
        }
      } else {
        // Show initials
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const initials = `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;
        pdf.text(initials, 14, 35, { align: 'center' });
      }

      // Member details
      pdf.setTextColor(0, 0, 0);
      
      // Member Number
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEMBER NO:', 26, 24);
      pdf.setFont('helvetica', 'normal');
      pdf.text(member.member_number, 26, 28);

      // Name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      const fullName = `${member.first_name} ${member.middle_name || ''} ${member.last_name}`.trim();
      pdf.text(fullName.toUpperCase(), 26, 34);

      // Phone
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128); // TAG Gray
      pdf.text(`Phone: ${member.phone}`, 26, 38);

      // Membership Date
      const memberSince = new Date(member.membership_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      pdf.text(`Member Since: ${memberSince}`, 26, 42);

      // Generate QR Code with member info
      const qrData = JSON.stringify({
        id: member.id,
        number: member.member_number,
        name: fullName,
        phone: member.phone
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: tagBlack,
          light: tagWhite
        }
      });

      // Add QR code
      pdf.addImage(qrCodeDataUrl, 'PNG', 61, 22, 20, 20);

      // QR Code label
      pdf.setFontSize(5);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Scan for Details', 71, 44, { align: 'center' });

      // Footer
      pdf.setFillColor(227, 30, 36); // TAG Red
      pdf.rect(0, 48, 85.6, 6, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('This card is property of FCC and must be returned upon request', 42.8, 51.5, { align: 'center' });

      // Card border
      pdf.setDrawColor(227, 30, 36);
      pdf.setLineWidth(0.5);
      pdf.rect(0, 0, 85.6, 53.98, 'S');

      // Save PDF
      const fileName = `FCC_MemberCard_${member.member_number}_${Date.now()}.pdf`;
      pdf.save(fileName);

    } catch (err: any) {
      console.error('Card generation error:', err);
      setError(err.message || 'Failed to generate membership card');
    } finally {
      setGenerating(false);
    }
  };

  // Helper function to load image
  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-tag-gray-50 to-white border-2 border-tag-gray-200 rounded-lg p-6 shadow-md">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <CreditCard className="h-12 w-12 text-tag-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-tag-gray-900 mb-1">
              Membership Card
            </h3>
            <p className="text-sm text-tag-gray-600 mb-3">
              Generate a printable membership card with QR code for {member.first_name} {member.last_name}
            </p>
            
            {/* Card Details Preview */}
            <div className="bg-white border border-tag-gray-200 rounded p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-tag-gray-600">Member Number:</span>
                <span className="font-semibold text-tag-gray-900">{member.member_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tag-gray-600">Name:</span>
                <span className="font-semibold text-tag-gray-900">
                  {member.first_name} {member.middle_name || ''} {member.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tag-gray-600">Phone:</span>
                <span className="font-semibold text-tag-gray-900">{member.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tag-gray-600">Member Since:</span>
                <span className="font-semibold text-tag-gray-900">
                  {new Date(member.membership_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-tag-gray-200">
                <QrCode className="h-4 w-4 text-tag-gray-400" />
                <span className="text-tag-gray-500">Includes QR code with member details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateCard}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Card...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate & Download Card
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="mt-4 pt-4 border-t border-tag-gray-200">
          <p className="text-xs text-tag-gray-600 mb-2 font-semibold">
            Printing Instructions:
          </p>
          <ul className="text-xs text-tag-gray-600 space-y-1 list-disc list-inside">
            <li>Card size: 85.6mm × 53.98mm (standard credit card size)</li>
            <li>Use high-quality cardstock paper (200-300 GSM)</li>
            <li>Print at 100% scale (do not fit to page)</li>
            <li>Consider laminating for durability</li>
            <li>QR code can be scanned for member verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
