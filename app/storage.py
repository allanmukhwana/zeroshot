from genblaze_core import ObjectStorageSink, KeyStrategy
from genblaze_s3 import S3StorageBackend

from .config import settings


def get_storage() -> ObjectStorageSink | None:
    if not settings.has_b2:
        return None

    backend = S3StorageBackend.for_backblaze(
        settings.b2_bucket,
        key_id=settings.b2_key_id,
        app_key=settings.b2_app_key,
    )
    return ObjectStorageSink(
        backend,
        key_strategy=KeyStrategy.HIERARCHICAL,
    )
