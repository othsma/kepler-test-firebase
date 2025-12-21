/**
 * Print Action Component
 *
 * Handles document printing functionality.
 */

import { Printer } from 'lucide-react';

interface PrintActionProps {
  onPrint: () => void;
  disabled?: boolean;
}

export default function PrintAction({ onPrint, disabled = false }: PrintActionProps) {
  return (
    <button
      onClick={onPrint}
      disabled={disabled}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title="Print Document"
    >
      <Printer className="h-4 w-4" />
      <span className="hidden sm:inline">Print</span>
    </button>
  );
}
