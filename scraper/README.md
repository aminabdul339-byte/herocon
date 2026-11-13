# Herocon marketplace metadata extractor

Scrapy-based, conservative extraction of **publicly available** metadata from the original marketplace URLs already in the catalogue. This does not use Doppel's private API, logins, proxies, CAPTCHA solving, browser fingerprint evasion or other anti-bot bypasses.

## Run locally

Requires Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r scraper/requirements.txt
cd scraper
scrapy crawl marketplace -a input_file=../public/herocon-linked-products-only.json -a limit=20 -O results.jsonl
cd ..
python scraper/merge.py --extracted scraper/results.jsonl
```

Review `scraper/merged-preview.json` before replacing `public/herocon-linked-products-only.json`. The merge never overwrites existing non-empty values. Product IDs and original URLs must match. Missing prices remain missing; no prices are guessed. A source's robots.txt or access restrictions may prevent extraction. The scraper is not automatically scheduled or deployed.

Prices may be in CNY or another marketplace currency and are kept with their source currency, not mislabeled GBP. Seller names alone are not reliable seller IDs, so seller profile grouping needs further verified data.
