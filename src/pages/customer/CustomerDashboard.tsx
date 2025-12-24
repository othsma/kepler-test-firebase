import React, { useEffect } from 'react';
import { Clock, CheckCircle, Wrench, AlertCircle, Smartphone } from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { useCustomerStore } from '../../lib/customerStore';
import { CustomerTicket } from '../../lib/customerStore';
import PushNotificationBanner from '../../components/customer/PushNotificationBanner';

export default function CustomerDashboard() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const {
    profile,
    tickets,
    loading,
    error,
    fetchProfile,
    fetchTickets,
    subscribeToTickets
  } = useCustomerStore();

  useEffect(() => {
    if (profile) {
      fetchTickets();
      const unsubscribe = subscribeToTickets();
      return unsubscribe;
    } else {
      // Fetch profile if not available
      fetchProfile();
    }
  }, [profile, fetchProfile, fetchTickets, subscribeToTickets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in-progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-xl font-semibold">
                {profile?.fullName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">
              Bonjour, {profile?.fullName?.split(' ')[0] || 'Client'}
            </h1>
            <p className="text-indigo-100 mt-1">
              Voici l'état de vos réparations
            </p>
          </div>
        </div>
      </div>

      {/* Push Notification Banner */}
      <PushNotificationBanner />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                En attente
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {tickets.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                En cours
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {tickets.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Terminées
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {tickets.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Tickets List */}
      <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Mes Réparations
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Suivez l'évolution de vos appareils
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {tickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Aucune réparation
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Vous n'avez pas encore de réparation en cours.
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(ticket.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {ticket.deviceType} {ticket.brand} {ticket.model}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>

                      {ticket.issue && (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                          {ticket.issue}
                        </p>
                      )}

                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                        <p>Réparation #{ticket.ticketNumber}</p>
                        <p>Dernière mise à jour: {formatDate(ticket.updatedAt)}</p>
                        {ticket.estimatedCompletion && (
                          <p>Estimation: {formatDate(ticket.estimatedCompletion)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <p className="text-lg font-semibold">{ticket.cost}€</p>
                    {ticket.paymentStatus && (
                      <p className={`text-xs ${
                        ticket.paymentStatus === 'fully_paid' ? 'text-green-600' :
                        ticket.paymentStatus === 'partially_paid' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {ticket.paymentStatus === 'fully_paid' ? 'Payé' :
                         ticket.paymentStatus === 'partially_paid' ? 'Partiellement payé' :
                         'Non payé'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time Update Indicator */}
      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
        🔄 Mises à jour en temps réel activées
      </div>
    </div>
  );
}
