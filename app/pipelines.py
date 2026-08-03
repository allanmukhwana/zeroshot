"""
GenBlaze pipeline definitions for ZeroShot Video.
Each function builds a Pipeline, runs it with B2 storage, and returns results.
Falls back to mock responses when API keys are not configured.
"""

import logging
from typing import Optional

from genblaze_core import Pipeline, Modality

from .config import settings
from .storage import get_storage
from .schemas import (
    GenerateResponse,
    AssetResponse,
    StoryboardResponse,
    StoryboardScene,
)

logger = logging.getLogger("zeroshot.pipelines")

VIDEO_MODELS = {
    "seedance": "seedance-2-0-260128",
    "kling": "Kling-Image2Video-V2.1-Master",
    "sora": "sora-2",
    "ray": "ray-2",
    "gen4": "gen4_turbo",
}

IMAGE_MODELS = {
    "seedream": "seedream-5.0-lite",
    "imagen": "imagen-4.0-generate-001",
    "dalle": "dall-e-3",
}

CREDITS = {
    "text-to-video": 40,
    "frames-to-video": 40,
    "elements-to-video": 40,
    "storyboard": 20,
    "image": 10,
    "audio": 15,
    "extend": 30,
    "inpaint": 25,
}


def _build_asset_response(result) -> list[AssetResponse]:
    assets = []
    for step in result.run.steps:
        for asset in step.assets:
            assets.append(AssetResponse(
                url=asset.url or "",
                sha256=getattr(asset, "sha256", None),
            ))
    return assets


def _build_response(result, credits_used: int) -> GenerateResponse:
    assets = _build_asset_response(result)
    return GenerateResponse(
        success=True,
        assets=assets,
        manifest_uri=getattr(result.manifest, "manifest_uri", None),
        canonical_hash=getattr(result.manifest, "canonical_hash", None),
        verified=getattr(result.manifest, "verify", lambda: None)(),
        credits_used=credits_used,
    )


def _mock_response(prompt: str, credits_used: int, kind: str = "video") -> GenerateResponse:
    import random
    seed = random.randint(1000, 99999)
    if kind == "video":
        url = f"https://picsum.photos/seed/gen{seed}/640/360"
    elif kind == "image":
        url = f"https://picsum.photos/seed/img{seed}/640/360"
    else:
        url = f"https://picsum.photos/seed/aud{seed}/640/360"
    return GenerateResponse(
        success=True,
        assets=[AssetResponse(url=url)],
        credits_used=credits_used,
    )


