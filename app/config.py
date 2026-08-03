import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    b2_key_id: str = os.getenv("B2_KEY_ID", "")
    b2_app_key: str = os.getenv("B2_APP_KEY", "")
    b2_bucket: str = os.getenv("B2_BUCKET", "zeroshot-video")
    b2_region: str = os.getenv("B2_REGION", "us-west-004")

    gmi_api_key: str = os.getenv("GMI_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    elevenlabs_api_key: str = os.getenv("ELEVENLABS_API_KEY", "")
    replicate_api_token: str = os.getenv("REPLICATE_API_TOKEN", "")

    @property
    def has_b2(self) -> bool:
        return bool(self.b2_key_id and self.b2_app_key)

    @property
    def has_gmi(self) -> bool:
        return bool(self.gmi_api_key)

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def has_elevenlabs(self) -> bool:
        return bool(self.elevenlabs_api_key)

    @property
    def has_replicate(self) -> bool:
        return bool(self.replicate_api_token)


settings = Settings()
