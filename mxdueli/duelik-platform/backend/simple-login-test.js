// Simple login test
global.fetch = fetch;

const testLogin = async () => {
    try {
        console.log('🔍 Testing Login with test user...');
        
        const response = await fetch('http://localhost:3003/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'testuser123@example.com',
                password: 'TestPassword123!'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Login Successful!');
            console.log('Token:', data.token?.substring(0, 20) + '...');
            console.log('User:', data.user?.username);
        } else {
            console.log('❌ Login Failed:', data.message);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
};

testLogin();