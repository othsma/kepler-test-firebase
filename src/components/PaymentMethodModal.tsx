import React, { useState } from 'react';
import { X, CreditCard, Banknote, FileText, Building } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  ticketNumber: string;
  clientName: string;
  totalAmount: number;
}

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Espèces', icon: Banknote, description: 'Paiement en espèces' },
  { id: 'card', name: 'Carte bancaire', icon: CreditCard, description: 'Carte de crédit/débit' },
  { id: 'transfer', name: 'Virement', icon: Building, description: 'Virement bancaire' },
  { id: 'check', name: 'Chèque', icon: FileText, description: 'Paiement par chèque' },
];

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  ticketNumber,
  clientName,
  totalAmount
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const handleConfirm = () => {
    if (!selectedMethod) return;
    onConfirm(selectedMethod);
    setSelectedMethod('');
    onClose();
  };

  const handleClose = () => {
    setSelectedMethod('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Méthode de paiement
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invoice Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Ticket:</span>
                <span className="font-medium">#{ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant total:</span>
                <span className="font-medium text-lg">€{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Sélectionnez la méthode de paiement utilisée:
            </h3>

            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    selectedMethod === method.id
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${
                      selectedMethod === method.id ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className={`font-medium ${
                        selectedMethod === method.id ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {method.name}
                      </div>
                      <div className={`text-sm ${
                        selectedMethod === method.id ? 'text-indigo-600' : 'text-gray-500'
                      }`}>
                        {method.description}
                      </div>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="text-indigo-600">
                        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Générer la facture
          </button>
        </div>
      </div>
    </div>
  );
}
