'use client';

import { useState } from 'react';
import { Button, Alert } from '@/components/ui';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  row: number;
  memberNumber?: string;
  name?: string;
  error?: string;
}

interface CSVImportProps {
  onImport: (members: any[]) => Promise<ImportResult[]>;
  onClose: () => void;
}

export default function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const downloadTemplate = () => {
    const template = [
      'first_name,last_name,middle_name,gender,date_of_birth,marital_status,phone,email,address,occupation,employer,emergency_contact_name,emergency_contact_phone,baptism_date,membership_date,status,notes',
      'John,Doe,Paul,male,1990-01-15,married,+255712345678,john@example.com,"123 Main St, Dar es Salaam",Teacher,ABC School,Jane Doe,+255712345679,2015-06-20,2020-01-15,active,Sample member',
      'Mary,Smith,,female,1985-05-22,single,+255713456789,mary@example.com,"456 Oak Ave, Dar es Salaam",Nurse,City Hospital,Peter Smith,+255713456790,2010-03-15,2018-07-10,active,',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member-import-template.csv';
    a.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const members = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      const member: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (value) {
          member[header] = value;
        }
      });

      if (member.first_name && member.last_name) {
        members.push(member);
      }
    }

    return members;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedMembers = parseCSV(text);
      setPreview(parsedMembers.slice(0, 5)); // Show first 5 rows
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const parsedMembers = parseCSV(text);
        
        const importResults = await onImport(parsedMembers);
        setResults(importResults);
        setShowResults(true);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return (
    <div className="space-y-6">
      {!showResults ? (
        <>
          {/* Instructions */}
          <div className="bg-tag-blue-50 border border-tag-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-tag-blue-700 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-tag-blue-900">
                <p className="font-semibold mb-2">CSV Import Instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-tag-blue-800">
                  <li>Download the template file below to see the required format</li>
                  <li>Fill in member data (first_name and last_name are required)</li>
                  <li>Save as CSV file and upload here</li>
                  <li>Member numbers will be auto-generated during import</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-tag-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-tag-gray-600
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-tag-red-50 file:text-tag-red-700
                  hover:file:bg-tag-red-100
                  cursor-pointer border border-tag-gray-300 rounded-xl p-3"
              />
            </div>
            {file && (
              <p className="mt-2 text-sm text-tag-gray-600 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-tag-blue-600" />
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-tag-gray-900 mb-3">
                Preview (First 5 rows)
              </h3>
              <div className="overflow-x-auto border border-tag-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-tag-gray-200">
                  <thead className="bg-tag-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-tag-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-tag-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-tag-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-tag-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-tag-gray-200">
                    {preview.map((member, index) => (
                      <tr key={index} className="hover:bg-tag-gray-50">
                        <td className="px-4 py-3 text-sm text-tag-gray-900">
                          {member.first_name} {member.middle_name || ''} {member.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-tag-gray-600">{member.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-tag-gray-600">{member.email || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-tag-yellow-100 text-tag-yellow-800 rounded-full text-xs font-semibold">
                            {member.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-tag-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              loading={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Members
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="text-center py-6">
            {errorCount === 0 ? (
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 bg-tag-yellow-100 rounded-full mb-4">
                <AlertCircle className="h-10 w-10 text-tag-yellow-600" />
              </div>
            )}
            <h3 className="text-2xl font-bold text-tag-gray-900 mb-2">Import Complete</h3>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="text-green-600 font-semibold">
                <CheckCircle className="h-5 w-5 inline mr-1" />
                {successCount} Successful
              </div>
              {errorCount > 0 && (
                <div className="text-tag-red-600 font-semibold">
                  <XCircle className="h-5 w-5 inline mr-1" />
                  {errorCount} Failed
                </div>
              )}
            </div>
          </div>

          {/* Error Details */}
          {errorCount > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-tag-gray-900 mb-3">Failed Imports:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.filter(r => !r.success).map((result, index) => (
                  <div key={index} className="bg-tag-red-50 border border-tag-red-200 rounded-lg p-3">
                    <p className="text-sm text-tag-red-900">
                      <span className="font-semibold">Row {result.row}:</span> {result.error}
                    </p>
                    {result.name && (
                      <p className="text-xs text-tag-red-700 mt-1">{result.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-tag-gray-200">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
