// =========================================
// Advanced Features & Future Enhancements
// =========================================

// Advanced Features Module
class DueliAdvanced {
    constructor() {
        this.init();
    }

    init() {
        this.initializeAdvancedFeatures();
        this.setupEventListeners();
    }

    // =========================================
    // Advanced Search with Autocomplete
    // =========================================
    
    initializeAdvancedFeatures() {
        this.setupAdvancedSearch();
        this.setupDarkMode();
        this.setupNotifications();
        this.setupAppInstallBanner();
        this.setupPerformanceMonitoring();
        this.setupOfflineSupport();
    }

    setupAdvancedSearch() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;

        // Create suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        searchInput.parentNode.appendChild(suggestionsContainer);

        // Search data
        this.searchData = [
            { term: 'حوار الأديان', type: 'category', count: 15 },
            { term: 'الذكاء الاصطناعي', type: 'topic', count: 8 },
            { term: 'أحمد محمد', type: 'competitor', count: 3 },
            { term: 'سارة أحمد', type: 'competitor', count: 5 },
            { term: 'البث المباشر', type: 'filter', count: 0 },
            { term: 'موسيقى', type: 'category', count: 12 },
            { term: 'حوار المذاهب', type: 'category', count: 7 }
        ];

        let activeSuggestionIndex = -1;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.updateSearchSuggestions(query, suggestionsContainer);
        });

        searchInput.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.search-suggestion');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, suggestions.length - 1);
                    this.updateActiveSuggestion(suggestions, activeSuggestionIndex);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
                    this.updateActiveSuggestion(suggestions, activeSuggestionIndex);
                    break;
                    
                case 'Enter':
                    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
                        e.preventDefault();
                        const suggestion = suggestions[activeSuggestionIndex];
                        searchInput.value = suggestion.dataset.term;
                        suggestionsContainer.style.display = 'none';
                        this.performAdvancedSearch(suggestion.dataset.term);
                    }
                    break;
                    
                case 'Escape':
                    suggestionsContainer.style.display = 'none';
                    activeSuggestionIndex = -1;
                    break;
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.parentNode.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    updateSearchSuggestions(query, container) {
        if (query.length < 2) {
            container.style.display = 'none';
            return;
        }

        const matches = this.searchData.filter(item => 
            item.term.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (matches.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = matches.map((match, index) => `
            <div class="search-suggestion" data-term="${match.term}" data-type="${match.type}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="suggestion-icon">${this.getSuggestionIcon(match.type)}</span>
                    <span class="suggestion-term">${this.highlightMatch(match.term, query)}</span>
                    ${match.count > 0 ? `<span class="suggestion-count">(${match.count})</span>` : ''}
                </div>
            </div>
        `).join('');

        container.style.display = 'block';

        // Add click handlers
        container.querySelectorAll('.search-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const searchInput = document.querySelector('.search-input');
                searchInput.value = suggestion.dataset.term;
                container.style.display = 'none';
                this.performAdvancedSearch(suggestion.dataset.term);
            });
        });
    }

    updateActiveSuggestion(suggestions, activeIndex) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('active', index === activeIndex);
        });
        
        if (activeIndex >= 0) {
            suggestions[activeIndex].scrollIntoView({
                block: 'nearest'
            });
        }
    }

    performAdvancedSearch(query) {
        const cards = document.querySelectorAll('.competition-card');
        let matchCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.competition-title').textContent.toLowerCase();
            const description = card.querySelector('.competition-desc').textContent.toLowerCase();
            const competitors = Array.from(card.querySelectorAll('.competitor-name'))
                .map(el => el.textContent.toLowerCase()).join(' ');

            const matches = 
                title.includes(query.toLowerCase()) ||
                description.includes(query.toLowerCase()) ||
                competitors.includes(query.toLowerCase());

            if (matches) {
                card.style.display = 'block';
                card.classList.add('search-result');
                this.highlightSearchTerms(card, query);
                matchCount++;
            } else {
                card.style.display = 'none';
                card.classList.remove('search-result');
                this.clearSearchHighlights(card);
            }
        });

        this.showSearchResults(matchCount, query);
    }

    showSearchResults(count, query) {
        let resultsMsg = document.querySelector('.search-results-message');
        
        if (count === 0) {
            if (!resultsMsg) {
                resultsMsg = document.createElement('div');
                resultsMsg.className = 'search-results-message';
                document.querySelector('.main-content .container').appendChild(resultsMsg);
            }
            resultsMsg.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">🔍</div>
                    <div class="error-title">لم يتم العثور على نتائج</div>
                    <div class="error-description">
                        لم نجد أي منافسات تطابق "${query}". جرب كلمات مختلفة أو تصفح الفئات.
                    </div>
                    <button class="error-action" onclick="this.clearSearch()">مسح البحث</button>
                </div>
            `;
        } else {
            if (resultsMsg) {
                resultsMsg.remove();
            }
        }
    }

    getSuggestionIcon(type) {
        const icons = {
            category: '📂',
            topic: '💡',
            competitor: '👤',
            filter: '🔧'
        };
        return icons[type] || '🔍';
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    highlightSearchTerms(card, query) {
        const elements = card.querySelectorAll('.competition-title, .competition-desc, .competitor-name');
        elements.forEach(element => {
            const text = element.textContent;
            const highlighted = this.highlightMatch(text, query);
            element.innerHTML = highlighted;
        });
    }

    clearSearchHighlights(card) {
        const highlights = card.querySelectorAll('mark');
        highlights.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }

    // =========================================
    // Dark Mode Toggle
    // =========================================

    setupDarkMode() {
        // Create mode toggle button
        const modeToggle = document.createElement('div');
        modeToggle.className = 'mode-toggle';
        modeToggle.innerHTML = `
            <button class="dark-mode-btn" title="الوضع المظلم" aria-label="تفعيل الوضع المظلم">
                🌙
            </button>
            <button class="light-mode-btn" title="الوضع الفاتح" aria-label="تفعيل الوضع الفاتح">
                ☀️
            </button>
        `;
        document.body.appendChild(modeToggle);

        const darkBtn = modeToggle.querySelector('.dark-mode-btn');
        const lightBtn = modeToggle.querySelector('.light-mode-btn');

        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem('duelik-theme');
        const currentMode = savedMode || (prefersDark ? 'dark' : 'light');

        this.setMode(currentMode);

        // Event listeners
        darkBtn.addEventListener('click', () => this.setMode('dark'));
        lightBtn.addEventListener('click', () => this.setMode('light'));

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('duelik-theme')) {
                this.setMode(e.matches ? 'dark' : 'light');
            }
        });
    }

    setMode(mode) {
        const isDark = mode === 'dark';
        
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            localStorage.setItem('duelik-theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            localStorage.setItem('duelik-theme', 'light');
        }

        // Update toggle buttons
        document.querySelector('.dark-mode-btn').classList.toggle('active', isDark);
        document.querySelector('.light-mode-btn').classList.toggle('active', !isDark);

        // Announce theme change
        this.announce(`تم التبديل إلى ${isDark ? 'الوضع المظلم' : 'الوضع الفاتح'}`);
    }

    // =========================================
    // Notification System
    // =========================================

    setupNotifications() {
        this.createNotificationContainer();
        this.setupNotificationTriggers();
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    setupNotificationTriggers() {
        // Add demo notification triggers
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showNotification('info', 'إشعار تجريبي', 'هذا إشعار تجريبي يمكنك إغلاقه');
            }
        });
    }

    showNotification(type, title, message, duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="إغلاق">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                </svg>
            </button>
        `;

        // Add close handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        container.appendChild(notification);

        // Announce to screen readers
        this.announce(`${title}: ${message}`);
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // =========================================
    // PWA App Install Banner
    // =========================================

    setupAppInstallBanner() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallBanner();
        });

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Show banner after some time if PWA is available
        setTimeout(() => {
            if (deferredPrompt) {
                this.showInstallBanner();
            }
        }, 30000); // Show after 30 seconds
    }

    showInstallBanner() {
        if (document.querySelector('.app-install-banner')) return;

        const banner = document.createElement('div');
        banner.className = 'app-install-banner';
        banner.innerHTML = `
            <div class="install-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
            </div>
            <div class="install-content">
                <div class="install-title">تثبيت تطبيق Dueli</div>
                <div class="install-description">احصل على تجربة أفضل مع التطبيق المخصص</div>
            </div>
            <div class="install-actions">
                <button class="install-btn">تثبيت</button>
                <button class="dismiss-btn">لاحقاً</button>
            </div>
        `;

        document.body.appendChild(banner);
        
        // Show with animation
        setTimeout(() => banner.classList.add('show'), 100);

        // Event handlers
        const installBtn = banner.querySelector('.install-btn');
        const dismissBtn = banner.querySelector('.dismiss-btn');

        installBtn.addEventListener('click', () => {
            this.installApp(banner);
        });

        dismissBtn.addEventListener('click', () => {
            this.dismissInstallBanner(banner);
        });

        // Auto dismiss after 10 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                this.dismissInstallBanner(banner);
            }
        }, 10000);
    }

    async installApp(banner) {
        // Check if we have the deferred prompt
        const deferredPrompt = window.deferredPrompt;
        
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showNotification('success', 'تثبيت ناجح', 'تم تثبيت التطبيق بنجاح!');
            }
            
            deferredPrompt = null;
        } else {
            this.showNotification('info', 'تثبيت التطبيق', 'زر التطبيق في قائمة المتصفح أو شريط المهام');
        }
        
        this.dismissInstallBanner(banner);
    }

    dismissInstallBanner(banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        }, 300);
    }

    // =========================================
    // Performance Monitoring
    // =========================================

    setupPerformanceMonitoring() {
        // Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // First Input Delay
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            }).observe({ type: 'first-input', buffered: true });

            // Cumulative Layout Shift
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        console.log('CLS:', clsValue);
                    }
                });
            }).observe({ type: 'layout-shift', buffered: true });
        }

        // Memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                
                if (usagePercent > 80) {
                    this.showNotification('warning', 'استخدام ذاكرة عالي', 
                        `التطبيق يستخدم ${usagePercent.toFixed(1)}% من الذاكرة المتاحة`);
                }
            }, 30000); // Check every 30 seconds
        }
    }

    // =========================================
    // Offline Support
    // =========================================

    setupOfflineSupport() {
        window.addEventListener('online', () => {
            this.showNotification('success', 'الاتصال متصل', 'تم استعادة الاتصال بالإنترنت');
            document.body.classList.remove('offline');
        });

        window.addEventListener('offline', () => {
            this.showNotification('warning', 'غير متصل', 'لا يوجد اتصال بالإنترنت');
            document.body.classList.add('offline');
        });

        // Show offline indicator
        this.createOfflineIndicator();
    }

    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.innerHTML = '🔌 غير متصل';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--status-warning);
            color: white;
            text-align: center;
            padding: var(--space-xs);
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 1001;
            transform: translateY(-100%);
            transition: transform var(--transition-normal);
        `;

        document.body.appendChild(indicator);

        // Show/hide based on connection
        const updateIndicator = () => {
            if (!navigator.onLine) {
                indicator.style.transform = 'translateY(0)';
            } else {
                indicator.style.transform = 'translateY(-100%)';
            }
        };

        window.addEventListener('online', updateIndicator);
        window.addEventListener('offline', updateIndicator);
        updateIndicator();
    }

    // =========================================
    // Utilities
    // =========================================

    announce(message) {
        const announcer = document.getElementById('announcer');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / for help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
    }

    showKeyboardShortcuts() {
        this.showNotification('info', 'اختصارات لوحة المفاتيح', `
            Ctrl+K: البحث<br>
            Ctrl+N: إشعار تجريبي<br>
            Ctrl+/: المساعدة<br>
            Escape: إغلاق النوافذ
        `, 10000);
    }

    // Method to clear search (for error state buttons)
    clearSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        }
    }
}

// Initialize advanced features
document.addEventListener('DOMContentLoaded', () => {
    new DueliAdvanced();
});

// Export for use in other scripts
window.DueliAdvanced = DueliAdvanced;