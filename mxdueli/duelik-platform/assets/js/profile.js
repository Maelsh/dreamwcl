// =========================================
// PROFILE JAVASCRIPT
// Profile Page Functionality
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page initialized');
    
    // Initialize profile components
    initializeNavigation();
    initializeProfileActions();
    initializeChallengeFilters();
    initializeFollowSystem();
    initializeStatsAnimation();
    initializeRecommendations();
    initializeSearchFunctionality();
    
    // Load profile data
    loadProfileData();
    
    // Start real-time updates
    initializeRealTimeUpdates();
});

let currentTab = 'overview';

// =========================================
// NAVIGATION SYSTEM
// =========================================

function initializeNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });
    
    // Initialize default tab
    switchToTab('overview');
}

function switchToTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}Tab`);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.classList.add('fade-in');
    }
    
    // Update current tab
    currentTab = tabName;
    
    // Load tab-specific data
    loadTabData(tabName);
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'challenges':
            loadChallengesData();
            break;
        case 'achievements':
            loadAchievementsData();
            break;
        case 'followers':
            loadFollowersData();
            break;
        case 'following':
            loadFollowingData();
            break;
    }
}

// =========================================
// PROFILE ACTIONS
// =========================================

function initializeProfileActions() {
    const followBtn = document.getElementById('followBtn');
    const messageBtn = document.getElementById('messageBtn');
    const shareProfileBtn = document.getElementById('shareProfileBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (followBtn) {
        followBtn.addEventListener('click', handleFollowAction);
    }
    
    if (messageBtn) {
        messageBtn.addEventListener('click', handleMessageAction);
    }
    
    if (shareProfileBtn) {
        shareProfileBtn.addEventListener('click', handleShareProfile);
    }
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', handleEditProfile);
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', handleSettings);
    }
    
    // Challenge action buttons
    const challengeButtons = document.querySelectorAll('.challenge-card .btn');
    challengeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const challengeCard = this.closest('.challenge-card');
            const buttonText = this.textContent.trim();
            handleChallengeAction(challengeCard, buttonText);
        });
    });
}

function handleFollowAction() {
    const followBtn = document.getElementById('followBtn');
    const isFollowing = followBtn.textContent.trim() === 'متابعة';
    
    if (isFollowing) {
        // Unfollow
        followBtn.textContent = 'إلغاء المتابعة';
        followBtn.classList.remove('btn-primary');
        followBtn.classList.add('btn-outline');
        
        updateFollowerCount(-1);
        showNotification('تم إلغاء المتابعة', 'info');
        
        // In real app, this would make API call
        console.log('User unfollowed');
    } else {
        // Follow
        followBtn.textContent = 'إلغاء المتابعة';
        followBtn.classList.remove('btn-outline');
        followBtn.classList.add('btn-primary');
        
        updateFollowerCount(1);
        showNotification('تم المتابعة بنجاح', 'success');
        
        // In real app, this would make API call
        console.log('User followed');
    }
}

function updateFollowerCount(change) {
    const followerCountElement = document.querySelector('.stat-item .stat-number');
    if (followerCountElement) {
        const currentCount = parseInt(followerCountElement.textContent.replace(/,/g, ''));
        const newCount = Math.max(0, currentCount + change);
        followerCountElement.textContent = newCount.toLocaleString();
        
        // Animate the change
        followerCountElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            followerCountElement.style.transform = 'scale(1)';
        }, 200);
    }
}

function handleMessageAction() {
    // Check if user is logged in and not themselves
    const profileName = document.querySelector('.profile-info h1').textContent;
    
    if (confirm(`هل تريد إرسال رسالة إلى ${profileName}؟`)) {
        showNotification('فتح نافذة الرسائل...', 'info');
        
        // In real app, this would open messaging interface
        setTimeout(() => {
            window.location.href = 'messages.html';
        }, 1000);
    }
}

function handleShareProfile() {
    const profileUrl = window.location.href;
    const profileName = document.querySelector('.profile-info h1').textContent;
    
    const shareData = {
        title: `بروفايل ${profileName} - Dueli`,
        text: `شاهد بروفايل ${profileName} على Dueli`,
        url: profileUrl
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(profileUrl).then(() => {
            showNotification('تم نسخ رابط البروفايل', 'success');
        }).catch(() => {
            showNotification('فشل في نسخ الرابط', 'error');
        });
    }
}

function handleEditProfile() {
    showNotification('فتح نموذج تعديل البروفايل...', 'info');
    
    // In real app, this would open profile edit modal or page
    setTimeout(() => {
        window.location.href = 'edit-profile.html';
    }, 1000);
}

function handleSettings() {
    showNotification('فتح الإعدادات...', 'info');
    
    // In real app, this would open settings page
    setTimeout(() => {
        window.location.href = 'settings.html';
    }, 1000);
}

function handleChallengeAction(challengeCard, actionText) {
    const challengeTitle = challengeCard.querySelector('h3').textContent;
    const challengeStatus = challengeCard.querySelector('.status-badge').textContent;
    
    switch (actionText) {
        case 'مشاهدة':
            if (challengeStatus === 'مباشر') {
                window.location.href = 'challenge-room.html';
            } else {
                showNotification(`مشاهدة ${challengeTitle}`, 'info');
            }
            break;
        case 'إعادة مشاهدة':
            showNotification(`إعادة مشاهدة ${challengeTitle}`, 'info');
            break;
        default:
            console.log('Unknown challenge action:', actionText);
    }
}

// =========================================
// CHALLENGE FILTERS
// =========================================

function initializeChallengeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setActiveFilter(this);
            filterChallenges(filter);
        });
    });
}

function setActiveFilter(activeFilter) {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(filter => filter.classList.remove('active'));
    activeFilter.classList.add('active');
}

function filterChallenges(filter) {
    const challengeCards = document.querySelectorAll('.challenge-card');
    
    challengeCards.forEach(card => {
        const status = card.querySelector('.status-badge');
        
        let shouldShow = true;
        
        switch (filter) {
            case 'all':
                shouldShow = true;
                break;
            case 'upcoming':
                shouldShow = status.textContent.includes('قادمة');
                break;
            case 'live':
                shouldShow = status.textContent.includes('مباشر');
                break;
            case 'completed':
                shouldShow = status.textContent.includes('منتهية') || status.textContent.includes('فوز');
                break;
            case 'won':
                shouldShow = card.classList.contains('won');
                break;
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

// =========================================
// FOLLOW SYSTEM
// =========================================

function initializeFollowSystem() {
    const followButtons = document.querySelectorAll('.user-item .btn');
    
    followButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userItem = this.closest('.user-item');
            const userName = userItem.querySelector('h3, h4').textContent;
            handleUserFollow(this, userName);
        });
    });
}

function handleUserFollow(button, userName) {
    const isFollowing = button.textContent.trim() === 'متابعة';
    
    if (isFollowing) {
        // Follow user
        button.textContent = 'إلغاء المتابعة';
        button.classList.remove('btn-outline');
        button.classList.add('btn-primary');
        
        showNotification(`تم متابعة ${userName}`, 'success');
    } else {
        // Unfollow user
        button.textContent = 'متابعة';
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline');
        
        showNotification(`تم إلغاء متابعة ${userName}`, 'info');
    }
    
    // In real app, this would make API call
    console.log(`${isFollowing ? 'Following' : 'Unfollowing'}: ${userName}`);
}

// =========================================
// STATISTICS ANIMATION
// =========================================

function initializeStatsAnimation() {
    // Animate stats on page load
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        const numericValue = parseFloat(finalValue.replace(/[^0-9.]/g, ''));
        
        if (numericValue && !isNaN(numericValue)) {
            animateStatNumber(stat, 0, numericValue, 1500, finalValue.includes('$') ? '$' : '', finalValue.includes(',') ? ',' : '');
        }
    });
}

function animateStatNumber(element, start, end, duration, prefix = '', suffix = '') {
    const startTime = performance.now();
    
    function updateStat(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeProgress = progress * (2 - progress);
        
        const current = start + (end - start) * easeProgress;
        let displayValue = Math.floor(current);
        
        // Format number
        if (suffix === ',') {
            displayValue = displayValue.toLocaleString();
        }
        
        element.textContent = prefix + displayValue + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateStat);
        }
    }
    
    requestAnimationFrame(updateStat);
}

// =========================================
// RECOMMENDATIONS
// =========================================

function initializeRecommendations() {
    const recommendButtons = document.querySelectorAll('.sidebar-section .btn');
    
    recommendButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userItem = this.closest('.user-item');
            const userName = userItem.querySelector('h4').textContent;
            
            handleUserFollow(this, userName);
        });
    });
    
    // Popular challenges
    const challengeMinis = document.querySelectorAll('.challenge-mini');
    challengeMinis.forEach(challenge => {
        challenge.addEventListener('click', function() {
            const challengeTitle = this.querySelector('h4').textContent;
            showNotification(`فتح ${challengeTitle}`, 'info');
            
            // In real app, this would navigate to challenge
        });
    });
}

// =========================================
// SEARCH FUNCTIONALITY
// =========================================

function initializeSearchFunctionality() {
    // Add search to profile if not exists
    if (!document.querySelector('.search-container')) {
        addProfileSearch();
    }
}

function addProfileSearch() {
    const profileHeader = document.querySelector('.profile-actions');
    if (profileHeader) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" class="search-input" placeholder="البحث في البروفايل...">
            <button class="search-btn">🔍</button>
        `;
        
        // Insert before profile actions
        profileHeader.parentNode.insertBefore(searchContainer, profileHeader);
        
        // Add search functionality
        const searchInput = searchContainer.querySelector('.search-input');
        const searchBtn = searchContainer.querySelector('.search-btn');
        
        searchInput.addEventListener('input', debounce(handleProfileSearch, 300));
        searchBtn.addEventListener('click', () => handleProfileSearch({ target: searchInput }));
    }
}

function handleProfileSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        clearSearchHighlights();
        return;
    }
    
    highlightSearchResults(query);
}

function highlightSearchResults(query) {
    // Clear previous highlights
    clearSearchHighlights();
    
    // Search in different sections based on current tab
    switch (currentTab) {
        case 'overview':
            searchInOverview(query);
            break;
        case 'challenges':
            searchInChallenges(query);
            break;
        case 'achievements':
            searchInAchievements(query);
            break;
    }
}

function searchInOverview(query) {
    const bioElement = document.querySelector('.profile-bio');
    const infoItems = document.querySelectorAll('.info-item .info-value');
    
    if (bioElement && bioElement.textContent.toLowerCase().includes(query)) {
        highlightText(bioElement, query);
    }
    
    infoItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(query)) {
            highlightText(item, query);
        }
    });
}

function searchInChallenges(query) {
    const challengeCards = document.querySelectorAll('.challenge-card');
    
    challengeCards.forEach(card => {
        const title = card.querySelector('h3');
        const description = card.querySelector('.challenge-desc');
        
        if (title && title.textContent.toLowerCase().includes(query)) {
            highlightText(title, query);
            card.style.borderColor = '#0A84FF';
        }
        
        if (description && description.textContent.toLowerCase().includes(query)) {
            highlightText(description, query);
            card.style.borderColor = '#0A84FF';
        }
    });
}

