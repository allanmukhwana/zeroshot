from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["tools"])

_tools = [
    {"name": "Type Overlays", "icon": "bi-fonts", "desc": "Position animated typographic text across generated timelines."},
    {"name": "Video Resizer", "icon": "bi-aspect-ratio", "desc": "Rapid aspect ratio reframing for varying distribution formats."},
    {"name": "PixelBento", "icon": "bi-grid-3x3-gap-fill", "desc": "High-end color grading and stylized visual bento layouts."},
    {"name": "Shader Effects", "icon": "bi-magic", "desc": "Glitch effects, lo-fi textures, and stylized post-processing filters."},
    {"name": "Auto Subtitle", "icon": "bi-chat-square-text", "desc": "Community remix: auto-generate synced subtitles from dialogue audio."},
    {"name": "Establishing Shot Builder", "icon": "bi-easel", "desc": "Community remix: one-click wide establishing shots from a location element."},
]


@router.get("/tools")
async def list_tools():
    return _tools
