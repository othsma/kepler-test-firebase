import { format } from 'date-fns';
import { DocumentData } from '../DocumentTypes';
import { FORMAT_CONFIGS, COMPANY_CONFIG, VAT_CONFIG, TERMS_CONFIG, DOCUMENT_TYPE_NAMES } from '../DocumentConfig';
import omegalogo from '../../../omegalogo.png';

interface ThermalFormatProps {
  data: DocumentData;
}

// Translate payment status to French
const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'not_paid':
      return 'Non payé';
    case 'partially_paid':
      return 'Partiellement payé';
    case 'fully_paid':
      return ' Payé ';
    default:
      return status;
  }
};

export default function ThermalFormat({ data }: ThermalFormatProps) {
  const formatConfig = FORMAT_CONFIGS.thermal;
  // Calculate remaining amount if partially paid
  const remainingAmount = data.amountPaid !== undefined 
    ? data.total - data.amountPaid 
    : 0;

  const getTitle = () => {
    switch (data.type) {
      case 'quote': return 'DEVIS';
      case 'invoice': return 'FACTURE';
      case 'ticket': return 'TICKET DE RÉPARATION';
      default: return 'REÇU';
    }
  };

  return (
    <div
      className={formatConfig.styles.container}
      style={{ width: formatConfig.width, margin: '0 auto' }}
      data-format="thermal"
    >
      {/* Company Header */}
      {formatConfig.showLogo && (
        <div className={formatConfig.styles.header}>
          <div className="flex items-center justify-center mb-2">
            <img
              src={omegalogo}
              alt={`${COMPANY_CONFIG.name} Logo`}
              className="h-8 w-auto mr-2"
            />
          </div>
          <h1 className="font-bold text-lg">{COMPANY_CONFIG.name}</h1>
          <p className="text-xs">{COMPANY_CONFIG.address}</p>
          <p className="text-xs">Tel: {COMPANY_CONFIG.phone}</p>
          <p className="text-xs">TVA: {COMPANY_CONFIG.taxId}</p>
        </div>
      )}

      {/* Receipt Header */}
      <div className="border-y border-dashed py-2 my-2 text-center">
        <p className="font-bold text-sm">{getTitle()}</p>
        <p className="text-xs">#{data.number}</p>
        <p className="text-xs">{format(new Date(data.date), 'dd/MM/yyyy HH:mm')}</p>
      </div>

      {/* Customer Information */}
      {data.customer && (
        <div className="my-2">
          <p className="font-bold text-xs mb-1">Client:</p>
          <p className="text-xs">{data.customer.name}</p>
          {data.customer.phone && <p className="text-xs">Tel: {data.customer.phone}</p>}
          {data.customer.email && <p className="text-xs">{data.customer.email}</p>}
          {data.customer.address && <p className="text-xs">{data.customer.address}</p>}
        </div>
      )}

      {/* Items */}
      <div className="my-2">
        <p className="font-bold text-xs mb-2">Produits:</p>
        {data.items.map((item, index) => (
          <div key={index} className="mb-1">
            <div className="flex justify-between text-xs">
              <span className="flex-1">{item.name}</span>
              <span>x{item.quantity}</span>
            </div>
            {item.sku && (
              <p className="text-xs text-gray-600">SKU: {item.sku}</p>
            )}
            <div className="flex justify-between text-xs font-medium">
              <span>€{(item.price * item.quantity).toFixed(2)}</span>
              <span>@ €{item.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="border-t border-dashed pt-2 my-2">
        <div className="flex justify-between text-xs">
          <span>Prix HT:</span>
          <span>€{data.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>TVA (20%):</span>
          <span>€{data.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1 mt-1">
          <span>TOTAL TTC:</span>
          <span>€{data.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Information */}
      {(data.paymentMethod || data.paymentStatus) && (
        <div className="my-2">
          <p className="font-bold text-xs mb-1">Paiement:</p>
          {data.paymentMethod && <p className="text-xs">Type de paiement: {data.paymentMethod}</p>}
          {data.paymentStatus && <p className="text-xs">Statut: {getPaymentStatusText(data.paymentStatus)}</p>}
          {data.amountPaid !== undefined && data.amountPaid > 0 && (
            <>
              <p className="text-xs">Montant payé: €{data.amountPaid.toFixed(2)}</p>
              {data.amountPaid < data.total && (
                <p className="text-xs font-bold">Solde restant: €{remainingAmount.toFixed(2)}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {data.note && (
        <div className="my-2">
          <p className="font-bold text-xs mb-1">Note:</p>
          <p className="text-xs">{data.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs mt-4 border-t border-dashed pt-2">
        <p className="mb-1">Merci pour votre confiance !</p>
        <p className="mb-1">Votre satisfaction est notre priorité.</p>
        <p>Pour toute question concernant ce {DOCUMENT_TYPE_NAMES[data.type].toLowerCase()}, veuillez nous contacter à l’adresse {COMPANY_CONFIG.email}</p>
       
      </div>
    </div>
  );
}
