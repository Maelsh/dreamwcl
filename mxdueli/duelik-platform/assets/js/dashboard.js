// =========================================
// DASHBOARD JAVASCRIPT
// Dashboard Page Functionality
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Initialize all dashboard components
    initializeHeader();
    initializeSearch();
    initializeProfileDropdown();
    initializeNotifications();
    initializeMessages();
    initializeQuickActions();
    initializeStats();
    initializeRecentChallenges();
    initializeTrendingChallenges();
    initializeRecommendations();
    
    // Start real-time updates
    initializeRealTimeUpdates();
});


// =========================================
// HEADER COMPONENTS
// =========================================

function initializeHeader() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keydown', handleSearchKeydown);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
}

function handleSearch(e) {
    const query = e.target.value.trim();
    
    if (query.length > 2) {
        // Show search suggestions
        showSearchSuggestions(query);
    } else {
        hideSearchSuggestions();
    }
    
    // If pressed Enter, perform search
    if (e.type === 'keydown' && e.key === 'Enter') {
        performSearch(query);
    }
}

function handleSearchKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch(e.target.value.trim());
    }
}

function performSearch(query) {
    if (query.length < 2) return;
    
    showNotification(`البحث عن: ${query}`, 'info');
    
    // In real app, this would navigate to search results page
    setTimeout(() => {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }, 1000);
}

function showSearchSuggestions(query) {
    // Remove existing suggestions
    hideSearchSuggestions();
    
    const suggestions = generateSearchSuggestions(query);
    
    if (suggestions.length === 0) return;
    
    const searchContainer = document.querySelector('.search-container');
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'search-suggestions';
    suggestionsDiv.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item" data-query="${suggestion}">${suggestion}</div>`
    ).join('');
    
    searchContainer.appendChild(suggestionsDiv);
    
    // Add click handlers
    suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.value = query;
            }
            performSearch(query);
            hideSearchSuggestions();
        });
    });
    
    // Position suggestions
    positionSuggestions(suggestionsDiv);
}

function hideSearchSuggestions() {
    const suggestions = document.querySelector('.search-suggestions');
    if (suggestions) {
        suggestions.remove();
    }
}

function generateSearchSuggestions(query) {
    const suggestions = [
        'مناظرة الذكاء الاصطناعي',
        'تحدي الحلول التقنية',
        'أحمد محمد',
        'سارة أحمد',
        'الحوار العلمي',
        'تحدي المواهب'
    ];
    
    return suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
}

function positionSuggestions(element) {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        const rect = searchInput.getBoundingClientRect();
        element.style.position = 'absolute';
        element.style.top = rect.height + 'px';
        element.style.left = '0';
        element.style.right = '0';
        element.style.zIndex = '100';
    }
}

// =========================================
// PROFILE DROPDOWN
// =========================================

function initializeProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileBtn && dropdown) {
        // Toggle dropdown
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
        
        // Handle dropdown items
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!this.href || this.href === '#') {
                    e.preventDefault();
                    handleDropdownAction(this);
                }
            });
        });
    }
}

function handleDropdownAction(item) {
    const text = item.textContent.trim();
    
    switch (text) {
        case 'عرض البروفايل':
            window.location.href = '../profile.html';
            break;
        case 'الإعدادات':
            window.location.href = 'settings.html';
            break;
        case 'تسجيل الخروج':
            handleLogout();
            break;
    }
}

function handleLogout() {
    // Show confirmation
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        showNotification('تم تسجيل الخروج بنجاح', 'success');
        
        // Clear user session
        localStorage.removeItem('userSession');
        sessionStorage.clear();
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }
}

// =========================================
// NOTIFICATIONS SYSTEM
// =========================================

function initializeNotifications() {
    const notificationBtn = document.getElementById('notificationsBtn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            toggleNotifications(this);
        });
    }
}

