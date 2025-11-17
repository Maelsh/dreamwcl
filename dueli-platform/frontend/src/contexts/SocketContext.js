import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);

  useEffect(() => {
    if (token && user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join-user-room', user.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('real-time-metrics', (data) => {
        setRealTimeMetrics(data);
      });

      newSocket.on('user-metrics-updated', (data) => {
        // Handle user-specific updates
        console.log('User metrics updated:', data);
      });

      newSocket.on('challenge-metrics-updated', (data) => {
        // Handle challenge-specific updates
        console.log('Challenge metrics updated:', data);
      });

      newSocket.on('rating-updated', (data) => {
        // Handle rating updates
        console.log('Rating updated:', data);
      });

      newSocket.on('viewer-count-updated', (data) => {
        // Handle viewer count updates
        console.log('Viewer count updated:', data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user]);

  const joinChallengeRoom = (challengeId) => {
    if (socket) {
      socket.emit('join-challenge-room', challengeId);
    }
  };

  const leaveChallengeRoom = (challengeId) => {
    if (socket) {
      socket.emit('leave-challenge-room', challengeId);
    }
  };

  const updateViewerCount = (challengeId, count) => {
    if (socket) {
      socket.emit('update-viewer-count', { challengeId, count });
    }
  };

  const toggleStream = (challengeId, streamType) => {
    if (socket) {
      socket.emit('toggle-stream', { challengeId, userId: user.id, streamType });
    }
  };

  const dismissAd = (challengeId, adId) => {
    if (socket) {
      socket.emit('dismiss-ad', { challengeId, adId, userId: user.id });
    }
  };

  const value = {
    socket,
    isConnected,
    realTimeMetrics,
    joinChallengeRoom,
    leaveChallengeRoom,
    updateViewerCount,
    toggleStream,
    dismissAd
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;