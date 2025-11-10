# Use Debian-based Node.js (NOT Alpine - Playwright doesn't work well on Alpine)
FROM node:20-slim

WORKDIR /app

# Install system dependencies for Python, Scrapy, and Playwright
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment (same name as local development)
RUN python3 -m venv python_env

# Copy requirements file
COPY requirements.txt .

# Install Python packages in virtual environment
# Using the venv's pip directly to ensure packages are installed in the right place
RUN python_env/bin/pip install --upgrade pip && \
    python_env/bin/pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers in the virtual environment
RUN python_env/bin/playwright install chromium && \
    python_env/bin/playwright install-deps chromium

# Update PATH to use virtual environment by default
ENV PATH="/app/python_env/bin:$PATH"

# Copy Node.js package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Copy all application source code
COPY . .

# Create temp directory for scraper outputs (only if it doesn't exist)
RUN mkdir -p temp && chmod 777 temp

# Set Python environment variables
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Expose application port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "src/server.js"]