function toggleNotifications(button) {
    // In real app, this would show a notification panel
    showNotification('لا توجد إشعارات جديدة', 'info');
    
    // Clear notification badge
    const badge = button.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

// =========================================
// MESSAGES SYSTEM
// =========================================

function initializeMessages() {
    const messageBtn = document.getElementById('messagesBtn');
    
    if (messageBtn) {
        messageBtn.addEventListener('click', function() {
            toggleMessages(this);
        });
    }
}

function toggleMessages(button) {
    // In real app, this would show a messages panel
    showNotification('لا توجد رسائل جديدة', 'info');
    
    // Clear message badge
    const badge = button.querySelector('.message-badge');
    if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

// =========================================
// QUICK ACTIONS
// =========================================

function initializeQuickActions() {
    const createChallengeBtn = document.querySelector('.welcome-section .btn');
    
    if (createChallengeBtn) {
        createChallengeBtn.addEventListener('click', function() {
            window.location.href = 'create-challenge.html';
        });
    }
}

// =========================================
// STATISTICS UPDATES
// =========================================

function initializeStats() {
    // Update stats with animation
    animateStatsCounters();
    
    // Setup real-time updates for stats
    setInterval(updateLiveStats, 30000); // Update every 30 seconds
}

function animateStatsCounters() {
    const statNumbers = document.querySelectorAll('.stat-number, .stat-card h3');
    
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        const numericValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
        
        if (numericValue && numericValue > 0) {
            animateCounter(stat, 0, numericValue, 1500);
        }
    });
}

function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeProgress = progress * (2 - progress);
        
        const current = Math.floor(start + (end - start) * easeProgress);
        const originalText = element.textContent;
        
        // Preserve formatting (currency, decimals, etc.)
        if (originalText.includes('$')) {
            element.textContent = `$${current.toLocaleString()}`;
        } else if (originalText.includes(',')) {
            element.textContent = current.toLocaleString();
        } else {
            element.textContent = current.toString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function updateLiveStats() {
    // Simulate real-time stat updates
    const viewsStat = document.querySelector('.stat-card .stat-number');
    if (viewsStat) {
        const currentViews = parseInt(viewsStat.textContent.replace(/,/g, ''));
        const newViews = currentViews + Math.floor(Math.random() * 10);
        viewsStat.textContent = newViews.toLocaleString();
    }
}

// =========================================
// RECENT CHALLENGES
// =========================================

function initializeRecentChallenges() {
    const challengeItems = document.querySelectorAll('.challenge-item');
    
    challengeItems.forEach(item => {
        const challengeBtn = item.querySelector('.btn');
        
        if (challengeBtn) {
            challengeBtn.addEventListener('click', function() {
                handleChallengeAction(item, this.textContent.trim());
            });
        }
        
        // Add hover effects
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function handleChallengeAction(challengeItem, actionText) {
    const title = challengeItem.querySelector('h4').textContent;
    
    switch (actionText) {
        case 'مشاهدة':
            // Navigate to live challenge room
            window.location.href = 'challenge-room.html';
            break;
        case 'إعادة مشاهدة':
            // Navigate to recorded challenge
            showNotification(`مشاهدة ${title}`, 'info');
            break;
        case 'تذكير':
            showNotification(`تم تعيين تذكير لـ ${title}`, 'success');
            break;
    }
}

// =========================================
// TRENDING CHALLENGES
// =========================================

function initializeTrendingChallenges() {
    const trendCards = document.querySelectorAll('.trend-card');
    
    trendCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h4').textContent;
            showNotification(`فتح ${title}`, 'info');
            
            // Navigate to challenge
            setTimeout(() => {
                window.location.href = 'challenge-room.html';
            }, 500);
        });
    });
}

// =========================================
// RECOMMENDATIONS
// =========================================

function initializeRecommendations() {
    // User recommendations
    const followButtons = document.querySelectorAll('.recommended-users .btn');
    
    followButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const userName = this.closest('.user-item').querySelector('h4').textContent;
            handleFollowAction(this, userName);
        });
    });
}

function handleFollowAction(button, userName) {
    const isFollowing = button.textContent.trim() === 'متابعة';
    
    if (isFollowing) {
        button.textContent = 'إلغاء المتابعة';
        button.classList.remove('btn-outline');
        button.classList.add('btn-primary');
        showNotification(`تم متابعة ${userName}`, 'success');
    } else {
        button.textContent = 'متابعة';
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline');
        showNotification(`تم إلغاء متابعة ${userName}`, 'info');
    }
}

