import requests
from bs4 import BeautifulSoup

from app.services.clean_text import clean_extracted_text


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def scrape_text_from_url(url: str, timeout: int = 15) -> str:
    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    container = soup.find("article") or soup.find("main") or soup.body
    if container is None:
        return ""

    parts: list[str] = []
    for tag in container.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
        text = tag.get_text(" ", strip=True)
        if text:
            parts.append(text)

    return clean_extracted_text("\n".join(parts))
