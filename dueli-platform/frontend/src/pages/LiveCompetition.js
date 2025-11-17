import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoCameraIcon,
  ComputerDesktopIcon,
  EyeIcon,
  EyeSlashIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  StarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const LiveCompetition = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [isCompetitorView, setIsCompetitorView] = useState(true);
  
  // Mock real-time data
  const [transparencyMetrics, setTransparencyMetrics] = useState({
    competitorA: {
      viewerCount: 1247,
      rating: 4.2,
      ratingBar: 84,
      reports: 3
    },
    competitorB: {
      viewerCount: 1189,
      rating: 4.7,
      ratingBar: 94,
      reports: 1
    },
    totalViewers: 2436,
    prizePool: 1000,
    platformShare: 200,
    competitorShare: 800
  });

  // Mock challenge data
  const [challenge] = useState({
    id: 'challenge-001',
    title: 'Global Warming: Crisis or Hoax?',
    topic: 'Climate Change Debate',
    competitorA: {
      id: 'user1',
      name: 'Dr. Sarah Chen',
      avatar: '/api/placeholder/64/64',
      position: 'Crisis Advocate',
      rating: 1850
    },
    competitorB: {
      id: 'user2',
      name: 'Prof. Michael Torres',
      avatar: '/api/placeholder/64/64',
      position: 'Skeptic',
      rating: 1920
    },
    status: 'active',
    startTime: new Date(),
    duration: 3600000, // 1 hour
    prizePool: 1000,
    category: 'Science & Environment'
  });

  useEffect(() => {
    // Apply RTL direction if needed
    document.body.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateMetrics();
    }, 2000);

    // Simulate chat messages
    const chatInterval = setInterval(() => {
      addRandomChatMessage();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(chatInterval);
    };
  }, [currentLanguage]);

  const updateMetrics = () => {
    setTransparencyMetrics(prev => ({
      ...prev,
      competitorA: {
        ...prev.competitorA,
        viewerCount: prev.competitorA.viewerCount + Math.floor(Math.random() * 10 - 5),
        rating: Math.max(1, Math.min(5, prev.competitorA.rating + (Math.random() * 0.2 - 0.1))),
        ratingBar: Math.max(0, Math.min(100, prev.competitorA.ratingBar + Math.floor(Math.random() * 6 - 3)))
      },
      competitorB: {
        ...prev.competitorB,
        viewerCount: prev.competitorB.viewerCount + Math.floor(Math.random() * 10 - 5),
        rating: Math.max(1, Math.min(5, prev.competitorB.rating + (Math.random() * 0.2 - 0.1))),
        ratingBar: Math.max(0, Math.min(100, prev.competitorB.ratingBar + Math.floor(Math.random() * 6 - 3)))
      },
      totalViewers: prev.totalViewers + Math.floor(Math.random() * 20 - 10)
    }));
  };

  const addRandomChatMessage = () => {
    const messages = [
      { user: 'Viewer123', message: 'Great point about renewable energy!' },
      { user: 'DebateFan', message: 'I disagree with that argument' },
      { user: 'ClimateExpert', message: 'The data supports this position' },
      { user: 'Skeptic101', message: 'Correlation does not imply causation' },
      { user: 'GreenAdvocate', message: 'We need to act now!' }
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setChatMessages(prev => [...prev.slice(-20), { ...randomMessage, timestamp: new Date() }]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, { 
        user: 'You', 
        message: newMessage, 
        timestamp: new Date() 
      }]);
      setNewMessage('');
    }
  };

  const toggleMedia = () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      setIsCameraOn(true);
    } else {
      setIsScreenSharing(true);
      setIsCameraOn(false);
    }
  };

  const dismissAd = () => {
    setShowAd(false);
    // Log ad dismissal
    console.log('Ad dismissed at:', new Date().toISOString());
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const elapsedTime = Date.now() - challenge.startTime.getTime();
  const remainingTime = Math.max(0, challenge.duration - elapsedTime);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <div className="text-sm text-gray-400">
              {formatTime(remainingTime)} remaining
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <EyeIcon className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">{transparencyMetrics.totalViewers.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-400">
              Prize Pool: ${transparencyMetrics.prizePool}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Feeds */}
          <div className="flex-1 grid grid-cols-2 gap-4 p-6">
            {/* Competitor A */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                <div className="text-center">
                  <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{challenge.competitorA.name}</p>
                  <p className="text-sm text-gray-500">{challenge.competitorA.position}</p>
                </div>
              </div>
              
              {/* Transparency Widget - Competitor A */}
              <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="w-4 h-4 text-blue-400" />
                    <span>{transparencyMetrics.competitorA.viewerCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span>{transparencyMetrics.competitorA.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                    <span>{transparencyMetrics.competitorA.reports}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${transparencyMetrics.competitorA.ratingBar}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Competitor Controls (if competitor view) */}
              {isCompetitorView && (
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  <button
                    onClick={toggleMedia}
                    className="bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg hover:bg-gray-800 transition-colors"
                    title={isScreenSharing ? 'Switch to Camera' : 'Switch to Screen Share'}
                  >
                    {isScreenSharing ? (
                      <VideoCameraIcon className="w-5 h-5 text-white" />
                    ) : (
                      <ComputerDesktopIcon className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    className="bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg hover:bg-gray-800 transition-colors"
                    title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    {isCameraOn ? (
                      <EyeIcon className="w-5 h-5 text-white" />
                    ) : (
                      <EyeSlashIcon className="w-5 h-5 text-red-400" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Competitor B */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                <div className="text-center">
                  <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{challenge.competitorB.name}</p>
                  <p className="text-sm text-gray-500">{challenge.competitorB.position}</p>
                </div>
              </div>
              
              {/* Transparency Widget - Competitor B */}
              <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="w-4 h-4 text-blue-400" />
                    <span>{transparencyMetrics.competitorB.viewerCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span>{transparencyMetrics.competitorB.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                    <span>{transparencyMetrics.competitorB.reports}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${transparencyMetrics.competitorB.ratingBar}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Bar */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Revenue Distribution (80/20 Split)</span>
              <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-sm font-medium"
                style={{ width: '80%' }}
              >
                Competitors: ${transparencyMetrics.competitorShare}
              </div>
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-medium"
                style={{ width: '20%' }}
              >
                Platform: ${transparencyMetrics.platformShare}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Live Chat</h3>
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {chatMessages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm"
                >
                  <div className="font-medium text-blue-400">{message.user}</div>
                  <div className="text-gray-300 mt-1">{message.message}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ad Modal */}
      <AnimatePresence>
        {showAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-8 max-w-md mx-4"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Advertisement</h3>
                <div className="bg-gray-700 rounded-lg h-32 mb-6 flex items-center justify-center">
                  <span className="text-gray-400">Ad Content</span>
                </div>
                <button
                  onClick={dismissAd}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Dismiss Ad
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Toggle */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setIsCompetitorView(!isCompetitorView)}
          className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg border border-gray-600 transition-colors"
        >
          {isCompetitorView ? '👤 Competitor View' : '👥 Audience View'}
        </button>
      </div>
    </div>
  );
};

export default LiveCompetition;