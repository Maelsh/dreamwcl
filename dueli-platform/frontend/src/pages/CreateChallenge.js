import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const CreateChallenge = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    category: '',
    description: '',
    rules: '',
    prizePool: 100,
    duration: 60,
    difficulty: 'intermediate',
    privacy: 'public',
    opponentRequirements: '',
    evidenceRequired: false,
    timeLimit: 5,
    citationFormat: 'any'
  });

  const categories = [
    { id: 'politics', name: t('challenges.categories.politics'), icon: '🏛️' },
    { id: 'technology', name: t('challenges.categories.technology'), icon: '💻' },
    { id: 'science', name: t('challenges.categories.science'), icon: '🧪' },
    { id: 'philosophy', name: t('challenges.categories.philosophy'), icon: '🤔' },
    { id: 'economics', name: t('challenges.categories.economics'), icon: '💰' },
    { id: 'social', name: t('challenges.categories.social'), icon: '👥' },
    { id: 'environment', name: t('challenges.categories.environment'), icon: '🌱' },
    { id: 'education', name: t('challenges.categories.education'), icon: '📚' },
    { id: 'health', name: t('challenges.categories.health'), icon: '🏥' },
    { id: 'sports', name: t('challenges.categories.sports'), icon: '⚽' },
    { id: 'entertainment', name: t('challenges.categories.entertainment'), icon: '🎬' }
  ];

  const difficulties = [
    { id: 'beginner', name: t('challenges.difficulties.beginner'), color: 'green' },
    { id: 'intermediate', name: t('challenges.difficulties.intermediate'), color: 'blue' },
    { id: 'advanced', name: t('challenges.difficulties.advanced'), color: 'yellow' },
    { id: 'expert', name: t('challenges.difficulties.expert'), color: 'red' }
  ];

  const standardRules = `
DUELI PLATFORM CHALLENGE TERMS AND CONDITIONS

BINDING AGREEMENT: By participating in this challenge, you agree to the following terms:

1. COMPETITOR CONDUCT
   - All arguments must be based on factual evidence
   - No personal attacks or harassment
   - Respectful discourse is mandatory
   - Violations result in immediate disqualification

2. EVIDENCE REQUIREMENTS
   - All claims must be supported by credible sources
   - Citations must be provided when requested
   - Fabricated evidence results in permanent ban
   - Opponent may challenge any unsupported claim

3. TIME LIMITS AND STRUCTURE
   - Opening statements: 3 minutes each
   - Rebuttal period: 2 minutes each
   - Cross-examination: 1 minute each
   - Closing statements: 2 minutes each
   - Overtime results in point deduction

4. JUDGING CRITERIA
   - Argument strength (40%)
   - Evidence quality (30%)
   - Presentation clarity (20%)
   - Rebuttal effectiveness (10%)

5. FINANCIAL TERMS
   - Platform retains 20% of prize pool
   - Winner receives 80% of prize pool
   - Earnings distributed within 24 hours
   - Tax responsibilities lie with competitors

6. TRANSPARENCY REQUIREMENTS
   - All actions are logged and visible
   - Rating changes are immediate
   - Revenue distribution is public
   - Moderator actions are recorded

7. DISPUTE RESOLUTION
   - Moderator decisions are final
   - Appeals must be filed within 1 hour
   - Evidence of misconduct is required
   - False accusations result in penalties

8. INTELLECTUAL PROPERTY
   - Arguments become part of platform content
   - Competitors retain ownership of ideas
   - Platform may use content for promotion
   - Proper attribution will be maintained

9. PRIVACY AND DATA
   - Personal information is encrypted
   - Public profiles show only username and rating
   - Financial data is never shared
   - Activity logs are anonymized

10. TERMINATION
    - Platform reserves right to terminate access
    - Violations result in rating penalties
    - Severe violations result in permanent ban
    - Remaining funds are forfeited

By clicking "Accept & Create Challenge", you acknowledge understanding and agreement to these terms.
  `;

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Set default rules
    setFormData(prev => ({ ...prev, rules: standardRules }));
  }, [currentLanguage]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('You must accept the terms and conditions to create a challenge');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to challenges page
      navigate('/challenges');
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'text-green-400 bg-green-500/20',
      intermediate: 'text-blue-400 bg-blue-500/20',
      advanced: 'text-yellow-400 bg-yellow-500/20',
      expert: 'text-red-400 bg-red-500/20'
    };
    return colors[difficulty] || 'text-gray-400 bg-gray-500/20';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Challenge</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Basic Info</span>
            <span>Details</span>
            <span>Rules</span>
            <span>Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Challenge Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter a compelling title for your challenge"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Topic/Subject *
                      </label>
                      <input
                        type="text"
                        name="topic"
                        value={formData.topic}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g., Climate Change, AI Ethics, Economic Policy"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                          className={`p-3 rounded-lg border transition-colors text-left ${
                            formData.category === category.id
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-2xl mb-1">{category.icon}</div>
                          <div className="text-sm font-medium">{category.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Provide context and background for your challenge..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Challenge Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-6">Challenge Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prize Pool ($)
                      </label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="prizePool"
                          value={formData.prizePool}
                          onChange={handleInputChange}
                          min="10"
                          max="10000"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Platform fee: 20% (${(formData.prizePool * 0.2).toFixed(2)})
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration (minutes)
                      </label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={90}>1.5 hours</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {difficulties.map((difficulty) => (
                        <button
                          key={difficulty.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, difficulty: difficulty.id }))}
                          className={`p-3 rounded-lg border transition-colors ${
                            formData.difficulty === difficulty.id
                              ? `${getDifficultyColor(difficulty.id)} border-current`
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {difficulty.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Privacy
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="privacy"
                          value="public"
                          checked={formData.privacy === 'public'}
                          onChange={handleInputChange}
                          className="text-blue-600"
                        />
                        <span>Public - Anyone can join</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="privacy"
                          value="private"
                          checked={formData.privacy === 'private'}
                          onChange={handleInputChange}
                          className="text-blue-600"
                        />
                        <span>Private - Invite only</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Opponent Requirements
                    </label>
                    <textarea
                      name="opponentRequirements"
                      value={formData.opponentRequirements}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Specify any requirements for your opponent (e.g., minimum rating, specific expertise)"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Rules and Conditions */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-6">Rules and Conditions</h2>
                  
                  <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto border border-gray-600">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {formData.rules}
                    </pre>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="evidenceRequired"
                        checked={formData.evidenceRequired}
                        onChange={handleInputChange}
                        className="text-blue-600"
                      />
                      <label className="text-sm">
                        Require evidence for all factual claims
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Response Time Limit (minutes)
                      </label>
                      <select
                        name="timeLimit"
                        value={formData.timeLimit}
                        onChange={handleInputChange}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value={2}>2 minutes</option>
                        <option value={3}>3 minutes</option>
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Citation Format
                      </label>
                      <select
                        name="citationFormat"
                        value={formData.citationFormat}
                        onChange={handleInputChange}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="any">Any format accepted</option>
                        <option value="academic">Academic (APA, MLA, Chicago)</option>
                        <option value="journalistic">Journalistic standards</option>
                        <option value="legal">Legal citation format</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-6">Review & Confirm</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Challenge Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Title:</span>
                          <span className="ml-2">{formData.title}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Topic:</span>
                          <span className="ml-2">{formData.topic}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Category:</span>
                          <span className="ml-2">{categories.find(c => c.id === formData.category)?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Prize Pool:</span>
                          <span className="ml-2">${formData.prizePool}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Duration:</span>
                          <span className="ml-2">{formData.duration} minutes</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Difficulty:</span>
                          <span className="ml-2 capitalize">{formData.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Financial Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Prize Pool:</span>
                          <span>${formData.prizePool}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee (20%):</span>
                          <span className="text-red-400">-${(formData.prizePool * 0.2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                          <span>Winner Prize (80%):</span>
                          <span className="text-green-400">${(formData.prizePool * 0.8).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Terms and Conditions</h3>
                      <div className="max-h-32 overflow-y-auto text-xs text-gray-300">
                        <p className="mb-2">You have read and agree to the following:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>All competitors must follow platform rules</li>
                          <li>Evidence is required for factual claims</li>
                          <li>Platform retains 20% of prize pool</li>
                          <li>Violations result in immediate disqualification</li>
                          <li>Moderator decisions are final</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="text-blue-600"
                      />
                      <label htmlFor="acceptTerms" className="text-sm">
                        I have read and agree to the Terms and Conditions, Rules, and Financial Agreement *
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span>Previous</span>
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Create Challenge</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallenge;