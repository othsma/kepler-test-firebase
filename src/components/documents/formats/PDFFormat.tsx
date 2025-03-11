import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { DocumentData } from '../DocumentTypes';

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

export default function PDFFormat({ data }: PDFFormatProps) {
  const getTitle = () => {
    switch (data.type) {
      case 'quote': return 'QUOTE';
      case 'invoice': return 'INVOICE';
      case 'ticket': return 'REPAIR TICKET';
      default: return 'RECEIPT';
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
              <Text>Status:</Text>
              <Text>{data.status}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>
            {data.type === 'ticket' ? 'Client Information:' : 'Bill To:'}
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
            <Text>Walk-in Customer</Text>
          )}
        </View>

        {/* Device information for tickets */}
        {data.type === 'ticket' && data.deviceType && (
          <View style={styles.section}>
            <Text style={styles.bold}>Device Information:</Text>
            <View style={styles.flexRow}>
              <Text>Type:</Text>
              <Text>{data.deviceType}</Text>
            </View>
            {data.brand && (
              <View style={styles.flexRow}>
                <Text>Brand:</Text>
                <Text>{data.brand}</Text>
              </View>
            )}
            {data.model && (
              <View style={styles.flexRow}>
                <Text>Model:</Text>
                <Text>{data.model}</Text>
              </View>
            )}
            {data.passcode && (
              <View style={styles.flexRow}>
                <Text>Passcode:</Text>
                <Text>{data.passcode}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>
              {data.type === 'ticket' ? 'Service' : 'Item'}
            </Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
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
            <Text>Subtotal:</Text>
            <Text>€{data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>Tax (20%):</Text>
            <Text>€{data.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text style={styles.bold}>Total:</Text>
            <Text style={styles.bold}>€{data.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment information */}
        {(data.paymentMethod || data.paymentStatus || data.amountPaid !== undefined) && (
          <View style={styles.section}>
            <Text style={styles.bold}>Payment Information:</Text>
            {data.paymentMethod && (
              <View style={styles.flexRow}>
                <Text>Method:</Text>
                <Text>{data.paymentMethod}</Text>
              </View>
            )}
            {data.paymentStatus && (
              <View style={styles.flexRow}>
                <Text>Status:</Text>
                <Text>{data.paymentStatus}</Text>
              </View>
            )}
            
            {data.amountPaid !== undefined && data.amountPaid > 0 && data.amountPaid < data.total && (
              <>
                <View style={styles.flexRow}>
                  <Text>Amount Paid:</Text>
                  <Text>€{data.amountPaid.toFixed(2)}</Text>
                </View>
                <View style={styles.flexRow}>
                  <Text style={styles.bold}>Remaining Balance:</Text>
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
          <Text>Your satisfaction is our success. Thank you for choosing us!</Text>
          <Text>For any questions regarding this {data.type}, please contact us at contact@omegaservices.fr</Text>
          <Text>O'MEGA SERVICES | 400 Rue nationale, 69400 Villefranche S/S | Tel: 0986608980</Text>
        </View>
      </Page>
    </Document>
  );
}
