/**
 * Email Action Component
 *
 * Handles document emailing functionality.
 */

import { Mail } from 'lucide-react';

interface EmailActionProps {
  onEmail: () => void;
  disabled?: boolean;
  hasEmail?: boolean;
}

export default function EmailAction({ onEmail, disabled = false, hasEmail = false }: EmailActionProps) {
  if (!hasEmail) return null;

  return (
    <button
      onClick={onEmail}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title="Email Document"
    >
      <Mail className="h-4 w-4" />
      <span className="hidden sm:inline">Email</span>
    </button>
  );
}
