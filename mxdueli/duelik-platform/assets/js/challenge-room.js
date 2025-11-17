// =========================================
// CHALLENGE ROOM JAVASCRIPT
// Live Challenge Room Functionality
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Challenge Room initialized');
    
    // Initialize all room components
    initializeHeader();
    initializeStream();
    initializeChat();
    initializeRatings();
    initializeCompetitorControls();
    initializeModeration();
    initializeNotifications();
    initializeFloatingActions();
    initializeKeyboardShortcuts();
    
    // Start real-time updates
    initializeRealTimeUpdates();
    
    // Initialize WebSocket simulation
    initializeWebSocket();
    
    // Track user session
    trackUserSession();
});

// =========================================
// HEADER COMPONENTS
// =========================================

function initializeHeader() {
    // Share functionality
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }
    
    // Fullscreen functionality
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Settings functionality
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showRoomSettings);
    }
    
    // Close room
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', confirmCloseRoom);
    }
}

function handleShare() {
    const shareData = {
        title: 'منافسة مباشرة - Dueli',
        text: 'انضم لمنافسة مباشرة شيقة!',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('تم نسخ رابط المنافسة', 'success');
        }).catch(() => {
            showNotification('فشل في نسخ الرابط', 'error');
        });
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            showNotification('فشل في تفعيل ملء الشاشة', 'error');
        });
    } else {
        document.exitFullscreen();
    }
}

function showRoomSettings() {
    showNotification('إعدادات الغرفة - قريباً', 'info');
}

function confirmCloseRoom() {
    if (confirm('هل أنت متأكد من الخروج من المنافسة؟')) {
        window.close();
    }
}

// =========================================
// STREAM MANAGEMENT
// =========================================

function initializeStream() {
    // Timer functionality
    initializeChallengeTimer();
    
    // Stream controls
    initializeStreamControls();
    
    // Video player
    initializeVideoPlayer();
    
    // Quality settings
    initializeQualitySettings();
}

function initializeChallengeTimer() {
    const timerText = document.querySelector('.timer-text');
    const timerBtn = document.getElementById('timerBtn');
    const progressFill = document.querySelector('.progress-fill');
    
    if (!timerText) return;
    
    let isPaused = false;
    let startTime = Date.now();
    let pausedTime = 0;
    let totalPausedTime = 0;
    
    // Set expected duration (60 minutes default)
    const expectedDuration = 60 * 60 * 1000; // 60 minutes in milliseconds
    
    function updateTimer() {
        if (isPaused) return;
        
        const elapsed = Date.now() - startTime - totalPausedTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        
        timerText.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = Math.min((elapsed / expectedDuration) * 100, 100);
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        // Show warning when time is running out
        if (elapsed > expectedDuration * 0.9 && elapsed < expectedDuration) {
            showNotification('الوقت ينتهي قريباً', 'warning');
        }
    }
    
    // Update timer every second
    const timerInterval = setInterval(updateTimer, 1000);
    
    // Pause/Resume button
    if (timerBtn) {
        timerBtn.addEventListener('click', () => {
            if (!isPaused) {
                isPaused = true;
                pausedTime = Date.now();
                timerBtn.textContent = 'استئناف';
                showNotification('تم إيقاف المنافسة مؤقتاً', 'info');
            } else {
                isPaused = false;
                totalPausedTime += Date.now() - pausedTime;
                timerBtn.textContent = 'إيقاف مؤقت';
                showNotification('تم استئناف المنافسة', 'success');
            }
        });
    }
}

function initializeStreamControls() {
    // Play/pause control
    const playBtn = document.querySelector('.control-btn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayPause);
    }
    
    // Volume control
    initializeVolumeControl();
    
    // Picture-in-picture
    const pipBtn = document.querySelector('.control-btn[title="Picture in Picture"]');
    if (pipBtn) {
        pipBtn.addEventListener('click', togglePictureInPicture);
    }
}

function togglePlayPause() {
    const playBtn = document.querySelector('.control-btn');
    const video = document.querySelector('video');
    
    if (video) {
        if (video.paused) {
            video.play();
            playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>';
        } else {
            video.pause();
            playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
        }
    }
}

function initializeVolumeControl() {
    // Add volume slider
    const streamControls = document.querySelector('.stream-controls');
    if (streamControls) {
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '50';
        volumeSlider.className = 'volume-slider';
        volumeSlider.style.cssText = `
            width: 80px;
            margin-left: 1rem;
            background: transparent;
        `;
        
        volumeSlider.addEventListener('input', function() {
            const video = document.querySelector('video');
            if (video) {
                video.volume = this.value / 100;
            }
        });
        
        streamControls.appendChild(volumeSlider);
    }
}

