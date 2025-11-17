import React from 'react';
import { useSocket } from '../contexts/SocketContext';

const RealTimeIndicator = () => {
  const { isConnected, realTimeMetrics } = useSocket();

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        
        {realTimeMetrics && (
          <div className="mt-2 text-xs text-gray-600">
            <div>Active Challenges: {realTimeMetrics.platformStats?.activeChallenges || 0}</div>
            <div>Online Users: {realTimeMetrics.platformStats?.totalUsers || 0}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeIndicator;