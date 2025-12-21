import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../lib/store';
import { resetPassword } from '../lib/firebase';
import { Wrench, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Échec de l\'envoi de l\'email de réinitialisation. Veuillez réessayer.');
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur inattendue s\'est produite');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <Wrench className="h-10 w-10 text-indigo-600" />
            <span className="ml-2 text-2xl font-bold">O'MEGA SERVICES</span>
          </div>
        </div>
        
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Réinitialisez votre mot de passe
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Email de réinitialisation envoyé. Veuillez vérifier votre boîte de réception.</span>
          </div>
        )}
        
        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
