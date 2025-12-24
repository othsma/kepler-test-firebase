import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Bell, Shield, Save } from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { useCustomerStore, CustomerProfile } from '../../lib/customerStore';

export default function CustomerProfilePage() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateNotificationPreferences
  } = useCustomerStore();

  const [formData, setFormData] = useState<Partial<CustomerProfile>>({
    fullName: profile?.fullName || '',
    email: profile?.email || '',
    phoneNumber: profile?.phoneNumber || '',
    preferredLanguage: profile?.preferredLanguage || 'fr',
    notificationPreferences: profile?.notificationPreferences || {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
    }
  });

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        preferredLanguage: profile.preferredLanguage || 'fr',
        notificationPreferences: profile.notificationPreferences || {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
        }
      });
    }
  }, [profile]);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      if (formData.notificationPreferences) {
        await updateNotificationPreferences(formData.notificationPreferences);
      }

      const { notificationPreferences, ...profileData } = formData;
      await updateProfile(profileData);

      setSaveMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Erreur lors de la mise à jour du profil');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences!,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement du profil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Mon Profil
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Gérez vos informations personnelles et préférences
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Informations Personnelles
          </h2>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Success/Error Messages */}
          {saveMessage && (
            <div className={`p-4 rounded-md ${
              saveMessage.includes('succès')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {saveMessage}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nom complet
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Votre nom complet"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Adresse email
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="votre@email.com"
                required
              />
            </div>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Utilisé pour les notifications et la connexion
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Numéro de téléphone
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="tel"
                name="phoneNumber"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="+33 6 XX XX XX XX"
              />
            </div>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Optionnel - pour les notifications SMS
            </p>
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="preferredLanguage" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Langue préférée
            </label>
            <select
              name="preferredLanguage"
              id="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className={`mt-1 block w-full pl-3 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <Bell className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Préférences de notification
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="pushEnabled"
                  name="pushEnabled"
                  type="checkbox"
                  checked={formData.notificationPreferences?.pushEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="pushEnabled" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notifications push
                </label>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recevoir des notifications en temps réel sur votre navigateur
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="emailEnabled"
                  name="emailEnabled"
                  type="checkbox"
                  checked={formData.notificationPreferences?.emailEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="emailEnabled" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notifications par email
                </label>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recevoir des mises à jour détaillées par email
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="smsEnabled"
                  name="smsEnabled"
                  type="checkbox"
                  checked={formData.notificationPreferences?.smsEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={!formData.phoneNumber}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="smsEnabled" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${!formData.phoneNumber ? 'opacity-50' : ''}`}>
                  Notifications SMS
                </label>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {!formData.phoneNumber
                    ? 'Ajoutez un numéro de téléphone pour activer les SMS'
                    : 'Recevoir des alertes importantes par SMS'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