function togglePictureInPicture() {
    const video = document.querySelector('video');
    
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (video && document.pictureInPictureEnabled) {
        video.requestPictureInPicture().catch(err => {
            showNotification('فشل في تفعيل Picture-in-Picture', 'error');
        });
    }
}

function initializeVideoPlayer() {
    // Simulate video player functionality
    const video = document.querySelector('video');
    
    if (video) {
        video.addEventListener('loadedmetadata', function() {
            console.log('Video loaded, duration:', video.duration);
        });
        
        video.addEventListener('error', function() {
            showNotification('خطأ في تحميل الفيديو', 'error');
        });
    }
}

function initializeQualitySettings() {
    const qualityIndicator = document.querySelector('.quality-indicator');
    if (qualityIndicator) {
        qualityIndicator.addEventListener('click', showQualityOptions);
    }
}

function showQualityOptions() {
    const qualities = ['144p', '360p', '720p', '1080p'];
    const currentQuality = '1080p';
    
    showNotification(`جودة الفيديو الحالية: ${currentQuality}`, 'info');
    
    // In real app, this would show quality selection menu
}

// =========================================
// CHAT SYSTEM
// =========================================

function initializeChat() {
    // Chat filters
    const chatFilters = document.querySelectorAll('.chat-filter');
    chatFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            setActiveChatFilter(this);
            filterChatMessages(this.getAttribute('data-filter'));
        });
    });
    
    // Chat input
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (chatInput && sendBtn) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Auto-scroll to bottom
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Emoji picker (basic implementation)
    initializeEmojiPicker();
}

function setActiveChatFilter(activeFilter) {
    const filters = document.querySelectorAll('.chat-filter');
    filters.forEach(filter => filter.classList.remove('active'));
    activeFilter.classList.add('active');
}

function filterChatMessages(filterType) {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(message => {
        const messageType = message.querySelector('.message-type');
        
        if (filterType === 'all') {
            message.style.display = 'flex';
        } else if (filterType === 'competitors' && messageType) {
            message.style.display = messageType.textContent.includes('منافس') ? 'flex' : 'none';
        } else if (filterType === 'moderators' && messageType) {
            message.style.display = messageType.textContent.includes('مشرف') ? 'flex' : 'none';
        }
    });
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add message to chat
    addChatMessage(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Simulate message processing
    setTimeout(() => {
        // Auto-reply for demo
        if (message.includes('شكرا') || message.includes('ممتاز')) {
            addChatMessage('شكراً لك! نقدر مشاركتك', 'system');
        }
    }, 1000);
}

function addChatMessage(message, type = 'user', userData = null) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    if (type === 'system') {
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="system-icon">⚡</span>
                <span class="username">النظام</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-content system">${message}</div>
        `;
    } else {
        const user = userData || {
            name: 'مستخدم جديد',
            avatar: '../assets/images/user-avatar.jpg',
            type: 'مشاهد'
        };
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
                <span class="username">${user.name}</span>
                <span class="message-time">${timeString}</span>
                ${user.type !== 'مشاهد' ? `<span class="message-type">${user.type}</span>` : ''}
            </div>
            <div class="message-content">${message}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Animate new message
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 100);
}

function initializeEmojiPicker() {
    // Basic emoji support
    const emojis = ['😀', '😂', '😍', '👍', '👏', '🔥', '💯', '❤️', '🤔', '😮'];
    
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    // Add emoji button
    const emojiBtn = document.createElement('button');
    emojiBtn.className = 'emoji-btn';
    emojiBtn.innerHTML = '😊';
    emojiBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0.5rem;
    `;
    
    chatInput.parentNode.appendChild(emojiBtn);
    
    // Emoji picker popup
    emojiBtn.addEventListener('click', function() {
        showEmojiPicker(chatInput, emojis);
    });
}

function showEmojiPicker(input, emojis) {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.style.cssText = `
        position: absolute;
        bottom: 100%;
        right: 0;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 1rem;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    
    emojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.textContent = emoji;
        emojiBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem;
            border-radius: 8px;
            transition: background 0.2s ease;
        `;
        
        emojiBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        emojiBtn.addEventListener('mouseleave', function() {
            this.style.background = 'none';
        });
        
        emojiBtn.addEventListener('click', function() {
            input.value += emoji;
            picker.remove();
            input.focus();
        });
        
        picker.appendChild(emojiBtn);
    });
    
    input.parentNode.appendChild(picker);
    
    // Close picker when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closePicker(e) {
            if (!picker.contains(e.target) && e.target !== emojiBtn) {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }
        });
    }, 100);
}

