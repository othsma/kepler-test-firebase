/**
 * Format Toggle Action Component
 *
 * Handles format switching between thermal and A4.
 */

import { FileText, Receipt } from 'lucide-react';
import { DocumentFormat } from '../DocumentTypes';

interface FormatToggleProps {
  currentFormat: DocumentFormat;
  onToggle: () => void;
  disabled?: boolean;
}

export default function FormatToggle({ currentFormat, onToggle, disabled = false }: FormatToggleProps) {
  const getIcon = () => {
    return currentFormat === 'thermal' ? FileText : Receipt;
  };

  const getLabel = () => {
    return `Switch to ${currentFormat === 'thermal' ? 'A4' : 'Thermal'}`;
  };

  const Icon = getIcon();

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title={getLabel()}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{getLabel()}</span>
      <span className="sm:hidden">Switch</span>
    </button>
  );
}
