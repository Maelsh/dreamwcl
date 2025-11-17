const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

// Store active users and their socket connections
const activeUsers = new Map();
const userRooms = new Map();

const configureSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.user = decoded;
            next();
        } catch (error) {
            logger.warn('Socket authentication failed:', error.message);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        
        // Store user connection
        if (!activeUsers.has(userId)) {
            activeUsers.set(userId, new Set());
        }
        activeUsers.get(userId).add(socket.id);

        logger.info(`User ${userId} connected with socket ${socket.id}`);

        // Handle user joining a challenge room
        socket.on('join_challenge', (challengeId) => {
            socket.join(`challenge_${challengeId}`);
            
            if (!userRooms.has(userId)) {
                userRooms.set(userId, new Set());
            }
            userRooms.get(userId).add(challengeId);

            // Notify room of user joining
            socket.to(`challenge_${challengeId}`).emit('user_joined', {
                userId,
                username: socket.user.username,
                timestamp: new Date()
            });

            logger.info(`User ${userId} joined challenge ${challengeId}`);
        });

        // Handle user leaving a challenge room
        socket.on('leave_challenge', (challengeId) => {
            socket.leave(`challenge_${challengeId}`);
            
            if (userRooms.has(userId)) {
                userRooms.get(userId).delete(challengeId);
            }

            // Notify room of user leaving
            socket.to(`challenge_${challengeId}`).emit('user_left', {
                userId,
                username: socket.user.username,
                timestamp: new Date()
            });

            logger.info(`User ${userId} left challenge ${challengeId}`);
        });

        // Handle real-time chat messages
        socket.on('send_message', (data) => {
            const { challengeId, message, type = 'text' } = data;
            
            const messageData = {
                id: require('uuid').v4(),
                userId,
                username: socket.user.username,
                message,
                type,
                timestamp: new Date(),
                challengeId
            };

            // Broadcast message to all users in the challenge room
            io.to(`challenge_${challengeId}`).emit('new_message', messageData);
            
            logger.info(`Message sent in challenge ${challengeId} by user ${userId}`);
        });

        // Handle live ratings/votes
        socket.on('submit_vote', (data) => {
            const { challengeId, competitorId, rating, ratingType = 'performance' } = data;
            
            const voteData = {
                id: require('uuid').v4(),
                userId,
                challengeId,
                competitorId,
                rating,
                ratingType,
                timestamp: new Date()
            };

            // Broadcast vote to challenge room and admins
            io.to(`challenge_${challengeId}`).emit('live_vote', voteData);
            io.to('admin_room').emit('new_vote', voteData);
            
            logger.info(`Vote submitted in challenge ${challengeId}: ${rating} for competitor ${competitorId}`);
        });

        // Handle real-time viewer count updates
        socket.on('viewer_count_update', (data) => {
            const { challengeId, count } = data;
            io.to(`challenge_${challengeId}`).emit('viewer_count_changed', {
                challengeId,
                count,
                timestamp: new Date()
            });
        });

        // Handle competition status updates
        socket.on('competition_update', (data) => {
            const { challengeId, status, competitorTurn, timeRemaining } = data;
            
            const updateData = {
                challengeId,
                status, // 'started', 'paused', 'ended'
                competitorTurn,
                timeRemaining,
                timestamp: new Date()
            };

            // Broadcast to all viewers
            io.to(`challenge_${challengeId}`).emit('competition_status', updateData);
            
            logger.info(`Competition ${challengeId} status updated: ${status}`);
        });

        // Handle user status updates (online/offline/away)
        socket.on('user_status', (status) => {
            const statusData = {
                userId,
                status, // 'online', 'offline', 'away'
                timestamp: new Date()
            };

            // Broadcast to user's friends/followers if needed
            socket.broadcast.emit('friend_status_changed', statusData);
        });

        // Handle admin commands
        socket.on('admin_command', (data) => {
            if (socket.user.role !== 'admin' && socket.user.role !== 'moderator') {
                return socket.emit('error', { message: 'Unauthorized access' });
            }

            const { command, targetUserId, reason, challengeId } = data;
            
            const adminAction = {
                command, // 'mute_user', 'ban_user', 'end_challenge', etc.
                adminId: userId,
                targetUserId,
                reason,
                challengeId,
                timestamp: new Date()
            };

            // Execute command based on type
            switch (command) {
                case 'mute_user':
                    socket.to(`challenge_${challengeId}`).emit('user_muted', {
                        userId: targetUserId,
                        reason,
                        timestamp: new Date()
                    });
                    break;
                    
                case 'end_challenge':
                    io.to(`challenge_${challengeId}`).emit('challenge_ended', {
                        reason,
                        timestamp: new Date()
                    });
                    break;
                    
                default:
                    logger.warn(`Unknown admin command: ${command}`);
            }

            logger.info(`Admin ${userId} executed command: ${command}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            // Remove user from active users
            if (activeUsers.has(userId)) {
                activeUsers.get(userId).delete(socket.id);
                
                // If no more connections for this user, remove from map
                if (activeUsers.get(userId).size === 0) {
                    activeUsers.delete(userId);
                }
            }

            // Remove user from all rooms
            if (userRooms.has(userId)) {
                const rooms = userRooms.get(userId);
                rooms.forEach(roomId => {
                    socket.to(`challenge_${roomId}`).emit('user_left', {
                        userId,
                        username: socket.user.username,
                        timestamp: new Date()
                    });
                });
                userRooms.delete(userId);
            }

            logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error(`Socket error for user ${userId}:`, error);
        });
    });

    // Utility functions for broadcasting to specific rooms or users
    io.broadcastToChallenge = (challengeId, event, data) => {
        io.to(`challenge_${challengeId}`).emit(event, data);
    };

    io.broadcastToUser = (userId, event, data) => {
        if (activeUsers.has(userId)) {
            activeUsers.get(userId).forEach(socketId => {
                io.to(socketId).emit(event, data);
            });
        }
    };

    io.broadcastToAdmins = (event, data) => {
        io.to('admin_room').emit(event, data);
    };

    io.getActiveUsers = () => {
        return Array.from(activeUsers.keys());
    };

    io.getChallengeViewers = (challengeId) => {
        // This would require tracking rooms in a more sophisticated way
        // For now, return estimated count based on active users
        return activeUsers.size;
    };

    return io;
};

module.exports = configureSocket;