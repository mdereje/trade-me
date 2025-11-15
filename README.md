# Trade Me - Barter Platform

A modern barter platform where users can trade everyday items without money exchange. Users pay a $1/week subscription and can trade items with others in their area.

## 🚀 Features

- 🔐 **Social Media Authentication** - Google, Facebook, Twitter login
- 📱 **Phone Verification** - SMS verification for security
- 🏠 **Location-Based Trading** - Filter by zip code, city, or radius
- 📸 **Multiple Photo Uploads** - Show your items with multiple photos
- 🔄 **Smart Trading System** - Make offers, counter-offers, accept/reject
- 📧 **Real-Time Notifications** - Get notified of trade offers and updates
- ⭐ **Review System** - Rate and review completed trades
- 💳 **Flexible Payments** - Stripe and PayPal subscription ($1/week)
- 📱 **Responsive Design** - Beautiful, intuitive user experience
- 🛡️ **Safe Trading** - User verification and review system

## 🛠️ Tech Stack

### Frontend

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for forms
- **Headless UI** for accessible components

### Backend

- **Python 3.11+** with FastAPI
- **PostgreSQL** database
- **SQLAlchemy** ORM
- **Alembic** for migrations
- **JWT** authentication
- **Stripe & PayPal** payment processing
- **Twilio** for SMS verification

## 📁 Project Structure

```
trade-me/
├── frontend/                 # React TypeScript app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Python FastAPI app
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── tests/               # Test files
│   ├── requirements.txt
│   └── main.py
├── package.json             # Monorepo configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 13+
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd trade-me
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install separately:
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

### 3. Set Up Environment Variables

#### Backend (.env)

```bash
cp backend/env.example backend/.env
# Edit backend/.env with your configuration
```

Key variables to configure:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `STRIPE_SECRET_KEY` - Stripe API key
- `TWILIO_ACCOUNT_SID` - Twilio credentials
- Social auth credentials (Google, Facebook, Twitter)

#### Frontend (.env)

```bash
cp frontend/env.example frontend/.env
# Edit frontend/.env with your configuration
```

Key variables to configure:

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- Social auth client IDs

### 4. Set Up Database

```bash
# Create PostgreSQL database
createdb trademe

# Run database migrations
cd backend
alembic upgrade head
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
# Frontend (http://localhost:3000)
npm run dev:frontend

# Backend (http://localhost:8000)
npm run dev:backend
```

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts and profiles
- **items** - Items available for trade
- **item_categories** - Item categories (Electronics, Furniture, etc.)
- **item_photos** - Multiple photos per item
- **trade_offers** - Trade offers and counter-offers
- **trades** - Completed trades
- **reviews** - User reviews for trades
- **subscriptions** - Payment subscriptions

### Key Relationships

- Users can have multiple items
- Items belong to categories and have multiple photos
- Trade offers connect items and users
- Reviews are linked to completed trades
- Users have subscription status

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🚀 Deployment

### Firebase Deployment (Recommended)

This project is configured for Firebase deployment with:
- **Firebase Hosting** for the frontend
- **Firebase Cloud Run** for the backend API
- **Cloud SQL PostgreSQL** for the database (via Firebase Data Connect)

#### Quick Start

See [FIREBASE-QUICK-START.md](./FIREBASE-QUICK-START.md) for a quick deployment guide.

#### Full Setup Guide

See [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) for detailed Firebase setup instructions.

#### Deploy Command

```bash
./deploy-firebase.sh
```

### Alternative Deployment Options

#### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

#### Backend (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables
3. Configure PostgreSQL database
4. Deploy

### Environment Variables for Production

#### Backend

- `DATABASE_URL` - Production PostgreSQL URL
- `SECRET_KEY` - Strong secret key
- `STRIPE_SECRET_KEY` - Production Stripe key
- `TWILIO_*` - Production Twilio credentials
- Social auth production credentials

#### Frontend

- `REACT_APP_API_URL` - Production API URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Production Stripe key
- Production social auth client IDs

## 📱 API Documentation

Once the backend is running, visit:

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/facebook` - Facebook OAuth
- `POST /api/auth/twitter` - Twitter OAuth

#### Items

- `GET /api/items` - List items with filters
- `POST /api/items` - Create new item
- `GET /api/items/{id}` - Get item details
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

#### Trades

- `POST /api/trades/offers` - Create trade offer
- `GET /api/trades/offers/received` - Get received offers
- `GET /api/trades/offers/made` - Get made offers
- `POST /api/trades/offers/{id}/accept` - Accept offer
- `POST /api/trades/offers/{id}/reject` - Reject offer

#### Payments

- `POST /api/payments/stripe/subscribe` - Create Stripe subscription
- `POST /api/payments/paypal/subscribe` - Create PayPal subscription
- `POST /api/payments/cancel` - Cancel subscription

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you have any questions or need help:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced search filters
- [ ] Push notifications
- [ ] Chat system for negotiations
- [ ] Item condition verification
- [ ] Shipping integration
- [ ] Multi-language support
- [ ] Admin dashboard
