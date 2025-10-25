#!/bin/bash

# Trade Me Platform Firebase Deployment Script

echo "🚀 Trade Me Platform - Firebase Deployment Script"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to deploy backend (Firebase Functions)
deploy_backend() {
    echo "📦 Deploying Backend (Firebase Functions)..."
    
    # Check if Firebase CLI is installed
    if command -v firebase &> /dev/null; then
        echo "🔥 Deploying to Firebase Functions..."
        firebase deploy --only functions
    else
        echo "⚠️  Firebase CLI not found. Please install it first."
        echo "   Run: npm install -g firebase-tools"
        echo "   Then: firebase login"
    fi
}

# Function to deploy frontend (Firebase Hosting)
deploy_frontend() {
    echo "🎨 Deploying Frontend (Firebase Hosting)..."
    
    # Build the frontend first
    echo "🔨 Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    # Check if Firebase CLI is installed
    if command -v firebase &> /dev/null; then
        echo "🔥 Deploying to Firebase Hosting..."
        firebase deploy --only hosting
    else
        echo "⚠️  Firebase CLI not found. Please install it first."
        echo "   Run: npm install -g firebase-tools"
        echo "   Then: firebase login"
    fi
}

# Function to deploy database (Firestore)
deploy_database() {
    echo "🗄️  Deploying Database (Firestore)..."
    
    if command -v firebase &> /dev/null; then
        echo "🔥 Deploying Firestore rules and indexes..."
        firebase deploy --only firestore:rules,firestore:indexes
    else
        echo "⚠️  Firebase CLI not found. Please install it first."
    fi
}

# Function to build and test locally
test_local() {
    echo "🧪 Testing Local Setup..."
    
    # Start backend
    echo "Starting backend server..."
    cd backend
    source venv/bin/activate
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    echo "Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait a bit for servers to start
    sleep 10
    
    # Test backend
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Backend is running at http://localhost:8000"
    else
        echo "❌ Backend failed to start"
    fi
    
    # Test frontend
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend is running at http://localhost:3000"
    else
        echo "❌ Frontend failed to start"
    fi
    
    echo "🎉 Local testing complete!"
    echo "Press Ctrl+C to stop servers"
    
    # Wait for user to stop
    wait
}

# Main menu
echo "Choose deployment option:"
echo "1) Deploy Backend (Firebase Functions)"
echo "2) Deploy Frontend (Firebase Hosting)"
echo "3) Deploy Database (Firestore)"
echo "4) Deploy Everything"
echo "5) Test Local Setup"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_database
        ;;
    4)
        echo "🚀 Deploying everything to Firebase..."
        deploy_database
        deploy_backend
        deploy_frontend
        ;;
    5)
        test_local
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo "🎉 Deployment script completed!"
