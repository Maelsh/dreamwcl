// =========================================
// API CONFIGURATION
// Dueli Platform API Settings
// =========================================

// API Configuration
const API_CONFIG = {
    // Base URLs
    BASE_URL: 'http://localhost:3003',
    API_BASE: 'http://localhost:3003/api',
    
    // API Endpoints
    ENDPOINTS: {
        // Authentication
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            ME: '/auth/me',
            REFRESH_TOKEN: '/auth/refresh-token',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password',
            CHANGE_PASSWORD: '/auth/change-password'
        },
        
        // User Management
        USERS: {
            PROFILE: '/users/profile',
            UPDATE_PROFILE: '/users/profile',
            AVATAR: '/users/avatar',
            FOLLOW: '/users/follow',
            UNFOLLOW: '/users/unfollow',
            FOLLOWERS: '/users/followers',
            FOLLOWING: '/users/following',
            SEARCH: '/users/search',
            PREFERENCES: '/users/preferences',
            DELETE_ACCOUNT: '/users/account'
        },
        
        // Challenges
        CHALLENGES: {
            LIST: '/challenges',
            CREATE: '/challenges',
            DETAILS: '/challenges',
            UPDATE: '/challenges',
            DELETE: '/challenges',
            JOIN: '/challenges/join',
            LEAVE: '/challenges/leave',
            START: '/challenges/start',
            END: '/challenges/end'
        },
        
        // Comments
        COMMENTS: {
            LIST: '/comments',
            CREATE: '/comments',
            UPDATE: '/comments',
            DELETE: '/comments',
            LIKE: '/comments/like',
            USER_COMMENTS: '/comments/user'
        },
        
        // Ratings
        RATINGS: {
            LIST: '/ratings',
            CREATE: '/ratings',
            UPDATE: '/ratings',
            DELETE: '/ratings',
            CHALLENGE_RATINGS: '/ratings/challenge',
            USER_RATINGS: '/ratings/user'
        },
        
        // Reports
        REPORTS: {
            LIST: '/reports',
            CREATE: '/reports',
            MY_REPORTS: '/reports/my-reports',
            UPDATE: '/reports/process'
        },
        
        // Finance
        FINANCE: {
            BALANCE: '/finance/balance',
            TRANSACTIONS: '/finance/transactions',
            WITHDRAW: '/finance/withdraw',
            DEPOSIT: '/finance/deposit',
            EARNINGS: '/finance/earnings'
        },
        
        // Admin
        ADMIN: {
            DASHBOARD: '/admin/dashboard',
            USERS: '/admin/users',
            CHALLENGES: '/admin/challenges',
            SETTINGS: '/admin/settings',
            ANALYTICS: '/admin/analytics'
        }
    },
    
    // HTTP Status Codes
    STATUS_CODES: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        INTERNAL_SERVER_ERROR: 500
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'duelik_access_token',
        REFRESH_TOKEN: 'duelik_refresh_token',
        USER_DATA: 'duelik_user_data',
        REMEMBER_ME: 'duelik_remember_me'
    },
    
    // Development Settings
    DEV_SETTINGS: {
        USE_MOCK_AUTH: false, // Set to true to use mock authentication
        ENABLE_LOGGING: true,
        ENABLE_DEBUG: true
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}

// Make available globally
window.API_CONFIG = API_CONFIG;

// =========================================
// API HELPER FUNCTIONS
// =========================================

class ApiHelper {
    constructor() {
        this.baseURL = API_CONFIG.API_BASE;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    // Get stored token
    getAuthToken() {
        return localStorage.getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    }
    
    // Get authorization headers
    getAuthHeaders() {
        const token = this.getAuthToken();
        return token ? {
            ...this.defaultHeaders,
            'Authorization': `Bearer ${token}`
        } : this.defaultHeaders;
    }
    
    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };
        
        const config = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            return {
                success: response.ok,
                data,
                status: response.status,
                statusText: response.statusText
            };
        } catch (error) {
            console.error('API Request Error:', error);
            return {
                success: false,
                error: error.message,
                status: 0
            };
        }
    }
    
    // HTTP Methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create global API instance
const api = new ApiHelper();

// Make API helper available globally
window.api = api;

console.log('✅ API Configuration loaded successfully');
console.log('🌐 Backend URL:', API_CONFIG.BASE_URL);
console.log('📡 API Base:', API_CONFIG.API_BASE);