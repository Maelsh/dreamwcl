import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import { Trophy, Users, Clock, Eye, Star, Play, Square, Camera, Monitor } from 'lucide-react';

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    joinChallengeRoom, 
    leaveChallengeRoom, 
    updateViewerCount, 
    toggleStream,
    dismissAd,
    socket 
  } = useSocket();

  const [isParticipant, setIsParticipant] = useState(false);
  const [localViewerCount, setLocalViewerCount] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    targetUser: '',
    rating: 0,
    comment: ''
  });

  const fetchChallenge = async () => {
    const { data } = await api.get(`/challenges/${id}`);
    return data;
  };

  const { data: challenge, isLoading, refetch } = useQuery(
    ['challenge', id],
    fetchChallenge,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 60000
    }
  );

  useEffect(() => {
    if (challenge && user) {
      const participant = user.id === challenge.challenger._id || 
                         user.id === challenge.opponent._id;
      setIsParticipant(participant);
    }
  }, [challenge, user]);

  useEffect(() => {
    if (challenge?.status === 'live') {
      joinChallengeRoom(id);
      
      // Simulate viewer count update
      const interval = setInterval(() => {
        if (socket) {
          const count = Math.floor(Math.random() * 100) + 50;
          setLocalViewerCount(count);
          updateViewerCount(id, count);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        leaveChallengeRoom(id);
      };
    }
  }, [challenge?.status, id, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('challenge-started', () => {
        refetch();
      });

      socket.on('challenge-ended', () => {
        refetch();
        if (!isParticipant) {
          setShowRatingModal(true);
        }
      });

      socket.on('viewer-count-updated', (data) => {
        setLocalViewerCount(data.viewerCount);
      });

      return () => {
        socket.off('challenge-started');
        socket.off('challenge-ended');
        socket.off('viewer-count-updated');
      };
    }
  }, [socket, refetch, isParticipant]);

  const handleStartChallenge = async () => {
    try {
      await api.put(`/challenges/${id}/start`);
      refetch();
    } catch (error) {
      console.error('Failed to start challenge:', error);
    }
  };

  const handleEndChallenge = async () => {
    try {
      await api.put(`/challenges/${id}/end`, {
        winner: user.id // Simple implementation - winner is the one who ends it
      });
      refetch();
    } catch (error) {
      console.error('Failed to end challenge:', error);
    }
  };

  const handleToggleStream = (streamType) => {
    toggleStream(id, streamType);
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/challenges/${id}/rate`, ratingData);
      setShowRatingModal(false);
      setRatingData({ targetUser: '', rating: 0, comment: '' });
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Challenge not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Challenge Header */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{challenge.title}</h1>
            <p className="text-gray-600">{challenge.topic}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              challenge.status === 'live' ? 'bg-red-100 text-red-800' :
              challenge.status === 'completed' ? 'bg-green-100 text-green-800' :
              challenge.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {challenge.status.toUpperCase()}
            </span>
            {challenge.status === 'live' && (
              <div className="live-indicator mt-2">LIVE</div>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Challenger</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {challenge.challenger.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{challenge.challenger.username}</p>
                <p className="text-sm text-gray-600">
                  Rating: {challenge.challenger.overallRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Opponent</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {challenge.opponent.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{challenge.opponent.username}</p>
                <p className="text-sm text-gray-600">
                  Rating: {challenge.opponent.overallRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Viewers</p>
            <p className="text-xl font-bold">{localViewerCount || challenge.viewerCount}</p>
          </div>
          <div className="text-center">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-xl font-bold">{challenge.settings?.maxDuration || 3600}s</p>
          </div>
          <div className="text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-xl font-bold">${challenge.revenue?.totalRevenue || 0}</p>
          </div>
          <div className="text-center">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Max Viewers</p>
            <p className="text-xl font-bold">{challenge.maxViewerCount}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {isParticipant && challenge.status === 'scheduled' && (
          <button
            onClick={handleStartChallenge}
            className="btn-primary flex items-center"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Challenge
          </button>
        )}

        {isParticipant && challenge.status === 'live' && (
          <div className="flex space-x-4">
            <button
              onClick={() => handleToggleStream('camera')}
              className="btn-secondary flex items-center"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </button>
            <button
              onClick={() => handleToggleStream('screen')}
              className="btn-secondary flex items-center"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Screen Share
            </button>
            <button
              onClick={handleEndChallenge}
              className="btn-danger flex items-center"
            >
              <Square className="h-4 w-4 mr-2" />
              End Challenge
            </button>
          </div>
        )}

        {!isParticipant && challenge.status === 'live' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              You are watching as a viewer. Enjoy the debate!
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      {challenge.description && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-600">{challenge.description}</p>
        </div>
      )}

      {/* Ratings */}
      {challenge.status === 'completed' && challenge.ratings && challenge.ratings.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ratings</h2>
          <div className="space-y-4">
            {challenge.ratings.map((rating, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    by {rating.user.username}
                  </span>
                </div>
                {rating.comment && (
                  <p className="text-gray-700">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Rate the Challenge</h3>
            <form onSubmit={handleSubmitRating}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Participant to Rate
                </label>
                <select
                  value={ratingData.targetUser}
                  onChange={(e) => setRatingData({ ...ratingData, targetUser: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Select a participant</option>
                  <option value={challenge.challenger._id}>
                    {challenge.challenger.username}
                  </option>
                  <option value={challenge.opponent._id}>
                    {challenge.opponent.username}
                  </option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingData({ ...ratingData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= ratingData.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={ratingData.comment}
                  onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  placeholder="Share your thoughts about this performance..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={!ratingData.targetUser || ratingData.rating === 0}
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDetail;