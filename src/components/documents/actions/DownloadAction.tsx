/**
 * Download Action Component
 *
 * Handles document download functionality.
 */

import { Download } from 'lucide-react';

interface DownloadActionProps {
  onDownload: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export default function DownloadAction({ onDownload, disabled = false, isProcessing = false }: DownloadActionProps) {
  return (
    <button
      onClick={onDownload}
      disabled={disabled || isProcessing}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title="Download Document"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isProcessing ? 'Downloading...' : 'Download'}
      </span>
      <span className="sm:hidden">
        {isProcessing ? '...' : 'DL'}
      </span>
    </button>
  );
}
