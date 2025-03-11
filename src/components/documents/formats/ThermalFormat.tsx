import React from 'react';
import { useThemeStore } from '../../../lib/store';
import { QRCodeSVG } from 'qrcode.react';
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
      <div className="text-center mb-4">
        <h1 className="font-bold text-lg">O'MEGA SERVICES</h1>
        <p className="text-xs">400 Rue nationale, 69400 Villefranche S/S</p>
        <p className="text-xs">Tel: 0986608980 | TVA: FR123456789</p>
      </div>

      <div className="border-y border-dashed py-2 my-2">
        <div className="text-center font-bold mb-2">{getTitle()}</div>
        <div className="flex justify-between text-sm">
          <span>Number:</span>
          <span>#{data.number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Date:</span>
          <span>{format(new Date(data.date), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Time:</span>
          <span>{format(new Date(data.date), 'HH:mm')}</span>
        </div>
        {data.status && (
          <div className="flex justify-between text-sm">
            <span>Status:</span>
            <span>{data.status}</span>
          </div>
        )}
      </div>

      {data.customer && (
        <div className="my-2">
          <p className="font-bold">Customer:</p>
          <p className="text-sm">{data.customer.name}</p>
          {data.customer.phone && <p className="text-sm">Tel: {data.customer.phone}</p>}
          {data.customer.email && <p className="text-sm">{data.customer.email}</p>}
        </div>
      )}

      {/* Device information for tickets */}
      {data.type === 'ticket' && data.deviceType && (
        <div className="border-y border-dashed py-2 my-2">
          <p className="font-bold">Device Information:</p>
          <div className="flex justify-between text-sm">
            <span>Type:</span>
            <span>{data.deviceType}</span>
          </div>
          {data.brand && (
            <div className="flex justify-between text-sm">
              <span>Brand:</span>
              <span>{data.brand}</span>
            </div>
          )}
          {data.model && (
            <div className="flex justify-between text-sm">
              <span>Model:</span>
              <span>{data.model}</span>
            </div>
          )}
          {data.passcode && (
            <div className="flex justify-between text-sm">
              <span>Passcode:</span>
              <span>{data.passcode}</span>
            </div>
          )}
        </div>
      )}

      <div className="my-2">
        <p className="font-bold">{data.type === 'ticket' ? 'Services:' : 'Items:'}</p>
        {data.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
            <span>€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed pt-2 my-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>€{data.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>VAT (20%):</span>
          <span>€{data.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>€{data.total.toFixed(2)}</span>
        </div>
        
        {data.paymentMethod && (
          <div className="flex justify-between text-sm mt-2">
            <span>Payment Method:</span>
            <span>{data.paymentMethod}</span>
          </div>
        )}
        
        {data.paymentStatus && (
          <div className="flex justify-between text-sm mt-1">
            <span>Payment Status:</span>
            <span>{data.paymentStatus}</span>
          </div>
        )}
        
        {data.amountPaid !== undefined && data.amountPaid > 0 && data.amountPaid < data.total && (
          <>
            <div className="flex justify-between text-sm mt-1">
              <span>Amount Paid:</span>
              <span>€{data.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1 font-bold">
              <span>Remaining:</span>
              <span>€{remainingAmount.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {data.note && (
        <div className="my-2">
          <p className="font-bold">Note:</p>
          <p className="text-sm">{data.note}</p>
        </div>
      )}

      <div className="text-center my-4">
        <QRCodeSVG
          value={JSON.stringify({
            id: data.id,
            number: data.number,
            total: data.total,
            date: data.date,
            type: data.type
          })}
          size={80}
          className="mx-auto"
        />
        <p className="text-xs mt-1">Scan to verify {data.type}</p>
      </div>

      <div className="text-center text-xs mt-4">
        <p>Your satisfaction is our success. Thank you for choosing us!</p>
        <p>This {data.type} serves as proof of service.</p>
        <p>For any questions, please contact us at contact@omegaservices.fr</p>
      </div>
    </div>
  );
}
