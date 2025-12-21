/**
 * UnifiedDocument Component
 *
 * Refactored with configuration-driven architecture and composition.
 * Uses custom hooks and separated action components for better maintainability.
 *
 * Usage:
 * ```jsx
 * <UnifiedDocument
 *   data={documentData}
 *   onClose={() => setShowDocument(false)}
 * />
 * ```
 */

import { useState, useRef, memo } from 'react';
import { useThemeStore } from '../../lib/store';
import { X } from 'lucide-react';
import { DocumentData, DocumentFormat } from './DocumentTypes';
import { FORMAT_CONFIGS, DOCUMENT_TYPE_NAMES, COMPANY_CONFIG } from './DocumentConfig';
import { useDocumentActions } from './hooks/useDocumentActions';

// Import action components
import FormatToggle from './actions/FormatToggle';
import DownloadAction from './actions/DownloadAction';
import PDFDownloadAction from './actions/PDFDownloadAction';
import EmailAction from './actions/EmailAction';
import PrintAction from './actions/PrintAction';

// Import format components
import ThermalFormat from './formats/ThermalFormat';
import A4Format from './formats/A4Format';
import PDFFormat from './formats/PDFFormat';

interface UnifiedDocumentProps {
  data: DocumentData;
  onClose: () => void;
  initialFormat?: DocumentFormat;
}

function UnifiedDocument({
  data,
  onClose,
  initialFormat = 'thermal'
}: UnifiedDocumentProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [format, setFormat] = useState<DocumentFormat>(initialFormat);
  const documentRef = useRef<HTMLDivElement>(null);

  // Use custom hook for actions
  const {
    handlePrint,
    handleEmail,
    handleDownload,
    handlePDFDownload,
    handleFormatToggle,
    isProcessing
  } = useDocumentActions({
    data,
    documentRef,
    onFormatChange: setFormat
  });

  // Get current format configuration
  const formatConfig = FORMAT_CONFIGS[format];

  // Get document title
  const documentTitle = DOCUMENT_TYPE_NAMES[data.type];

  // Handle format change
  const onFormatToggle = () => {
    handleFormatToggle(format);
  };

  // Render document content based on selected format
  const renderDocumentContent = () => {
    const commonProps = { data };

    switch (format) {
      case 'thermal':
        return <ThermalFormat {...commonProps} />;
      case 'a4':
        return <A4Format {...commonProps} />;
      case 'pdf':
        return <PDFFormat {...commonProps} />;
      default:
        return <ThermalFormat {...commonProps} />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div
        className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-y-auto`}
        style={{
          width: formatConfig.width,
          maxHeight: '90vh',
          minHeight: '600px'
        }}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b sticky top-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-10`}>
          <div>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatConfig.name} - {documentTitle}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              #{data.number} • {COMPANY_CONFIG.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-500 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document Content */}
        <div
          className={`overflow-auto ${formatConfig.styles.container}`}
          ref={documentRef}
        >
          {renderDocumentContent()}
        </div>

        {/* Footer with Actions */}
        <div className={`flex justify-between items-center gap-2 p-4 border-t sticky bottom-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Left side - Format toggle */}
          <FormatToggle
            currentFormat={format}
            onToggle={onFormatToggle}
            disabled={isProcessing}
          />

          {/* Right side - Action buttons */}
          <div className="flex gap-2">
            <PDFDownloadAction
              data={data}
              onDownload={handlePDFDownload}
              disabled={isProcessing}
              isProcessing={isProcessing}
            />
            <DownloadAction
              onDownload={handleDownload}
              disabled={isProcessing}
              isProcessing={isProcessing}
            />
            <EmailAction
              onEmail={handleEmail}
              disabled={isProcessing}
              hasEmail={!!data.customer?.email}
            />
            <PrintAction
              onPrint={handlePrint}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(UnifiedDocument);
