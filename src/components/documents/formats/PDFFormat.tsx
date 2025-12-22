import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { DocumentData } from '../DocumentTypes';
import { DOCUMENT_TYPE_NAMES, COMPANY_CONFIG } from '../DocumentConfig';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10,
    textAlign: 'center'
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  section: {
    marginBottom: 15
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 5
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 3
  },
  colDescription: {
    width: '60%'
  },
  colQty: {
    width: '15%',
    textAlign: 'right'
  },
  colPrice: {
    width: '25%',
    textAlign: 'right'
  },
  totalSection: {
    marginTop: 15,
    borderTopWidth: 1,
    paddingTop: 10
  },
  bold: {
    fontWeight: 'bold'
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    paddingTop: 10,
    fontSize: 10,
    textAlign: 'center'
  }
});

interface PDFFormatProps {
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
    case 'Paid':
      return ' Payé ';
    default:
      return status;
  }
};

// Translate payment method to French
const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'cash':
      return 'Espèces';
    case 'card':
      return 'Carte bancaire';
    case 'transfer':
      return 'Virement';
    case 'digital':
      return 'Chèque';
    default:
      return method;
  }
};

export default function PDFFormat({ data }: PDFFormatProps) {
  const getTitle = () => {
    switch (data.type) {
      case 'quote': return 'DEVIS';
      case 'invoice': return 'FACTURE';
      case 'ticket': return 'TICKET DE RÉPARATION';
      default: return 'REÇU';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>O'MEGA SERVICES</Text>
          <Text>400 Rue nationale, 69400 Villefranche S/S</Text>
          <Text>Tel: 0986608980 | TVA: FR123456789</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.flexRow}>
            <Text style={styles.bold}>{getTitle()}</Text>
            <Text>#{data.number}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>Date:</Text>
            <Text>{new Date(data.date).toLocaleDateString()}</Text>
          </View>
          {data.status && (
            <View style={styles.flexRow}>
              <Text>Statut:</Text>
              <Text>{data.status}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>
            {data.type === 'ticket' ? 'Informations client:' : 'Facturer à:'}
          </Text>
          {data.customer ? (
            <>
              <Text>{data.customer.name}</Text>
              {data.customer.address && <Text>{data.customer.address}</Text>}
              {data.customer.phone && <Text>Tel: {data.customer.phone}</Text>}
              {data.customer.email && <Text>{data.customer.email}</Text>}
              {data.customer.taxId && <Text>Tax ID: {data.customer.taxId}</Text>}
            </>
          ) : (
            <Text>Client walk-in</Text>
          )}
        </View>

        {/* Device information for tickets */}
        {data.type === 'ticket' && data.deviceType && (
          <View style={styles.section}>
            <Text style={styles.bold}>Caractéristiques de l'appareil:</Text>
            <View style={styles.flexRow}>
              <Text>Type:</Text>
              <Text>{data.deviceType}</Text>
            </View>
            {data.brand && (
              <View style={styles.flexRow}>
                <Text>Marque:</Text>
                <Text>{data.brand}</Text>
              </View>
            )}
            {data.model && (
              <View style={styles.flexRow}>
                <Text>Modèle:</Text>
                <Text>{data.model}</Text>
              </View>
            )}
            {data.imeiSerial && (
              <View style={styles.flexRow}>
                <Text>IMEI/Série:</Text>
                <Text>{data.imeiSerial}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>
              {data.type === 'ticket' ? 'Service' : 'Produit'}
            </Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix</Text>
          </View>

          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>€{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.flexRow}>
            <Text>Prix HT:</Text>
            <Text>€{data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>TVA (20%):</Text>
            <Text>€{data.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text style={styles.bold}>Total TTC:</Text>
            <Text style={styles.bold}>€{data.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment information */}
        {(data.paymentMethod || data.paymentStatus || data.amountPaid !== undefined) && (
          <View style={styles.section}>
            <Text style={styles.bold}>Informations de paiement:</Text>
            {data.paymentMethod && (
              <View style={styles.flexRow}>
                <Text>Méthode:</Text>
                <Text>{getPaymentMethodText(data.paymentMethod)}</Text>
              </View>
            )}
            {data.paymentStatus && (
              <View style={styles.flexRow}>
                <Text>Statut:</Text>
                <Text>{getPaymentStatusText(data.paymentStatus)}</Text>
              </View>
            )}

            {data.amountPaid !== undefined && data.amountPaid > 0 && data.amountPaid < data.total && (
              <>
                <View style={styles.flexRow}>
                  <Text>Montant payé:</Text>
                  <Text>€{data.amountPaid.toFixed(2)}</Text>
                </View>
                <View style={styles.flexRow}>
                  <Text style={styles.bold}>Solde restant:</Text>
                  <Text style={styles.bold}>€{(data.total - data.amountPaid).toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Notes */}
        {data.note && (
          <View style={styles.section}>
            <Text style={styles.bold}>Notes:</Text>
            <Text>{data.note}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Votre satisfaction est notre priorité. Merci pour votre confiance !</Text>
          <Text>Pour toute question concernant ce {DOCUMENT_TYPE_NAMES[data.type].toLowerCase()}, veuillez nous contacter à l'adresse {COMPANY_CONFIG.email}</Text>
          <Text>O'MEGA SERVICES | 400 Rue nationale, 69400 Villefranche S/S | Tel: 0986608980</Text>
        </View>
      </Page>
    </Document>
  );
}
