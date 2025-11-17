#!/bin/bash

# MongoDB Atlas Quick Setup Script for Dueli Platform
# This script automates the MongoDB Atlas setup process

set -e

echo "🚀 Dueli Platform - MongoDB Atlas Setup"
echo "=========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please ensure you're in the backend directory."
    exit 1
fi

# Function to validate connection string
validate_connection_string() {
    if [[ $1 == *"cluster"*"mongodb.net"* ]] || [[ $1 == *"cluster"*"mongodb.com"* ]]; then
        return 0
    else
        return 1
    fi
}

# Function to update .env file
update_env_file() {
    local uri=$1
    
    echo "📝 Updating .env file..."
    
    # Backup original .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update connection string
    sed -i.bak "s|MONGODB_URI=.*|MONGODB_URI=$uri|" .env
    rm .env.bak
    
    # Update other settings
    sed -i.bak 's/SKIP_DB_CONNECTION=.*/SKIP_DB_CONNECTION=false/' .env
    sed -i.bak 's/USE_MOCK_AUTH=.*/USE_MOCK_AUTH=false/' .env
    rm .env.bak
    
    echo "✅ .env file updated successfully!"
}

# Function to test connection
test_connection() {
    echo "🔍 Testing database connection..."
    if node mongodb-setup.js connect-test; then
        echo "✅ Connection test successful!"
        return 0
    else
        echo "❌ Connection test failed!"
        return 1
    fi
}

# Function to seed database
seed_database() {
    echo "🌱 Seeding database with sample data..."
    if node mongodb-setup.js seed; then
        echo "✅ Database seeded successfully!"
        return 0
    else
        echo "❌ Database seeding failed!"
        return 1
    fi
}

# Function to show statistics
show_stats() {
    echo "📊 Database Statistics:"
    node mongodb-setup.js stats
}

# Function to show help
show_help() {
    echo "Usage: ./setup-mongodb.sh [command]"
    echo ""
    echo "Commands:"
    echo "  init <connection_string>  - Initialize MongoDB Atlas connection"
    echo "  test                      - Test database connection"
    echo "  seed                      - Seed database with sample data"
    echo "  stats                     - Show database statistics"
    echo "  reset                     - Clear and reseed database"
    echo "  status                    - Show current configuration"
    echo "  help                      - Show this help message"
    echo ""
    echo "Example:"
    echo "  ./setup-mongodb.sh init 'mongodb+srv://user:pass@cluster.mongodb.net/duelik?retryWrites=true&w=majority'"
    echo ""
}

# Function to show current status
show_status() {
    echo "📋 Current Configuration:"
    echo "========================"
    echo "MongoDB URI: $(grep MONGODB_URI .env | sed 's/MONGODB_URI=//' | sed 's/:.*@/:***@/' )"
    echo "Skip DB Connection: $(grep SKIP_DB_CONNECTION .env | sed 's/SKIP_DB_CONNECTION=//')"
    echo "Use Mock Auth: $(grep USE_MOCK_AUTH .env | sed 's/USE_MOCK_AUTH=//')"
    echo "Server Port: $(grep PORT .env | sed 's/PORT=//')"
    echo "Frontend URL: $(grep FRONTEND_URL .env | sed 's/FRONTEND_URL=//')"
    echo ""
    
    if grep -q "localhost" .env; then
        echo "⚠️  Warning: Configuration may still point to localhost"
    fi
}

# Main script logic
case "${1:-help}" in
    "init")
        if [ -z "$2" ]; then
            echo "❌ Connection string required!"
            echo "Usage: ./setup-mongodb.sh init <connection_string>"
            echo ""
            echo "Example:"
            echo "  ./setup-mongodb.sh init 'mongodb+srv://user:pass@cluster.mongodb.net/duelik?retryWrites=true&w=majority'"
            exit 1
        fi
        
        CONNECTION_STRING=$2
        
        if ! validate_connection_string "$CONNECTION_STRING"; then
            echo "❌ Invalid connection string format!"
            echo "Connection string should contain 'cluster' and 'mongodb.net' or 'mongodb.com'"
            exit 1
        fi
        
        echo "🔧 Setting up MongoDB Atlas connection..."
        update_env_file "$CONNECTION_STRING"
        
        echo "🔍 Testing connection..."
        if test_connection; then
            echo ""
            echo "✅ MongoDB Atlas setup completed successfully!"
            echo ""
            echo "Next steps:"
            echo "  1. Seed database: ./setup-mongodb.sh seed"
            echo "  2. Start the backend server: npm start"
            echo "  3. Start the frontend server: npx serve -l 8000"
            echo "  4. Test the application at http://localhost:8000"
        else
            echo "❌ Connection test failed. Please check your connection string and settings."
            echo ""
            echo "Troubleshooting:"
            echo "  1. Ensure cluster is created and running"
            echo "  2. Check IP access list (should include your IP or 0.0.0.0/0)"
            echo "  3. Verify username and password"
            echo "  4. Ensure Network Access allows connections"
        fi
        ;;
        
    "test")
        test_connection
        ;;
        
    "seed")
        echo "🌱 Seeding database..."
        seed_database
        ;;
        
    "reset")
        echo "🔄 Resetting database..."
        echo "This will clear all data and reseed with sample data."
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            node mongodb-setup.js clear
            seed_database
        else
            echo "❌ Reset cancelled."
        fi
        ;;
        
    "stats")
        show_stats
        ;;
        
    "status")
        show_status
        ;;
        
    "help"|*)
        show_help
        ;;
esac