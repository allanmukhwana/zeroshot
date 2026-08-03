"""
Elements & Consistency Engine.
Manages character/object/location elements with visual fingerprints
for cross-shot consistency. Uses B2 for persistent storage.
"""

import logging
from typing import Optional

from .config import settings
from .schemas import ElementResponse, CreateElementRequest
from .pipelines import generate_image

logger = logging.getLogger("zeroshot.elements")

_elements_db: dict[str, dict] = {
    "el-ryan": {
        "id": "el-ryan", "name": "Ryan", "type": "character",
        "thumb": "https://picsum.photos/seed/ryan/300/300",
        "voice": "Deep, Weary Male (ElevenLabs)",
        "tags": ["protagonist", "detective"],
        "backstory": "A burnt-out detective haunted by an unsolved case a decade ago. Wears a long grey coat, guarded and observant.",
        "prompt_fingerprint": "weary male detective, long grey coat, guarded expression, film noir aesthetic",
    },
    "el-mara": {
        "id": "el-mara", "name": "Mara", "type": "character",
        "thumb": "https://picsum.photos/seed/mara/300/300",
        "voice": "Sharp, Confident Female (ElevenLabs)",
        "tags": ["informant"],
        "backstory": "A shadowy information broker who always knows more than she lets on.",
        "prompt_fingerprint": "confident female informant, dark hair, sharp features, neon-lit aesthetic",
    },
    "el-alley": {
        "id": "el-alley", "name": "Neon Alley", "type": "location",
        "thumb": "https://picsum.photos/seed/alley/300/300",
        "tags": ["night", "urban"],
        "backstory": "A cramped alleyway between two towering neon-signed buildings, always slick with rain.",
        "prompt_fingerprint": "narrow neon-lit alley at night, rain-slicked pavement, towering buildings with neon signs",
    },
    "el-case": {
        "id": "el-case", "name": "Metal Briefcase", "type": "object",
        "thumb": "https://picsum.photos/seed/case/300/300",
        "tags": ["prop"],
        "backstory": "A locked steel briefcase, central MacGuffin of the story.",
        "prompt_fingerprint": "locked steel briefcase, weathered metal, combination locks",
    },
    "el-car": {
        "id": "el-car", "name": "Detective's Sedan", "type": "object",
        "thumb": "https://picsum.photos/seed/car/300/300",
        "tags": ["vehicle"],
        "backstory": "A weathered 1970s sedan, Ryan's only constant companion.",
        "prompt_fingerprint": "weathered 1970s sedan, dark blue, slightly dented, vintage",
    },
    "el-rooftop": {
        "id": "el-rooftop", "name": "Rooftop Skyline", "type": "location",
        "thumb": "https://picsum.photos/seed/roof/300/300",
        "tags": ["day", "urban"],
        "backstory": "A sprawling rooftop view overlooking the neon sprawl of the city below.",
        "prompt_fingerprint": "rooftop overlooking neon city skyline, urban sprawl, dramatic sky",
    },
    "el-officer": {
        "id": "el-officer", "name": "Officer Kade", "type": "character",
        "thumb": "https://picsum.photos/seed/kade/300/300",
        "voice": "Gruff, Authoritative Male (ElevenLabs)",
        "tags": ["supporting"],
        "backstory": "A by-the-book beat cop who begrudgingly assists Ryan.",
        "prompt_fingerprint": "gruff male police officer, uniform, middle-aged, stern expression",
    },
    "el-diner": {
        "id": "el-diner", "name": "24hr Diner", "type": "location",
        "thumb": "https://picsum.photos/seed/diner/300/300",
        "tags": ["interior", "night"],
        "backstory": "A near-empty diner glowing under flickering fluorescent lights.",
        "prompt_fingerprint": "interior of a 24hr diner, flickering fluorescent lights, vinyl booths, late night",
    },
}


def list_elements(
    filter_type: str = "all",
    search: str = "",
) -> list[ElementResponse]:
    results = []
    query = search.lower()
    for el in _elements_db.values():
        if filter_type != "all" and el["type"] != filter_type:
            continue
        if query and query not in el["name"].lower():
            continue
        results.append(ElementResponse(
            id=el["id"],
            name=el["name"],
            type=el["type"],
            thumb=el["thumb"],
            voice=el.get("voice"),
            tags=el.get("tags", []),
            backstory=el.get("backstory", ""),
        ))
    return results


def get_element(el_id: str) -> Optional[dict]:
    return _elements_db.get(el_id)


def create_element(req: CreateElementRequest) -> ElementResponse:
    el_id = f"el-{req.name.lower().replace(' ', '-')}"
    
    fingerprint = req.prompt or f"{req.type}: {req.name}"
    
    thumb = f"https://picsum.photos/seed/{el_id}/300/300"
    
    if req.prompt and settings.has_gmi:
        result = generate_image(
            prompt=fingerprint,
            model="seedream-5.0-lite",
            aspect_ratio="1:1",
        )
        if result.success and result.assets:
            thumb = result.assets[0].url

    _elements_db[el_id] = {
        "id": el_id,
        "name": req.name,
        "type": req.type,
        "thumb": thumb,
        "voice": req.voice,
        "tags": req.tags,
        "backstory": req.backstory,
        "prompt_fingerprint": fingerprint,
    }

    return ElementResponse(
        id=el_id,
        name=req.name,
        type=req.type,
        thumb=thumb,
        voice=req.voice,
        tags=req.tags,
        backstory=req.backstory,
    )


def get_fingerprints(element_ids: list[str]) -> list[str]:
    fingerprints = []
    for eid in element_ids:
        el = _elements_db.get(eid)
        if el and el.get("prompt_fingerprint"):
            fingerprints.append(f"@{el['name']}: {el['prompt_fingerprint']}")
    return fingerprints
