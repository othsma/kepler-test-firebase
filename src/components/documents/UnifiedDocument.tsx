/**
 * UnifiedDocument Component
 * 
 * This is the main component for the unified document system.
 * It handles format switching and provides a consistent interface for all document types.
 * 
 * Usage:
 * ```jsx
 * <UnifiedDocument 
 *   data={documentData} 
 *   onClose={() => setShowDocument(false)} 
 * />
 * ```
 */

import { useState, useRef } from 'react';
import { useThemeStore } from '../../lib/store';
import { Printer, Mail, Download, X, FileText, Receipt } from 'lucide-react';
import { DocumentData, DocumentFormat } from './DocumentTypes';
import html2canvas from 'html2canvas';

// Import format components
import ThermalFormat from './formats/ThermalFormat';
import A4Format from './formats/A4Format';
import PDFFormat from './formats/PDFFormat';

interface UnifiedDocumentProps {
  data: DocumentData;
  onClose: () => void;
  initialFormat?: DocumentFormat;
}

export default function UnifiedDocument({ 
  data, 
  onClose,
  initialFormat = 'thermal'
}: UnifiedDocumentProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [format, setFormat] = useState<DocumentFormat>(initialFormat);
  const documentRef = useRef<HTMLDivElement>(null);

  // Get title based on document type
  const getTitle = () => {
    switch (data.type) {
      case 'quote': return 'Quote';
      case 'invoice': return 'Invoice';
      case 'ticket': return 'Repair Ticket';
      default: return 'Receipt';
    }
  };

  // Handle print action
  const handlePrint = () => {
    window.print();
  };

  // Handle email action
  const handleEmail = () => {
    if (data.customer?.email) {
      const subject = `${getTitle()} ${data.number}`;
      const body = `Please find attached your ${data.type.toLowerCase()} details.`;
      window.location.href = `mailto:${data.customer.email}?subject=${subject}&body=${body}`;
    }
  };

  // Handle download action
  const handleDownload = async () => {
    if (documentRef.current) {
      try {
        const canvas = await html2canvas(documentRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${data.type}_${data.number}.png`;
        link.click();
      } catch (error) {
        console.error('Error generating document image:', error);
      }
    }
  };

  // Toggle between formats
  const toggleFormat = () => {
    setFormat(prevFormat => {
      if (prevFormat === 'thermal') return 'a4';
      if (prevFormat === 'a4') return 'thermal';
      return 'thermal';
    });
  };

  // Render document content based on selected format
  const renderDocumentContent = () => {
    switch (format) {
      case 'thermal':
        return <ThermalFormat data={data} />;
      case 'a4':
        return <A4Format data={data} />;
      case 'pdf':
        return <PDFFormat data={data} />;
      default:
        return <ThermalFormat data={data} />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className={`relative ${format === 'a4' ? 'w-[210mm] max-h-[90vh]' : 'w-[400px]'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-y-auto`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {format === 'thermal' ? 'Thermal Receipt' : 'A4 Format'} - {getTitle()}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document Content */}
        <div className="p-4 overflow-auto" ref={documentRef}>
          {renderDocumentContent()}
        </div>

        {/* Footer with Actions */}
        <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={toggleFormat}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
          >
            {format === 'thermal' ? <FileText className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
            Switch to {format === 'thermal' ? 'A4' : 'Thermal'}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          {data.customer?.email && (
            <button
              onClick={handleEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
