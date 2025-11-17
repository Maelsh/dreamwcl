const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, 12);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test verification
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Verification test:', isMatch);
}

generateHash();