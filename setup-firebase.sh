#!/bin/bash

# Trade Me Platform - Firebase Setup Script

echo "🔥 Trade Me Platform - Firebase Setup"
echo "====================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI already installed"
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase:"
    firebase login
else
    echo "✅ Already logged in to Firebase"
fi

# Initialize Firebase project
echo "🚀 Initializing Firebase project..."
firebase init

echo ""
echo "🎉 Firebase setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your Firebase project in the console"
echo "2. Configure environment variables"
echo "3. Run: ./deploy.sh"
echo ""
echo "🔧 Environment Variables to set:"
echo "   firebase functions:config:set stripe.secret_key=\"sk_test_...\""
echo "   firebase functions:config:set paypal.client_id=\"your-paypal-id\""
echo "   firebase functions:config:set twilio.account_sid=\"your-twilio-sid\""
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
