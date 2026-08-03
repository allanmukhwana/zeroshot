from fastapi import APIRouter

from ..schemas import (
    GenerateVideoRequest,
    FramesToVideoRequest,
    ElementsToVideoRequest,
    GenerateResponse,
    ExtendClipRequest,
    InpaintRequest,
    CameraControlRequest,
)
from ..pipelines import (
    generate_text_to_video,
    generate_frames_to_video,
    generate_elements_to_video,
    extend_clip,
    inpaint_region,
)
from ..elements import get_fingerprints

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.post("/text-to-video", response_model=GenerateResponse)
async def text_to_video(req: GenerateVideoRequest):
    element_fps = get_fingerprints(req.element_refs) if req.element_refs else []
    full_prompt = req.prompt
    if element_fps:
        full_prompt = f"{req.prompt}\n\nCharacter references for consistency:\n" + "\n".join(element_fps)

    return generate_text_to_video(
        prompt=full_prompt,
        model=req.model,
        duration=req.duration,
        aspect_ratio=req.aspect_ratio,
        quality_mode=req.quality_mode,
    )


@router.post("/frames-to-video", response_model=GenerateResponse)
async def frames_to_video(req: FramesToVideoRequest):
    return generate_frames_to_video(
        start_frame_url=req.start_frame_url,
        end_frame_url=req.end_frame_url,
        motion_prompt=req.motion_prompt,
        model=req.model,
        duration=req.duration,
        aspect_ratio=req.aspect_ratio,
    )


@router.post("/elements-to-video", response_model=GenerateResponse)
async def elements_to_video(req: ElementsToVideoRequest):
    element_fps = get_fingerprints(req.element_ids)
    return generate_elements_to_video(
        element_refs=element_fps,
        scene_prompt=req.scene_prompt,
        model=req.model,
        duration=req.duration,
        aspect_ratio=req.aspect_ratio,
    )


@router.post("/extend", response_model=GenerateResponse)
async def extend_clip_api(req: ExtendClipRequest):
    return extend_clip(req.clip_id, req.extend_duration)


@router.post("/inpaint", response_model=GenerateResponse)
async def inpaint_api(req: InpaintRequest):
    return inpaint_region(
        clip_id=req.clip_id,
        mode=req.mode,
        region_mask=req.region_mask,
        prompt=req.prompt,
    )


@router.post("/camera", response_model=GenerateResponse)
async def apply_camera(req: CameraControlRequest):
    camera_prompt = (
        f"Camera movement — pan: {req.pan}°, tilt: {req.tilt}°, "
        f"zoom: {req.zoom}%, rotation: {req.rotation}°"
    )
    return generate_text_to_video(
        prompt=camera_prompt,
        model="seedance-2-0-260128",
        duration=8,
        aspect_ratio="16:9",
    )