// =========================================
// RATINGS SYSTEM
// =========================================

function initializeRatings() {
    const starButtons = document.querySelectorAll('.star-btn');
    
    starButtons.forEach(button => {
        button.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            const competitorName = this.closest('.rating-item').querySelector('.competitor-mini span').textContent;
            
            submitRating(competitorName, rating);
            
            // Visual feedback
            this.style.transform = 'scale(1.5)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
            
            showNotification(`تم تقييم ${competitorName} بـ ${rating} نجوم`, 'success');
        });
    });
    
    // Initialize live scores
    updateLiveScores();
}

function submitRating(competitorName, rating) {
    // In real app, this would send to server via WebSocket
    console.log(`Rating submitted: ${competitorName} - ${rating} stars`);
    
    // Simulate score update
    setTimeout(() => {
        updateLiveScores(competitorName, rating);
    }, 500);
}

function updateLiveScores() {
    const scoreItems = document.querySelectorAll('.score-item');
    
    scoreItems.forEach((item, index) => {
        const scoreBar = item.querySelector('.score-fill');
        const scoreValue = item.querySelector('.score-value');
        
        if (scoreBar && scoreValue) {
            // Simulate score change
            const currentScore = parseInt(scoreValue.textContent.replace('%', ''));
            const change = Math.floor(Math.random() * 10) - 5; // Random change -5 to +5
            const newScore = Math.max(0, Math.min(100, currentScore + change));
            
            // Animate score change
            animateScoreChange(scoreBar, scoreValue, newScore);
        }
    });
}

function animateScoreChange(scoreBar, scoreValue, newScore) {
    const startScore = parseInt(scoreValue.textContent.replace('%', ''));
    const duration = 1000; // 1 second
    const startTime = performance.now();
    
    function updateScore(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeProgress = progress * (2 - progress);
        
        const currentScore = Math.floor(startScore + (newScore - startScore) * easeProgress);
        scoreValue.textContent = `${currentScore}%`;
        scoreBar.style.width = `${currentScore}%`;
        
        if (progress < 1) {
            requestAnimationFrame(updateScore);
        }
    }
    
    requestAnimationFrame(updateScore);
}

// =========================================
// COMPETITOR CONTROLS
// =========================================

function initializeCompetitorControls() {
    const micToggle = document.getElementById('micToggle');
    const camToggle = document.getElementById('camToggle');
    const screenShare = document.getElementById('screenShare');
    const chatToggle = document.getElementById('chatToggle');
    
    if (micToggle) {
        micToggle.addEventListener('click', () => toggleMicrophone(micToggle));
    }
    
    if (camToggle) {
        camToggle.addEventListener('click', () => toggleCamera(camToggle));
    }
    
    if (screenShare) {
        screenShare.addEventListener('click', () => toggleScreenShare(screenShare));
    }
    
    if (chatToggle) {
        chatToggle.addEventListener('click', () => toggleChat(chatToggle));
    }
    
    // Emergency actions
    const endChallenge = document.getElementById('endChallenge');
    const pauseChallenge = document.getElementById('pauseChallenge');
    
    if (endChallenge) {
        endChallenge.addEventListener('click', endChallengeConfirm);
    }
    
    if (pauseChallenge) {
        pauseChallenge.addEventListener('click', pauseChallengeConfirm);
    }
}

function toggleMicrophone(button) {
    const icon = button.querySelector('.btn-icon');
    const text = button.querySelector('span:last-child');
    
    // Toggle microphone state
    const isMuted = button.classList.contains('active');
    
    if (isMuted) {
        // Unmute
        button.classList.remove('active');
        icon.textContent = '🎤';
        text.textContent = 'الميكروفون';
        showNotification('تم تفعيل الميكروفون', 'success');
    } else {
        // Mute
        button.classList.add('active');
        icon.textContent = '🔇';
        text.textContent = 'إلغاء كتم';
        showNotification('تم كتم الميكروفون', 'info');
    }
    
    // In real app, this would control actual microphone
    console.log('Microphone toggled:', !isMuted);
}

