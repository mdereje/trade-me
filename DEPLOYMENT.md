# Trade Me Platform - Firebase Deployment Guide

## 🚀 Firebase Deployment (Recommended)

### Prerequisites
1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase project:**
   ```bash
   firebase init
   ```

### Backend Deployment (Firebase Functions)

#### Step 1: Setup Firebase Functions
1. **Initialize Firebase Functions:**
   ```bash
   cd backend
   firebase init functions
   ```

2. **Install dependencies:**
   ```bash
   cd functions
   pip install -r requirements_firebase.txt
   ```

3. **Set Environment Variables:**
   ```bash
   firebase functions:config:set \
     stripe.secret_key="sk_test_..." \
     paypal.client_id="your-paypal-client-id" \
     paypal.client_secret="your-paypal-secret" \
     twilio.account_sid="your-twilio-sid" \
     twilio.auth_token="your-twilio-token" \
     twilio.phone_number="+1234567890"
   ```

4. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

### Frontend Deployment (Firebase Hosting)

#### Step 1: Setup Firebase Hosting
1. **Initialize Firebase Hosting:**
   ```bash
   cd frontend
   firebase init hosting
   ```

2. **Build the frontend:**
   ```bash
   npm run build
   ```

3. **Set Environment Variables:**
   ```bash
   firebase functions:config:set \
     app.api_url="https://your-region-your-project.cloudfunctions.net/api"
   ```

4. **Deploy Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

### Database Setup (Firestore)

#### Step 1: Setup Firestore Database
1. **Enable Firestore in Firebase Console**
2. **Deploy Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Firestore indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Complete Deployment

#### Deploy Everything at Once:
```bash
firebase deploy
```

#### Deploy Specific Services:
```bash
# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only firestore rules
firebase deploy --only firestore:rules
```

## 🔧 Environment Variables

### Firebase Functions Configuration
```bash
# Set Firebase Functions config
firebase functions:config:set \
  stripe.secret_key="sk_test_..." \
  paypal.client_id="your-paypal-client-id" \
  paypal.client_secret="your-paypal-secret" \
  twilio.account_sid="your-twilio-sid" \
  twilio.auth_token="your-twilio-token" \
  twilio.phone_number="+1234567890" \
  app.secret_key="your-super-secret-key"
```

### Frontend Environment Variables
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# API Configuration
REACT_APP_API_URL=https://your-region-your-project.cloudfunctions.net/api

# Payment Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_PAYPAL_CLIENT_ID=your-paypal-client-id
```

## 📊 Database Setup (Firestore)

### Firestore Database
1. **Enable Firestore in Firebase Console**
2. **Set up Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Firestore indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Configure Firestore collections:**
   - `users` - User profiles and authentication
   - `items` - Trade items and listings
   - `trades` - Trade offers and transactions
   - `reviews` - User reviews and ratings
   - `subscriptions` - User subscription data

### Local Development Database
- SQLite automatically created when running locally
- No additional setup required for development

## 🔐 Security Checklist

- [ ] Set strong SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Set up CORS properly
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment variables for secrets
- [ ] Enable database backups

## 📈 Monitoring

### Backend Health Check
- Endpoint: `/health`
- Returns: `{"status": "healthy"}`

### Frontend Health Check
- Check if app loads without errors
- Monitor API connectivity

## 🚨 Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check environment variables
   - Verify database connection
   - Check port availability

2. **Frontend build fails:**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Check for TypeScript errors

3. **Database connection issues:**
   - Verify DATABASE_URL format
   - Check database server status
   - Verify credentials

### Logs
- **Railway:** `railway logs`
- **Render:** Check dashboard logs
- **Vercel:** Check function logs
- **Local:** Check terminal output

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway up
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: vercel --prod
```

## 📝 Post-Deployment

1. **Test all endpoints**
2. **Verify database connectivity**
3. **Check environment variables**
4. **Test authentication flow**
5. **Verify file uploads work**
6. **Check payment integration**
7. **Monitor performance**

## 🎯 Recommended Setup

**For Production:**
- Backend: Railway + PostgreSQL
- Frontend: Vercel
- Database: Railway PostgreSQL
- Monitoring: Railway logs + Vercel analytics

**For Development:**
- Backend: Local with SQLite
- Frontend: Local with npm start
- Database: SQLite (included)
