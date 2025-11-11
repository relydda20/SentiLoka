# SentiLoka

**Every Review Matters**

SentiLoka is an AI-powered customer sentiment analysis and review management platform that helps businesses understand customer feedback across multiple locations. We help companies who struggle to read thousands of reviews uncover what customers truly feel.

## GitHub Repository

**Repository:** [https://github.com/relydda20/SentiLoka](https://github.com/relydda20/SentiLoka)

## Live Demo

**Deployment:** [https://www.sentiloka.app/](https://www.sentiloka.app/)

## Project Overview

### Goal

SentiLoka aims to transform how businesses understand and respond to customer feedback by providing:

- Real-time sentiment analysis of Google Maps reviews
- Geographic visualization of customer satisfaction across multiple locations
- AI-powered review response generation
- Actionable insights from customer feedback data
- Conversational AI interface for querying review data

### Problem Statement

Companies with multiple business locations struggle to:
- Process and analyze thousands of customer reviews manually
- Understand geographic patterns in customer sentiment
- Respond promptly and appropriately to customer feedback
- Extract actionable insights from unstructured review data

## Main Features

### 1. Map-Based Analytics
**See what customers feel - anywhere, anytime, on the map**

Visualize customer sentiment across all your business locations on an interactive map. Get a geographical overview of customer satisfaction and identify trends by region in real-time.

### 2. Emotion-Driven Insights
**We don't just show data - we show emotions**

Transform raw review data into emotional insights. Our AI analyzes the underlying emotions in customer feedback, helping you understand not just what customers say, but how they feel.

### 3. Live Sentiment Analysis
**We're redefining feedback - turning emotions into live insights, instantly**

Real-time sentiment analysis provides immediate understanding of customer feelings with positive, neutral, and negative feedback classification. Track sentiment trends over time and identify areas for improvement.

### 4. AI-Powered Reply Generation
Generate perfect, context-aware responses to reviews in seconds. The AI understands the nuances of each review and creates personalized replies that match your brand voice and tone.

### 5. Loka AI - Conversational Intelligence
**Your AI you can talk to, anytime, anywhere, no signup needed**

Meet Loka AI, an intelligent chatbot that listens, understands, and transforms your questions into meaningful insights instantly. Query your review data using natural language and get data-driven answers about customer sentiment, common themes, and business performance.

### 6. Comprehensive Dashboard
Monitor all your locations from a single, intuitive dashboard. View sentiment breakdowns, rating distributions, and key performance indicators across your business with visual analytics.

## Technology Stack

### Frontend
- **React** - Modern UI framework for building interactive user interfaces
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **React Query (TanStack Query)** - Efficient data fetching and state management
- **Google Maps API** - Interactive map visualizations for geographic sentiment analysis
- **ApexCharts** - Data visualization and analytics charts

### Backend
- **Node.js & Express** - RESTful API development and server-side logic
- **Python** - Web scraping and data processing
- **Scrapy & Playwright** - Custom high-performance web scraper for Google Maps
- **Bull Queue & Redis** - Background job processing for asynchronous tasks
- **JWT Authentication** - Secure authentication with Google OAuth support
- **Passport.js** - Authentication middleware

### Database
- **MongoDB** - Flexible, scalable NoSQL database for storing reviews and sentiment data

### AI & Machine Learning
- **OpenAI Elice ML API** - Advanced sentiment analysis and natural language processing
- **Google Gemini** - AI-powered review response generation

## Getting Started

### Prerequisites

- Node.js 20 or higher
- Python 3.x with pip
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

5. Configure environment variables in `.env`:
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

6. (Optional) Seed the database with test data:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The backend API will run on `http://localhost:8080`.

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

The frontend application will run on `http://localhost:5173`.

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

## Development Challenges & Solutions

### Challenge 1: API Costs and Limitations
**Problem:** Third-party sentiment analysis APIs were costly and had usage limitations that would not scale with our needs.

**Solution:** We went open-source. Built custom sentiment analysis using open-source AI models (OpenAI Elice and Google Gemini), significantly reducing operational costs while maintaining high-quality analysis.

### Challenge 2: Slow Web Scraping
**Problem:** Conventional web scraping methods were too slow to handle large volumes of reviews from multiple locations.

**Solution:** We built our own, faster scraper. Developed a custom Scrapy spider with Playwright that efficiently handles dynamic content, with intelligent caching and pagination handling. Our scraper can collect unlimited reviews from any Google Maps location.

### Challenge 3: Long Analysis Times
**Problem:** Processing thousands of reviews sequentially took too long, creating bottlenecks in the user experience.

**Solution:** We made it parallel. Implemented Bull queue with Redis for background job processing, allowing multiple reviews to be analyzed simultaneously. This parallel processing architecture dramatically reduced analysis time and improved system responsiveness.

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

## What Makes SentiLoka Unique

### Loka AI - Conversational Interface
Unlike traditional analytics platforms, SentiLoka features Loka AI, a conversational AI assistant that you can talk to anytime, anywhere, with no signup needed. Simply ask questions in natural language and receive meaningful insights instantly.

### Geographic Sentiment Visualization
Our interactive map-based interface allows businesses to visualize customer emotions geographically, providing spatial context to sentiment analysis that traditional review management tools lack.

### Emotion-Centric Analysis
We go beyond simple ratings and keywords. SentiLoka focuses on understanding and presenting the emotional content of reviews, turning raw data into actionable emotional intelligence.

## Future Development Roadmap

### 1. Enhanced User Experience
- Improved UI/UX with more interactive visualizations
- Mobile app development for on-the-go review management
- Advanced filtering and search capabilities
- Customizable dashboard widgets

### 2. Security Enhancements
- Two-factor authentication implementation
- Enhanced data encryption
- Advanced user permission management
- Security audit and compliance certifications

### 3. New Features
- Multi-platform review aggregation (beyond Google Maps)
- Automated report generation and scheduling
- Review comparison tools across locations
- Competitor sentiment analysis
- Integration with CRM and marketing tools
- Advanced predictive analytics

### 4. Marketing Strategy
- Customer segmentation based on sentiment patterns
- Automated marketing campaign recommendations
- ROI tracking for review response efforts
- Industry benchmark comparisons

## Team

**KADA Batch 2 - Group 1**

Backend Developers:
- Raphael Reynaldi
- Otniel Abiezer
- Richly Ranald Januar

Frontend Developer:
- Satria Ibnu Pamungkas

UI/UX Designers:
- Nada Salsabila
- Alif Fata Fadhlillah

## License

This project is part of Korean-ASEAN Digital Academy (KADA) Batch 2 educational program.

## Support

For questions and support, please contact the development team or create an issue in the project repository.

---

**Built by KADA Batch 2 Group 1**