def generate_text_to_video(
    prompt: str,
    model: str = "seedance-2-0-260128",
    duration: int = 10,
    aspect_ratio: str = "16:9",
    quality_mode: str = "fast",
) -> GenerateResponse:
    credits = CREDITS["text-to-video"]
    if quality_mode == "quality":
        credits = int(credits * 1.5)

    if not settings.has_gmi:
        logger.warning("GMI_API_KEY not set — returning mock response")
        return _mock_response(prompt, credits, "video")

    try:
        from genblaze_gmicloud import GMICloudVideoProvider

        storage = get_storage()
        provider = GMICloudVideoProvider()

        pipeline = Pipeline("text-to-video").step(
            provider,
            model=model,
            prompt=prompt,
            modality=Modality.VIDEO,
            duration=duration,
            aspect_ratio=aspect_ratio,
        )

        run_kwargs = {"timeout": 600}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Text-to-video generation failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def generate_frames_to_video(
    start_frame_url: str,
    end_frame_url: Optional[str] = None,
    motion_prompt: str = "",
    model: str = "seedance-2-0-260128",
    duration: int = 8,
    aspect_ratio: str = "16:9",
) -> GenerateResponse:
    credits = CREDITS["frames-to-video"]

    if not settings.has_gmi:
        logger.warning("GMI_API_KEY not set — returning mock response")
        return _mock_response(motion_prompt, credits, "video")

    try:
        from genblaze_gmicloud import GMICloudVideoProvider

        storage = get_storage()
        provider = GMICloudVideoProvider()

        step_kwargs = {
            "model": model,
            "prompt": motion_prompt or "smooth camera transition",
            "modality": Modality.VIDEO,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
        }

        if end_frame_url:
            step_kwargs["start_frame"] = start_frame_url
            step_kwargs["end_frame"] = end_frame_url
        else:
            step_kwargs["image"] = start_frame_url

        pipeline = Pipeline("frames-to-video").step(provider, **step_kwargs)

        run_kwargs = {"timeout": 600}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Frames-to-video generation failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def generate_elements_to_video(
    element_refs: list[str],
    scene_prompt: str,
    model: str = "seedance-2-0-260128",
    duration: int = 10,
    aspect_ratio: str = "16:9",
) -> GenerateResponse:
    credits = CREDITS["elements-to-video"]

    full_prompt = scene_prompt
    if element_refs:
        full_prompt = f"Elements: {', '.join(element_refs)}. {scene_prompt}"

    if not settings.has_gmi:
        logger.warning("GMI_API_KEY not set — returning mock response")
        return _mock_response(full_prompt, credits, "video")

    try:
        from genblaze_gmicloud import GMICloudVideoProvider

        storage = get_storage()
        provider = GMICloudVideoProvider()

        pipeline = Pipeline("elements-to-video").step(
            provider,
            model=model,
            prompt=full_prompt,
            modality=Modality.VIDEO,
            duration=duration,
            aspect_ratio=aspect_ratio,
        )

        run_kwargs = {"timeout": 600}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Elements-to-video generation failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def generate_image(
    prompt: str,
    model: str = "seedream-5.0-lite",
    aspect_ratio: str = "16:9",
) -> GenerateResponse:
    credits = CREDITS["image"]

    if not settings.has_gmi:
        return _mock_response(prompt, credits, "image")

    try:
        from genblaze_gmicloud import GMICloudImageProvider

        storage = get_storage()
        provider = GMICloudImageProvider()

        pipeline = Pipeline("image-gen").step(
            provider,
            model=model,
            prompt=prompt,
            modality=Modality.IMAGE,
            aspect_ratio=aspect_ratio,
        )

        run_kwargs = {"timeout": 300}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def generate_audio(
    prompt: str,
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb",
    model: str = "eleven_v3",
) -> GenerateResponse:
    credits = CREDITS["audio"]

    if not settings.has_elevenlabs:
        return _mock_response(prompt, credits, "audio")

    try:
        from genblaze_elevenlabs import ElevenLabsTTSProvider

        storage = get_storage()
        provider = ElevenLabsTTSProvider(output_dir="output/")

        pipeline = Pipeline("narration").step(
            provider,
            model=model,
            prompt=prompt,
            modality=Modality.AUDIO,
            voice_id=voice_id,
        )

        run_kwargs = {"timeout": 120}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Audio generation failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def extend_clip(
    clip_id: str,
    extend_duration: int = 8,
) -> GenerateResponse:
    credits = CREDITS["extend"]

    if not settings.has_gmi:
        return _mock_response(f"extend {clip_id}", credits, "video")

    try:
        from genblaze_gmicloud import GMICloudVideoProvider

        storage = get_storage()
        provider = GMICloudVideoProvider()

        pipeline = Pipeline("extend-clip").step(
            provider,
            model="seedance-2-0-260128",
            prompt=f"Continue the motion and lighting from clip {clip_id}, extend by {extend_duration}s",
            modality=Modality.VIDEO,
            duration=extend_duration,
            aspect_ratio="16:9",
        )

        run_kwargs = {"timeout": 600}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Clip extension failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def inpaint_region(
    clip_id: str,
    mode: str,
    region_mask: str,
    prompt: str = "",
) -> GenerateResponse:
    credits = CREDITS["inpaint"]

    if not settings.has_gmi:
        return _mock_response(f"inpaint {mode} {prompt}", credits, "image")

    try:
        from genblaze_gmicloud import GMICloudImageProvider

        storage = get_storage()
        provider = GMICloudImageProvider()

        mode_prompt = {
            "lasso": f"Edit region: {prompt}",
            "insert": f"Insert object in region: {prompt}",
            "remove": f"Remove object in selected region, reconstruct background",
        }.get(mode, prompt)

        pipeline = Pipeline("inpaint").step(
            provider,
            model="seedream-5.0-lite",
            prompt=mode_prompt,
            modality=Modality.IMAGE,
            aspect_ratio="16:9",
        )

        run_kwargs = {"timeout": 300}
        if storage:
            run_kwargs["sink"] = storage

        result = pipeline.run(**run_kwargs)
        return _build_response(result, credits)
    except Exception as e:
        logger.error(f"Inpaint failed: {e}")
        return GenerateResponse(success=False, error=str(e), credits_used=0)


def generate_storyboard(
    script: str,
    element_refs: list[str] = None,
) -> StoryboardResponse:
    element_refs = element_refs or []

    if not settings.has_gemini:
        logger.warning("GEMINI_API_KEY not set — using heuristic storyboard split")
        return _heuristic_storyboard(script, element_refs)

    try:
        from genblaze_google import GoogleChatProvider

        provider = GoogleChatProvider()
        element_context = f"\nElements available: {', '.join(element_refs)}" if element_refs else ""
        chat_prompt = f"""You are a storyboard director. Break the following script into 4-6 sequential scenes.
For each scene, provide: title (short), description (1-2 sentences), and cast (character names from the script).
Return as JSON array: [{{"title": "...", "desc": "...", "cast": ["Name1", "Name2"]}}]

Script:
{script}{element_context}

Return ONLY the JSON array, no other text."""

        response = provider.chat(
            model="gemini-2.5-flash",
            prompt=chat_prompt,
        )

        import json
        text = response.text if hasattr(response, "text") else str(response)
        scenes_data = json.loads(text)

        scenes = []
        for i, s in enumerate(scenes_data):
            scenes.append(StoryboardScene(
                id=i + 1,
                title=s.get("title", f"Scene {i+1}"),
                desc=s.get("desc", ""),
                cast=s.get("cast", []),
                thumb=f"https://picsum.photos/seed/sb{i+1}/300/170",
            ))

        return StoryboardResponse(success=True, scenes=scenes)
    except Exception as e:
        logger.error(f"Storyboard generation failed: {e}, falling back to heuristic")
        return _heuristic_storyboard(script, element_refs)


def _heuristic_storyboard(script: str, element_refs: list[str]) -> StoryboardResponse:
    sentences = [s.strip() for s in script.replace("\n", ". ").split(".") if s.strip()]
    scenes = []
    for i, s in enumerate(sentences[:6]):
        cast = [ref.replace("@", "") for ref in element_refs] if element_refs else []
        scenes.append(StoryboardScene(
            id=i + 1,
            title=f"Scene {i+1}",
            desc=s[:120],
            cast=cast,
            thumb=f"https://picsum.photos/seed/sb{i+1}/300/170",
        ))
    return StoryboardResponse(success=True, scenes=scenes)
