# SentiLoka

**Every Review Matters**

SentiLoka is an AI-powered customer sentiment analysis and review management platform that helps businesses understand customer feedback across multiple locations. By leveraging advanced sentiment analysis and automated response generation, SentiLoka transforms customer reviews into actionable business insights.

## Overview

SentiLoka provides businesses with the tools to monitor, analyze, and respond to customer reviews from Google Maps in real-time. The platform uses AI to analyze sentiment, identify trends, and generate contextually appropriate responses, helping businesses maintain strong customer relationships across all their locations.

## Key Features

### Map-Based Analytics
Visualize customer sentiment across all your business locations on an interactive map. Get a geographical overview of customer satisfaction and identify trends by region.

### AI-Powered Reply Generation
Generate perfect, context-aware responses to reviews in seconds with customizable tones. The AI understands the nuances of each review and creates personalized replies that match your brand voice.

### Sentiment Tracking
Understand customer feelings at a glance with real-time positive, neutral, and negative feedback analysis. Track sentiment trends over time and identify areas for improvement.

### Comprehensive Dashboard
Monitor all your locations from a single, intuitive dashboard. View sentiment breakdowns, rating distributions, and key performance indicators across your business.

### Intelligent Chatbot
Get instant insights about your reviews through natural language queries. Ask questions about customer sentiment, common themes, or specific locations and receive data-driven answers.

## Tech Stack

### Frontend
- React with Tailwind CSS for a modern, responsive user interface
- React Query for efficient data fetching and state management
- Leaflet for interactive map visualizations
- Recharts for data visualization and analytics

### Backend
- Node.js with Express for RESTful API development
- Python with Scrapy and Playwright for web scraping
- Bull queue with Redis for background job processing
- JWT-based authentication with Google OAuth support

### Database
- MongoDB for flexible, scalable data storage

### AI & Machine Learning
- OpenAI Elice for sentiment analysis
- Google Gemini for advanced natural language processing
- Custom keyword extraction and topic modeling

## Getting Started

### Prerequisites

- Node.js 20 or higher
- Python 3.x
- MongoDB
- Redis (optional, for background job processing)
- OpenAI API key
- Google OAuth credentials (optional, for social login)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Set up Python environment:
```bash
python3 -m venv python_env
source python_env/bin/activate  # On Windows: python_env\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Configure environment variables:
```
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/sentiloka
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
GPT4O_MINI_BASE_URL=https://api.openai.com/v1
GPT4O_MINI_API_KEY=your-openai-api-key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

6. Seed the database (optional):
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:8080`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
VITE_API_URL=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Project Structure

```
sentiloka/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (database, passport, queue)
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Custom middleware
│   │   ├── utils/           # Utility functions
│   │   └── seeders/         # Database seeders
│   ├── scraper/             # Python Scrapy spider for Google Maps
│   ├── scripts/             # Utility scripts
│   └── temp/                # Temporary scraper output
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   └── public/              # Static assets
└── README.md
```

## Available Scripts

### Backend

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with test data
- `npm run seed:clear` - Clear all database data
- `npm run seed:fresh` - Clear and reseed database

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Core Features

### Review Scraping

The platform uses a custom-built Scrapy spider with Playwright to scrape Google Maps reviews efficiently. The scraper:

- Collects unlimited reviews from any Google Maps location
- Runs asynchronously in background jobs using Bull queue
- Caches reviews during scraping for performance
- Handles pagination and dynamic content loading

### Sentiment Analysis

Each review is analyzed for sentiment using AI models:

- Sentiment classification (positive, neutral, negative)
- Confidence scoring
- Keyword extraction
- Topic identification
- Contextual understanding

### Dashboard Analytics

The dashboard provides comprehensive insights:

- Overall sentiment breakdown
- Rating distribution
- Temporal sentiment trends
- Location-specific performance
- Top keywords and topics

### AI Chatbot

An intelligent chatbot that:

- Answers questions about review data
- Provides business insights and recommendations
- Analyzes trends across locations
- Suggests improvements based on customer feedback

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth login

### Locations
- `GET /api/locations` - Get all user locations
- `POST /api/locations` - Add new location
- `GET /api/locations/:id` - Get location details
- `DELETE /api/locations/:id` - Delete location

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/location/:locationId` - Get reviews by location
- `GET /api/reviews/:id` - Get single review

### Scraper
- `POST /api/scraper/scrape` - Start scraping job
- `GET /api/scraper/status/:jobId` - Get scraping job status
- `POST /api/scraper/rescrape/:locationId` - Rescrape location

### Sentiment
- `POST /api/sentiment/analyze` - Analyze sentiment
- `GET /api/sentiment/location/:locationId` - Get sentiment data

### Chatbot
- `POST /api/chatbot/query` - Send chatbot query

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Models

### User
- Authentication and profile information
- Subscription tier
- Associated locations

### Location
- Business information (name, address, coordinates)
- Google Maps URL
- Associated reviews
- Sentiment statistics

### Review
- Review content and metadata
- Sentiment analysis results
- Keywords and topics
- Timestamps

### ReviewSentiment
- Detailed sentiment analysis
- Confidence scores
- Contextual topics

## Development Challenges Solved

### API Costs
Switched from costly third-party APIs to open-source solutions, significantly reducing operational costs while maintaining high-quality sentiment analysis.

### Slow Scraping
Built a custom Scrapy spider with Playwright that is significantly faster than conventional solutions, with intelligent caching and parallel processing.

### Long Analysis Times
Implemented parallel processing and background jobs using Bull queue, allowing multiple reviews to be analyzed simultaneously without blocking the main application.

## Security

- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs
- HTTP-only cookies for secure token storage
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for cross-origin requests

## Deployment

### Backend (DigitalOcean / Docker)

1. Build Docker image:
```bash
docker build -t sentiloka-backend .
```

2. Run container:
```bash
docker run -p 8080:8080 --env-file .env sentiloka-backend
```

### Frontend (Vercel / Netlify)

1. Build production bundle:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider.

## Environment Variables

### Backend
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `FRONTEND_URL` - Frontend URL for CORS
- `GPT4O_MINI_API_KEY` - OpenAI API key
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (optional)

### Frontend
- `VITE_API_URL` - Backend API URL

## Future Development

1. **User Experience** - Enhanced UI/UX with more interactive visualizations and improved mobile responsiveness

2. **Security** - Implementation of advanced security features including two-factor authentication and enhanced data encryption

3. **New Features** - Review comparison tools, automated report generation, and multi-platform review aggregation

4. **Marketing Strategy** - Integration with marketing tools, competitive analysis features, and customer segmentation

## Team

**KADA Batch 2 - Group 1**

- Raphael Reynaldi - Backend Developer
- Nada Salsabila - UI/UX Designer
- Alif Fata Fadhlillah - UI/UX Designer
- Otniel Abiezer - Backend Developer
- Satria Ibnu Pamungkas - Frontend Developer
- Richly Ranald Januar - Backend Developer

## License

This project is part of KADA Batch 2 educational program.

## Support

For questions and support, please contact the development team or create an issue in the project repository.

---

Built with passion by KADA Batch 2 Group 1