function searchInAchievements(query) {
    const achievementCards = document.querySelectorAll('.achievement-card');
    
    achievementCards.forEach(card => {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');
        
        if (title && title.textContent.toLowerCase().includes(query)) {
            highlightText(title, query);
        }
        
        if (description && description.textContent.toLowerCase().includes(query)) {
            highlightText(description, query);
        }
    });
}

function highlightText(element, query) {
    const text = element.textContent;
    const regex = new RegExp(`(${query})`, 'gi');
    const highlightedText = text.replace(regex, '<mark>$1</mark>');
    
    element.innerHTML = highlightedText;
}

function clearSearchHighlights() {
    const highlightedElements = document.querySelectorAll('mark');
    highlightedElements.forEach(mark => {
        const parent = mark.parentNode;
        parent.textContent = parent.textContent; // Remove mark tags
    });
    
    // Reset challenge borders
    const challengeCards = document.querySelectorAll('.challenge-card');
    challengeCards.forEach(card => {
        card.style.borderColor = '';
    });
}

// =========================================
// DATA LOADING
// =========================================

function loadProfileData() {
    // Simulate loading profile data
    console.log('Loading profile data...');
    
    // In real app, this would fetch from API
    setTimeout(() => {
        console.log('Profile data loaded');
    }, 1000);
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'challenges':
            loadChallengesData();
            break;
        case 'achievements':
            loadAchievementsData();
            break;
        case 'followers':
            loadFollowersData();
            break;
        case 'following':
            loadFollowingData();
            break;
    }
}

function loadChallengesData() {
    // Simulate loading challenges data
    const challengesList = document.querySelector('.challenges-list');
    if (challengesList) {
        // Add loading state
        challengesList.style.opacity = '0.5';
        
        setTimeout(() => {
            challengesList.style.opacity = '1';
        }, 500);
    }
}

function loadAchievementsData() {
    // Simulate loading achievements data
    const achievementsGrid = document.querySelector('.achievements-grid');
    if (achievementsGrid) {
        achievementsGrid.style.opacity = '0.5';
        
        setTimeout(() => {
            achievementsGrid.style.opacity = '1';
        }, 500);
    }
}

function loadFollowersData() {
    // Simulate loading followers data
    const followersGrid = document.querySelector('.followers-grid');
    if (followersGrid) {
        followersGrid.style.opacity = '0.5';
        
        setTimeout(() => {
            followersGrid.style.opacity = '1';
        }, 500);
    }
}

function loadFollowingData() {
    // Simulate loading following data
    const followingGrid = document.querySelector('.following-grid');
    if (followingGrid) {
        followingGrid.style.opacity = '0.5';
        
        setTimeout(() => {
            followingGrid.style.opacity = '1';
        }, 500);
    }
}

// =========================================
// REAL-TIME UPDATES
// =========================================

function initializeRealTimeUpdates() {
    // Update follower count periodically
    setInterval(updateLiveFollowerCount, 60000);
    
    // Update challenge stats
    setInterval(updateChallengeStats, 30000);
    
    // Check for new achievements
    setInterval(checkNewAchievements, 120000);
}

