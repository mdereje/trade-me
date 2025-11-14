# Trade Me - Deployment Access Guide

## 🚀 Deployed Infrastructure

### Frontend (React App)

- **URL**: https://storage.googleapis.com/trade-me-476221-trade-me-frontend/app-v2.html
- **Description**: React-based user interface for the Trade Me application
- **Features**: User authentication, item browsing, trade management, profile management
- **Note**: This URL bypasses caching issues and loads the correct version with proper asset paths
- **Auth Setup**: See `AUTH-SETUP.md` for configuring email/social/SMS registration

### Backend (FastAPI)

- **URL**: https://trade-me-backend-325079353832.us-central1.run.app
- **Description**: RESTful API backend built with FastAPI
- **Database**: PostgreSQL on Google Cloud SQL
- **Region**: us-central1

### Database

- **Instance**: trade-me-db
- **Database**: trademe
- **User**: trademe_user
- **Location**: us-central1

## 🔧 API Endpoints

### Health Check

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/health
```

**Response**: `{"status":"healthy"}`

### Root Endpoint

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/
```

**Response**: `{"message":"Trade Me API is running!"}`

### Authentication Endpoints

#### Register User

```bash
curl -X POST https://trade-me-backend-325079353832.us-central1.run.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

#### Login User

```bash
curl -X POST https://trade-me-backend-325079353832.us-central1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Items Endpoints

#### Get All Items

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/api/items/
```

#### Create New Item

```bash
curl -X POST https://trade-me-backend-325079353832.us-central1.run.app/api/items/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Vintage Camera",
    "description": "A beautiful vintage camera in excellent condition",
    "category": "Electronics",
    "condition": "Excellent",
    "location": "New York, NY"
  }'
```

#### Get Item by ID

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/api/items/1
```

### Trades Endpoints

#### Get All Trades

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/api/trades/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create Trade Request

```bash
curl -X POST https://trade-me-backend-325079353832.us-central1.run.app/api/trades/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "item_id": 1,
    "offered_item_id": 2,
    "message": "I would like to trade my item for yours"
  }'
```

### Users Endpoints

#### Get User Profile

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update User Profile

```bash
curl -X PUT https://trade-me-backend-325079353832.us-central1.run.app/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "username": "newusername",
    "bio": "Updated bio",
    "location": "San Francisco, CA"
  }'
```

### Reviews Endpoints

#### Get Reviews for User

```bash
curl https://trade-me-backend-325079353832.us-central1.run.app/api/reviews/user/1
```

#### Create Review

```bash
curl -X POST https://trade-me-backend-325079353832.us-central1.run.app/api/reviews/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": 1,
    "rating": 5,
    "comment": "Great trader, highly recommended!"
  }'
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful login, include the token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📱 Frontend Usage

1. **Access the application**: Visit https://storage.googleapis.com/trade-me-476221-trade-me-frontend/index.html
2. **Register**: Create a new account using the registration form
3. **Login**: Use your credentials to access the application
4. **Browse Items**: View available items for trade
5. **Create Items**: Add your own items to the marketplace
6. **Manage Trades**: Send and receive trade requests
7. **Profile Management**: Update your profile and view your trading history

## 🛠️ Development & Updates

### Update Backend

```bash
./update-gcp.sh
```

### View Logs

```bash
gcloud run services logs read trade-me-backend --region us-central1
```

### Update Environment Variables

```bash
gcloud run services update trade-me-backend --region us-central1 --set-env-vars KEY=VALUE
```

## 📊 Monitoring

- **Backend Logs**: https://console.cloud.google.com/run/detail/us-central1/trade-me-backend/logs
- **Database**: https://console.cloud.google.com/sql/instances/trade-me-db
- **Storage**: https://console.cloud.google.com/storage/browser/trade-me-476221-trade-me-frontend

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key
- `STRIPE_SECRET_KEY`: Payment processing
- `PAYPAL_CLIENT_ID`: PayPal integration
- `TWILIO_ACCOUNT_SID`: SMS verification
- `CORS_ORIGINS`: Allowed frontend origins

### Database Connection

The application connects to Cloud SQL using the Cloud SQL Proxy, which is automatically configured in Cloud Run.

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the frontend URL is included in CORS_ORIGINS
2. **Database Connection**: Check Cloud SQL instance status and network configuration
3. **Authentication**: Verify JWT token is valid and not expired
4. **File Uploads**: Ensure static directory permissions are correct

### Health Checks

- Backend: `curl https://trade-me-backend-325079353832.us-central1.run.app/health`
- Frontend: Visit the URL and check browser console for errors

## 📈 Performance

- **Backend**: Auto-scaling Cloud Run service
- **Database**: PostgreSQL with automatic backups
- **Frontend**: Static files served from Cloud Storage with CDN
- **Region**: us-central1 for optimal performance

## 🔒 Security

- HTTPS enforced for all endpoints
- JWT-based authentication
- CORS protection
- Database connection encryption
- Environment variables for sensitive data