function toggleCamera(button) {
    const icon = button.querySelector('.btn-icon');
    const text = button.querySelector('span:last-child');
    
    // Toggle camera state
    const isOff = button.classList.contains('active');
    
    if (isOff) {
        // Turn on camera
        button.classList.remove('active');
        icon.textContent = '📹';
        text.textContent = 'الكاميرا';
        showNotification('تم تفعيل الكاميرا', 'success');
    } else {
        // Turn off camera
        button.classList.add('active');
        icon.textContent = '📷';
        text.textContent = 'تشغيل الكاميرا';
        showNotification('تم إيقاف الكاميرا', 'info');
    }
    
    // In real app, this would control actual camera
    console.log('Camera toggled:', !isOff);
}

function toggleScreenShare(button) {
    const icon = button.querySelector('.btn-icon');
    const text = button.querySelector('span:last-child');
    
    const isSharing = button.classList.contains('active');
    
    if (isSharing) {
        // Stop sharing
        button.classList.remove('active');
        icon.textContent = '🖥️';
        text.textContent = 'مشاركة الشاشة';
        showNotification('تم إيقاف مشاركة الشاشة', 'info');
    } else {
        // Start sharing
        button.classList.add('active');
        icon.textContent = '⏹️';
        text.textContent = 'إيقاف المشاركة';
        showNotification('تم بدء مشاركة الشاشة', 'success');
    }
    
    // In real app, this would use Screen Capture API
    console.log('Screen share toggled:', !isSharing);
}

function toggleChat(button) {
    const icon = button.querySelector('.btn-icon');
    const text = button.querySelector('span:last-child');
    
    const isDisabled = button.classList.contains('active');
    
    if (isDisabled) {
        // Enable chat
        button.classList.remove('active');
        icon.textContent = '💬';
        text.textContent = 'الدردشة';
        showNotification('تم تفعيل الدردشة', 'success');
    } else {
        // Disable chat
        button.classList.add('active');
        icon.textContent = '🚫';
        text.textContent = 'تفعيل الدردشة';
        showNotification('تم تعطيل الدردشة', 'info');
    }
    
    // In real app, this would control chat permissions
    console.log('Chat toggled:', !isDisabled);
}

function endChallengeConfirm() {
    if (confirm('هل أنت متأكد من إنهاء المنافسة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        showNotification('تم إنهاء المنافسة', 'success');
        
        // In real app, this would end the challenge
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
    }
}

function pauseChallengeConfirm() {
    if (confirm('هل تريد إيقاف المنافسة مؤقتاً؟')) {
        showNotification('تم إيقاف المنافسة مؤقتاً', 'info');
        
        // In real app, this would pause the challenge
        console.log('Challenge paused');
    }
}

// =========================================
// MODERATION SYSTEM
// =========================================

function initializeModeration() {
    const moderationPanel = document.getElementById('moderationPanel');
    const openModerationBtn = document.getElementById('openModeration');
    const closeModerationBtn = document.getElementById('closeModeration');
    
    if (openModerationBtn && moderationPanel) {
        openModerationBtn.addEventListener('click', () => {
            moderationPanel.classList.toggle('hidden');
        });
    }
    
    if (closeModerationBtn && moderationPanel) {
        closeModerationBtn.addEventListener('click', () => {
            moderationPanel.classList.add('hidden');
        });
    }
    
    // Moderation actions
    const muteParticipants = document.getElementById('muteParticipants');
    const endChat = document.getElementById('endChat');
    const deleteMessages = document.getElementById('deleteMessages');
    
    if (muteParticipants) {
        muteParticipants.addEventListener('click', () => {
            showNotification('تم كتم جميع المشاركين', 'warning');
        });
    }
    
    if (endChat) {
        endChat.addEventListener('click', () => {
            showNotification('تم تعطيل الدردشة', 'warning');
        });
    }
    
    if (deleteMessages) {
        deleteMessages.addEventListener('click', () => {
            if (confirm('هل تريد حذف جميع الرسائل؟')) {
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    showNotification('تم حذف جميع الرسائل', 'success');
                }
            }
        });
    }
}

// =========================================
// REAL-TIME UPDATES
// =========================================

function initializeRealTimeUpdates() {
    // Update viewer count every 30 seconds
    setInterval(updateViewerCount, 30000);
    
    // Update chat activity
    simulateChatActivity();
    
    // Update scores periodically
    setInterval(updateLiveScores, 10000);
    
    // Check for new participants
    setInterval(checkNewParticipants, 15000);
}

