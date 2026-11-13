"""Conservative public-page metadata extractor. No authentication or anti-bot bypass."""
import json
import re
from pathlib import Path
from urllib.parse import urlparse

import scrapy

ALLOWED = {"item.taobao.com", "detail.1688.com", "detail.tmall.com", "weidian.com", "www.weidian.com"}


def text_value(value):
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, (int, float)):
        return str(value)
    return None


def objects(value):
    if isinstance(value, list):
        for item in value:
            yield from objects(item)
    elif isinstance(value, dict):
        if "@graph" in value:
            yield from objects(value["@graph"])
        yield value


class MarketplaceSpider(scrapy.Spider):
    name = "marketplace"
    allowed_domains = list(ALLOWED)

    def __init__(self, input_file="../public/herocon-linked-products-only.json", limit=20, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.input_file = input_file
        self.limit = max(0, int(limit))

    def start_requests(self):
        data = json.loads(Path(self.input_file).read_text(encoding="utf-8"))
        products = data if isinstance(data, list) else data.get("products", [])
        for product in products[:self.limit]:
            url = product.get("originalMarketplaceUrl")
            if not isinstance(url, str):
                continue
            parsed = urlparse(url)
            if parsed.scheme != "https" or parsed.hostname not in ALLOWED:
                continue
            yield scrapy.Request(url, callback=self.parse, errback=self.on_error, meta={"product_id": product.get("doppelProductId"), "original_url": url}, dont_filter=True)

    def on_error(self, failure):
        self.logger.info("Skipped inaccessible listing: %s", failure.request.url)

    def parse(self, response):
        if response.status != 200:
            return
        price = seller = category = currency = None
        for script in response.css('script[type="application/ld+json"]::text').getall():
            try:
                doc = json.loads(script)
            except (ValueError, TypeError):
                continue
            for obj in objects(doc):
                kind = obj.get("@type", "")
                kinds = kind if isinstance(kind, list) else [kind]
                if "Product" not in kinds:
                    continue
                offers = obj.get("offers", {})
                if isinstance(offers, list):
                    offers = next((x for x in offers if isinstance(x, dict)), {})
                if not isinstance(offers, dict):
                    offers = {}
                price = price or text_value(offers.get("price") or offers.get("lowPrice"))
                currency = currency or text_value(offers.get("priceCurrency"))
                category = category or text_value(obj.get("category"))
                seller_obj = offers.get("seller") or obj.get("brand")
                if isinstance(seller_obj, dict):
                    seller = seller or text_value(seller_obj.get("name"))
                else:
                    seller = seller or text_value(seller_obj)
        price = price or response.css('meta[property="product:price:amount"]::attr(content), meta[itemprop="price"]::attr(content)').get()
        currency = currency or response.css('meta[property="product:price:currency"]::attr(content), meta[itemprop="priceCurrency"]::attr(content)').get()
        if price:
            price = price.strip()
            if not re.fullmatch(r"\d+(?:\.\d{1,2})?", price):
                price = None
        if not any([price, seller, category]):
            self.logger.info("No public structured fields: %s", response.url)
            return
        yield {
            "doppelProductId": response.meta["product_id"],
            "originalMarketplaceUrl": response.meta["original_url"],
            "price": price,
            "currency": currency,
            "sellerName": seller,
            "category": category,
        }
