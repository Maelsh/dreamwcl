#!/usr/bin/env node

/**
 * MongoDB Atlas Quick Setup Tool
 * Interactive setup for MongoDB Atlas integration
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class MongoDBSetupTool {
    constructor() {
        this.backendDir = path.join(__dirname);
        this.envFile = path.join(this.backendDir, '.env');
        this.setupScript = path.join(this.backendDir, 'mongodb-setup.js');
    }

    async question(prompt) {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    }

    async setup() {
        console.log('🚀 Dueli Platform - MongoDB Atlas Setup Tool');
        console.log('=============================================\n');

        // Check if .env exists
        if (!fs.existsSync(this.envFile)) {
            console.log('❌ .env file not found. Please ensure you\'re in the backend directory.');
            process.exit(1);
        }

        // Show current status
        await this.showCurrentStatus();

        console.log('\n📋 Setup Options:');
        console.log('1. Quick Setup (Enter connection string)');
        console.log('2. Interactive Setup (Step by step)');
        console.log('3. Test Connection Only');
        console.log('4. Seed Database Only');
        console.log('5. Show Database Statistics');
        console.log('6. Reset Database (Clear + Seed)');
        console.log('7. Exit\n');

        const choice = await this.question('Choose option (1-7): ');

        switch (choice.trim()) {
            case '1':
                await this.quickSetup();
                break;
            case '2':
                await this.interactiveSetup();
                break;
            case '3':
                await this.testConnection();
                break;
            case '4':
                await this.seedDatabase();
                break;
            case '5':
                await this.showStats();
                break;
            case '6':
                await this.resetDatabase();
                break;
            case '7':
                console.log('👋 Setup cancelled.');
                break;
            default:
                console.log('❌ Invalid option. Please choose 1-7.');
                await this.setup();
                return;
        }

        rl.close();
    }

    async showCurrentStatus() {
        console.log('📊 Current Configuration:\n');
        
        try {
            const envContent = fs.readFileSync(this.envFile, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                if (line.includes('MONGODB_URI=')) {
                    const uri = line.split('=')[1] || 'Not set';
                    const maskedUri = uri.includes('@') ? 
                        uri.replace(/:.*@/, ':***@') : uri;
                    console.log(`MongoDB URI: ${maskedUri}`);
                }
                if (line.includes('SKIP_DB_CONNECTION=')) {
                    console.log(`Skip DB Connection: ${line.split('=')[1]}`);
                }
                if (line.includes('USE_MOCK_AUTH=')) {
                    console.log(`Use Mock Auth: ${line.split('=')[1]}`);
                }
                if (line.includes('PORT=')) {
                    console.log(`Server Port: ${line.split('=')[1]}`);
                }
                if (line.includes('FRONTEND_URL=')) {
                    console.log(`Frontend URL: ${line.split('=')[1]}`);
                }
            });
        } catch (error) {
            console.log('❌ Error reading .env file:', error.message);
        }
    }

    async quickSetup() {
        console.log('\n🔧 Quick Setup');
        console.log('===============\n');
        
        console.log('Please provide your MongoDB Atlas connection string:');
        console.log('Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
        console.log('Example: mongodb+srv://duelik_user:mypassword@duelik-cluster.abcdef.mongodb.net/duelik?retryWrites=true&w=majority\n');
        
        const connectionString = await this.question('Connection String: ');
        
        if (!connectionString || !connectionString.includes('mongodb+srv://')) {
            console.log('❌ Invalid connection string format.');
            return;
        }

        console.log('\n📝 Updating configuration...');
        await this.updateEnvFile(connectionString);
        
        console.log('\n🔍 Testing connection...');
        if (await this.testConnection()) {
            console.log('\n✅ Connection successful! Seeding database...');
            await this.seedDatabase();
            
            console.log('\n🎉 MongoDB Atlas setup completed successfully!');
            await this.showNextSteps();
        } else {
            console.log('\n❌ Connection test failed. Please check your connection string.');
        }
    }

    async interactiveSetup() {
        console.log('\n🔧 Interactive Setup');
        console.log('===================\n');

        console.log('Step 1: MongoDB Atlas Connection String');
        console.log('Please get your connection string from:');
        console.log('  1. Go to https://cloud.mongodb.com/');
        console.log('  2. Create a cluster');
        console.log('  3. Click "Connect" on your cluster');
        console.log('  4. Choose "Connect your application"');
        console.log('  5. Copy the connection string\n');

        const connectionString = await this.question('Enter connection string: ');
        
        if (!connectionString) {
            console.log('❌ Connection string is required.');
            return;
        }

        console.log('\nStep 2: Updating configuration...');
        await this.updateEnvFile(connectionString);

        console.log('\nStep 3: Testing connection...');
        const connected = await this.testConnection();
        
        if (!connected) {
            console.log('❌ Connection failed. Please check your connection string and try again.');
            return;
        }

        console.log('\nStep 4: Seeding database...');
        await this.seedDatabase();

        console.log('\nStep 5: Setup complete!');
        await this.showNextSteps();
    }

    async updateEnvFile(connectionString) {
        try {
            const envContent = fs.readFileSync(this.envFile, 'utf8');
            let updatedContent = envContent;

            // Update MongoDB URI
            updatedContent = updatedContent.replace(
                /MONGODB_URI=.*/g,
                `MONGODB_URI=${connectionString}`
            );

            // Update skip connection
            updatedContent = updatedContent.replace(
                /SKIP_DB_CONNECTION=.*/g,
                'SKIP_DB_CONNECTION=false'
            );

            // Update mock auth
            updatedContent = updatedContent.replace(
                /USE_MOCK_AUTH=.*/g,
                'USE_MOCK_AUTH=false'
            );

            // Backup original file
            const backupPath = `${this.envFile}.backup.${Date.now()}`;
            fs.writeFileSync(backupPath, envContent);
            console.log(`✅ Backup created: ${path.basename(backupPath)}`);

            // Write updated content
            fs.writeFileSync(this.envFile, updatedContent);
            console.log('✅ Configuration updated successfully!');
            
        } catch (error) {
            console.log('❌ Error updating .env file:', error.message);
            throw error;
        }
    }

    async testConnection() {
        try {
            execSync(`node ${this.setupScript} connect-test`, { stdio: 'inherit' });
            return true;
        } catch (error) {
            return false;
        }
    }

    async seedDatabase() {
        try {
            execSync(`node ${this.setupScript} seed`, { stdio: 'inherit' });
        } catch (error) {
            console.log('❌ Database seeding failed:', error.message);
        }
    }

    async showStats() {
        try {
            execSync(`node ${this.setupScript} stats`, { stdio: 'inherit' });
        } catch (error) {
            console.log('❌ Error showing statistics:', error.message);
        }
    }

    async resetDatabase() {
        const confirm = await this.question('\n⚠️  This will clear all data and reseed with sample data.\nAre you sure? (y/N): ');
        
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Reset cancelled.');
            return;
        }

        console.log('\n🔄 Resetting database...');
        try {
            execSync(`node ${this.setupScript} clear`, { stdio: 'inherit' });
            await this.seedDatabase();
            console.log('✅ Database reset completed!');
        } catch (error) {
            console.log('❌ Database reset failed:', error.message);
        }
    }

    async showNextSteps() {
        console.log('\n📋 Next Steps:');
        console.log('==============');
        console.log('1. Start the backend server:');
        console.log('   cd backend && npm start');
        console.log('');
        console.log('2. Start the frontend server (in another terminal):');
        console.log('   cd ../duelik-platform && npx serve -l 8000');
        console.log('');
        console.log('3. Test the application:');
        console.log('   Open http://localhost:8000 in your browser');
        console.log('   Use test credentials:');
        console.log('   - ahmed@example.com / Password123!');
        console.log('   - fatima@example.com / Password123!');
        console.log('   - admin@duelik.com / Admin123!');
        console.log('');
        console.log('4. Test APIs directly:');
        console.log('   curl -X POST http://localhost:3003/api/auth/login \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"email": "ahmed@example.com", "password": "Password123!"}\'');
        console.log('');
        console.log('📖 For more information, see:');
        console.log('   - MONGODB_SETUP_GUIDE.md (detailed guide)');
        console.log('   - MONGODB_INTEGRATION_README.md (complete reference)');
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new MongoDBSetupTool();
    setup.setup().catch(error => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}

module.exports = MongoDBSetupTool;