function updateLiveFollowerCount() {
    // Simulate real-time follower count changes
    const followerCountElement = document.querySelector('.stat-item .stat-number');
    if (followerCountElement && Math.random() > 0.8) { // 20% chance
        const currentCount = parseInt(followerCountElement.textContent.replace(/,/g, ''));
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newCount = Math.max(0, currentCount + change);
        
        if (change !== 0) {
            followerCountElement.textContent = newCount.toLocaleString();
            
            // Visual feedback
            followerCountElement.style.color = change > 0 ? '#4CAF50' : '#FF6B6B';
            setTimeout(() => {
                followerCountElement.style.color = '';
            }, 2000);
            
            // Show notification for new followers
            if (change > 0) {
                showNotification('حصلت على متابع جديد! 🎉', 'success');
            }
        }
    }
}

function updateChallengeStats() {
    // Update challenge view counts
    const viewsElements = document.querySelectorAll('.views');
    viewsElements.forEach(element => {
        if (Math.random() > 0.9) { // 10% chance
            const currentViews = parseInt(element.textContent.replace(/,/g, ''));
            const newViews = currentViews + Math.floor(Math.random() * 10);
            element.textContent = `${newViews.toLocaleString()} مشاهدة`;
        }
    });
}

function checkNewAchievements() {
    // Simulate earning new achievements
    if (Math.random() > 0.95) { // 5% chance
        showNotification('مبروك! حصلت على إنجاز جديد 🏆', 'success');
        
        // In real app, this would trigger achievement modal
    }
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
    
    // Add to page
    document.body.appendChild(notification);
    
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

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener('keydown', function(e) {
    // Ctrl+T to switch tabs
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        cycleTabs();
    }
    
    // Number keys to switch to specific tabs
    if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['overview', 'challenges', 'achievements', 'followers', 'following'];
        if (tabs[tabIndex]) {
            switchToTab(tabs[tabIndex]);
        }
    }
    
    // F for follow/unfollow
    if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            followBtn.click();
        }
    }
    
    // M for message
    if (e.key === 'm' && e.ctrlKey) {
        e.preventDefault();
        const messageBtn = document.getElementById('messageBtn');
        if (messageBtn) {
            messageBtn.click();
        }
    }
});

function cycleTabs() {
    const tabs = ['overview', 'challenges', 'achievements', 'followers', 'following'];
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    switchToTab(tabs[nextIndex]);
}

// =========================================
// ACCESSIBILITY ENHANCEMENTS
// =========================================

function enhanceAccessibility() {
    // Add ARIA labels to navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', tab.classList.contains('active'));
        tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
    });
    
    // Add ARIA labels to tab panels
    const tabPanels = document.querySelectorAll('.tab-content');
    tabPanels.forEach(panel => {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-hidden', !panel.classList.contains('active'));
    });
    
    // Add ARIA labels to buttons
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
        followBtn.setAttribute('aria-describedby', 'follow-help');
        
        const helpText = document.createElement('div');
        helpText.id = 'follow-help';
        helpText.textContent = 'اضغط للمتابعة أو إلغاء المتابعة';
        helpText.style.display = 'none';
        followBtn.parentNode.appendChild(helpText);
    }
    
    // Announce tab changes to screen readers
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (mutation.target.classList.contains('nav-tab')) {
                    const tabName = mutation.target.getAttribute('data-tab');
                    const isActive = mutation.target.classList.contains('active');
                    
                    if (isActive) {
                        announceTabChange(tabName);
                    }
                }
            }
        });
    });
    
    // Observe tab changes
    document.querySelectorAll('.nav-tab').forEach(tab => {
        observer.observe(tab, { attributes: true });
    });
}

function announceTabChange(tabName) {
    const announcements = {
        'overview': 'تم التبديل إلى تبويب نظرة عامة',
        'challenges': 'تم التبديل إلى تبويب المنافسات',
        'achievements': 'تم التبديل إلى تبويب الإنجازات',
        'followers': 'تم التبديل إلى تبويب المتابعين',
        'following': 'تم التبديل إلى تبويب المتابعة'
    };
    
    const message = announcements[tabName] || `تم التبديل إلى تبويب ${tabName}`;
    announceToScreenReader(message);
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => announcement.remove(), 1000);
}

// Initialize accessibility enhancements
enhanceAccessibility();

// =========================================
// PERFORMANCE MONITORING
// =========================================

window.addEventListener('load', function() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Profile page loaded in ${loadTime}ms`);
    
    // Monitor profile interaction time
    const interactionStart = Date.now();
    
    window.addEventListener('beforeunload', function() {
        const interactionTime = Math.floor((Date.now() - interactionStart) / 1000);
        console.log(`User spent ${interactionTime} seconds on profile page`);
    });
});