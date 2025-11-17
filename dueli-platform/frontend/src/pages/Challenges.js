import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  TagIcon,
  FilterIcon,
  SearchIcon,
  PlayIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const Challenges = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: t('challenges.allCategories') },
    { id: 'politics', name: t('challenges.categories.politics') },
    { id: 'technology', name: t('challenges.categories.technology') },
    { id: 'science', name: t('challenges.categories.science') },
    { id: 'philosophy', name: t('challenges.categories.philosophy') },
    { id: 'economics', name: t('challenges.categories.economics') },
    { id: 'social', name: t('challenges.categories.social') },
    { id: 'environment', name: t('challenges.categories.environment') },
    { id: 'education', name: t('challenges.categories.education') },
    { id: 'health', name: t('challenges.categories.health') },
    { id: 'sports', name: t('challenges.categories.sports') },
    { id: 'entertainment', name: t('challenges.categories.entertainment') }
  ];

  const difficulties = [
    { id: 'all', name: t('challenges.allDifficulties') },
    { id: 'beginner', name: t('challenges.difficulties.beginner') },
    { id: 'intermediate', name: t('challenges.difficulties.intermediate') },
    { id: 'advanced', name: t('challenges.difficulties.advanced') },
    { id: 'expert', name: t('challenges.difficulties.expert') }
  ];

  const statuses = [
    { id: 'all', name: t('challenges.allStatuses') },
    { id: 'waiting', name: t('challenges.statuses.waiting') },
    { id: 'active', name: t('challenges.statuses.active') },
    { id: 'completed', name: t('challenges.statuses.completed') },
    { id: 'cancelled', name: t('challenges.statuses.cancelled') }
  ];

  const sortOptions = [
    { id: 'newest', name: t('challenges.sort.newest') },
    { id: 'oldest', name: t('challenges.sort.oldest') },
    { id: 'prize-high', name: t('challenges.sort.prizeHigh') },
    { id: 'prize-low', name: t('challenges.sort.prizeLow') },
    { id: 'participants-high', name: t('challenges.sort.participantsHigh') },
    { id: 'participants-low', name: t('challenges.sort.participantsLow') }
  ];

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Fetch challenges
    fetchChallenges();
  }, [currentLanguage]);

  useEffect(() => {
    filterAndSortChallenges();
  }, [challenges, searchTerm, selectedCategory, selectedDifficulty, selectedStatus, sortBy]);

  const fetchChallenges = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockChallenges = [
          {
            id: 1,
            title: t('challenges.sampleChallenge1'),
            topic: t('challenges.sampleTopic1'),
            category: 'politics',
            prizePool: 500,
            difficulty: 'intermediate',
            status: 'active',
            participants: 2,
            maxParticipants: 2,
            startTime: new Date(Date.now() - 3600000),
            endTime: new Date(Date.now() + 7200000),
            creator: 'John Doe',
            rating: 4.5,
            thumbnail: '/api/placeholder/300/200'
          },
          {
            id: 2,
            title: t('challenges.sampleChallenge2'),
            topic: t('challenges.sampleTopic2'),
            category: 'technology',
            prizePool: 300,
            difficulty: 'advanced',
            status: 'waiting',
            participants: 1,
            maxParticipants: 2,
            startTime: new Date(Date.now() + 3600000),
            endTime: new Date(Date.now() + 10800000),
            creator: 'Jane Smith',
            rating: 4.8,
            thumbnail: '/api/placeholder/300/200'
          },
          {
            id: 3,
            title: t('challenges.sampleChallenge3'),
            topic: t('challenges.sampleTopic3'),
            category: 'science',
            prizePool: 750,
            difficulty: 'expert',
            status: 'active',
            participants: 2,
            maxParticipants: 2,
            startTime: new Date(Date.now() - 7200000),
            endTime: new Date(Date.now() + 3600000),
            creator: 'Mike Johnson',
            rating: 4.2,
            thumbnail: '/api/placeholder/300/200'
          },
          {
            id: 4,
            title: t('challenges.sampleChallenge4'),
            topic: t('challenges.sampleTopic4'),
            category: 'philosophy',
            prizePool: 200,
            difficulty: 'beginner',
            status: 'completed',
            participants: 2,
            maxParticipants: 2,
            startTime: new Date(Date.now() - 86400000),
            endTime: new Date(Date.now() - 82800000),
            creator: 'Sarah Williams',
            rating: 4.7,
            thumbnail: '/api/placeholder/300/200'
          },
          {
            id: 5,
            title: t('challenges.sampleChallenge5'),
            topic: t('challenges.sampleTopic5'),
            category: 'economics',
            prizePool: 1000,
            difficulty: 'advanced',
            status: 'waiting',
            participants: 0,
            maxParticipants: 2,
            startTime: new Date(Date.now() + 7200000),
            endTime: new Date(Date.now() + 14400000),
            creator: 'David Brown',
            rating: 4.9,
            thumbnail: '/api/placeholder/300/200'
          },
          {
            id: 6,
            title: t('challenges.sampleChallenge6'),
            topic: t('challenges.sampleTopic6'),
            category: 'social',
            prizePool: 400,
            difficulty: 'intermediate',
            status: 'active',
            participants: 2,
            maxParticipants: 2,
            startTime: new Date(Date.now() - 1800000),
            endTime: new Date(Date.now() + 5400000),
            creator: 'Lisa Davis',
            rating: 4.3,
            thumbnail: '/api/placeholder/300/200'
          }
        ];
        
        setChallenges(mockChallenges);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setLoading(false);
    }
  };

  const filterAndSortChallenges = () => {
    let filtered = [...challenges];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(challenge => 
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.creator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(challenge => challenge.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(challenge => challenge.difficulty === selectedDifficulty);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(challenge => challenge.status === selectedStatus);
    }

    // Sort challenges
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.startTime) - new Date(a.startTime);
        case 'oldest':
          return new Date(a.startTime) - new Date(b.startTime);
        case 'prize-high':
          return b.prizePool - a.prizePool;
        case 'prize-low':
          return a.prizePool - b.prizePool;
        case 'participants-high':
          return b.participants - a.participants;
        case 'participants-low':
          return a.participants - b.participants;
        default:
          return 0;
      }
    });

    setFilteredChallenges(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'waiting':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400';
      case 'intermediate':
        return 'bg-blue-500/20 text-blue-400';
      case 'advanced':
        return 'bg-orange-500/20 text-orange-400';
      case 'expert':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const ChallengeCard = ({ challenge }) => {
    const timeRemaining = challenge.status === 'active' 
      ? Math.max(0, new Date(challenge.endTime) - new Date())
      : challenge.status === 'waiting'
      ? Math.max(0, new Date(challenge.startTime) - new Date())
      : 0;

    const formatTime = (ms) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300"
      >
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 h-48 flex items-center justify-center">
            <TrophyIcon className="w-16 h-16 text-white opacity-50" />
          </div>
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
              {t(`challenges.statuses.${challenge.status}`)}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
              {t(`challenges.difficulties.${challenge.difficulty}`)}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h3 className={`text-lg font-semibold text-white mb-2 ${
            isRTL(currentLanguage) ? 'text-right' : 'text-left'
          }`}>
            {challenge.title}
          </h3>
          <p className={`text-sm text-gray-400 mb-4 ${
            isRTL(currentLanguage) ? 'text-right' : 'text-left'
          }`}>
            {challenge.topic}
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">
                  ${challenge.prizePool}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">
                  {challenge.participants}/{challenge.maxParticipants}
                </span>
              </div>
            </div>

            {challenge.status === 'active' && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">
                  {t('challenges.endsIn')}: {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            {challenge.status === 'waiting' && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  {t('challenges.startsIn')}: {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            <div className={`text-xs text-gray-500 ${
              isRTL(currentLanguage) ? 'text-right' : 'text-left'
            }`}>
              {t('challenges.createdBy')}: {challenge.creator}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TagIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 capitalize">
                {t(`challenges.categories.${challenge.category}`)}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Link
                to={`/challenges/${challenge.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <EyeIcon className="w-4 h-4" />
                <span>{t('challenges.view')}</span>
              </Link>
              
              {challenge.status === 'waiting' && challenge.participants < challenge.maxParticipants && (
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1">
                  <PlayIcon className="w-4 h-4" />
                  <span>{t('challenges.join')}</span>
                </button>
              )}
              
              {challenge.status === 'active' && (
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1">
                  <PlayIcon className="w-4 h-4" />
                  <span>{t('challenges.watch')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold text-white mb-2 ${
              isRTL(currentLanguage) ? 'text-center md:text-right' : 'text-center md:text-left'
            }`}>
              {t('challenges.title')}
            </h1>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center md:text-right' : 'text-center md:text-left'
            }`}>
              {t('challenges.subtitle')}
            </p>
          </div>
          
          {user && (
            <Link
              to="/create-challenge"
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('challenges.createChallenge')}</span>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 lg:mr-4">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('challenges.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors lg:hidden"
            >
              <FilterIcon className="w-5 h-5" />
              <span>{t('challenges.filters')}</span>
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-600 lg:hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map((difficulty) => (
                      <option key={difficulty.id} value={difficulty.id}>
                        {difficulty.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className={`text-gray-400 ${
            isRTL(currentLanguage) ? 'text-right' : 'text-left'
          }`}>
            {t('challenges.showingResults', { count: filteredChallenges.length })}
          </p>
        </div>

        {/* Challenges Grid */}
        <AnimatePresence mode="wait">
          {filteredChallenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <TrophyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className={`text-xl font-semibold text-white mb-2 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('challenges.noChallengesFound')}
              </h3>
              <p className={`text-gray-400 mb-6 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('challenges.tryDifferentFilters')}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSelectedStatus('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {t('challenges.clearFilters')}
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Challenges;