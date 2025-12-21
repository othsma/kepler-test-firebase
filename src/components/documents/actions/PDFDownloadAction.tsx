/**
 * PDF Download Action Component
 *
 * Handles PDF document generation and download.
 */

import { FileText } from 'lucide-react';
import { DocumentData } from '../DocumentTypes';

interface PDFDownloadActionProps {
  data: DocumentData;
  onDownload: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export default function PDFDownloadAction({
  data,
  onDownload,
  disabled = false,
  isProcessing = false
}: PDFDownloadActionProps) {
  return (
    <button
      onClick={onDownload}
      disabled={disabled || isProcessing}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title="Download PDF"
    >
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isProcessing ? 'Generating PDF...' : 'PDF'}
      </span>
      <span className="sm:hidden">
        {isProcessing ? '...' : 'PDF'}
      </span>
    </button>
  );
}
