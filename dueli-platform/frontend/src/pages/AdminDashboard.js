import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UsersIcon, 
  TrophyIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  UserIcon,
  TrashIcon,
  BanIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChallenges: 0,
    totalRevenue: 0,
    activeReports: 0,
    pendingVerifications: 0,
    activeStreams: 0
  });
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);

  const tabs = [
    { id: 'overview', name: t('admin.overview'), icon: ChartBarIcon },
    { id: 'users', name: t('admin.users'), icon: UsersIcon },
    { id: 'challenges', name: t('admin.challenges'), icon: TrophyIcon },
    { id: 'reports', name: t('admin.reports'), icon: ExclamationTriangleIcon },
    { id: 'logs', name: t('admin.systemLogs'), icon: ShieldCheckIcon },
    { id: 'financial', name: t('admin.financial'), icon: CurrencyDollarIcon },
    { id: 'transparency', name: t('admin.transparency'), icon: DocumentTextIcon }
  ];

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Fetch admin data
    fetchAdminData();
  }, [currentLanguage]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      setTimeout(() => {
        setStats({
          totalUsers: 12543,
          totalChallenges: 892,
          totalRevenue: 45600,
          activeReports: 23,
          pendingVerifications: 7,
          activeStreams: 12
        });

        setUsers([
          {
            id: 1,
            fullName: 'John Doe',
            username: 'johndoe',
            email: 'john@example.com',
            status: 'active',
            role: 'user',
            rating: 1750,
            totalEarnings: 1240,
            joinDate: new Date('2024-01-15'),
            lastActive: new Date(),
            verified: true,
            country: 'US'
          },
          {
            id: 2,
            fullName: 'Sarah Williams',
            username: 'sarahw',
            email: 'sarah@example.com',
            status: 'suspended',
            role: 'user',
            rating: 1920,
            totalEarnings: 2100,
            joinDate: new Date('2024-02-03'),
            lastActive: new Date(Date.now() - 86400000),
            verified: true,
            country: 'UK'
          },
          {
            id: 3,
            fullName: 'Mike Chen',
            username: 'mikechen',
            email: 'mike@example.com',
            status: 'active',
            role: 'moderator',
            rating: 2100,
            totalEarnings: 3500,
            joinDate: new Date('2023-12-10'),
            lastActive: new Date(),
            verified: true,
            country: 'CA'
          },
          {
            id: 4,
            fullName: 'Emma Davis',
            username: 'emmad',
            email: 'emma@example.com',
            status: 'pending',
            role: 'user',
            rating: 1450,
            totalEarnings: 680,
            joinDate: new Date('2024-03-20'),
            lastActive: new Date(Date.now() - 172800000),
            verified: false,
            country: 'AU'
          }
        ]);

        setChallenges([
          {
            id: 1,
            title: t('admin.sampleChallenge1'),
            creator: 'John Doe',
            status: 'active',
            participants: 2,
            prizePool: 500,
            startTime: new Date(),
            category: 'politics',
            reports: 0
          },
          {
            id: 2,
            title: t('admin.sampleChallenge2'),
            creator: 'Sarah Williams',
            status: 'completed',
            participants: 2,
            prizePool: 300,
            startTime: new Date(Date.now() - 86400000),
            category: 'technology',
            reports: 1
          },
          {
            id: 3,
            title: t('admin.sampleChallenge3'),
            creator: 'Mike Chen',
            status: 'waiting',
            participants: 1,
            prizePool: 750,
            startTime: new Date(Date.now() + 3600000),
            category: 'science',
            reports: 0
          }
        ]);

        setReports([
          {
            id: 1,
            reporter: 'Alice Brown',
            reportedUser: 'Bob Smith',
            challenge: t('admin.sampleChallenge2'),
            reason: t('admin.reportReasons.inappropriateBehavior'),
            status: 'pending',
            priority: 'high',
            createdAt: new Date(Date.now() - 3600000),
            description: 'User was using offensive language during the debate'
          },
          {
            id: 2,
            reporter: 'Charlie Wilson',
            reportedUser: 'Diana Johnson',
            challenge: t('admin.sampleChallenge1'),
            reason: t('admin.reportReasons.cheating'),
            status: 'investigating',
            priority: 'medium',
            createdAt: new Date(Date.now() - 7200000),
            description: 'Suspected use of external assistance during live debate'
          },
          {
            id: 3,
            reporter: 'Eva Martinez',
            reportedUser: 'Frank Lee',
            challenge: t('admin.sampleChallenge3'),
            reason: t('admin.reportReasons.violation'),
            status: 'resolved',
            priority: 'low',
            createdAt: new Date(Date.now() - 86400000),
            description: 'Minor rule violation, already addressed'
          }
        ]);

        setLogs([
          {
            id: 1,
            timestamp: new Date(),
            level: 'info',
            message: 'User John Doe logged in successfully',
            user: 'John Doe',
            ip: '192.168.1.100'
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 300000),
            level: 'warning',
            message: 'Multiple failed login attempts detected',
            user: 'System',
            ip: '203.0.113.0'
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 600000),
            level: 'error',
            message: 'Database connection timeout',
            user: 'System',
            ip: 'Internal'
          },
          {
            id: 4,
            timestamp: new Date(Date.now() - 900000),
            level: 'info',
            message: 'New challenge created: Politics Debate #47',
            user: 'Sarah Williams',
            ip: '198.51.100.42'
          }
        ]);

        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Simulate API call
      console.log(`Performing ${action} on user ${userId}`);
      // Refresh data after action
      setTimeout(() => {
        fetchAdminData();
      }, 1000);
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      // Simulate API call
      console.log(`Performing ${action} on report ${reportId}`);
      // Refresh data after action
      setTimeout(() => {
        fetchAdminData();
      }, 1000);
    } catch (error) {
      console.error('Error performing report action:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'resolved':
        return 'text-green-400 bg-green-500/20';
      case 'suspended':
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'banned':
      case 'cancelled':
        return 'text-red-400 bg-red-500/20';
      case 'investigating':
        return 'text-orange-400 bg-orange-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-500/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'info':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat(currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${color}`} />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className={`text-gray-400 text-sm mb-2 ${
        isRTL(currentLanguage) ? 'text-right' : 'text-left'
      }`}>
        {label}
      </p>
      {trend && (
        <p className={`text-xs ${
          trend > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </p>
      )}
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={UsersIcon}
          label={t('admin.totalUsers')}
          value={stats.totalUsers.toLocaleString()}
          color="text-blue-400"
          trend={12}
        />
        <StatCard
          icon={TrophyIcon}
          label={t('admin.totalChallenges')}
          value={stats.totalChallenges.toLocaleString()}
          color="text-green-400"
          trend={8}
        />
        <StatCard
          icon={CurrencyDollarIcon}
          label={t('admin.totalRevenue')}
          value={`$${stats.totalRevenue.toLocaleString()}`}
          color="text-yellow-400"
          trend={15}
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          label={t('admin.activeReports')}
          value={stats.activeReports}
          color="text-red-400"
          trend={-5}
        />
        <StatCard
          icon={ShieldCheckIcon}
          label={t('admin.pendingVerifications')}
          value={stats.pendingVerifications}
          color="text-orange-400"
          trend={3}
        />
        <StatCard
          icon={EyeIcon}
          label={t('admin.activeStreams')}
          value={stats.activeStreams}
          color="text-purple-400"
          trend={20}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('admin.quickActions')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
            <UsersIcon className="w-5 h-5" />
            <span>{t('admin.viewAllUsers')}</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
            <TrophyIcon className="w-5 h-5" />
            <span>{t('admin.manageChallenges')}</span>
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>{t('admin.reviewReports')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('admin.userManagement')}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.user')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.status')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.role')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.rating')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.earnings')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.fullName}</div>
                        <div className="text-gray-400 text-sm">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {t(`admin.statuses.${user.status}`)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-gray-300 capitalize">{user.role}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-white">{user.rating}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-green-400">${user.totalEarnings}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUserAction(user.id, 'view')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <BanIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, 'ban')}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          {t('admin.challengeManagement')}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.challenge')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.creator')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.status')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.participants')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.prizePool')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.reports')}
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((challenge) => (
                <tr key={challenge.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-4">
                    <div className="text-white font-medium">{challenge.title}</div>
                    <div className="text-gray-400 text-sm capitalize">{challenge.category}</div>
                  </td>
                  <td className="py-4">
                    <span className="text-gray-300">{challenge.creator}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                      {t(`admin.statuses.${challenge.status}`)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-white">{challenge.participants}/2</span>
                  </td>
                  <td className="py-4">
                    <span className="text-yellow-400">${challenge.prizePool}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      challenge.reports > 0 ? 'text-red-400 bg-red-500/20' : 'text-green-400 bg-green-500/20'
                    }`}>
                      {challenge.reports}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => console.log('View challenge:', challenge.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {challenge.status === 'active' && (
                        <button
                          onClick={() => console.log('End challenge:', challenge.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('admin.reportManagement')}
        </h3>
        
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-gray-700 rounded-lg border border-gray-600"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {t(`admin.statuses.${report.status}`)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {t(`admin.priorities.${report.priority}`)}
                    </span>
                  </div>
                  
                  <h4 className={`text-white font-medium mb-2 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {t('admin.reportedUser')}: {report.reportedUser}
                  </h4>
                  
                  <p className={`text-gray-400 text-sm mb-2 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {t('admin.reportedBy')}: {report.reporter}
                  </p>
                  
                  <p className={`text-gray-300 text-sm mb-2 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {report.description}
                  </p>
                  
                  <div className={`text-xs text-gray-500 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {formatDate(report.createdAt)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReportAction(report.id, 'investigate')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {t('admin.investigate')}
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'resolve')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {t('admin.resolve')}
                      </button>
                    </>
                  )}
                  
                  {report.status === 'investigating' && (
                    <>
                      <button
                        onClick={() => handleReportAction(report.id, 'resolve')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {t('admin.resolve')}
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {t('admin.dismiss')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          {t('admin.systemLogs')}
        </h3>
        
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-gray-700 rounded-lg border border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  
                  <p className={`text-white text-sm mb-2 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {log.message}
                  </p>
                  
                  <div className={`text-xs text-gray-500 ${
                    isRTL(currentLanguage) ? 'text-right' : 'text-left'
                  }`}>
                    {t('admin.user')}: {log.user} • IP: {log.ip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          Financial Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Revenue</span>
              <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">$45,600</div>
            <div className="text-xs text-gray-500">+15% from last month</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Platform Share</span>
              <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">$9,120</div>
            <div className="text-xs text-gray-500">20% of total revenue</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Competitor Payouts</span>
              <CurrencyDollarIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">$36,480</div>
            <div className="text-xs text-gray-500">80% distributed to winners</div>
          </div>
        </div>
      </div>

      {/* Revenue Distribution Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          Revenue Distribution
        </h3>
        
        <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400">Revenue Distribution Chart</p>
            <p className="text-sm text-gray-500 mt-2">80% Competitors / 20% Platform</p>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold text-white ${
            isRTL(currentLanguage) ? 'text-right' : 'text-left'
          }`}>
            Recent Transactions
          </h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Download Invoice</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  Date
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  Challenge
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  Winner
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  Amount
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  Platform Fee
                </th>
                <th className={`py-3 text-left text-gray-400 font-medium ${
                  isRTL(currentLanguage) ? 'text-right' : 'text-left'
                }`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 1, date: '2024-01-15', challenge: 'Climate Change Debate', winner: 'Dr. Sarah Chen', amount: 800, fee: 200, status: 'Completed' },
                { id: 2, date: '2024-01-14', challenge: 'AI Ethics Discussion', winner: 'Prof. Mike Torres', amount: 640, fee: 160, status: 'Completed' },
                { id: 3, date: '2024-01-13', challenge: 'Economic Policy Debate', winner: 'Dr. Emma Wilson', amount: 1200, fee: 300, status: 'Completed' },
                { id: 4, date: '2024-01-12', challenge: 'Healthcare Reform', winner: 'Dr. John Davis', amount: 960, fee: 240, status: 'Pending' },
                { id: 5, date: '2024-01-11', challenge: 'Education Policy', winner: 'Prof. Lisa Brown', amount: 720, fee: 180, status: 'Completed' }
              ].map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-4 text-sm">{transaction.date}</td>
                  <td className="py-4 text-sm">{transaction.challenge}</td>
                  <td className="py-4 text-sm">{transaction.winner}</td>
                  <td className="py-4 text-sm text-green-400">${transaction.amount}</td>
                  <td className="py-4 text-sm text-blue-400">${transaction.fee}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transaction.status === 'Completed'
                        ? 'text-green-400 bg-green-500/20'
                        : 'text-yellow-400 bg-yellow-500/20'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransparency = () => (
    <div className="space-y-6">
      {/* Transparency Metrics */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold text-white mb-6 ${
          isRTL(currentLanguage) ? 'text-right' : 'text-left'
        }`}>
          Transparency Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Active Challenges</span>
              <EyeIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">12</div>
            <div className="text-xs text-gray-500">Live with transparency</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Real-time Updates</span>
              <ChartBarIcon className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">1.2s</div>
            <div className="text-xs text-gray-500">Average latency</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Public Ratings</span>
              <StarIcon className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">2,847</div>
            <div className="text-xs text-gray-500">Transparent ratings</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Admin Actions</span>
              <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">156</div>
            <div className="text-xs text-gray-500">Logged this month</div>
          </div>
        </div>
      </div>

      {/* Admin Action Log */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold text-white ${
            isRTL(currentLanguage) ? 'text-right' : 'text-left'
          }`}>
            Admin Action Log
          </h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search actions..."
                className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <FunnelIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { id: 1, admin: 'Admin Sarah', action: 'Account Suspended', target: 'user123', reason: 'Multiple violations of community guidelines including harassment and spreading misinformation', timestamp: new Date(Date.now() - 3600000) },
            { id: 2, admin: 'Admin Mike', action: 'Challenge Moderated', target: 'challenge456', reason: 'Removed inappropriate content from live debate', timestamp: new Date(Date.now() - 7200000) },
            { id: 3, admin: 'Admin Lisa', action: 'Rating Adjusted', target: 'user789', reason: 'Corrected rating due to confirmed evidence of vote manipulation', timestamp: new Date(Date.now() - 10800000) },
            { id: 4, admin: 'Admin John', action: 'Content Removed', target: 'user456', reason: 'Copyright infringement - used copyrighted material without permission', timestamp: new Date(Date.now() - 14400000) },
            { id: 5, admin: 'Admin Emma', action: 'Warning Issued', target: 'user321', reason: 'Minor violation - personal attack during debate', timestamp: new Date(Date.now() - 18000000) }
          ].map((action) => (
            <div
              key={action.id}
              className="p-4 bg-gray-700 rounded-lg border border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      {action.action}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {formatDate(action.timestamp)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <span className="text-gray-400">Admin:</span>
                      <span className="ml-2 text-white">{action.admin}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Target:</span>
                      <span className="ml-2 text-white">{action.target}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Reason:</span>
                    <p className="text-white text-sm mt-1">{action.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold text-white mb-2 ${
              isRTL(currentLanguage) ? 'text-center md:text-right' : 'text-center md:text-left'
            }`}>
              {t('admin.adminDashboard')}
            </h1>
            <p className={`text-gray-400 ${
              isRTL(currentLanguage) ? 'text-center md:text-right' : 'text-center md:text-left'
            }`}>
              {t('admin.welcomeAdmin', { name: user?.fullName })}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 w-3 h-3 rounded-full"></div>
            <span className="text-gray-400">{t('admin.live')}</span>
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
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'challenges' && renderChallenges()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'logs' && renderLogs()}
            {activeTab === 'financial' && renderFinancial()}
            {activeTab === 'transparency' && renderTransparency()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

export default AdminDashboard;