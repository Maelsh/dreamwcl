import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, CheckIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const { t } = useTranslation();
  const { register, user } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    country: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const countries = [
    { code: 'US', name: t('register.countries.us') },
    { code: 'UK', name: t('register.countries.uk') },
    { code: 'CA', name: t('register.countries.ca') },
    { code: 'AU', name: t('register.countries.au') },
    { code: 'DE', name: t('register.countries.de') },
    { code: 'FR', name: t('register.countries.fr') },
    { code: 'ES', name: t('register.countries.es') },
    { code: 'IT', name: t('register.countries.it') },
    { code: 'JP', name: t('register.countries.jp') },
    { code: 'CN', name: t('register.countries.cn') },
    { code: 'IN', name: t('register.countries.in') },
    { code: 'BR', name: t('register.countries.br') },
    { code: 'MX', name: t('register.countries.mx') },
    { code: 'RU', name: t('register.countries.ru') },
    { code: 'SA', name: t('register.countries.sa') },
    { code: 'AE', name: t('register.countries.ae') },
    { code: 'EG', name: t('register.countries.eg') },
    { code: 'MA', name: t('register.countries.ma') },
    { code: 'TN', name: t('register.countries.tn') },
    { code: 'DZ', name: t('register.countries.dz') }
  ];

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate, currentLanguage]);

  useEffect(() => {
    // Calculate password strength
    const password = formData.password;
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    setPasswordCriteria(criteria);
    const strength = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError(t('register.weakPassword'));
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError(t('register.acceptTermsRequired'));
      setLoading(false);
      return;
    }

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        username: formData.username,
        country: formData.country
      });
      
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || t('register.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return t('register.weak');
    if (passwordStrength <= 3) return t('register.medium');
    return t('register.strong');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <ShieldCheckIcon className="w-12 h-12 text-blue-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mt-6 text-center text-3xl font-bold text-white ${
            isRTL(currentLanguage) ? 'text-center' : ''
          }`}
        >
          {t('register.createAccount')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-2 text-center text-sm text-gray-400 ${
            isRTL(currentLanguage) ? 'text-center' : ''
          }`}
        >
          {t('register.joinDueli')}
        </motion.p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-700"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/20 border border-red-500/30 rounded-md p-4"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <div>
              <label 
                htmlFor="fullName" 
                className={`block text-sm font-medium text-gray-300 mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}
              >
                {t('register.fullName')}
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('register.fullNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="username" 
                className={`block text-sm font-medium text-gray-300 mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}
              >
                {t('register.username')}
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('register.usernamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="email" 
                className={`block text-sm font-medium text-gray-300 mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}
              >
                {t('register.emailAddress')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="country" 
                className={`block text-sm font-medium text-gray-300 mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}
              >
                {t('register.country')}
              </label>
              <div className="mt-1">
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">{t('register.selectCountry')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label 
                htmlFor="password" 
                className={`block text-sm font-medium text-gray-300 mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}
              >
                {t('register.password')}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('register.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {t('register.passwordStrength')}
                    </span>
                    <span className={`text-xs ${
                      passwordStrength <= 1 ? 'text-red-400' :
                      passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center ${
                      passwordCriteria.length ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      <CheckIcon className="w-3 h-3 mr-1" />
                      {t('register.minLength')}
                    </div>
                    <div className={`flex items-center ${
                      passwordCriteria.uppercase ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      <CheckIcon className="w-3 h-3 mr-1" />
                      {t('register.uppercase')}
                    </div>
                    <div className={`flex items-center ${
                      passwordCriteria.lowercase ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      <CheckIcon className="w-3 h-3 mr-1" />
                      {t('register.lowercase')}
                    </div>
                    <div className={`flex items-center ${
                      passwordCriteria.number ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      <CheckIcon className="w-3 h-3 mr-1" />
                      {t('register.number')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className={`block text-sm font-medium text-gray-300 mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}
              >
                {t('register.confirmPassword')}
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
                />
              </div>
              <div className={`ml-3 text-sm ${
                isRTL(currentLanguage) ? 'mr-3' : 'ml-3'
              }`}>
                <label htmlFor="acceptTerms" className="font-medium text-gray-300">
                  {t('register.acceptTerms')}{' '}
                  <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                    {t('register.termsOfService')}
                  </Link>{' '}
                  {t('register.and')}{' '}
                  <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                    {t('register.privacyPolicy')}
                  </Link>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !formData.acceptTerms}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('register.creatingAccount')}
                  </div>
                ) : (
                  t('register.createAccount')
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">
                {t('register.alreadyHaveAccount')}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-400 bg-gray-800 hover:bg-gray-700 border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors"
            >
              {t('register.signIn')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;