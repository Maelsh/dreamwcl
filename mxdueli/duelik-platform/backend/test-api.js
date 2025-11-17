// Using native fetch API (Node.js 18+)
global.fetch = fetch;

const BASE_URL = 'http://localhost:3003';
const API_BASE = 'http://localhost:3003/api';
const API_VERSION = 'v1';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
    test: (msg) => console.log(`${colors.cyan}🔍 Testing: ${msg}${colors.reset}`)
};

async function testEndpoint(method, path, data = null, headers = {}) {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: data && (method === 'POST' || method === 'PUT' || method === 'PATCH') 
                ? JSON.stringify(data) 
                : undefined
        });

        const responseData = await response.json().catch(() => ({}));

        return {
            success: response.ok,
            status: response.status,
            data: responseData
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error.message,
            data: null
        };
    }
}

async function runTests() {
    console.log(`${colors.yellow}🚀 Starting API Testing Suite${colors.reset}\n`);
    
    // Test 1: Health Check (no API prefix needed)
    log.test('Health Check Endpoint');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthResult = {
        success: healthResponse.ok,
        status: healthResponse.status,
        data: await healthResponse.json().catch(() => ({}))
    };
    
    if (healthResult.success) {
        log.success(`Health Check: ${JSON.stringify(healthResult.data)}`);
    } else {
        log.error(`Health Check Failed: ${healthResult.status}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Register a new user with unique credentials
    log.test('User Registration');
    const userData = {
        username: 'newuser123',
        email: 'newuser123@example.com',
        password: 'TestPassword123!',
        fullName: 'New Test User',
        dateOfBirth: '1990-01-01',
        country: 'Test Country'
    };
    
    const registerResult = await testEndpoint('POST', '/auth/register', userData);
    let authToken = null;
    
    if (registerResult.success) {
        log.success(`User Registered: ${registerResult.data.user?.username || 'Success'}`);
    } else {
        log.error(`Registration Failed: ${registerResult.status} - ${registerResult.error}`);
        if (registerResult.data?.message) {
            log.info(`Error details: ${registerResult.data.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Login with existing test user
    log.test('User Login');
    const loginData = {
        email: 'testuser123@example.com',
        password: 'TestPassword123!'
    };
    
    const loginResult = await testEndpoint('POST', '/auth/login', loginData);
    
    if (loginResult.success) {
        log.success(`Login Successful: ${loginResult.data.user?.username || 'Success'}`);
        if (!authToken) {
            authToken = loginResult.data.token;
        }
    } else {
        log.error(`Login Failed: ${loginResult.status} - ${loginResult.error}`);
        if (loginResult.data?.message) {
            log.info(`Error details: ${loginResult.data.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Get current user profile (requires authentication)
    if (authToken) {
        log.test('Get Current User Profile');
        const profileResult = await testEndpoint('GET', '/users/profile', null, {
            'Authorization': `Bearer ${authToken}`
        });
        
        if (profileResult.success) {
            log.success(`Profile Retrieved: ${profileResult.data.user?.username || 'Success'}`);
        } else {
            log.error(`Profile Failed: ${profileResult.status} - ${profileResult.error}`);
            if (profileResult.data?.message) {
                log.info(`Error details: ${profileResult.data.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');

        // Test 5: Create a challenge
        log.test('Create Challenge');
        const challengeData = {
            title: 'Test Challenge from API',
            description: 'This is a test challenge created via API',
            category: 'dialogue',
            subCategory: 'religions',
            difficulty: 'beginner',
            timeLimit: 30,
            maxParticipants: 2,
            rules: ['Be respectful', 'Stay on topic']
        };
        
        const challengeResult = await testEndpoint('POST', '/challenges', challengeData, {
            'Authorization': `Bearer ${authToken}`
        });
        
        if (challengeResult.success) {
            log.success(`Challenge Created: ${challengeResult.data.challenge?.title || 'Success'}`);
        } else {
            log.error(`Challenge Creation Failed: ${challengeResult.status} - ${challengeResult.error}`);
            if (challengeResult.data?.message) {
                log.info(`Error details: ${challengeResult.data.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');

        // Test 6: Get all challenges
        log.test('Get All Challenges');
        const challengesResult = await testEndpoint('GET', '/challenges');
        
        if (challengesResult.success) {
            const count = challengesResult.data.challenges?.length || 0;
            log.success(`Retrieved ${count} challenges`);
        } else {
            log.error(`Get Challenges Failed: ${challengesResult.status} - ${challengesResult.error}`);
        }
    } else {
        log.error('Skipping authenticated tests - no auth token available');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    log.info('API Testing Suite Completed');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    log.error(`Unhandled Promise Rejection: ${err.message}`);
});

// Start tests
runTests().catch(error => {
    log.error(`Test Suite Error: ${error.message}`);
});