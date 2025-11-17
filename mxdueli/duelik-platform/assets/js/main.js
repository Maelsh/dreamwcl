// =========================================
// Dueli Platform - Main JavaScript
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dueli Platform initialized');
    
    // Initialize all components
    initializeTabs();
    initializeSearch();
    initializeCards();
    initializeScrollEffects();
    initializeAnimations();
    initializeLazyLoading();
    initializeAccessibility();
});

// =========================================
// Tab System
// =========================================

function initializeTabs() {
    // Main filter tabs (الجميع، حي، مسجل)
    const mainTabs = document.querySelectorAll('.tab-btn');
    const subTabs = document.querySelectorAll('.sub-tab-btn');
    
    mainTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchMainTab(this);
        });
    });
    
    subTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchSubTab(this);
        });
    });
}

function switchMainTab(activeTab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const allTabs = Array.from(tabs);
    
    // Remove active class from all tabs
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to clicked tab
    activeTab.classList.add('active');
    
    // Filter competitions based on selected tab
    const filterType = activeTab.dataset.tab;
    filterCompetitions(filterType);
    
    // Add visual feedback
    addClickFeedback(activeTab);
}

function switchSubTab(activeTab) {
    const tabs = document.querySelectorAll('.sub-tab-btn');
    
    // Remove active class from all tabs in the same group
    tabs.forEach(tab => {
        if (tab.parentNode === activeTab.parentNode) {
            tab.classList.remove('active');
        }
    });
    
    // Add active class to clicked tab
    activeTab.classList.add('active');
    
    // Filter competitions based on selected sub-tab
    const filterType = activeTab.dataset.sub;
    filterSubCompetitions(filterType);
    
    // Add visual feedback
    addClickFeedback(activeTab);
}

