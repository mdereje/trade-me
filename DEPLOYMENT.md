# Trade Me Platform - Deployment Guide

## 🚀 Deployment Options

### Backend Deployment

#### Option 1: Railway (Recommended)
1. **Connect to Railway:**
   ```bash
   cd backend
   railway login
   railway init
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="postgresql://user:pass@host:port/db"
   railway variables set SECRET_KEY="your-super-secret-key"
   railway variables set STRIPE_SECRET_KEY="sk_test_..."
   railway variables set PAYPAL_CLIENT_ID="your-paypal-client-id"
   railway variables set PAYPAL_CLIENT_SECRET="your-paypal-secret"
   railway variables set TWILIO_ACCOUNT_SID="your-twilio-sid"
   railway variables set TWILIO_AUTH_TOKEN="your-twilio-token"
   railway variables set TWILIO_PHONE_NUMBER="+1234567890"
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

#### Option 2: Render
1. **Connect GitHub repository to Render**
2. **Create new Web Service**
3. **Configure:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`

4. **Set Environment Variables in Render dashboard**

#### Option 3: Heroku
1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   cd backend
   heroku create trade-me-backend
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set DATABASE_URL="postgresql://..."
   heroku config:set SECRET_KEY="your-secret-key"
   # ... other variables
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Frontend Deployment

#### Option 1: Vercel (Recommended)
1. **Connect GitHub repository to Vercel**
2. **Configure build settings:**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables:**
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://trade-me-backend.railway.app`)

4. **Deploy automatically on git push**

#### Option 2: Netlify
1. **Connect GitHub repository to Netlify**
2. **Configure build settings:**
   - Build Command: `npm run build`
   - Publish Directory: `build`
   - Environment Variables: `REACT_APP_API_URL`

3. **Deploy automatically on git push**

#### Option 3: Railway
1. **Connect GitHub repository to Railway**
2. **Configure:**
   - Build Command: `npm run build`
   - Start Command: `npx serve -s build -l 3000`
   - Environment Variables: `REACT_APP_API_URL`

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-super-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_PAYPAL_CLIENT_ID=your-paypal-client-id
```

## 🐳 Docker Deployment

### Backend
```bash
cd backend
docker build -t trade-me-backend .
docker run -p 8000:8000 --env-file .env trade-me-backend
```

### Frontend
```bash
cd frontend
docker build -t trade-me-frontend .
docker run -p 3000:80 trade-me-frontend
```

## 📊 Database Setup

### PostgreSQL (Production)
1. **Create database on Railway/Render/Heroku**
2. **Run migrations:**
   ```bash
   cd backend
   alembic upgrade head
   ```

### SQLite (Development)
- Automatically created when running locally
- No additional setup required

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