import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  TrophyIcon, 
  CurrencyDollarIcon, 
  StarIcon,
  CalendarIcon,
  ChartBarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingField, setEditingField] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalChallenges: 0,
    wins: 0,
    losses: 0,
    totalEarnings: 0,
    currentRating: 0,
    bestRating: 0,
    winStreak: 0,
    rank: 0
  });
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const tabs = [
    { id: 'overview', name: t('profile.overview'), icon: UserIcon },
    { id: 'challenges', name: t('profile.challenges'), icon: TrophyIcon },
    { id: 'earnings', name: t('profile.earnings'), icon: CurrencyDollarIcon },
    { id: 'achievements', name: t('profile.achievements'), icon: StarIcon }
  ];

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Fetch user data
    fetchUserData();
  }, [currentLanguage, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      setTimeout(() => {
        setUserStats({
          totalChallenges: 47,
          wins: 32,
          losses: 15,
          totalEarnings: 2840,
          currentRating: 1750,
          bestRating: 1920,
          winStreak: 5,
          rank: 127
        });

        setRecentChallenges([
          {
            id: 1,
            title: t('profile.sampleChallenge1'),
            result: 'win',
            prize: 150,
            date: new Date(Date.now() - 86400000),
            opponent: 'Alex Johnson',
            topic: t('profile.sampleTopic1')
          },
          {
            id: 2,
            title: t('profile.sampleChallenge2'),
            result: 'win',
            prize: 200,
            date: new Date(Date.now() - 172800000),
            opponent: 'Sarah Williams',
            topic: t('profile.sampleTopic2')
          },
          {
            id: 3,
            title: t('profile.sampleChallenge3'),
            result: 'loss',
            prize: 0,
            date: new Date(Date.now() - 259200000),
            opponent: 'Mike Chen',
            topic: t('profile.sampleTopic3')
          },
          {
            id: 4,
            title: t('profile.sampleChallenge4'),
            result: 'win',
            prize: 300,
            date: new Date(Date.now() - 345600000),
            opponent: 'Emma Davis',
            topic: t('profile.sampleTopic4')
          },
          {
            id: 5,
            title: t('profile.sampleChallenge5'),
            result: 'win',
            prize: 180,
            date: new Date(Date.now() - 432000000),
            opponent: 'David Wilson',
            topic: t('profile.sampleTopic5')
          }
        ]);

        setAchievements([
          {
            id: 1,
            name: t('profile.achievements.firstWin'),
            description: t('profile.achievements.firstWinDesc'),
            icon: TrophyIcon,
            unlocked: true,
            unlockedDate: new Date(Date.now() - 2592000000)
          },
          {
            id: 2,
            name: t('profile.achievements.winStreak5'),
            description: t('profile.achievements.winStreak5Desc'),
            icon: StarIcon,
            unlocked: true,
            unlockedDate: new Date(Date.now() - 1296000000)
          },
          {
            id: 3,
            name: t('profile.achievements.top100'),
            description: t('profile.achievements.top100Desc'),
            icon: ShieldCheckIcon,
            unlocked: false,
            progress: 73
          },
          {
            id: 4,
            name: t('profile.achievements.earnings1k'),
            description: t('profile.achievements.earnings1kDesc'),
            icon: CurrencyDollarIcon,
            unlocked: true,
            unlockedDate: new Date(Date.now() - 864000000)
          },
          {
            id: 5,
            name: t('profile.achievements.debateMaster'),
            description: t('profile.achievements.debateMasterDesc'),
            icon: ChartBarIcon,
            unlocked: false,
            progress: 47
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setEditForm({ [field]: user[field] || '' });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditForm({});
  };

  const handleSave = async (field) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saving ${field}:`, editForm[field]);
      setEditingField(null);
      setEditForm({});
      setLoading(false);
    } catch (error) {
      console.error('Error saving data:', error);
      setLoading(false);
    }
  };

  const getWinRate = () => {
    if (userStats.totalChallenges === 0) return 0;
    return Math.round((userStats.wins / userStats.totalChallenges) * 100);
  };

  const getRankColor = () => {
    if (userStats.rank <= 10) return 'text-yellow-400';
    if (userStats.rank <= 100) return 'text-blue-400';
    if (userStats.rank <= 500) return 'text-green-400';
    return 'text-gray-400';
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat(currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${color}`} />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className={`text-gray-400 text-sm ${
        isRTL(currentLanguage) ? 'text-right' : 'text-left'
      }`}>
        {label}
      </p>
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={TrophyIcon}
          label={t('profile.totalChallenges')}
          value={userStats.totalChallenges}
          color="text-blue-400"
        />
        <StatCard
          icon={CurrencyDollarIcon}
          label={t('profile.totalEarnings')}
          value={`$${userStats.totalEarnings}`}
          color="text-green-400"
        />
        <StatCard
          icon={StarIcon}
          label={t('profile.currentRating')}
          value={userStats.currentRating}
          color="text-yellow-400"
        />
        <StatCard
          icon={ChartBarIcon}
          label={t('profile.globalRank')}
          value={`#${userStats.rank}`}
          color={getRankColor()}
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('profile.performanceMetrics')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${getWinRate() * 2.51} 251.2`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{getWinRate()}%</span>
              </div>
            </div>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('profile.winRate')}
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userStats.wins}W - {userStats.losses}L
            </div>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('profile.winLossRecord')}
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userStats.winStreak}
            </div>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('profile.currentWinStreak')}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('profile.personalInformation')}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <span className="text-gray-400">{t('profile.fullName')}</span>
            {editingField === 'fullName' ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editForm.fullName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSave('fullName')}
                  className="text-green-400 hover:text-green-300"
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-400 hover:text-red-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-white">{user?.fullName}</span>
                <button
                  onClick={() => handleEdit('fullName')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <span className="text-gray-400">{t('profile.email')}</span>
            <span className="text-white">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <span className="text-gray-400">{t('profile.username')}</span>
            <span className="text-white">@{user?.username}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <span className="text-gray-400">{t('profile.country')}</span>
            <span className="text-white">{user?.country}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-gray-400">{t('profile.memberSince')}</span>
            <span className="text-white">
              {user?.createdAt ? formatDate(new Date(user.createdAt)) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChallenges = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('profile.recentChallenges')}
        </h3>
        
        <div className="space-y-4">
          {recentChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex-1">
                <h4 className={`text-white font-medium mb-1 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {challenge.title}
                </h4>
                <p className={`text-gray-400 text-sm mb-2 ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {challenge.topic}
                </p>
                <div className={`flex items-center space-x-4 text-xs text-gray-500 ${
                  isRTL(currentLanguage) ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{t('profile.vs')} {challenge.opponent}</span>
                  <span>{formatDate(challenge.date)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    challenge.result === 'win' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {challenge.result === 'win' ? t('profile.win') : t('profile.loss')}
                  </div>
                  {challenge.prize > 0 && (
                    <div className="text-yellow-400 text-sm">
                      +${challenge.prize}
                    </div>
                  )}
                </div>
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  challenge.result === 'win' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {challenge.result === 'win' ? (
                    <CheckIcon className="w-6 h-6 text-green-400" />
                  ) : (
                    <XMarkIcon className="w-6 h-6 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('profile.earningsSummary')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              $${userStats.totalEarnings}
            </div>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('profile.totalEarned')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              $${Math.round(userStats.totalEarnings / userStats.wins)}
            </div>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('profile.averagePerWin')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              $${Math.round(userStats.totalEarnings / userStats.totalChallenges)}
            </div>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center' : ''
            }`}>
              {t('profile.averagePerChallenge')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('profile.monthlyBreakdown')}
        </h3>
        
        <div className="space-y-4">
          {[
            { month: t('profile.months.january'), amount: 450, wins: 3 },
            { month: t('profile.months.february'), amount: 680, wins: 5 },
            { month: t('profile.months.march'), amount: 320, wins: 2 },
            { month: t('profile.months.april'), amount: 890, wins: 7 },
            { month: t('profile.months.may'), amount: 500, wins: 4 }
          ].map((month, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div>
                <span className="text-white font-medium">{month.month}</span>
                <span className="text-gray-400 text-sm ml-2">
                  ({month.wins} {t('profile.wins')})
                </span>
              </div>
              <span className="text-green-400 font-semibold">${month.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('profile.achievements')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border ${
                achievement.unlocked
                  ? 'bg-gray-700 border-green-500/30'
                  : 'bg-gray-700/50 border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  achievement.unlocked ? 'bg-green-500/20' : 'bg-gray-600'
                }`}>
                  <achievement.icon className={`w-6 h-6 ${
                    achievement.unlocked ? 'text-green-400' : 'text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-white font-medium mb-1 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-gray-400 text-sm mb-2 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {achievement.unlocked ? (
                    <p className="text-green-400 text-xs">
                      {t('profile.unlocked')}: {formatDate(achievement.unlockedDate)}
                    </p>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {t('profile.progress')}
                        </span>
                        <span className="text-xs text-white">
                          {achievement.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!user) {
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
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 md:mb-0">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className={`text-3xl font-bold text-white mb-2 ${
                isRTL(currentLanguage) ? 'text-center md:text-right' : 'text-center md:text-left'
              }`}>
                {user.fullName}
              </h1>
              <p className={`text-gray-400 mb-4 ${
                isRTL(currentLanguage) ? 'text-center md:text-right' : 'text-center md:text-left'
              }`}>
                @{user.username} • {t('profile.memberSince')} {formatDate(new Date(user.createdAt))}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {userStats.currentRating}
                  </div>
                  <div className="text-xs text-gray-400">{t('profile.rating')}</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getRankColor()}`}>
                    #{userStats.rank}
                  </div>
                  <div className="text-xs text-gray-400">{t('profile.globalRank')}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {getWinRate()}%
                  </div>
                  <div className="text-xs text-gray-400">{t('profile.winRate')}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    ${userStats.totalEarnings}
                  </div>
                  <div className="text-xs text-gray-400">{t('profile.earned')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl mb-8 border border-gray-700">
          <div className="flex flex-wrap border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'challenges' && renderChallenges()}
            {activeTab === 'earnings' && renderEarnings()}
            {activeTab === 'achievements' && renderAchievements()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;