function filterCompetitions(filterType) {
    const cards = document.querySelectorAll('.competition-card');
    
    cards.forEach(card => {
        const status = card.querySelector('.status');
        const statusText = status.textContent.trim();
        
        let shouldShow = false;
        
        switch(filterType) {
            case 'all':
                shouldShow = true;
                break;
            case 'live':
                shouldShow = statusText === 'حي';
                break;
            case 'recorded':
                shouldShow = statusText === 'مسجل';
                break;
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            animateCard(card, 'fadeInUp');
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update grid layout after filtering
    setTimeout(updateGridLayout, 300);
}

function filterSubCompetitions(filterType) {
    const cards = document.querySelectorAll('.competition-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.competition-title').textContent.toLowerCase();
        
        let shouldShow = false;
        
        switch(filterType) {
            case 'all':
                shouldShow = true;
                break;
            case 'religions':
                shouldShow = title.includes('أديان') || title.includes('مسيحية') || title.includes('إسلام');
                break;
            case 'sects':
                shouldShow = title.includes('مذاهب') || title.includes('شافعية') || title.includes('أحناف');
                break;
            case 'politics':
                shouldShow = title.includes('سياسة') || title.includes('انتخابات') || title.includes('ديمقراطية');
                break;
            case 'economics':
                shouldShow = title.includes('اقتصاد') || title.includes('تضخم') || title.includes('أسعار');
                break;
            case 'conflicts':
                shouldShow = title.includes('منازعات') || title.includes('قضايا');
                break;
            case 'current':
                shouldShow = title.includes('قضايا الساعة') || title.includes('معاصرة');
                break;
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            animateCard(card, 'slideInRight');
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update grid layout after filtering
    setTimeout(updateGridLayout, 300);
}

// =========================================
// Search Functionality
// =========================================

function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    // Real-time search with debounce
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim().toLowerCase();
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Search focus effects
    searchInput.addEventListener('focus', function() {
        this.parentNode.classList.add('focused');
        animateSearchIcon(true);
    });
    
    searchInput.addEventListener('blur', function() {
        this.parentNode.classList.remove('focused');
        if (!this.value) {
            animateSearchIcon(false);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
            clearSearch();
        }
    });
}

function performSearch(query) {
    const cards = document.querySelectorAll('.competition-card');
    let hasResults = false;
    
    cards.forEach(card => {
        const title = card.querySelector('.competition-title').textContent.toLowerCase();
        const description = card.querySelector('.competition-desc').textContent.toLowerCase();
        const competitor1 = card.querySelectorAll('.competitor-name')[0].textContent.toLowerCase();
        const competitor2 = card.querySelectorAll('.competitor-name')[1].textContent.toLowerCase();
        
        const matchesSearch = 
            title.includes(query) ||
            description.includes(query) ||
            competitor1.includes(query) ||
            competitor2.includes(query);
        
        if (matchesSearch && query !== '') {
            card.style.display = 'block';
            card.classList.add('search-match');
            addSearchHighlight(card, query);
            hasResults = true;
        } else if (query === '') {
            card.style.display = 'block';
            card.classList.remove('search-match');
            removeSearchHighlight(card);
        } else {
            card.style.display = 'none';
            card.classList.remove('search-match');
            removeSearchHighlight(card);
        }
    });
    
    // Show/hide no results message
    showNoResults(!hasResults && query !== '');
    
    // Update grid layout
    setTimeout(updateGridLayout, 300);
    
    // Track search analytics
    if (query) {
        console.log(`Search performed: "${query}"`);
    }
}

function clearSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
        performSearch('');
    }
}

function showNoResults(show) {
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (show && !noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = `
            <div class="no-results-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
                <h3>لم يتم العثور على نتائج</h3>
                <p>جرب البحث بكلمات مختلفة أو تصفح الفئات</p>
            </div>
        `;
        
        document.querySelector('.main-content .container').appendChild(noResultsMsg);
        animateElement(noResultsMsg, 'fadeInUp');
    } else if (!show && noResultsMsg) {
        noResultsMsg.remove();
    }
}

// =========================================
// Competition Cards
// =========================================

function initializeCards() {
    const cards = document.querySelectorAll('.competition-card');
    
    cards.forEach((card, index) => {
        // Add entrance animation
        setTimeout(() => {
            card.classList.add('fade-in-up');
        }, index * 100);
        
        // Add click handlers
        card.addEventListener('click', function() {
            handleCardClick(this);
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            addCardHoverEffect(this);
        });
        
        card.addEventListener('mouseleave', function() {
            removeCardHoverEffect(this);
        });
        
        // Add keyboard navigation
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(this);
            }
        });
    });
}

function handleCardClick(card) {
    const competitionId = card.dataset.id;
    
    // Add click feedback
    addClickFeedback(card);
    
    // Add loading state
    card.classList.add('loading');
    
    // Simulate navigation (replace with actual navigation logic)
    setTimeout(() => {
        card.classList.remove('loading');
        console.log(`Navigating to competition: ${competitionId}`);
        
        // You can replace this with actual navigation
        // window.location.href = `/competition/${competitionId}`;
        
        // For demo purposes, show an alert
        showCompetitionModal(card);
    }, 500);
}

