from functools import lru_cache

import cv2
import easyocr
import numpy as np


@lru_cache
def get_ocr_reader() -> easyocr.Reader:
    return easyocr.Reader(["en"], gpu=False)


def extract_text_from_image_bytes(file_bytes: bytes) -> str:
    if not file_bytes:
        return ""

    np_array = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    if image is None:
        return ""

    results = get_ocr_reader().readtext(image, detail=0, paragraph=True)
    lines = [
        line.strip()
        for line in results
        if isinstance(line, str) and line.strip()
    ]
    return "\n".join(lines)
