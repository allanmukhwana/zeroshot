from fastapi import APIRouter

from ..schemas import StoryboardRequest, StoryboardResponse
from ..pipelines import generate_storyboard

router = APIRouter(prefix="/api", tags=["storyboard"])


@router.post("/storyboard/generate", response_model=StoryboardResponse)
async def generate_storyboard_api(req: StoryboardRequest):
    return generate_storyboard(req.script, req.element_refs)
