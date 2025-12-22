import { format } from 'date-fns';
import { DocumentData } from '../DocumentTypes';
import { FORMAT_CONFIGS, COMPANY_CONFIG, DOCUMENT_TYPE_NAMES } from '../DocumentConfig';
import omegalogo from '../../../omegalogo.png';

interface EngagementFormatProps {
  data: DocumentData;
}

export default function EngagementFormat({ data }: EngagementFormatProps) {
  const formatConfig = FORMAT_CONFIGS.a4;
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  // French terms and conditions
  const termsAndConditions = [
    "Je reconnais avoir confié mon appareil à OMEGA SERVICES",
    "J'ai été informé(e) que je dois sauvegarder mes données avant toute intervention",
    "Le client reconnaît avoir été informé que l'intervention peut entraîner la perte de tout ou une partie de ses données et en accepte les conséquences",
    "J'accepte que le diagnostic puisse être payant",
    "Je reconnais que les délais sont indicatifs",
    "Je m'engage à régler la totalité de la prestation avant récupération de l'appareil",
    "Je reconnais la garantie de 3 mois applicable uniquement sur les pièces remplacées",
    "Tout appareil non récupéré sous 30 jours pourra être considéré comme abandonné"
  ];

  return (
    <div
      className={`${formatConfig.styles.container} flex flex-col`}
      style={{ width: formatConfig.width, maxWidth: '100%', minHeight: '100vh' }}
      data-format="a4"
    >
      {/* Fixed Header */}
      <div className={`${formatConfig.styles.header} flex justify-between flex-shrink-0`}>
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
          <h2 className="text-xl font-bold mb-1 text-gray-900">CONTRAT D'ENGAGEMENT CLIENT</h2>
          <p className="text-sm text-gray-600">#{data.number}</p>
          <p className="text-sm text-gray-600">Date: {currentDate}</p>
        </div>
      </div>

      {/* Main Content - This grows to fill available space */}
      <div className="flex-grow py-4">
        {/* Client Information */}
        <div className="mb-6">
          <h3 className="font-bold mb-2 text-gray-900">Informations client:</h3>
          {data.customer ? (
            <>
              <p className="text-gray-800">{data.customer.name}</p>
              {data.customer.address && <p className="text-gray-800">{data.customer.address}</p>}
              {data.customer.phone && <p className="text-gray-800">Tel: {data.customer.phone}</p>}
              {data.customer.email && <p className="text-gray-800">{data.customer.email}</p>}
            </>
          ) : (
            <p className="text-gray-800">Client walk-in</p>
          )}
        </div>

        {/* Device Information - Compact Single Row Table */}
        <div className="mb-4">
          <h3 className="font-bold mb-2 text-gray-900">Appareil confié:</h3>
          <table className="w-full border-collapse border border-gray-300" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-gray-900" style={{ width: '25%' }}>Type</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-gray-900" style={{ width: '25%' }}>Marque</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-gray-900" style={{ width: '25%' }}>Modèle</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-gray-900" style={{ width: '25%' }}>IMEI / Numéro de Série</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 pt-1 pb-2 text-sm text-gray-800" style={{ verticalAlign: 'text-top' }}>{data.deviceType || 'Non spécifié'}</td>
                <td className="border border-gray-300 px-3 pt-1 pb-2 text-sm text-gray-800" style={{ verticalAlign: 'text-top' }}>{data.brand || 'Non spécifiée'}</td>
                <td className="border border-gray-300 px-3 pt-1 pb-2 text-sm text-gray-800" style={{ verticalAlign: 'text-top' }}>{data.model || 'Non spécifié'}</td>
                <td className="border border-gray-300 px-3 pt-1 pb-2 text-sm text-gray-800" style={{ verticalAlign: 'text-top' }}>{data.imeiSerial || 'Non fourni'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Services/Tasks */}
        {data.items && data.items.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-2 text-gray-900">Prestations prévues:</h3>
            <table className="w-full mb-4">
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2 font-medium text-gray-800">{index + 1}. {item.name}</td>
                    <td className="py-2 text-gray-800">{item.description || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cost Estimate */}
        <div className="mb-6">
          <h3 className="font-bold mb-2 text-gray-900">Estimation des coûts:</h3>
          <p className="text-gray-800 font-bold">
            Montant estimé: {data.total ? `€${data.total.toFixed(2)}` : 'À déterminer après diagnostic'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            * Le montant final pourra être différent suite au diagnostic complet de l'appareil
          </p>
        </div>
      </div>

      {/* Fixed Footer - Always at bottom */}
      <div className="flex-shrink-0 mt-auto">
        {/* Terms and Conditions */}
        <div className="mb-6">
          <h3 className="font-bold mb-2 text-gray-900">Conditions de réparation:</h3>
          <div className="space-y-2">
            {termsAndConditions.map((term, index) => (
              <div key={index} className="flex items-start">
                <span className="inline-block w-6 text-sm font-medium text-gray-800 flex-shrink-0">{index + 1}.</span>
                <span className="text-sm text-gray-600 leading-relaxed">{term}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Section */}
        <div className="mb-6 border-t border-gray-300 pt-4">
          <h3 className="font-bold mb-2 text-gray-900 text-center">SIGNATURE DU CLIENT</h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            En signant ce document, le client reconnaît avoir lu et accepté toutes les conditions ci-dessus.
          </p>

          <div className="flex justify-between">
            <div className="w-1/2 pr-4">
              <div className="border border-gray-300 p-4">
                <p className="font-medium text-sm mb-2">Signature du client:</p>
                <div className="border-b border-gray-400 h-8 mb-2"></div>
                <p className="text-xs text-gray-600">Nom: {data.customer?.name || ''}</p>
              </div>
            </div>

            <div className="w-1/2 pl-4">
              <div className="border border-gray-300 p-4">
                <p className="font-medium text-sm mb-2">O'MEGA SERVICES:</p>
                <div className="border-b border-gray-400 h-8 mb-2"></div>
                <p className="text-xs text-gray-600">Date: {currentDate}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center mt-4 italic">
            Ce document fait office de contrat légal entre le client et OMEGA SERVICES
          </p>
        </div>

        <div className={formatConfig.styles.footer}>
          <p>OMEGA SERVICES - Tous droits réservés - Document généré le {currentDate}</p>
        </div>
      </div>
    </div>
  );
}
