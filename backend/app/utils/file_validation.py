from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import get_settings


ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpg",
    "image/jpeg",
}


async def validate_upload_file(upload_file: UploadFile) -> None:
    if not upload_file.filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must include a filename.",
        )

    extension = Path(upload_file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, JPG, and JPEG files are allowed.",
        )

    content_type = (upload_file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file content type.",
        )

    file_bytes = await upload_file.read()
    await upload_file.seek(0)

    max_size_mb = get_settings().max_file_size_mb
    max_size_bytes = max_size_mb * 1024 * 1024
    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {max_size_mb} MB size limit.",
        )
