import React, { useState, useEffect, useMemo } from 'react';
import { useThemeStore, useQuotesStore, useClientsStore } from '../lib/store';
import { Search, Plus, Eye, Edit, Trash2, Download, Mail, CheckCircle, XCircle, Clock, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertQuoteToDocument } from '../components/documents/DocumentConverter';
import QuoteEditModal from '../components/QuoteEditModal';

export default function Quotes() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { quotes, loading, error, fetchQuotes, updateQuote, updateQuoteStatus, convertQuoteToSale } = useQuotesStore();
  const { clients } = useClientsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = newest first
  const [showQuoteViewer, setShowQuoteViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [editingQuote, setEditingQuote] = useState<any>(null);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Filter and sort quotes based on search, status, and sort order
  const filteredQuotes = useMemo(() => {
    let filtered = quotes.filter((quote) => {
      const matchesSearch = searchQuery === '' ||
        quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quote.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [quotes, searchQuery, statusFilter, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'sent': return <Mail className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: any) => {
    try {
      await updateQuoteStatus(quoteId, newStatus);
      // Refresh quotes after status update
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote status:', error);
      alert('Erreur lors de la mise à jour du statut du devis');
    }
  };

  const handleConvertToSale = async (quoteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir convertir ce devis en vente ? Cette action est irréversible.')) {
      return;
    }

    try {
      const saleId = await convertQuoteToSale(quoteId);
      alert(`Devis converti en vente avec succès! Numéro de vente: ${saleId}`);
      fetchQuotes(); // Refresh quotes
    } catch (error) {
      console.error('Error converting quote to sale:', error);
      alert('Erreur lors de la conversion du devis en vente');
    }
  };

  const viewQuote = (quote: any) => {
    setSelectedQuote(quote);
    setShowQuoteViewer(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Gestion des Devis
        </h1>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredQuotes.length} devis
          </span>
        </div>
      </div>

      {/* Quote Viewer Modal */}
      {showQuoteViewer && selectedQuote && (
        <UnifiedDocument
          data={convertQuoteToDocument(selectedQuote)}
          onClose={() => {
            setShowQuoteViewer(false);
            setSelectedQuote(null);
          }}
          initialFormat="a4"
        />
      )}

      {/* Edit Quote Modal */}
      {showEditModal && editingQuote && (
        <QuoteEditModal
          quote={editingQuote}
          clients={clients}
          onClose={() => {
            setShowEditModal(false);
            setEditingQuote(null);
          }}
          onSave={async (updatedQuote) => {
            console.log('=== QUOTE SAVE START ===');
            console.log('Original updatedQuote:', updatedQuote);

            try {
              // Remove id from the update data since it's passed separately
              const { id, ...quoteData } = updatedQuote;

              // Filter out undefined values to prevent Firestore errors
              const cleanQuoteData = Object.fromEntries(
                Object.entries(quoteData).filter(([_, value]) => value !== undefined)
              );

              console.log('Quote ID:', id);
              console.log('Original quote data:', quoteData);
              console.log('Clean quote data:', cleanQuoteData);

              console.log('Calling updateQuote...');
              await updateQuote(id, cleanQuoteData);
              console.log('updateQuote completed successfully');

              alert('Devis mis à jour avec succès!');
              setShowEditModal(false);
              setEditingQuote(null);
              fetchQuotes(); // Refresh quotes
            } catch (error) {
              console.error('=== QUOTE SAVE ERROR ===');
              console.error('Error updating quote:', error);
              alert('Erreur lors de la mise à jour du devis');
            }
          }}
        />
      )}

      {/* Filters */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro de devis, client, produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent border-0 focus:ring-0 ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          {/* Status Filter and Sort */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Statut:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">Tous</option>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyé</option>
                <option value="accepted">Accepté</option>
                <option value="rejected">Rejeté</option>
                <option value="expired">Expiré</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={`Trier par date (${sortOrder === 'desc' ? 'Plus récent d\'abord' : 'Plus ancien d\'abord'})`}
            >
              {sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              <span className="text-sm">Date {sortOrder === 'desc' ? '↓' : '↑'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden`}>
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {quotes.length === 0 ? 'Aucun devis trouvé.' : 'Aucun devis ne correspond à vos filtres.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Devis
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Client
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Statut
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Total
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Validité
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {quote.quoteNumber}
                      <br />
                      <span className="text-xs text-gray-500">
                        {format(new Date(quote.createdAt), 'dd/MM/yyyy')}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {quote.customer?.name || 'Client sans rendez-vous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        {quote.status === 'draft' ? 'Brouillon' :
                         quote.status === 'sent' ? 'Envoyé' :
                         quote.status === 'accepted' ? 'Accepté' :
                         quote.status === 'rejected' ? 'Rejeté' :
                         quote.status === 'expired' ? 'Expiré' : quote.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      €{quote.total.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {format(new Date(quote.validUntil), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {/* View Quote */}
                        <button
                          onClick={() => viewQuote(quote)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Voir le devis"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Quote - Only for draft and sent quotes */}
                        {(quote.status === 'draft' || quote.status === 'sent') && (
                          <button
                            onClick={() => {
                              setEditingQuote({...quote});
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier le devis"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        {/* Status Actions */}
                        {quote.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'sent')}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Marquer comme envoyé"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}

                        {quote.status === 'sent' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(quote.id, 'accepted')}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Accepter le devis"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(quote.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Rejeter le devis"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {/* Convert to Sale */}
                        {quote.status === 'accepted' && !quote.convertedToSaleId && (
                          <button
                            onClick={() => handleConvertToSale(quote.id)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Convertir en vente"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}

                        {/* Show converted sale ID */}
                        {quote.convertedToSaleId && (
                          <span className="text-xs text-green-600 font-medium">
                            → Vente #{quote.convertedToSaleId.slice(-6)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
