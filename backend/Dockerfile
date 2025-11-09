# Use Node.js as base (we'll install Python in the same image)
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Python, Scrapy, and Playwright
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copy Python requirements first
COPY requirements.txt .

# Install Python dependencies directly (not in a separate stage)
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN pip3 install --break-system-packages playwright && \
    playwright install chromium

# Copy package files for Node.js
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Copy application source
COPY . .

# Create temp directory with proper permissions
RUN mkdir -p temp && chmod 777 temp

# Set Python environment variables
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]