function updateViewerCount() {
    const viewerCounts = document.querySelectorAll('.viewer-count');
    
    viewerCounts.forEach(element => {
        const currentCount = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const change = Math.floor(Math.random() * 20) - 10; // Random change -10 to +10
        const newCount = Math.max(0, currentCount + change);
        element.textContent = `${newCount.toLocaleString()} مشاهدة`;
        
        // Visual feedback for changes
        if (change > 0) {
            element.style.color = '#4CAF50';
            setTimeout(() => element.style.color = '', 2000);
        } else if (change < 0) {
            element.style.color = '#FF6B6B';
            setTimeout(() => element.style.color = '', 2000);
        }
    });
}

function simulateChatActivity() {
    const sampleMessages = [
        { user: 'محمد العلي', message: 'مناظرة ممتازة! 👏', type: 'competitor' },
        { user: 'فاطمة الزهراني', message: 'تقييم رائع للمتنافسين', type: 'viewer' },
        { user: 'النظام', message: 'تم تحديث النقاط', type: 'system' },
        { user: 'علي المحترف', message: 'موضوع مهم جداً', type: 'viewer' },
        { user: 'سارة التقنية', message: 'أحب النقاط المطروحة', type: 'viewer' }
    ];
    
    // Add random message every 45-90 seconds
    setTimeout(() => {
        const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        addChatMessage(randomMessage.message, randomMessage.type === 'system' ? 'system' : 'user', {
            name: randomMessage.user,
            avatar: '../assets/images/user-avatar.jpg',
            type: randomMessage.type === 'competitor' ? 'منافس' : randomMessage.type === 'viewer' ? 'مشاهد' : 'مشرف'
        });
        
        // Schedule next message
        simulateChatActivity();
    }, Math.random() * 45000 + 45000);
}

function checkNewParticipants() {
    // Simulate new participants joining
    const viewerList = document.querySelector('.viewers-list');
    if (viewerList && Math.random() > 0.7) { // 30% chance
        const newViewer = document.createElement('div');
        newViewer.className = 'viewer-item';
        newViewer.innerHTML = `
            <img src="../assets/images/user-avatar.jpg" alt="مستخدم" class="viewer-avatar">
            <span class="viewer-name">مستخدم جديد</span>
        `;
        
        viewerList.appendChild(newViewer);
        
        // Animate new participant
        newViewer.style.opacity = '0';
        newViewer.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            newViewer.style.transition = 'all 0.5s ease';
            newViewer.style.opacity = '1';
            newViewer.style.transform = 'translateX(0)';
        }, 100);
        
        showNotification('انضم مشاهد جديد للمنافسة', 'info');
    }
}

// =========================================
// WEBSOCKET SIMULATION
// =========================================

function initializeWebSocket() {
    // Simulate WebSocket connection for real-time updates
    console.log('Connecting to WebSocket...');
    
    // Simulate connection successful
    setTimeout(() => {
        console.log('WebSocket connected');
        
        // Listen for real-time events
        setupRealtimeEventListeners();
    }, 1000);
    
    // Handle connection errors
    setTimeout(() => {
        if (Math.random() > 0.9) { // 10% chance of connection issue
            showNotification('تم إعادة الاتصال بالخادم', 'warning');
        }
    }, 10000);
}

function setupRealtimeEventListeners() {
    // Listen for rating updates
    document.addEventListener('rating-update', function(event) {
        console.log('Rating update received:', event.detail);
        updateLiveScores();
    });
    
    // Listen for new messages
    document.addEventListener('new-message', function(event) {
        console.log('New message received:', event.detail);
        // Message already handled by chat system
    });
    
    // Listen for participant updates
    document.addEventListener('participant-update', function(event) {
        console.log('Participant update received:', event.detail);
        updateViewerCount();
    });
}

// =========================================
// USER SESSION TRACKING
// =========================================

function trackUserSession() {
    const startTime = Date.now();
    let isActive = true;
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let activityTimeout;
    
    function updateActivity() {
        isActive = true;
        clearTimeout(activityTimeout);
        
        // Set inactive after 5 minutes of no activity
        activityTimeout = setTimeout(() => {
            isActive = false;
            showNotification('لم يتم النشاط لفترة طويلة', 'info');
        }, 300000); // 5 minutes
    }
    
    // Monitor activity
    activityEvents.forEach(event => {
        document.addEventListener(event, updateActivity, true);
    });
    
    // Track session duration
    setInterval(() => {
        if (isActive) {
            const sessionDuration = Math.floor((Date.now() - startTime) / 60000); // minutes
            updateSessionStats(sessionDuration);
        }
    }, 60000); // Update every minute
    
    console.log('User session tracking started');
}