// =========================================
// REAL-TIME UPDATES
// =========================================

function initializeRealTimeUpdates() {
    // Start WebSocket simulation for real-time updates
    startRealtimeSimulation();
}

function startRealtimeSimulation() {
    // Simulate real-time viewer count updates
    setInterval(updateViewerCount, 10000); // Every 10 seconds
    
    // Simulate live challenge updates
    setInterval(checkLiveChallenges, 5000); // Every 5 seconds
}

function updateViewerCount() {
    const viewerCounts = document.querySelectorAll('.viewer-count');
    
    viewerCounts.forEach(element => {
        const currentCount = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const change = Math.floor(Math.random() * 20) - 10; // Random change between -10 and +10
        const newCount = Math.max(0, currentCount + change);
        element.textContent = `${newCount.toLocaleString()} مشاهدة`;
        
        // Add visual feedback for changes
        if (change > 0) {
            element.style.color = '#4CAF50';
            setTimeout(() => element.style.color = '', 2000);
        } else if (change < 0) {
            element.style.color = '#FF6B6B';
            setTimeout(() => element.style.color = '', 2000);
        }
    });
}

function checkLiveChallenges() {
    // Check for new live challenges
    const liveBadges = document.querySelectorAll('.live-badge');
    
    liveBadges.forEach(badge => {
        // Randomly update viewer counts for live challenges
        const parent = badge.closest('.challenge-item, .trend-card');
        if (parent) {
            const viewerElement = parent.querySelector('.viewers, .viewer-count');
            if (viewerElement) {
                const currentCount = parseInt(viewerElement.textContent.replace(/[^0-9]/g, ''));
                const newCount = currentCount + Math.floor(Math.random() * 5);
                viewerElement.textContent = `${newCount.toLocaleString()} مشاهد`;
            }
        }
    });
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

function showNotification(message, type = 'info') {
    // Create notification element
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
        borderLeft: `4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#FF6B6B' : '#0A84FF'}`,
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

// Debounce function for search
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
    // Ctrl+K for search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Ctrl+N for new challenge
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        window.location.href = 'create-challenge.html';
    }
    
    // Ctrl+P for profile
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.location.href = '../profile.html';
    }
});

// =========================================
// PERFORMANCE MONITORING
// =========================================

// Monitor page performance
window.addEventListener('load', function() {
    // Track page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Dashboard loaded in ${loadTime}ms`);
    
    // Report slow loading
    if (loadTime > 3000) {
        showNotification('تحذير: الصفحة تستغرق وقتاً طويلاً في التحميل', 'warning');
    }
});

// =========================================
// ACCESSIBILITY ENHANCEMENTS
// =========================================

// Add ARIA labels for better screen reader support
function enhanceAccessibility() {
    // Add aria-labels to interactive elements
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.setAttribute('aria-label', 'البحث في المنافسات والمستخدمين');
    }
    
    const createBtn = document.querySelector('.welcome-section .btn');
    if (createBtn) {
        createBtn.setAttribute('aria-label', 'إنشاء منافسة جديدة');
    }
    
    // Add role attributes
    const dashboardMain = document.querySelector('.dashboard-main');
    if (dashboardMain) {
        dashboardMain.setAttribute('role', 'main');
    }
}

// Initialize accessibility enhancements
enhanceAccessibility();

// =========================================
// OFFLINE SUPPORT
// =========================================

// Handle offline/online status
window.addEventListener('online', function() {
    showNotification('تم استعادة الاتصال بالإنترنت', 'success');
});

window.addEventListener('offline', function() {
    showNotification('انقطع الاتصال بالإنترنت. بعض الميزات قد لا تعمل.', 'warning');
    
    // Enable offline mode features
    enableOfflineMode();
});

function enableOfflineMode() {
    // Disable real-time updates
    clearInterval();
    
    // Show offline indicator
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.innerHTML = '⚠️ وضع عدم الاتصال';
    offlineIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(255, 165, 0, 0.9);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        z-index: 1000;
    `;
    
    document.body.appendChild(offlineIndicator);
}