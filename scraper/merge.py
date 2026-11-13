"""Merge verified Scrapy metadata without overwriting existing catalogue fields."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--catalogue", default="public/herocon-linked-products-only.json")
parser.add_argument("--extracted", default="scraper/results.jsonl")
parser.add_argument("--output", default="scraper/merged-preview.json")
args = parser.parse_args()

data = json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
products = data if isinstance(data, list) else data["products"]
updates = {}
for line in Path(args.extracted).read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    item = json.loads(line)
    key = item.get("doppelProductId")
    if key and item.get("originalMarketplaceUrl"):
        updates[key] = item
changed = 0
for product in products:
    item = updates.get(product.get("doppelProductId"))
    if not item or item["originalMarketplaceUrl"] != product.get("originalMarketplaceUrl"):
        continue
    for key in ("price", "sellerName", "category"):
        value = item.get(key)
        if value and not product.get(key):
            if key == "price":
                currency = item.get("currency")
                value = f"{value} {currency}" if currency else value
            product[key] = value
            changed += 1
Path(args.output).parent.mkdir(parents=True, exist_ok=True)
Path(args.output).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Merged {changed} fields. Preview: {args.output}")