function updateSessionStats(duration) {
    // Update session stats (could be sent to analytics)
    console.log(`User has been active for ${duration} minutes`);
}

// =========================================
// FLOATING ACTIONS
// =========================================

function initializeFloatingActions() {
    const inviteFriends = document.getElementById('inviteFriends');
    const shareChallenge = document.getElementById('shareChallenge');
    
    if (inviteFriends) {
        inviteFriends.addEventListener('click', inviteFriendsToChallenge);
    }
    
    if (shareChallenge) {
        shareChallenge.addEventListener('click', handleShare);
    }
}

function inviteFriendsToChallenge() {
    // Simulate friend invitation
    showNotification('تم إرسال الدعوات للأصدقاء', 'success');
    
    // In real app, this would open friend selection modal
    console.log('Inviting friends to challenge...');
}

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // M to toggle mute
        if (e.key === 'm' && e.ctrlKey) {
            e.preventDefault();
            const micBtn = document.getElementById('micToggle');
            if (micBtn) {
                micBtn.click();
            }
        }
        
        // V to toggle video
        if (e.key === 'v' && e.ctrlKey) {
            e.preventDefault();
            const camBtn = document.getElementById('camToggle');
            if (camBtn) {
                camBtn.click();
            }
        }
        
        // S to toggle screen share
        if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            const screenBtn = document.getElementById('screenShare');
            if (screenBtn) {
                screenBtn.click();
            }
        }
        
        // F for fullscreen
        if (e.key === 'f' && e.ctrlKey) {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // H for help
        if (e.key === 'h' && e.ctrlKey) {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

function showKeyboardShortcuts() {
    const shortcuts = `
اختصارات لوحة المفاتيح:
Ctrl+M - كتم/إلغاء كتم الميكروفون
Ctrl+V - تشغيل/إيقاف الكاميرا  
Ctrl+S - مشاركة الشاشة
Ctrl+F - ملء الشاشة
Ctrl+H - عرض هذه الاختصارات
    `;
    
    showNotification(shortcuts, 'info');
}

// =========================================
// NOTIFICATIONS
// =========================================

function initializeNotifications() {
    // System notifications
    const notifications = document.getElementById('notificationsContainer');
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('مرحباً بك في المنافسة المباشرة!', 'success');
    }, 2000);
    
    // Show periodic tips
    setTimeout(() => {
        showNotification('نصيحة: يمكنك تقييم المتنافسين بالنجوم', 'info');
    }, 30000);
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        borderLeft: `4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#FF6B6B' : type === 'warning' ? '#FFA500' : '#0A84FF'}`,
        zIndex: '1000',
        maxWidth: '350px',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    });
    
    // Add to notifications container or body
    const container = document.getElementById('notificationsContainer') || document.body;
    container.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #B0B0B0;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        margin-left: 1rem;
    `;
    
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// =========================================
// PERFORMANCE MONITORING
// =========================================

window.addEventListener('load', function() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Challenge Room loaded in ${loadTime}ms`);
    
    // Monitor connection quality
    if ('connection' in navigator) {
        const connection = navigator.connection;
        console.log('Connection type:', connection.effectiveType);
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            showNotification('الاتصال بطيء، قد تواجه تقطع في البث', 'warning');
        }
    }
});

// =========================================
// ACCESSIBILITY ENHANCEMENTS
// =========================================

function enhanceAccessibility() {
    // Add ARIA labels to interactive elements
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.setAttribute('aria-label', 'اكتب رسالتك في الدردشة');
        chatInput.setAttribute('aria-describedby', 'chat-help');
        
        const helpText = document.createElement('div');
        helpText.id = 'chat-help';
        helpText.textContent = 'اضغط Enter للإرسال';
        helpText.style.display = 'none';
        chatInput.parentNode.appendChild(helpText);
    }
    
    // Add role attributes
    const mainStream = document.querySelector('.main-stream');
    if (mainStream) {
        mainStream.setAttribute('role', 'region');
        mainStream.setAttribute('aria-label', 'البث المباشر للمنافسة');
    }
    
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.setAttribute('role', 'log');
        chatMessages.setAttribute('aria-live', 'polite');
    }
    
    // Announce important updates to screen readers
    function announceUpdate(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => announcement.remove(), 1000);
    }
    
    // Make announcement function global
    window.announceUpdate = announceUpdate;
}

// Initialize accessibility enhancements
enhanceAccessibility();