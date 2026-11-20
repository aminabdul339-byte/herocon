#!/usr/bin/env python3
"""Import the spreadsheet's embedded C-column pictures, keyed by Google Sheet gid/row."""
import io
import pathlib
import tempfile
import xml.etree.ElementTree as ET
import zipfile

import requests
from PIL import Image, ImageOps

SPREADSHEET_ID = "1UPZerApqDKyhiZk4GOOzr4IY3LvgTZsXCtPdENlEwok"
SOURCE_URL = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/export?format=xlsx"
GIDS = {2: 480556134, 3: 2052363225, 4: 908762924, 5: 1155948127, 6: 579377089}
NS = {
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
OUT = pathlib.Path("public/shop-for-yourself-images")

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryFile() as out:
        response = requests.get(SOURCE_URL, timeout=(30, 180), stream=True,
                                headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        content_length = 0
        for block in response.iter_content(chunk_size=1024 * 1024):
            content_length += len(block)
            if content_length > 300 * 1024 * 1024:
                raise ValueError("Spreadsheet download exceeded 300 MB")
            out.write(block)
        out.seek(0)
        if not zipfile.is_zipfile(out):
            raise ValueError("Google Sheets export returned a non-XLSX document")
        with zipfile.ZipFile(out) as workbook:
            count = 0
            for drawing_no, gid in GIDS.items():
                root = ET.fromstring(workbook.read(f"xl/drawings/drawing{drawing_no}.xml"))
                relroot = ET.fromstring(workbook.read(
                    f"xl/drawings/_rels/drawing{drawing_no}.xml.rels"))
                refs = {item.get("Id"): item.get("Target") for item in relroot}
                for anchor in root:
                    first = anchor.find("xdr:from", NS)
                    blip = anchor.find(".//a:blip", NS)
                    if first is None or blip is None:
                        continue
                    row = int(first.find("xdr:row", NS).text) + 1
                    col = int(first.find("xdr:col", NS).text) + 1
                    if col != 3 or row < 5:
                        continue
                    rid = blip.get("{" + NS["r"] + "}embed")
                    target = refs.get(rid)
                    if not target or not target.startswith("../media/"):
                        continue
                    original = workbook.read("xl/media/" + target.split("/")[-1])
                    with Image.open(io.BytesIO(original)) as src:
                        src = ImageOps.exif_transpose(src).convert("RGB")
                        src.thumbnail((330, 330), Image.Resampling.LANCZOS)
                        canvas = Image.new("RGB", (330, 330), (246, 246, 243))
                        canvas.paste(src, ((330 - src.width) // 2, (330 - src.height) // 2))
                        canvas.save(OUT / f"{gid}-{row}.webp", "WEBP", quality=72, method=5)
                    count += 1
            if count != 844:
                raise ValueError(f"Expected 844 embedded images, found {count}; no commit")
            print(f"Extracted {count} row-matched photos to {OUT}")

if __name__ == "__main__":
    main()
