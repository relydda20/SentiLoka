"""
Google Maps Review Spider
Scrapes reviews from Google Maps business listings
"""

import scrapy
from scrapy_playwright.page import PageMethod
from datetime import datetime, timedelta
import json
import re
import asyncio


class MapsReviewsSpider(scrapy.Spider):
    name = 'maps_reviews'
    allowed_domains = ['google.com', 'www.google.com', 'maps.google.com']
    
    custom_settings = {
        'DOWNLOAD_DELAY': 2,
        'CONCURRENT_REQUESTS': 1,
        'PLAYWRIGHT_BROWSER_TYPE': 'chromium',
    }
    
    def __init__(self, url=None, urls_file=None, max_reviews=None, *args, **kwargs):
        super(MapsReviewsSpider, self).__init__(*args, **kwargs)

        # Handle single URL or file with multiple URLs
        self.urls = []
        if url:
            self.urls.append(url)
        elif urls_file:
            try:
                with open(urls_file, 'r') as f:
                    self.urls = [line.strip() for line in f if line.strip()]
            except FileNotFoundError:
                self.logger.error(f"URL file not found: {urls_file}")

        # No limit on reviews - scrape all available
        self.max_reviews = None

        if not self.urls:
            raise ValueError("Must provide either 'url' or 'urls_file' argument")

        # Cache for successful selectors (optimization)
        self.cached_selectors = {
            'reviews_button': None,
            'scrollable_div': None,
            'rating': None,
        }

    def parse_relative_date(self, relative_date_str):
        """
        Convert relative date strings to actual dates.
        Supports multiple languages including Indonesian, English, Spanish, French, German, Italian.

        Examples:
        - "6 hari lalu" (Indonesian) -> 2025-10-24
        - "2 months ago" (English) -> 2025-08-30
        - "setahun lalu" (Indonesian) -> 2024-10-30
        """
        if not relative_date_str or relative_date_str == 'Unknown':
            return relative_date_str

        now = datetime.now()
        date_str = relative_date_str.lower().strip()

        # Remove "Diedit" (Edited) prefix if present
        date_str = re.sub(r'^(diedit|edited)\s+', '', date_str, flags=re.IGNORECASE)

        try:
            # Extract number from string
            number_match = re.search(r'(\d+)', date_str)
            number = int(number_match.group(1)) if number_match else 1

            # Days - hari (Indonesian), day/days (English), día/días (Spanish), jour/jours (French), tag/tage (German), giorno/giorni (Italian)
            if any(word in date_str for word in ['hari', 'day', 'día', 'jour', 'tag', 'giorno']):
                result_date = now - timedelta(days=number)
                return result_date.strftime('%Y-%m-%d')

            # Weeks - minggu (Indonesian), week/weeks (English), semana/semanas (Spanish), semaine/semaines (French), woche/wochen (German), settimana/settimane (Italian)
            elif any(word in date_str for word in ['minggu', 'week', 'semana', 'semaine', 'woche', 'settimana']):
                result_date = now - timedelta(weeks=number)
                return result_date.strftime('%Y-%m-%d')

            # Months - bulan (Indonesian), month/months (English), mes/meses (Spanish), mois (French), monat/monate (German), mese/mesi (Italian)
            elif any(word in date_str for word in ['bulan', 'month', 'mes', 'mois', 'monat', 'mese']):
                # Approximate: 1 month = 30 days
                result_date = now - timedelta(days=number * 30)
                return result_date.strftime('%Y-%m-%d')

            # Years - tahun (Indonesian), year/years (English), año/años (Spanish), an/ans/année (French), jahr/jahre (German), anno/anni (Italian)
            elif any(word in date_str for word in ['tahun', 'year', 'año', 'an', 'année', 'jahr', 'anno', 'setahun']):
                # Approximate: 1 year = 365 days
                # "setahun" means "a year" in Indonesian
                result_date = now - timedelta(days=number * 365)
                return result_date.strftime('%Y-%m-%d')

            # If we can't parse it, return the original string
            else:
                return relative_date_str

        except Exception as e:
            self.logger.debug(f"Could not parse relative date '{relative_date_str}': {e}")
            return relative_date_str

    async def start(self):
        """Generate initial requests for all URLs (async version for Scrapy 2.13+)"""
        for url in self.urls:
            # Make sure we're on the reviews tab
            if 'reviews' not in url.lower():
                # Add reviews filter to URL
                if '?' in url:
                    url = url + '&reviews=true'
                else:
                    url = url + '?reviews=true'

            yield scrapy.Request(
                url=url,
                callback=self.parse,
                errback=self.errback,
                meta={
                    'playwright': True,
                    'playwright_include_page': True,
                    'playwright_page_methods': [
                        PageMethod('wait_for_timeout', 3000),  # Wait for page to load
                        PageMethod('wait_for_selector', 'h1', timeout=10000),
                    ],
                    'place_url': url,
                }
            )
    
    async def parse(self, response):
        """Parse the Google Maps page and extract reviews"""
        page = response.meta['playwright_page']
        place_url = response.meta['place_url']

        try:
            # ANTI-POPUP: Prevent new tabs/windows from opening (profiles, images, etc.)
            await page.evaluate('''
                () => {
                    // Override window.open to prevent popups
                    window.open = function() { return null; };

                    // Prevent all links from opening in new tabs
                    document.addEventListener('click', function(e) {
                        const target = e.target.closest('a');
                        if (target && (target.target === '_blank' || target.hasAttribute('target'))) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }, true);
                }
            ''')

            # Extract place name
            place_name = await page.query_selector('h1')
            place_name_text = await place_name.inner_text() if place_name else 'Unknown'

            self.logger.info(f"Scraping reviews for: {place_name_text}")
            
            # Try to find and click on the reviews tab/button
            try:
                # Look for reviews button - multiple possible selectors in multiple languages
                # Including Indonesian ("Ulasan"), English ("Reviews"), and other languages
                reviews_button_selectors = [
                    'button[aria-label*="Reviews"]',
                    'button[aria-label*="reviews"]',
                    'button[aria-label*="Ulasan"]',  # Indonesian
                    'button[aria-label*="ulasan"]',  # Indonesian lowercase
                    'button[aria-label*="Reseñas"]',  # Spanish
                    'button[aria-label*="Avis"]',  # French
                    'button[aria-label*="Bewertungen"]',  # German
                    'button[aria-label*="Recensioni"]',  # Italian
                    'div[role="tab"]:has-text("Reviews")',
                    'div[role="tab"]:has-text("Ulasan")',  # Indonesian
                    'button:has-text("Reviews")',
                    'button:has-text("Ulasan")',  # Indonesian
                ]

                reviews_button = None

                # OPTIMIZATION 3: Try cached selector first
                if self.cached_selectors.get('reviews_button'):
                    try:
                        reviews_button = await page.query_selector(self.cached_selectors['reviews_button'])
                        if reviews_button:
                            self.logger.info(f"Using cached reviews button selector")
                            await reviews_button.click()
                            # SPEED UP: Reduced wait time from 3000ms to 800ms
                            await page.wait_for_timeout(800)
                            self.logger.info("Clicked on reviews tab")
                    except Exception as e:
                        # Cached selector failed, clear it and try all
                        self.cached_selectors['reviews_button'] = None

                # If cached selector didn't work, try all selectors
                if not reviews_button:
                    for selector in reviews_button_selectors:
                        try:
                            reviews_button = await page.query_selector(selector)
                            if reviews_button:
                                self.logger.info(f"Found reviews button with selector: {selector}")
                                # Cache the working selector
                                self.cached_selectors['reviews_button'] = selector
                                await reviews_button.click()
                                # SPEED UP: Reduced wait time from 3000ms to 800ms
                                await page.wait_for_timeout(800)
                                self.logger.info("Clicked on reviews tab")
                                break
                        except Exception as e:
                            continue

                if not reviews_button:
                    self.logger.warning("Could not find reviews button with any selector, trying tab index approach")
                    # Try clicking the second tab (usually reviews on Google Maps)
                    try:
                        tabs = await page.query_selector_all('button[role="tab"]')
                        if len(tabs) >= 2:
                            # Usually: [0] = Overview/Ringkasan, [1] = Reviews/Ulasan, [2] = About/Tentang
                            await tabs[1].click()
                            # SPEED UP: Reduced wait time from 3000ms to 800ms
                            await page.wait_for_timeout(800)
                            self.logger.info("Clicked on second tab (likely reviews)")
                        else:
                            self.logger.warning("Could not find tabs, assuming already on reviews")
                    except Exception as e:
                        self.logger.warning(f"Could not click tab by index: {e}")
            except Exception as e:
                self.logger.warning(f"Error clicking reviews tab: {e}")

            # SPEED UP: Reduced wait time from 3000ms to 500ms - reviews load fast
            await page.wait_for_timeout(500)

            # Try to change sort order to "Newest" to get all reviews more reliably
            try:
                sort_button_selectors = [
                    'button[data-value="Sort"]',
                    'button[aria-label*="Sort"]',
                    'button:has-text("Sort")',
                ]

                for selector in sort_button_selectors:
                    try:
                        sort_button = await page.query_selector(selector)
                        if sort_button:
                            await sort_button.click()
                            # SPEED UP: Reduced from 1000ms to 400ms
                            await page.wait_for_timeout(400)

                            # Click "Newest" option
                            newest_option = await page.query_selector('div[data-index="1"]')
                            if newest_option:
                                await newest_option.click()
                                # SPEED UP: Reduced from 2000ms to 600ms
                                await page.wait_for_timeout(600)
                                self.logger.info("Changed sort order to Newest")
                                break
                    except:
                        continue
            except Exception as e:
                self.logger.warning(f"Could not change sort order: {e}")

            # Use optimized incremental scraping - scrape WHILE scrolling
            seen_reviews = set()
            reviews_scraped = 0
            duplicates_skipped = 0

            self.logger.info("Starting incremental scraping (scrape while loading)...")

            # Scroll and scrape incrementally - no limit, get all available reviews
            async for review_data in self.scroll_and_scrape_incrementally(
                page,
                place_name_text,
                place_url
            ):
                if review_data:
                    # Create unique key for deduplication
                    review_id = review_data.get('_review_id')
                    reviewer_name = review_data.get('reviewer_name')
                    review_date = review_data.get('review_date')

                    review_key = None
                    if review_id:
                        review_key = f"id:{review_id}"
                    elif reviewer_name and review_date:
                        review_key = f"name_date:{reviewer_name}:{review_date}"

                    # Skip duplicates
                    if review_key and review_key in seen_reviews:
                        duplicates_skipped += 1
                        continue

                    # Mark as seen and yield
                    if review_key:
                        seen_reviews.add(review_key)

                    # Remove internal tracking field before yielding
                    review_data.pop('_review_id', None)

                    yield review_data
                    reviews_scraped += 1

                    # Log progress every 10 reviews
                    if reviews_scraped % 10 == 0:
                        self.logger.info(f"Progress: {reviews_scraped} reviews scraped")

            self.logger.info(f"Successfully scraped {reviews_scraped} unique reviews from {place_name_text} (skipped {duplicates_skipped} duplicates)")
        
        except Exception as e:
            self.logger.error(f"Error parsing page {place_url}: {e}")
        
        finally:
            await page.close()
    
    async def scroll_and_scrape_incrementally(self, page, place_name, place_url):
        """
        Optimized: Scroll and scrape reviews incrementally with parallel processing.
        No limit - scrapes ALL available reviews.
        - Reduced wait times (150ms scroll, 100ms expansion)
        - Smart scroll detection to avoid unnecessary scrolls
        - Parallel review extraction using asyncio.gather
        - Cached selectors to avoid repeated selector attempts
        - ONLY scrapes from the specific reviews container (blue highlighted area)
        - Prevents accidental clicks on profiles/images
        """
        scrollable_selectors = [
            'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde',
            'div.m6QErb.DxyBCb.kA9KIf.dS8AEf',
            'div[role="main"]',
            'div.m6QErb',
        ]

        processed_review_ids = set()
        no_new_reviews_count = 0
        max_no_change_attempts = 3
        scroll_count = 0
        max_scrolls = 999999  # Effectively unlimited - scroll until no more reviews

        # Cache the working selector after first successful use
        working_scrollable_selector = self.cached_selectors.get('scrollable_div')
        previous_scroll_height = 0

        # ANTI-CLICK: Disable pointer events on profile images and links to prevent accidental navigation
        await page.evaluate('''
            () => {
                // Add CSS to disable clicks on profile pictures and images
                const style = document.createElement('style');
                style.textContent = `
                    img[role="img"],
                    a[href*="/contrib/"],
                    a[data-item-id*="authority"],
                    div[role="img"],
                    button[aria-label*="photo"],
                    button[aria-label*="Photo"] {
                        pointer-events: none !important;
                    }
                `;
                document.head.appendChild(style);
            }
        ''')

        while scroll_count < max_scrolls:
            try:
                # IMPORTANT: Only get reviews from the specific scrollable container
                # Find the scrollable container first
                scrollable_container = None
                for selector in scrollable_selectors:
                    scrollable_container = await page.query_selector(selector)
                    if scrollable_container:
                        working_scrollable_selector = selector
                        break

                # Get current reviews on page - ONLY from within the scrollable container
                review_elements = []
                if scrollable_container:
                    # Query reviews ONLY within the scrollable container
                    review_elements = await scrollable_container.query_selector_all('div[data-review-id]')
                    if not review_elements:
                        review_elements = await scrollable_container.query_selector_all('div.jftiEf')
                else:
                    # Fallback: query from page but log warning
                    self.logger.warning("Could not find scrollable container, using page-level query")
                    review_elements = await page.query_selector_all('div[data-review-id]')
                    if not review_elements:
                        review_elements = await page.query_selector_all('div.jftiEf')

                # OPTIMIZATION 2 & 3: Expand "More" buttons with reduced wait time
                # IMPORTANT: Only expand buttons within the scrollable container
                if scrollable_container:
                    await page.evaluate(f'''
                        () => {{
                            const container = document.querySelector('{working_scrollable_selector}');
                            if (container) {{
                                const buttons = Array.from(container.querySelectorAll('button[aria-label="See more"], button[aria-label*="more"], button[aria-label*="More"]'));
                                buttons.forEach(btn => {{
                                    try {{ btn.click(); }} catch (e) {{}}
                                }});
                            }}
                        }}
                    ''')
                else:
                    # Fallback to page-level
                    await page.evaluate('''
                        () => {
                            const buttons = Array.from(document.querySelectorAll('button[aria-label="See more"], button[aria-label*="more"], button[aria-label*="More"]'));
                            buttons.forEach(btn => {
                                try { btn.click(); } catch (e) {}
                            });
                        }
                    ''')
                # SPEED UP: Reduced from 100ms to 50ms
                await page.wait_for_timeout(50)

                # OPTIMIZATION 4: Parallel review extraction
                # Collect new reviews first, then process them in parallel
                new_review_elements = []
                for review_elem in review_elements:
                    try:
                        review_id = await review_elem.get_attribute('data-review-id')
                        if not review_id:
                            elem_text = await review_elem.inner_text()
                            review_id = hash(elem_text[:100]) if elem_text else None

                        if review_id and review_id not in processed_review_ids:
                            processed_review_ids.add(review_id)
                            new_review_elements.append((review_elem, review_id))

                    except Exception as e:
                        self.logger.debug(f"Error checking review element: {e}")
                        continue

                # Process new reviews in parallel (batches of 5 for efficiency)
                if new_review_elements:
                    batch_size = 5
                    for i in range(0, len(new_review_elements), batch_size):
                        batch = new_review_elements[i:i + batch_size]

                        # Extract reviews in parallel using asyncio.gather
                        extraction_tasks = [
                            self.extract_review_data(elem, place_name, place_url, review_id)
                            for elem, review_id in batch
                        ]
                        review_results = await asyncio.gather(*extraction_tasks, return_exceptions=True)

                        # Yield the successfully extracted reviews
                        for idx, review_data in enumerate(review_results):
                            if isinstance(review_data, Exception):
                                self.logger.debug(f"Error extracting review: {review_data}")
                                continue

                            if review_data:
                                # Add internal tracking ID
                                review_data['_review_id'] = batch[idx][1]
                                yield review_data

                # OPTIMIZATION 5: Smart scroll detection - check if we're at bottom
                current_scroll_height = await page.evaluate(f'''
                    () => {{
                        const element = document.querySelector('{working_scrollable_selector or scrollable_selectors[0]}') ||
                                        document.querySelector('{scrollable_selectors[1]}') ||
                                        document.querySelector('{scrollable_selectors[2]}') ||
                                        document.querySelector('{scrollable_selectors[3]}');
                        if (element) {{
                            return element.scrollHeight;
                        }}
                        return document.body.scrollHeight;
                    }}
                ''')

                # OPTIMIZATION 3: Use cached selector or find working one
                scroll_success = False
                if working_scrollable_selector:
                    # Use cached selector
                    scroll_success = await page.evaluate(f'''
                        () => {{
                            const element = document.querySelector('{working_scrollable_selector}');
                            if (element) {{
                                element.scrollTop = element.scrollHeight;
                                return true;
                            }}
                            return false;
                        }}
                    ''')

                if not scroll_success:
                    # Try selectors and cache the working one
                    for selector in scrollable_selectors:
                        scroll_success = await page.evaluate(f'''
                            () => {{
                                const element = document.querySelector('{selector}');
                                if (element) {{
                                    element.scrollTop = element.scrollHeight;
                                    return true;
                                }}
                                return false;
                            }}
                        ''')
                        if scroll_success:
                            working_scrollable_selector = selector
                            self.cached_selectors['scrollable_div'] = selector
                            break

                # Fallback scroll
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')

                # SPEED UP: Reduced wait time to 80ms for faster scraping
                await page.wait_for_timeout(80)  # REDUCED: 300ms → 150ms → 80ms

                scroll_count += 1

                # Check if we're still finding new reviews or at bottom
                new_reviews_found = len(new_review_elements) > 0
                at_bottom = (current_scroll_height == previous_scroll_height)

                if not new_reviews_found or at_bottom:
                    no_new_reviews_count += 1
                    if no_new_reviews_count >= max_no_change_attempts:
                        self.logger.info(f"No new reviews after {no_new_reviews_count} scroll attempts, ending")
                        break
                else:
                    no_new_reviews_count = 0

                previous_scroll_height = current_scroll_height

                # Log progress
                if scroll_count % 5 == 0:
                    self.logger.info(f"Scroll {scroll_count}: Found {len(processed_review_ids)} reviews so far")

            except Exception as e:
                self.logger.warning(f"Error during incremental scroll {scroll_count}: {e}")
                continue

    async def expand_all_reviews(self, page):
        """Batch expand all 'More' buttons to get full review text"""
        try:
            # Find all "More" buttons - try multiple selectors for different languages
            more_button_selectors = [
                'button[aria-label="See more"]',
                'button[aria-label*="more"]',
                'button[aria-label*="More"]',
                'button.w8nwRe.kyuRq',  # Class-based selector
            ]

            all_more_buttons = []
            for selector in more_button_selectors:
                buttons = await page.query_selector_all(selector)
                all_more_buttons.extend(buttons)

            # Remove duplicates by converting to set (based on element handle)
            unique_buttons = list({id(btn): btn for btn in all_more_buttons}.values())

            if unique_buttons:
                self.logger.info(f"Found {len(unique_buttons)} 'More' buttons to expand")

                # Click all buttons using JavaScript for speed (avoids individual waits)
                await page.evaluate('''
                    () => {
                        const buttons = Array.from(document.querySelectorAll('button[aria-label="See more"], button[aria-label*="more"], button[aria-label*="More"]'));
                        buttons.forEach(btn => {
                            try {
                                btn.click();
                            } catch (e) {
                                // Ignore errors for individual buttons
                            }
                        });
                    }
                ''')

                # Single wait for all expansions
                await page.wait_for_timeout(1000)
                self.logger.info("Expanded all 'More' buttons")
            else:
                self.logger.info("No 'More' buttons found (all reviews may already be expanded)")

        except Exception as e:
            self.logger.warning(f"Error expanding 'More' buttons: {e}")

    async def scroll_reviews(self, page, max_scrolls=10):
        """Scroll through the reviews section to load more reviews"""
        try:
            # List of selectors to try for finding the scrollable container
            scrollable_selectors = [
                'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde',
                'div.m6QErb.DxyBCb.kA9KIf.dS8AEf',
                'div[role="main"]',
                'div.m6QErb',
            ]

            # Track previous review count to detect when no new reviews load
            previous_review_count = 0
            no_new_reviews_count = 0
            max_no_change_attempts = 3

            # Scroll multiple times to load more reviews
            for i in range(max_scrolls):
                try:
                    # Get current review count BEFORE scrolling
                    current_reviews = await page.query_selector_all('div[data-review-id]')
                    if not current_reviews:
                        current_reviews = await page.query_selector_all('div.jftiEf')
                    current_count = len(current_reviews)

                    # Re-query the scrollable element on EACH iteration to avoid stale references
                    scrollable_div = None
                    for selector in scrollable_selectors:
                        try:
                            scrollable_div = await page.query_selector(selector)
                            if scrollable_div:
                                break
                        except:
                            continue

                    # Scroll down to bottom using multiple methods for reliability
                    if scrollable_div:
                        # Method 1: Scroll the container using selector string (more reliable)
                        await page.evaluate(f'''
                            () => {{
                                const element = document.querySelector('{scrollable_selectors[0]}') ||
                                                document.querySelector('{scrollable_selectors[1]}') ||
                                                document.querySelector('{scrollable_selectors[2]}') ||
                                                document.querySelector('{scrollable_selectors[3]}');
                                if (element) {{
                                    element.scrollTop = element.scrollHeight;
                                }}
                            }}
                        ''')

                    # Also try scrolling the window itself
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')

                    # Wait for content to load (reduced from 1000ms to 400ms for faster scraping)
                    await page.wait_for_timeout(400)

                    # Get count AFTER scrolling and waiting
                    new_reviews = await page.query_selector_all('div[data-review-id]')
                    if not new_reviews:
                        new_reviews = await page.query_selector_all('div.jftiEf')
                    new_count = len(new_reviews)

                    # Check if new reviews loaded
                    if new_count == previous_review_count:
                        no_new_reviews_count += 1
                        self.logger.info(f"Scroll {i+1}/{max_scrolls} - No new reviews loaded: {new_count} reviews ({no_new_reviews_count}/{max_no_change_attempts})")

                        # Try a more aggressive scroll
                        if no_new_reviews_count < max_no_change_attempts:
                            # Try scrolling multiple times in succession
                            for _ in range(3):
                                await page.evaluate(f'''
                                    () => {{
                                        const element = document.querySelector('{scrollable_selectors[0]}') ||
                                                        document.querySelector('{scrollable_selectors[1]}') ||
                                                        document.querySelector('{scrollable_selectors[2]}');
                                        if (element) {{
                                            element.scrollTop = element.scrollHeight;
                                        }}
                                    }}
                                ''')
                                await page.wait_for_timeout(500)

                        # If no new reviews after max attempts, we've reached the end
                        if no_new_reviews_count >= max_no_change_attempts:
                            self.logger.info(f"Reached end of reviews after {i+1} scrolls with {new_count} total reviews")
                            break
                    else:
                        no_new_reviews_count = 0
                        self.logger.info(f"Scroll {i+1}/{max_scrolls} - Loaded {new_count} reviews (+{new_count - previous_review_count} new)")

                    previous_review_count = new_count

                except Exception as e:
                    self.logger.warning(f"Error during scroll {i+1}: {e}")
                    # Don't break immediately, try to continue
                    continue

        except Exception as e:
            self.logger.error(f"Error in scroll_reviews: {e}")
    
    async def extract_review_data(self, review_elem, place_name, place_url, data_review_id=None):
        """Extract data from a single review element"""
        try:
            # Reviewer name
            reviewer_name_elem = await review_elem.query_selector('div.d4r55')
            reviewer_name = await reviewer_name_elem.inner_text() if reviewer_name_elem else 'Anonymous'

            # Rating (star rating) - support multiple languages
            rating = None
            # Try multiple selectors for different languages
            rating_selectors = [
                'span[role="img"][aria-label*="star"]',      # English
                'span[role="img"][aria-label*="bintang"]',   # Indonesian
                'span[role="img"][aria-label*="estrella"]',  # Spanish
                'span[role="img"][aria-label*="étoile"]',    # French
                'span[role="img"][aria-label*="Stern"]',     # German
                'span[role="img"][aria-label*="stella"]',    # Italian
            ]

            for selector in rating_selectors:
                rating_elem = await review_elem.query_selector(selector)
                if rating_elem:
                    aria_label = await rating_elem.get_attribute('aria-label')
                    if aria_label:
                        # Extract number from "5 stars", "4 bintang", etc.
                        rating_match = re.search(r'(\d+(?:[.,]\d+)?)', aria_label)
                        if rating_match:
                            # Replace comma with dot for float conversion (some locales use comma)
                            rating_str = rating_match.group(1).replace(',', '.')
                            rating = float(rating_str)
                            break

            # Fallback: if rating not found, try alternative approach
            if rating is None:
                # Look for any span with role="img" that might contain rating info
                all_rating_spans = await review_elem.query_selector_all('span[role="img"]')
                for span in all_rating_spans:
                    aria_label = await span.get_attribute('aria-label')
                    if aria_label:
                        # Look for number followed by any word (star, bintang, etc.)
                        rating_match = re.search(r'(\d+(?:[.,]\d+)?)', aria_label)
                        if rating_match:
                            rating_str = rating_match.group(1).replace(',', '.')
                            rating = float(rating_str)
                            # Validate it's a reasonable rating (1-5)
                            if 1 <= rating <= 5:
                                break
                            else:
                                rating = None

            # Log warning if rating couldn't be extracted (helps with debugging)
            if rating is None:
                reviewer_name_for_log = reviewer_name if reviewer_name else 'Unknown'
                self.logger.debug(f"Could not extract rating for review by {reviewer_name_for_log}")

            # Review text (already expanded via batch operation)
            review_text_elem = await review_elem.query_selector('span.wiI7pd')
            review_text = ''
            if review_text_elem:
                review_text = await review_text_elem.inner_text()

            # If review text is empty or just whitespace, skip this review
            if not review_text or not review_text.strip():
                self.logger.debug(f"Skipping review with empty text by {reviewer_name}")
                return None

            # Review date - extract actual timestamp from DOM
            review_date = 'Unknown'
            review_timestamp = None

            # Try to get the actual timestamp from data attributes
            try:
                # Try to find timestamp in the entire review element first
                # Google Maps stores timestamps in data-review-id or other attributes

                # Method 1: Check review element's data-sort-time attribute
                timestamp_value = await review_elem.get_attribute('data-sort-time')
                if timestamp_value:
                    review_timestamp = timestamp_value

                # Method 2: Check for jslog attribute which may contain timestamp
                if not review_timestamp:
                    jslog = await review_elem.get_attribute('jslog')
                    if jslog:
                        # Try to extract timestamp from jslog string
                        timestamp_match = re.search(r'(\d{10,13})', jslog)
                        if timestamp_match:
                            review_timestamp = timestamp_match.group(1)

                # Method 3: Look in the date element and its parents
                if not review_timestamp:
                    date_elem = await review_elem.query_selector('span.rsqaWe')

                    if date_elem:
                        # Check all attributes of date element
                        all_attrs = await date_elem.evaluate('''
                            element => {
                                const attrs = {};
                                for (let i = 0; i < element.attributes.length; i++) {
                                    attrs[element.attributes[i].name] = element.attributes[i].value;
                                }
                                return attrs;
                            }
                        ''')

                        # Look for timestamp in any attribute
                        for attr_name, attr_value in all_attrs.items():
                            if attr_value and str(attr_value).isdigit() and len(str(attr_value)) >= 10:
                                review_timestamp = str(attr_value)
                                break

                        # Check parent elements
                        if not review_timestamp:
                            parent_timestamp = await date_elem.evaluate('''
                                element => {
                                    let current = element;
                                    for (let i = 0; i < 5; i++) {
                                        if (!current.parentElement) break;
                                        current = current.parentElement;

                                        // Check all attributes
                                        for (let j = 0; j < current.attributes.length; j++) {
                                            const value = current.attributes[j].value;
                                            if (value && /^\\d{10,13}$/.test(value)) {
                                                return value;
                                            }
                                        }
                                    }
                                    return null;
                                }
                            ''')
                            if parent_timestamp:
                                review_timestamp = parent_timestamp

                # Convert timestamp to datetime if found
                if review_timestamp:
                    try:
                        # Handle different timestamp formats
                        timestamp_str = str(review_timestamp).strip()
                        if timestamp_str.isdigit():
                            # Unix timestamp
                            if len(timestamp_str) > 10:
                                # Milliseconds
                                timestamp_int = int(timestamp_str) / 1000
                            else:
                                # Seconds
                                timestamp_int = int(timestamp_str)

                            review_date = datetime.fromtimestamp(timestamp_int).strftime('%Y-%m-%d %H:%M:%S')
                            self.logger.debug(f"Found timestamp {review_timestamp} -> {review_date}")
                        else:
                            # Not a unix timestamp, might be ISO format
                            review_date = timestamp_str
                    except Exception as e:
                        self.logger.debug(f"Could not convert timestamp '{review_timestamp}': {e}")
                        # Fallback to relative date parsing
                        date_elem = await review_elem.query_selector('span.rsqaWe')
                        review_date_raw = await date_elem.inner_text() if date_elem else 'Unknown'
                        review_date = self.parse_relative_date(review_date_raw)
                else:
                    # No timestamp found, use relative date parsing as fallback
                    date_elem = await review_elem.query_selector('span.rsqaWe')
                    review_date_raw = await date_elem.inner_text() if date_elem else 'Unknown'
                    review_date = self.parse_relative_date(review_date_raw)
                    self.logger.debug(f"No timestamp found, using relative date: {review_date_raw} -> {review_date}")

            except Exception as e:
                self.logger.debug(f"Error extracting timestamp: {e}")
                # Fallback to relative date parsing
                try:
                    date_elem = await review_elem.query_selector('span.rsqaWe')
                    review_date_raw = await date_elem.inner_text() if date_elem else 'Unknown'
                    review_date = self.parse_relative_date(review_date_raw)
                except:
                    review_date = 'Unknown'

            # Create review item
            review_data = {
                'place_name': place_name,
                'place_url': place_url,
                'data_review_id': data_review_id if data_review_id and str(data_review_id).isdigit() else None,
                'reviewer_name': reviewer_name.strip() if reviewer_name else 'Anonymous',
                'rating': rating,
                'review_text': review_text.strip() if review_text else '',
                'review_date': review_date,
                'scraped_at': datetime.now().isoformat(),
            }

            return review_data

        except Exception as e:
            self.logger.error(f"Error extracting review data: {e}")
            return None
    
    async def errback(self, failure):
        """Handle request errors"""
        self.logger.error(f"Request failed: {failure}")
        page = failure.request.meta.get('playwright_page')
        if page:
            await page.close()