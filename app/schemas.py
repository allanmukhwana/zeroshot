from pydantic import BaseModel, Field
from typing import Optional


class GenerateVideoRequest(BaseModel):
    prompt: str
    model: str = "seedance-2-0-260128"
    duration: int = 10
    aspect_ratio: str = "16:9"
    quality_mode: str = "fast"
    variations: int = 1
    element_refs: list[str] = Field(default_factory=list)


class FramesToVideoRequest(BaseModel):
    start_frame_url: str
    end_frame_url: Optional[str] = None
    motion_prompt: str = ""
    model: str = "seedance-2-0-260128"
    duration: int = 8
    aspect_ratio: str = "16:9"


class ElementsToVideoRequest(BaseModel):
    element_ids: list[str]
    scene_prompt: str
    model: str = "seedance-2-0-260128"
    duration: int = 10
    aspect_ratio: str = "16:9"


class StoryboardRequest(BaseModel):
    script: str
    element_refs: list[str] = Field(default_factory=list)


class GenerateImageRequest(BaseModel):
    prompt: str
    model: str = "seedream-5.0-lite"
    aspect_ratio: str = "16:9"


class GenerateAudioRequest(BaseModel):
    prompt: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    model: str = "eleven_v3"


class CameraControlRequest(BaseModel):
    pan: float = 0
    tilt: float = 0
    zoom: float = 100
    rotation: float = 0


class InpaintRequest(BaseModel):
    clip_id: str
    mode: str  # 'lasso' | 'insert' | 'remove'
    region_mask: str  # base64-encoded mask or polygon coords
    prompt: str = ""


class ExtendClipRequest(BaseModel):
    clip_id: str
    extend_duration: int = 8


class CreateElementRequest(BaseModel):
    name: str
    type: str  # 'character' | 'object' | 'location'
    prompt: str = ""
    voice: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    backstory: str = ""


class AssetResponse(BaseModel):
    url: str
    sha256: Optional[str] = None
    manifest_uri: Optional[str] = None
    canonical_hash: Optional[str] = None
    verified: Optional[bool] = None


class GenerateResponse(BaseModel):
    success: bool
    assets: list[AssetResponse] = Field(default_factory=list)
    manifest_uri: Optional[str] = None
    canonical_hash: Optional[str] = None
    credits_used: int = 0
    error: Optional[str] = None


class StoryboardScene(BaseModel):
    id: int
    title: str
    desc: str
    cast: list[str] = Field(default_factory=list)
    thumb: Optional[str] = None


class StoryboardResponse(BaseModel):
    success: bool
    scenes: list[StoryboardScene] = Field(default_factory=list)
    error: Optional[str] = None


class ElementResponse(BaseModel):
    id: str
    name: str
    type: str
    thumb: str
    voice: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    backstory: str = ""


class ProjectResponse(BaseModel):
    id: int
    name: str
    thumb: str
    clips: int
    duration: str
    updated: str


class CreditsResponse(BaseModel):
    balance: int
