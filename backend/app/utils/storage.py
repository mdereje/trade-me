import logging
import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, UploadFile, status

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE", str(10 * 1024 * 1024)))  # 10 MB


async def validate_and_read_image(file: UploadFile) -> Tuple[bytes, str]:
    """Validate uploaded image content type and size, returning (bytes, extension)."""
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, WebP, GIF.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty.",
        )
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    return data, ALLOWED_IMAGE_TYPES[content_type]


async def upload_item_photo(file: UploadFile, item_id: int) -> str:
    """Persist an item photo to Google Cloud Storage (prod) or local static dir (dev/test)."""
    data, ext = await validate_and_read_image(file)
    object_name = f"items/{item_id}/{uuid.uuid4().hex}{ext}"
    bucket_name = os.getenv("GCS_BUCKET_NAME", "").strip()

    if bucket_name:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_name)
        blob.upload_from_string(data, content_type=file.content_type)
        public_base = os.getenv(
            "GCS_PUBLIC_BASE_URL", f"https://storage.googleapis.com/{bucket_name}"
        ).rstrip("/")
        return f"{public_base}/{object_name}"

    upload_root = Path(os.getenv("UPLOAD_DIR", "static/uploads"))
    target_path = upload_root / object_name
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_bytes(data)

    # Normalize to /static/... URL path for local FastAPI StaticFiles mount
    normalized = str(target_path).replace("\\", "/")
    if not normalized.startswith("/"):
        normalized = "/" + normalized
    return normalized
