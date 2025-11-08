# Stage 1: Python dependencies
FROM python:3.12-slim as python-builder

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and browsers
RUN playwright install --with-deps chromium

# Stage 2: Node.js application
FROM node:20-alpine

WORKDIR /app

# Install Python runtime (needed for scraper)
RUN apk add --no-cache python3 py3-pip chromium chromium-chromedriver

# Copy Python environment from builder
COPY --from=python-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin
COPY --from=python-builder /root/.cache/ms-playwright /root/.cache/ms-playwright

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy backend source
COPY . .

# Create temp directory for scraper outputs
RUN mkdir -p temp

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]