"""
Items definition for Google Maps Review Scraper
"""

import scrapy


class GoogleMapsReview(scrapy.Item):
    """Data structure for a Google Maps review"""
    
    # Place information
    place_name = scrapy.Field()
    place_url = scrapy.Field()
    
    # Reviewer information
    reviewer_name = scrapy.Field()
    reviewer_url = scrapy.Field()
    
    # Review content
    rating = scrapy.Field()
    review_text = scrapy.Field()
    review_date = scrapy.Field()
    
    # Additional data
    response_from_owner = scrapy.Field()
    number_of_photos = scrapy.Field()
    
    # Metadata
    scraped_at = scrapy.Field()


class GoogleMapsPlace(scrapy.Item):
    """Data structure for a Google Maps place/business"""
    
    # Basic information
    name = scrapy.Field()
    url = scrapy.Field()
    place_id = scrapy.Field()
    
    # Location
    address = scrapy.Field()
    city = scrapy.Field()
    state = scrapy.Field()
    postal_code = scrapy.Field()
    country = scrapy.Field()
    latitude = scrapy.Field()
    longitude = scrapy.Field()
    
    # Contact
    phone = scrapy.Field()
    website = scrapy.Field()
    
    # Business details
    category = scrapy.Field()
    price_level = scrapy.Field()
    hours = scrapy.Field()
    
    # Ratings
    overall_rating = scrapy.Field()
    total_reviews = scrapy.Field()
    
    # Metadata
    scraped_at = scrapy.Field()