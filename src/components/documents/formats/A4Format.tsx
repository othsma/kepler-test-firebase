import { format } from 'date-fns';
import { DocumentData } from '../DocumentTypes';
import { FORMAT_CONFIGS, COMPANY_CONFIG, VAT_CONFIG, TERMS_CONFIG, DOCUMENT_TYPE_NAMES } from '../DocumentConfig';
import omegalogo from '../../../omegalogo.png';

interface A4FormatProps {
  data: DocumentData;
}

export default function A4Format({ data }: A4FormatProps) {
  const formatConfig = FORMAT_CONFIGS.a4;
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
    <div
      className={formatConfig.styles.container}
      style={{ width: formatConfig.width, maxWidth: '100%' }}
      data-format="a4"
    >
      <div className={`${formatConfig.styles.header} flex justify-between`}>
        {formatConfig.showLogo && (
          <div className="flex items-center">
            <div className="mr-4">
              <img
                src={omegalogo}
                alt={`${COMPANY_CONFIG.name} Logo`}
                className="h-12 w-auto"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">{COMPANY_CONFIG.name}</h1>
              <p className="text-sm text-gray-600">{COMPANY_CONFIG.address}</p>
              <p className="text-sm text-gray-600">Tel: {COMPANY_CONFIG.phone}</p>
              <p className="text-sm text-gray-600">Email: {COMPANY_CONFIG.email}</p>
              <p className="text-sm text-gray-600">TVA: {COMPANY_CONFIG.taxId}</p>
            </div>
          </div>
        )}
        <div className="text-right">
          <h2 className="text-xl font-bold mb-1 text-gray-900">{getTitle()}</h2>
          <p className="text-sm text-gray-600">#{data.number}</p>
          <p className="text-sm text-gray-600">Date: {format(new Date(data.date), 'dd/MM/yyyy')}</p>
          <p className="text-sm text-gray-600">Time: {format(new Date(data.date), 'HH:mm')}</p>
          {data.status && (
            <p className="text-sm text-gray-600">Status: {data.status}</p>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="font-bold mb-2 text-gray-900">
          {data.type === 'ticket' ? 'Client Information:' : 'Bill To:'}
        </h3>
        {data.customer ? (
          <>
            <p className="text-gray-800">{data.customer.name}</p>
            {data.customer.address && <p className="text-gray-800">{data.customer.address}</p>}
            {data.customer.phone && <p className="text-gray-800">Tel: {data.customer.phone}</p>}
            {data.customer.email && <p className="text-gray-800">{data.customer.email}</p>}
            {data.customer.taxId && (
              <p className="text-gray-800">Tax ID: {data.customer.taxId}</p>
            )}
          </>
        ) : (
          <p className="text-gray-800">Walk-in Customer</p>
        )}
      </div>
      
      {/* Device information for tickets */}
      {data.type === 'ticket' && data.deviceType && (
        <div className="mb-8">
          <h3 className="font-bold mb-2 text-gray-900">Device Information:</h3>
          <table className="w-full mb-4">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-800">Type:</td>
                <td className="py-2 text-gray-800">{data.deviceType}</td>
              </tr>
              {data.brand && (
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium text-gray-800">Brand:</td>
                  <td className="py-2 text-gray-800">{data.brand}</td>
                </tr>
              )}
              {data.model && (
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium text-gray-800">Model:</td>
                  <td className="py-2 text-gray-800">{data.model}</td>
                </tr>
              )}
              {data.passcode && (
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium text-gray-800">Passcode:</td>
                  <td className="py-2 text-gray-800">{data.passcode}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 text-gray-900">
              {data.type === 'ticket' ? 'Service' : 'Item'}
            </th>
            <th className="text-center py-2 text-gray-900">Quantity</th>
            <th className="text-right py-2 text-gray-900">Unit Price</th>
            <th className="text-right py-2 text-gray-900">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3 text-gray-800">
                <p className="font-medium">{item.name}</p>
                {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                {item.sku && <p className="text-sm text-gray-600">{item.sku}</p>}
              </td>
              <td className="text-center py-3 text-gray-800">{item.quantity}</td>
              <td className="text-right py-3 text-gray-800">€{item.price.toFixed(2)}</td>
              <td className="text-right py-3 text-gray-800">€{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="text-right py-2 font-medium text-gray-800">Subtotal</td>
            <td className="text-right py-2 text-gray-800">€{data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="text-right py-2 font-medium text-gray-800">VAT (20%)</td>
            <td className="text-right py-2 text-gray-800">€{data.tax.toFixed(2)}</td>
          </tr>
          <tr className="border-t border-gray-300">
            <td colSpan={3} className="text-right py-2 font-bold text-gray-900">Total</td>
            <td className="text-right py-2 font-bold text-gray-900">€{data.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      {/* Payment information */}
      {(data.paymentMethod || data.paymentStatus || data.amountPaid !== undefined) && (
        <div className="mb-8">
          <h3 className="font-bold mb-2 text-gray-900">Payment Information:</h3>
          {data.paymentMethod && <p className="text-gray-800">Method: {data.paymentMethod}</p>}
          {data.paymentStatus && <p className="text-gray-800">Status: {data.paymentStatus}</p>}
          
          {data.amountPaid !== undefined && data.amountPaid > 0 && data.amountPaid < data.total && (
            <>
              <p className="text-gray-800">Amount Paid: €{data.amountPaid.toFixed(2)}</p>
              <p className="text-gray-800 font-bold">Remaining Balance: €{remainingAmount.toFixed(2)}</p>
            </>
          )}
        </div>
      )}
      
      {/* Notes */}
      {data.note && (
        <div className="mb-8">
          <h3 className="font-bold mb-2 text-gray-900">Notes:</h3>
          <p className="text-gray-800">{data.note}</p>
        </div>
      )}
      
      {formatConfig.showTerms && (
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="font-bold mb-2 text-gray-900">Terms and Conditions:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 pl-4">
              {TERMS_CONFIG[data.type].map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ol>
          </div>
          {/* QR code disabled for debugging
          <div className="text-center">
            <QRCodeSVG
              value={JSON.stringify({
                id: data.id,
                number: data.number,
                total: data.total,
                date: data.date,
                type: data.type,
                business: "O'MEGA SERVICES",
                taxId: "FR123456789"
              })}
              size={100}
            />
            <p className="text-xs text-gray-600 mt-1">Scan to verify {data.type}</p>
          </div>
          */}
        </div>
      )}
      
      <div className={formatConfig.styles.footer}>
        <p>Your satisfaction is our success. Thank you for choosing us!</p>
        <p>For any questions regarding this {DOCUMENT_TYPE_NAMES[data.type].toLowerCase()}, please contact us at {COMPANY_CONFIG.email}</p>
      </div>
    </div>
  );
}
