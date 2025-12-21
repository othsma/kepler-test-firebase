/**
 * Document Actions Hook
 *
 * Custom hook that encapsulates all document action logic.
 * Provides memoized action handlers and state management.
 */

import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { DocumentData, DocumentFormat } from '../DocumentTypes';

interface UseDocumentActionsProps {
  data: DocumentData;
  documentRef: React.RefObject<HTMLElement>;
  onFormatChange?: (format: DocumentFormat) => void;
}

export const useDocumentActions = ({ data, documentRef, onFormatChange }: UseDocumentActionsProps) => {
  const isProcessingRef = useRef(false);

  // Handle print action
  const handlePrint = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      window.print();
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, []);

  // Handle email action
  const handleEmail = useCallback(() => {
    if (isProcessingRef.current || !data.customer?.email) return;
    isProcessingRef.current = true;

    try {
      const subject = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} ${data.number}`;
      const body = `Please find attached your ${data.type.toLowerCase()} details.`;
      window.location.href = `mailto:${data.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [data.customer?.email, data.type, data.number]);

  // Handle download action
  const handleDownload = useCallback(async () => {
    if (isProcessingRef.current || !documentRef.current) return;
    isProcessingRef.current = true;

    try {
      // Find the specific format element to capture
      const modalElement = documentRef.current;
      const formatElement = modalElement?.querySelector('[data-format="a4"]') ||
                           modalElement?.querySelector('[data-format="thermal"]') ||
                           modalElement;

      if (!formatElement) {
        throw new Error('No format element found');
      }

      // Use the format element for PNG capture
      const targetElement = formatElement as HTMLElement;

      // Wait for images to load
      const images = targetElement.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 2000);
          }
        });
      });

      await Promise.all(imagePromises);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        width: targetElement.offsetWidth,
        height: targetElement.offsetHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${data.type}_${data.number}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating document image:', error);
      // Could dispatch an error notification here
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [data.type, data.number, documentRef]);

  // Handle format toggle
  const handleFormatToggle = useCallback((currentFormat: DocumentFormat) => {
    if (isProcessingRef.current) return;

    const newFormat = currentFormat === 'thermal' ? 'a4' :
                     currentFormat === 'a4' ? 'thermal' : 'thermal';

    onFormatChange?.(newFormat);
  }, [onFormatChange]);

  // Handle PDF download - captures current format as PDF
  const handlePDFDownload = useCallback(async () => {
    if (isProcessingRef.current || !documentRef.current) return;
    isProcessingRef.current = true;

    try {
      // Dynamic import jsPDF to reduce bundle size
      const { default: jsPDF } = await import('jspdf');

      // Try to find the actual document format element
      const modalElement = documentRef.current;
      const formatElement = modalElement?.querySelector('[data-format="a4"]') ||
                           modalElement?.querySelector('[data-format="thermal"]') ||
                           modalElement;

      if (!formatElement) {
        throw new Error('No format element found');
      }

      // Use the format element for capture
      const targetElement = formatElement as HTMLElement;

      // Wait for images to load before capturing
      const images = targetElement.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails
            setTimeout(() => resolve(), 2000); // Timeout fallback
          }
        });
      });

      // Wait for all images to load
      await Promise.all(imagePromises);

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Temporarily modify styles to fix html2canvas issues
      const originalStyles = {
        transform: targetElement.style.transform,
        position: targetElement.style.position,
        willChange: targetElement.style.willChange,
        contain: targetElement.style.contain
      };

      // Fix common html2canvas issues
      targetElement.style.transform = 'none';
      targetElement.style.position = 'static';
      targetElement.style.willChange = 'auto';
      targetElement.style.contain = 'none';

      // Also fix parent modal styles that might interfere
      const modalParent = targetElement.closest('[class*="fixed"]') as HTMLElement;
      const modalOriginalStyles = modalParent ? {
        transform: modalParent.style.transform,
        willChange: modalParent.style.willChange
      } : {};

      if (modalParent) {
        modalParent.style.transform = 'none';
        modalParent.style.willChange = 'auto';
      }

      // Capture the document format element with optimized settings
      const canvas = await html2canvas(targetElement, {
        scale: 1.5, // Slightly lower scale for better compatibility
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false, // Disable for better compatibility
        logging: false, // Disable logging for production
        width: targetElement.offsetWidth,
        height: targetElement.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'IFRAME' ||
                 element.classList.contains('html2canvas-ignore') ||
                 (element as HTMLElement).style.display === 'none';
        }
      });

      // Restore original styles
      Object.assign(targetElement.style, originalStyles);
      if (modalParent && modalOriginalStyles) {
        Object.assign(modalParent.style, modalOriginalStyles);
      }



      // Determine PDF format based on content type
      const isThermal = targetElement.hasAttribute('data-format') &&
                       targetElement.getAttribute('data-format') === 'thermal';

      console.log('PDF Generation - Element format:', targetElement.getAttribute('data-format'));
      console.log('PDF Generation - Is thermal:', isThermal);

      let pdf, pdfWidth, pdfHeight;

      if (isThermal) {
        // Thermal receipt: 80mm width (standard thermal printer)
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, 200] // 80mm width, auto height
        });
        pdfWidth = 80;
        pdfHeight = 200; // Allow up to 200mm height for thermal receipts
      } else {
        // A4 format for regular documents
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        pdfWidth = pdf.internal.pageSize.getWidth();
        pdfHeight = pdf.internal.pageSize.getHeight();
      }

      // Calculate dimensions to fit the PDF format
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Scale to fit page height if needed
      const scaledHeight = Math.min(imgHeight, pdfHeight);

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, scaledHeight);

      // Generate PDF blob and download
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.type}_${data.number}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to the original PDF method if html2canvas fails
      try {
        const [{ pdf }, { default: PDFFormat }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('../formats/PDFFormat')
        ]);
        const pdfDocument = PDFFormat({ data });
        const blob = await pdf(pdfDocument).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fallback_${data.type}_${data.number}_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
      }
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [data, documentRef]);

  // Check if action is available
  const isActionAvailable = useCallback((action: string) => {
    switch (action) {
      case 'email':
        return !!data.customer?.email;
      case 'download':
      case 'print':
      case 'toggleFormat':
        return true;
      default:
        return false;
    }
  }, [data.customer?.email]);

  return {
    handlePrint,
    handleEmail,
    handleDownload,
    handlePDFDownload,
    handleFormatToggle,
    isActionAvailable,
    isProcessing: isProcessingRef.current
  };
};
