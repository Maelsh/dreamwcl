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
  ShieldCheckIcon, 
  PlayIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BellIcon,
  MegaphoneIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChallenges: 0,
    totalPrizePool: 0,
    activeStreams: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'challenge', title: 'New Challenge Available', message: 'Climate Change Debate starting in 30 minutes', time: '5 min ago', read: false },
    { id: 2, type: 'system', title: 'Platform Update', message: 'New transparency features have been added', time: '1 hour ago', read: true },
    { id: 3, type: 'earnings', title: 'Earnings Received', message: 'You received $150 from your last debate', time: '2 hours ago', read: false }
  ]);

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Fetch challenges and stats
    fetchHomeData();
  }, [currentLanguage]);

  const fetchHomeData = async () => {
    try {
      // Simulate API calls
      setTimeout(() => {
        setChallenges([
          {
            id: 1,
            title: t('home.sampleChallenge1'),
            topic: t('home.sampleTopic1'),
            prizePool: 500,
            competitors: 2,
            status: t('home.active'),
            difficulty: t('home.intermediate')
          },
          {
            id: 2,
            title: t('home.sampleChallenge2'),
            topic: t('home.sampleTopic2'),
            prizePool: 300,
            competitors: 2,
            status: t('home.waiting'),
            difficulty: t('home.advanced')
          },
          {
            id: 3,
            title: t('home.sampleChallenge3'),
            topic: t('home.sampleTopic3'),
            prizePool: 750,
            competitors: 2,
            status: t('home.active'),
            difficulty: t('home.expert')
          }
        ]);
        
        setStats({
          totalUsers: 12543,
          totalChallenges: 892,
          totalPrizePool: 45600,
          activeStreams: 12
        });
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
    </motion.div>
  );

  const ChallengeCard = ({ challenge }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{challenge.title}</h3>
          <p className="text-blue-400 text-sm">{challenge.topic}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          challenge.status === t('home.active') 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {challenge.status}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">${challenge.prizePool}</span>
        </div>
        <div className="flex items-center space-x-2">
          <UsersIcon className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">{challenge.competitors} {t('home.competitors')}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs ${
          challenge.difficulty === t('home.expert') 
            ? 'bg-red-500/20 text-red-400'
            : challenge.difficulty === t('home.advanced')
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {challenge.difficulty}
        </span>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {t('home.watch')}
        </button>
      </div>
    </motion.div>
  );

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
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 pt-20 pb-16">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-5xl md:text-6xl font-bold text-white mb-6 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}
            >
              {t('home.heroTitle')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-xl text-gray-300 mb-8 max-w-3xl mx-auto ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}
            >
              {t('home.heroSubtitle')}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/challenges"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <TrophyIcon className="w-5 h-5" />
                <span>{t('home.browseChallenges')}</span>
              </Link>
              <Link
                to="/create-challenge"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors border border-gray-600 flex items-center justify-center space-x-2"
              >
                <PlayIcon className="w-5 h-5" />
                <span>{t('home.createChallenge')}</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Dashboard Quick Actions (for logged in users) */}
      {user && (
        <div className="py-12 bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className={`text-2xl font-bold text-white mb-6 ${
              isRTL(currentLanguage) ? 'text-center' : 'text-left'
            }`}>
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Create New Challenge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => window.location.href = '/create-challenge'}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Create New Challenge</h3>
                    <p className="text-gray-400 text-sm">Start a new debate competition</p>
                  </div>
                </div>
              </motion.div>

              {/* Search Users */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-green-500 transition-colors cursor-pointer"
                onClick={() => window.location.href = '/users'}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <MagnifyingGlassIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Search Users</h3>
                    <p className="text-gray-400 text-sm">Find competitors and experts</p>
                  </div>
                </div>
              </motion.div>

              {/* Live Challenges */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => window.location.href = '/challenges?status=active'}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-600 p-3 rounded-lg">
                    <PlayIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Live Challenges</h3>
                    <p className="text-gray-400 text-sm">Watch active debates</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={UsersIcon}
              label={t('home.totalUsers')}
              value={stats.totalUsers.toLocaleString()}
              color="border-l-4 border-blue-500"
            />
            <StatCard
              icon={TrophyIcon}
              label={t('home.totalChallenges')}
              value={stats.totalChallenges.toLocaleString()}
              color="border-l-4 border-green-500"
            />
            <StatCard
              icon={CurrencyDollarIcon}
              label={t('home.totalPrizePool')}
              value={`$${stats.totalPrizePool.toLocaleString()}`}
              color="border-l-4 border-yellow-500"
            />
            <StatCard
              icon={PlayIcon}
              label={t('home.activeStreams')}
              value={stats.activeStreams.toString()}
              color="border-l-4 border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold text-white mb-4 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('home.whyChooseDueli')}
            </h2>
            <p className={`text-gray-400 max-w-2xl mx-auto ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('home.whyChooseDueliDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center p-6"
            >
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold text-white mb-2 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('home.transparentSystem')}
              </h3>
              <p className={`text-gray-400 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('home.transparentSystemDesc')}
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center p-6"
            >
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold text-white mb-2 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('home.realTimeDebate')}
              </h3>
              <p className={`text-gray-400 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('home.realTimeDebateDesc')}
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center p-6"
            >
              <div className="bg-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-semibold text-white mb-2 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('home.fairCompetition')}
              </h3>
              <p className={`text-gray-400 ${
                isRTL(currentLanguage) ? 'text-center' : ''
              }`}>
                {t('home.fairCompetitionDesc')}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Active Challenges Section */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-3xl font-bold text-white ${
              isRTL(currentLanguage) ? 'text-right' : 'text-left'
            }`}>
              {t('home.activeChallenges')}
            </h2>
            <Link
              to="/challenges"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {t('home.viewAll')} →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl font-bold text-white mb-4 ${
            isRTL(currentLanguage) ? 'text-center' : ''
          }`}>
            {t('home.readyToDebate')}
          </h2>
          <p className={`text-xl text-blue-100 mb-8 ${
            isRTL(currentLanguage) ? 'text-center' : ''
          }`}>
            {t('home.readyToDebateDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={user ? "/create-challenge" : "/register"}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {t('home.getStarted')}
            </Link>
            <Link
              to="/how-it-works"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              {t('home.learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;