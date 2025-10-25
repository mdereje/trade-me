#!/bin/bash

# Trade Me Platform Deployment Script

echo "🚀 Trade Me Platform Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to deploy backend
deploy_backend() {
    echo "📦 Deploying Backend..."
    cd backend
    
    # Check if Railway CLI is installed
    if command -v railway &> /dev/null; then
        echo "🚂 Deploying to Railway..."
        railway up
    else
        echo "⚠️  Railway CLI not found. Please install it or deploy manually."
        echo "   Visit: https://docs.railway.app/develop/cli"
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo "🎨 Deploying Frontend..."
    cd frontend
    
    # Check if Vercel CLI is installed
    if command -v vercel &> /dev/null; then
        echo "▲ Deploying to Vercel..."
        vercel --prod
    else
        echo "⚠️  Vercel CLI not found. Please install it or deploy manually."
        echo "   Visit: https://vercel.com/docs/cli"
    fi
    
    cd ..
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
echo "1) Deploy Backend to Railway"
echo "2) Deploy Frontend to Vercel"
echo "3) Deploy Both"
echo "4) Test Local Setup"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    4)
        test_local
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo "🎉 Deployment script completed!"