function showCompetitionModal(card) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'competition-modal-overlay';
    modal.innerHTML = `
        <div class="competition-modal">
            <div class="modal-header">
                <h3>نافذة مشاهدة المنافسة</h3>
                <button class="modal-close" aria-label="إغلاق">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
            <div class="modal-content">
                <p>هذه نافذة تجريبية لعرض تفاصيل المنافسة.</p>
                <p>في النسخة النهائية، سيتم تشغيل الفيديو هنا.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles
    addModalStyles();
    
    // Animate modal appearance
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Add close handlers
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => closeModal(modal));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    
    // Escape key to close
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function addCardHoverEffect(card) {
    card.style.transform = 'translateY(-6px) scale(1.02)';
    card.style.transition = 'all 0.3s ease-out';
}

function removeCardHoverEffect(card) {
    card.style.transform = '';
}

// =========================================
// Scroll Effects and Performance
// =========================================

function initializeScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Header shadow effect
        const header = document.querySelector('.header');
        if (header) {
            if (scrolled > 10) {
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
            } else {
                header.style.boxShadow = 'none';
            }
        }
        
        // Parallax effect for sections
        const sections = document.querySelectorAll('.category-section');
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const yPos = (scrolled - section.offsetTop) * 0.1;
                section.style.transform = `translateY(${yPos}px)`;
            }
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Initialize grid layout on load
    updateGridLayout();
}

function updateGridLayout() {
    const grids = document.querySelectorAll('.competitions-grid');
    
    grids.forEach(grid => {
        // Force reflow to update grid
        grid.style.display = 'none';
        grid.offsetHeight; // Trigger reflow
        grid.style.display = 'flex';
        
        // Update scroll indicators
        updateScrollIndicators(grid);
    });
}

function updateScrollIndicators(grid) {
    const scrollLeft = grid.scrollLeft;
    const scrollWidth = grid.scrollWidth;
    const clientWidth = grid.clientWidth;
    
    // Add scroll indicators (optional visual feedback)
    if (scrollLeft > 0) {
        grid.classList.add('scrolled-left');
    } else {
        grid.classList.remove('scrolled-left');
    }
    
    if (scrollLeft < scrollWidth - clientWidth) {
        grid.classList.add('scrolled-right');
    } else {
        grid.classList.remove('scrolled-right');
    }
}

// =========================================
// Lazy Loading for Images
// =========================================

function initializeLazyLoading() {
    const images = document.querySelectorAll('.video-thumbnail');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const thumbnail = entry.target;
                    loadThumbnailImage(thumbnail);
                    observer.unobserve(thumbnail);
                }
            });
        });
        
        images.forEach(image => imageObserver.observe(image));
    } else {
        // Fallback for older browsers
        images.forEach(image => loadThumbnailImage(image));
    }
}

function loadThumbnailImage(thumbnail) {
    // Simulate loading thumbnail images
    // In a real application, you would load actual images here
    thumbnail.classList.add('loaded');
    
    // Add random thumbnail colors for demo
    const colors = [
        'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
        'linear-gradient(45deg, #A8E6CF, #FFD93D)',
        'linear-gradient(45deg, #6C5CE7, #A29BFE)',
        'linear-gradient(45deg, #FD79A8, #FDCB6E)',
        'linear-gradient(45deg, #00B894, #00CEC9)'
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    thumbnail.style.background = randomColor;
}

// =========================================
// Animations and Visual Effects
// =========================================

function initializeAnimations() {
    // Add entrance animations to sections
    const sections = document.querySelectorAll('.category-section');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => sectionObserver.observe(section));
    
    // Add stagger animations to competition cards
    const cards = document.querySelectorAll('.competition-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

function animateCard(card, animationType) {
    card.classList.add(animationType);
    setTimeout(() => {
        card.classList.remove(animationType);
    }, 600);
}

function animateElement(element, animationType) {
    element.classList.add(animationType);
    setTimeout(() => {
        element.classList.remove(animationType);
    }, 600);
}

function addClickFeedback(element) {
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

function animateSearchIcon(focused) {
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        if (focused) {
            searchIcon.style.color = 'var(--primary-500)';
            searchIcon.style.transform = 'scale(1.1)';
        } else {
            searchIcon.style.color = 'var(--text-tertiary)';
            searchIcon.style.transform = 'scale(1)';
        }
    }
}

function addSearchHighlight(card, query) {
    const elements = card.querySelectorAll('.competition-title, .competition-desc, .competitor-name');
    elements.forEach(element => {
        const originalText = element.textContent;
        const highlightedText = originalText.replace(
            new RegExp(query, 'gi'),
            match => `<mark class="search-highlight">${match}</mark>`
        );
        element.innerHTML = highlightedText;
    });
}

function removeSearchHighlight(card) {
    const elements = card.querySelectorAll('.search-highlight');
    elements.forEach(element => {
        const parent = element.parentNode;
        parent.replaceChild(document.createTextNode(element.textContent), element);
        parent.normalize();
    });
}

// =========================================
// Accessibility Enhancements
// =========================================

function initializeAccessibility() {
    // Add ARIA labels to interactive elements
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
            const title = button.getAttribute('title');
            if (title) {
                button.setAttribute('aria-label', title);
            }
        }
    });
    
    // Add keyboard navigation for tabs
    const tabButtons = document.querySelectorAll('.tab-btn, .sub-tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('keydown', function(e) {
            handleTabKeyNavigation(e, this);
        });
    });
    
    // Add focus management
    addFocusManagement();
    
    // Add screen reader announcements
    addScreenReaderAnnouncements();
}

function handleTabKeyNavigation(e, currentButton) {
    const tabs = Array.from(document.querySelectorAll('.tab-btn, .sub-tab-btn'));
    const currentIndex = tabs.indexOf(currentButton);
    let targetIndex;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            targetIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            break;
        case 'ArrowRight':
            e.preventDefault();
            targetIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            break;
        case 'Home':
            e.preventDefault();
            targetIndex = 0;
            break;
        case 'End':
            e.preventDefault();
            targetIndex = tabs.length - 1;
            break;
    }
    
    if (targetIndex !== undefined) {
        tabs[targetIndex].focus();
        tabs[targetIndex].click();
    }
}

function addFocusManagement() {
    // Skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'تخطي إلى المحتوى الرئيسي';
    skipLink.className = 'skip-link';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content landmark
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('role', 'main');
    }
}

function addScreenReaderAnnouncements() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'announcer';
    document.body.appendChild(announcer);
    
    // Announce tab changes
    const tabButtons = document.querySelectorAll('.tab-btn, .sub-tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const text = `تم التبديل إلى ${this.textContent}`;
            document.getElementById('announcer').textContent = text;
        });
    });
}

// =========================================
// Utility Functions
// =========================================

// Debounce function for performance
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

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if device supports touch
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Check if device is mobile
function isMobile() {
    return window.innerWidth <= 767;
}

// =========================================
// Modal Styles Injection
// =========================================

function addModalStyles() {
    if (document.getElementById('modal-styles')) return;
    
    const styles = `
        <style id="modal-styles">
            .competition-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease-out;
            }
            
            .competition-modal-overlay.show {
                opacity: 1;
            }
            
            .competition-modal {
                background: var(--bg-surface);
                border-radius: var(--radius-lg);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: auto;
                transform: scale(0.9);
                transition: transform 0.3s ease-out;
            }
            
            .competition-modal-overlay.show .competition-modal {
                transform: scale(1);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-lg);
                border-bottom: 1px solid var(--border-subtle);
            }
            
            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: var(--space-xs);
                border-radius: var(--radius-sm);
                transition: all var(--transition-normal);
            }
            
            .modal-close:hover {
                background-color: var(--bg-surface-hover);
                color: var(--text-primary);
            }
            
            .modal-content {
                padding: var(--space-lg);
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            .search-highlight {
                background-color: rgba(10, 132, 255, 0.3);
                color: var(--text-primary);
                padding: 1px 2px;
                border-radius: 2px;
            }
            
            .no-results-message {
                text-align: center;
                padding: var(--space-xxl) var(--space-lg);
                color: var(--text-secondary);
            }
            
            .no-results-content svg {
                margin-bottom: var(--space-md);
                opacity: 0.5;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--primary-500);
                color: white;
                padding: 8px;
                border-radius: var(--radius-sm);
                text-decoration: none;
                z-index: 1001;
                transition: top 0.3s;
            }
            
            .skip-link:focus {
                top: 6px;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// =========================================
// Performance Monitoring
// =========================================

// Track performance metrics
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        }, 0);
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
});

// Unhandled promise rejection handling
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

console.log('Dueli Platform scripts loaded successfully');