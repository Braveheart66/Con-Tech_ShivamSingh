from __future__ import annotations

import json
import re
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse
from typing import Any

import pdfplumber
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


SOURCE_URLS = [
    "https://www.indiafilings.com/learn/rental-agreement-format/",
    "https://jurigram.com/blog/corporate-law/"
    "leave-and-license-agreement-format-india-word-pdf-templates",
    "https://jurigram.com/blog/corporate-law/"
    "rental-agreement-format-in-word-india",
    "https://www.club4ca.com/formats/others/"
    "simple-rental-agreement-format-india/",
    "https://www.dexform.com/download/leave-and-license-agreement-india",
    "https://www.zoopsign.com/blog/rental-agreement-format-online-india",
    "https://www.genieai.co/en-in/template-type/rental-agreement",
    "https://www.housing.com/news/rent-agreement-format/",
    "https://www.magicbricks.com/blog/rent-agreement-format/129031.html",
    "https://www.nobroker.in/blog/rent-agreement-format/",
    "https://www.99acres.com/articles/rental-agreement-format.html",
    "https://www.mygate.com/blog/rental-agreement/",
    "https://cleartax.in/s/rent-agreement",
    "https://www.bajajfinserv.in/rent-agreement-format",
    "https://vakilsearch.com/blog/rental-agreement-format/",
    "https://www.legalraasta.com/blog/rent-agreement-format/",
    "https://www.policybazaar.com/ifsc/rent-agreement-format/",
]

KEYWORD_HINTS = {
    "rental",
    "rent",
    "tenant",
    "landlord",
    "lessor",
    "lessee",
    "license",
    "licensor",
    "licensee",
    "stamp-duty",
    "police-verification",
    "leave-and-license",
    "lease",
    "residential",
}

EXCLUDE_HINTS = {
    "non-compete",
    "confidentiality",
    "vehicle",
    "agency-agreement",
    "partnership",
    "sale-of-property",
    "property-agreement-to-sell",
    "contractor-agreement",
    "professional-services",
}

MAX_DISCOVERED_PER_SOURCE = 3

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
ALL_RAW_PATH = RAW_DIR / "all_raw.jsonl"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def log(message: str) -> None:
    print(f"[scrape] {message}")


def build_session() -> requests.Session:
    retry = Retry(
        total=3,
        backoff_factor=0.7,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
    )
    adapter = HTTPAdapter(max_retries=retry)

    session = requests.Session()
    session.headers.update(HEADERS)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url)
    normalized = parsed._replace(fragment="")
    clean_url = urlunparse(normalized)
    if clean_url.endswith("/"):
        clean_url = clean_url[:-1]
    return clean_url


def is_pdf_response(url: str, response: requests.Response) -> bool:
    content_type = (response.headers.get("Content-Type") or "").lower()
    return "application/pdf" in content_type or url.lower().endswith(".pdf")


def is_relevant_url(candidate_url: str, base_url: str) -> bool:
    candidate = urlparse(candidate_url)
    base = urlparse(base_url)
    if candidate.scheme not in {"http", "https"}:
        return False
    if candidate.netloc != base.netloc:
        return False

    lowered = candidate_url.lower()
    if any(term in lowered for term in EXCLUDE_HINTS):
        return False

    # Require strong in-domain hint instead of generic "agreement" match.
    return any(term in lowered for term in KEYWORD_HINTS)


def discover_more_urls(html: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    discovered: list[str] = []
    seen: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        resolved = canonicalize_url(urljoin(base_url, anchor["href"]))
        if resolved in seen:
            continue
        if not is_relevant_url(resolved, base_url):
            continue

        seen.add(resolved)
        discovered.append(resolved)
        if len(discovered) >= MAX_DISCOVERED_PER_SOURCE:
            break

    return discovered


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = (page.extract_text() or "").strip()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_from_html(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    root = soup.find("article") or soup.find("main") or soup.body
    if root is None:
        return title, ""

    parts: list[str] = []
    for node in root.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
        text = node.get_text(" ", strip=True)
        if text:
            parts.append(text)

    merged = "\n".join(parts)
    merged = re.sub(r"\n{3,}", "\n\n", merged)
    return title, merged.strip()


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def append_jsonl(path: Path, payloads: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in payloads:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def scrape_single_source(
    session: requests.Session,
    source_id: str,
    url: str,
) -> tuple[dict[str, Any], list[str]]:
    response = session.get(url, timeout=25)
    response.raise_for_status()

    discovered_urls: list[str] = []

    if is_pdf_response(url, response):
        text = extract_text_from_pdf_bytes(response.content)
        title = f"PDF Source {source_id}"
        source_type = "pdf"
    else:
        response.encoding = response.encoding or "utf-8"
        title, text = extract_text_from_html(response.text)
        discovered_urls = discover_more_urls(response.text, url)
        source_type = "html"

    row = {
        "id": source_id,
        "source_url": url,
        "source_type": source_type,
        "title": title,
        "text": text,
    }
    return row, discovered_urls


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    session = build_session()

    all_rows: list[dict[str, Any]] = []
    success_count = 0
    visited: set[str] = set()
    queue: list[str] = [canonicalize_url(url) for url in SOURCE_URLS]
    max_to_process = len(SOURCE_URLS) * (MAX_DISCOVERED_PER_SOURCE + 1)
    source_index = 0

    while queue and source_index < max_to_process:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        source_index += 1
        source_id = f"source_{source_index:03d}"
        log(f"Processing {source_id}: {url}")

        try:
            row, discovered_urls = scrape_single_source(
                session,
                source_id,
                url,
            )
            if not row["text"].strip():
                log(f"Skipped {source_id}: extracted text is empty")
                continue

            json_path = RAW_DIR / f"{source_id}.json"
            write_json(json_path, row)
            all_rows.append(row)
            success_count += 1
            log(f"Saved {source_id} to {json_path}")

            for discovered in discovered_urls:
                if discovered not in visited:
                    queue.append(discovered)
            if discovered_urls:
                log(
                    f"Discovered {len(discovered_urls)} related links from "
                    f"{source_id}"
                )
        except Exception as exc:
            log(f"Failed {source_id}: {exc}")
            continue

    append_jsonl(ALL_RAW_PATH, all_rows)
    log(f"Completed. Success={success_count}, Visited={len(visited)}")
    log(f"Combined JSONL written to {ALL_RAW_PATH}")


if __name__ == "__main__":
    main()
