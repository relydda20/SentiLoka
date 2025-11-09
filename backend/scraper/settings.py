"""
Scrapy Settings for Google Maps Review Scraper
Copy this to your Scrapy project's settings.py
"""

BOT_NAME = 'scraper'

SPIDER_MODULES = ['scraper.src.spiders']
NEWSPIDER_MODULE = 'scraper.src.spiders'

# Crawl responsibly by identifying yourself (and your website) on the user-agent
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Obey robots.txt rules
ROBOTSTXT_OBEY = False  # Set to True if you want to respect robots.txt

# Configure maximum concurrent requests performed by Scrapy
CONCURRENT_REQUESTS = 1  # Keep low to avoid rate limiting

# Configure a delay for requests for the same website (default: 0)
DOWNLOAD_DELAY = 2  # 2 seconds delay between requests
# The download delay setting will honor only one of:
CONCURRENT_REQUESTS_PER_DOMAIN = 1
CONCURRENT_REQUESTS_PER_IP = 1

# Disable cookies (enabled by default)
COOKIES_ENABLED = True

# Disable Telnet Console (enabled by default)
TELNETCONSOLE_ENABLED = False

# Override the default request headers:
DEFAULT_REQUEST_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

# Enable or disable spider middlewares
SPIDER_MIDDLEWARES = {
    'scraper.middlewares.GooglemapsScraperSpiderMiddleware': 543,
}

# Enable or disable downloader middlewares
DOWNLOADER_MIDDLEWARES = {
    'scraper.middlewares.GooglemapsScraperDownloaderMiddleware': 543,
}

# Enable or disable extensions
EXTENSIONS = {
    'scrapy.extensions.telnet.TelnetConsole': None,
}

# Configure item pipelines
ITEM_PIPELINES = {
    'scraper.pipelines.GooglemapsScraperPipeline': 300,
}

# Enable and configure the AutoThrottle extension (disabled by default)
AUTOTHROTTLE_ENABLED = True
# The initial download delay
AUTOTHROTTLE_START_DELAY = 2
# The maximum download delay to be set in case of high latencies
AUTOTHROTTLE_MAX_DELAY = 10
# The average number of requests Scrapy should be sending in parallel to
# each remote server
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
# Enable showing throttling stats for every response received:
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
HTTPCACHE_ENABLED = False
HTTPCACHE_EXPIRATION_SECS = 0
HTTPCACHE_DIR = 'httpcache'
HTTPCACHE_IGNORE_HTTP_CODES = []
HTTPCACHE_STORAGE = 'scrapy.extensions.httpcache.FilesystemCacheStorage'

# ============================================
# PLAYWRIGHT SETTINGS (for maps_reviews spider)
# ============================================

DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}

PLAYWRIGHT_BROWSER_TYPE = "chromium"  # or "firefox" or "webkit"

PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": False,  # Set to False for debugging
    "timeout": 60000,  # 60 seconds
    # Uncomment below for debugging
    # "slowMo": 1000,  # Slow down by 1 second
}

# Additional Playwright settings
PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT = 60000  # 60 seconds

# ============================================
# ZYTE API SETTINGS (for maps_reviews_zyte spider)
# ============================================

# In Scrapy Cloud, this will be set automatically
# For local testing, uncomment and add your key:
# ZYTE_API_KEY = "YOUR_ZYTE_API_KEY_HERE"

    # Enable Zyte API
ZYTE_API_ENABLED = True

# Zyte API specific middlewares
# Uncomment if using Zyte API:
# DOWNLOADER_MIDDLEWARES = {
#     'scrapy_zyte_api.ScrapyZyteAPIDownloaderMiddleware': 1000,
# }
# REQUEST_FINGERPRINTER_CLASS = 'scrapy_zyte_api.ScrapyZyteAPIRequestFingerprinter'

# Zyte API settings
ZYTE_API_TRANSPARENT_MODE = True  # Enable transparent mode

# ============================================
# RETRY SETTINGS
# ============================================

RETRY_ENABLED = True
RETRY_TIMES = 3  # Retry failed requests up to 3 times
RETRY_HTTP_CODES = [500, 502, 503, 504, 522, 524, 408, 429]

# ============================================
# LOGGING SETTINGS
# ============================================

LOG_LEVEL = 'INFO'  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
# LOG_FILE = 'scrapy.log'  # Uncomment to save logs to file

# ============================================
# FEED EXPORT SETTINGS
# ============================================

# Default output encoding
FEED_EXPORT_ENCODING = 'utf-8'

# Feed export settings for different formats
FEED_EXPORTERS = {
    'json': 'scrapy.exporters.JsonItemExporter',
    'jsonlines': 'scrapy.exporters.JsonLinesItemExporter',
    'csv': 'scrapy.exporters.CsvItemExporter',
    'xml': 'scrapy.exporters.XmlItemExporter',
}

# CSV specific settings
FEED_EXPORT_FIELDS = [
    'place_name',
    'place_url',
    'reviewer_name',
    'rating',
    'review_text',
    'review_date',
    'scraped_at',
]

# ============================================
# CUSTOM SETTINGS
# ============================================

# Scraper Configuration - NO LIMITS
# The scraper will collect ALL available reviews from Google Maps
# Scroll settings for loading more reviews
MAX_SCROLL_COUNT = 999999  # Effectively unlimited - will scroll until no more reviews
SCROLL_DELAY = 1.5  # seconds

# ============================================
# SCRAPY CLOUD SETTINGS
# ============================================

# These are automatically set in Scrapy Cloud
# PROJECT_ID = 'YOUR_PROJECT_ID'
# SHUB_JOBKEY = 'project_id/spider_id/job_id'

# Set higher timeout for Scrapy Cloud
DOWNLOAD_TIMEOUT = 180  # 3 minutes

# ============================================
# PROXY SETTINGS (Optional)
# ============================================

# Uncomment if using a proxy service
# PROXY_URL = 'http://proxy.example.com:8080'
# HTTP_PROXY = PROXY_URL
# HTTPS_PROXY = PROXY_URL

# Or use rotating proxies middleware
# DOWNLOADER_MIDDLEWARES.update({
#     'scrapy_rotating_proxies.middlewares.RotatingProxyMiddleware': 610,
#     'scrapy_rotating_proxies.middlewares.BanDetectionMiddleware': 620,
# })
# ROTATING_PROXY_LIST = [
#     'proxy1.example.com:8000',
#     'proxy2.example.com:8000',
# ]
