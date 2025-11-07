'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Button, Modal, Alert, Loading } from '@/components/ui';
import { CreditCard, Download, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  photo_url?: string;
  membership_date: string;
  phone: string;
}

interface BulkCardGeneratorProps {
  members: Member[];
  onClose: () => void;
}

export default function BulkCardGenerator({ members, onClose }: BulkCardGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateCards = async () => {
    try {
      setGenerating(true);
      setError(null);
      setProgress(0);

      // Create PDF with multiple cards (2 per page)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const cardWidth = 85.6;
      const cardHeight = 53.98;
      const marginX = (210 - cardWidth * 2) / 3; // A4 width is 210mm
      const marginY = 20;
      const spacing = 10;

      let cardCount = 0;

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        setProgress(Math.round(((i + 1) / members.length) * 100));

        // Calculate position (2 cards per row, multiple rows per page)
        const row = Math.floor(cardCount / 2) % 4; // 4 rows per page
        const col = cardCount % 2;
        const x = marginX + col * (cardWidth + marginX);
        const y = marginY + row * (cardHeight + spacing);

        // Add new page if needed (after 8 cards)
        if (cardCount > 0 && cardCount % 8 === 0) {
          pdf.addPage();
        }

        // Draw card
        await drawMemberCard(pdf, member, x, y);

        cardCount++;
      }

      // Save PDF
      const fileName = `FCC_MemberCards_Bulk_${Date.now()}.pdf`;
      pdf.save(fileName);

      onClose();

    } catch (err: any) {
      console.error('Bulk generation error:', err);
      setError(err.message || 'Failed to generate membership cards');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const drawMemberCard = async (pdf: jsPDF, member: Member, x: number, y: number) => {
    // Colors
    const tagRed: [number, number, number] = [227, 30, 36];
    const tagYellow: [number, number, number] = [255, 215, 0];

    // Save state
    pdf.saveGraphicsState();

    // Card background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, 85.6, 53.98, 'F');

    // Header
    pdf.setFillColor(...tagRed);
    pdf.rect(x, y, 85.6, 18, 'F');

    // Church name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FILADEFIA CHRISTIAN CENTER', x + 42.8, y + 6, { align: 'center' });

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Tanzania Assemblies of God', x + 42.8, y + 10, { align: 'center' });

    pdf.setFontSize(6);
    pdf.text('MEMBER IDENTIFICATION CARD', x + 42.8, y + 14, { align: 'center' });

    // Yellow line
    pdf.setFillColor(...tagYellow);
    pdf.rect(x, y + 18, 85.6, 1, 'F');

    // Photo placeholder
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x + 5, y + 22, 18, 22, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(x + 5, y + 22, 18, 22, 'S');

    // Initials
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const initials = `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;
    pdf.text(initials, x + 14, y + 35, { align: 'center' });

    // Member details
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MEMBER NO:', x + 26, y + 24);
    pdf.setFont('helvetica', 'normal');
    pdf.text(member.member_number, x + 26, y + 28);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const fullName = `${member.first_name} ${member.middle_name || ''} ${member.last_name}`.trim();
    pdf.text(fullName.toUpperCase(), x + 26, y + 34);

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Phone: ${member.phone}`, x + 26, y + 38);

    const memberSince = new Date(member.membership_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    pdf.text(`Member Since: ${memberSince}`, x + 26, y + 42);

    // QR Code
    const qrData = JSON.stringify({
      id: member.id,
      number: member.member_number,
      name: fullName,
      phone: member.phone
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1
    });

    pdf.addImage(qrCodeDataUrl, 'PNG', x + 61, y + 22, 20, 20);

    pdf.setFontSize(5);
    pdf.text('Scan for Details', x + 71, y + 44, { align: 'center' });

    // Footer
    pdf.setFillColor(...tagRed);
    pdf.rect(x, y + 48, 85.6, 6, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.text('This card is property of FCC', x + 42.8, y + 51.5, { align: 'center' });

    // Border
    pdf.setDrawColor(...tagRed);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, 85.6, 53.98, 'S');

    // Restore state
    pdf.restoreGraphicsState();
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info */}
      <div className="bg-tag-blue-50 border border-tag-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="h-6 w-6 text-tag-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-tag-blue-900 mb-2">
              Bulk Card Generation
            </h3>
            <p className="text-sm text-tag-blue-700 mb-2">
              Generate membership cards for {members.length} member{members.length !== 1 ? 's' : ''}.
            </p>
            <ul className="text-sm text-tag-blue-600 space-y-1 list-disc list-inside">
              <li>2 cards per page (A4 format)</li>
              <li>Each card includes member photo (or initials), details, and QR code</li>
              <li>Ready for printing on cardstock paper</li>
              <li>Print at 100% scale for accurate sizing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Progress */}
      {generating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-tag-gray-600">
            <span>Generating cards...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-tag-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-tag-red-500 to-tag-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={generating}
        >
          Cancel
        </Button>
        <Button
          onClick={generateCards}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate All Cards
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
