import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Smartphone, ArrowLeft } from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { useCustomerStore } from '../../lib/customerStore';
import { registerCustomer, db } from '../../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';

export default function CustomerRegister() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { setUser, setError } = useCustomerStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    customerCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setLocalError] = useState('');
  const [ticketInfo, setTicketInfo] = useState<any>(null);

  // Pre-fill form with URL parameters and client data
  useEffect(() => {
    const prefillForm = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ticketId = urlParams.get('ticket');
      const emailParam = urlParams.get('email');

      if (ticketId) {
        try {
          // Fetch ticket data to get client information
          const ticketRef = doc(db, 'tickets', ticketId);
          const ticketSnap = await getDoc(ticketRef);

          if (ticketSnap.exists()) {
            const ticketData = ticketSnap.data();
            const clientId = ticketData?.clientId;

            if (clientId) {
              try {
                // Use Cloud Function to get client data securely
                const functions = getFunctions();
                const getClientForRegistration = httpsCallable(functions, 'getClientForRegistration');

                const result = await getClientForRegistration({ ticketId });
                const clientData = result.data as any;

                // Pre-fill form with client data
                const newFormData = {
                  fullName: clientData?.name || '',
                  email: emailParam || clientData?.email || '',
                  phoneNumber: clientData?.phone || '',
                  customerCode: clientData?.customerCode || '',
                  password: '', // Keep password empty
                  confirmPassword: '' // Keep confirm password empty
                };

                setFormData(newFormData);
              } catch (cloudFunctionError: any) {
                // Fallback: pre-fill with email only if Cloud Function fails
                if (emailParam) {
                  setFormData(prev => ({
                    ...prev,
                    email: emailParam
                  }));
                }
              }
            }
          }
        } catch (error) {
          // Silent error handling - don't expose internal errors to users
        }
      } else if (emailParam) {
        // If no ticket ID but email provided, just pre-fill email
        setFormData(prev => ({
          ...prev,
          email: emailParam
        }));
      }
    };

    prefillForm();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const result = await registerCustomer(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phoneNumber,
        formData.customerCode || undefined
      );

      if (result.success && result.user) {
        setUser(result.user);
        navigate('/customer');
      } else {
        setLocalError(result.error || 'Erreur d\'inscription');
      }
    } catch (error) {
      setLocalError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Convert customer code to uppercase
    const processedValue = name === 'customerCode' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className={`inline-flex items-center text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>

          <div className="mt-6 flex justify-center">
            <div className="flex items-center">
              <Smartphone className="h-12 w-12 text-indigo-600" />
              <span className={`ml-3 text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                O'MEGA Services
              </span>
            </div>
          </div>

          <h2 className={`mt-6 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Inscription Client
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Créez votre compte pour suivre vos réparations
          </p>
        </div>

        {/* Form */}
        <form className={`mt-8 space-y-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-8 px-6 shadow rounded-lg`} onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Numéro de téléphone
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="+33 6 XX XX XX XX"
              />
            </div>

            <div>
              <label htmlFor="customerCode" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Code d'accès client (optionnel)
              </label>
              <input
                id="customerCode"
                name="customerCode"
                type="text"
                value={formData.customerCode}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Entrez votre code d'accès"
                maxLength={6}
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Si vous avez reçu un code d'accès de l'administrateur
              </p>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Au moins 6 caractères"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirmer le mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Confirmer votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </div>

          <div className="text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Déjà un compte ?{' '}
              <Link to="/customer/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
