import { format } from 'date-fns';
import { DocumentData } from '../DocumentTypes';

interface ThermalFormatProps {
  data: DocumentData;
}

export default function ThermalFormat({ data }: ThermalFormatProps) {
  // Calculate remaining amount if partially paid
  const remainingAmount = data.amountPaid !== undefined 
    ? data.total - data.amountPaid 
    : 0;

  const getTitle = () => {
    switch (data.type) {
      case 'quote': return 'QUOTE';
      case 'invoice': return 'INVOICE';
      case 'ticket': return 'REPAIR TICKET';
      default: return 'RECEIPT';
    }
  };

  return (
    <div className="p-4 bg-white text-black" style={{ width: '80mm', margin: '0 auto' }}>
      {/* Company Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center mb-2">
          <img
            src="https://github.com/othsma/kepler-test-firebase/blob/main/src/omegalogo.png?raw=true"
            alt="O'MEGA SERVICES Logo"
            className="h-8 w-auto mr-2"
          />
        </div>
        <h1 className="font-bold text-lg">O'MEGA SERVICES</h1>
        <p className="text-xs">400 Rue nationale</p>
        <p className="text-xs">69400 Villefranche S/S</p>
        <p className="text-xs">Tel: 0986608980</p>
        <p className="text-xs">TVA: FR123456789</p>
      </div>

      {/* Receipt Header */}
      <div className="border-y border-dashed py-2 my-2 text-center">
        <p className="font-bold text-sm">{getTitle()}</p>
        <p className="text-xs">#{data.number}</p>
        <p className="text-xs">{format(new Date(data.date), 'dd/MM/yyyy HH:mm')}</p>
        {data.status && (
          <p className="text-xs">Status: {data.status}</p>
        )}
      </div>

      {/* Customer Information */}
      {data.customer && (
        <div className="my-2">
          <p className="font-bold text-xs mb-1">Customer:</p>
          <p className="text-xs">{data.customer.name}</p>
          {data.customer.phone && <p className="text-xs">Tel: {data.customer.phone}</p>}
          {data.customer.email && <p className="text-xs">{data.customer.email}</p>}
          {data.customer.address && <p className="text-xs">{data.customer.address}</p>}
        </div>
      )}

      {/* Items */}
      <div className="my-2">
        <p className="font-bold text-xs mb-2">Items:</p>
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
          <span>Subtotal:</span>
          <span>€{data.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>VAT (20%):</span>
          <span>€{data.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1 mt-1">
          <span>TOTAL:</span>
          <span>€{data.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Information */}
      {(data.paymentMethod || data.paymentStatus) && (
        <div className="my-2">
          <p className="font-bold text-xs mb-1">Payment:</p>
          {data.paymentMethod && <p className="text-xs">Method: {data.paymentMethod}</p>}
          {data.paymentStatus && <p className="text-xs">Status: {data.paymentStatus}</p>}
          {data.amountPaid !== undefined && data.amountPaid > 0 && (
            <>
              <p className="text-xs">Paid: €{data.amountPaid.toFixed(2)}</p>
              {data.amountPaid < data.total && (
                <p className="text-xs font-bold">Balance: €{remainingAmount.toFixed(2)}</p>
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
        <p className="mb-1">Thank you for your business!</p>
        <p className="mb-1">Your satisfaction is our success.</p>
        <p>For questions: contact@omegaservices.fr</p>
        <p className="mt-2 text-xs italic">
          This {data.type} serves as proof of purchase.
        </p>
      </div>
    </div>
  );
}
