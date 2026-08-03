from fastapi import APIRouter

from ..schemas import ProjectResponse

router = APIRouter(prefix="/api", tags=["projects"])

_projects = [
    {"id": 1, "name": "Neon Streets — Episode 1", "thumb": "https://picsum.photos/seed/proj1/400/240", "clips": 12, "duration": "1:24", "updated": "2 hours ago"},
    {"id": 2, "name": "Product Launch Teaser", "thumb": "https://picsum.photos/seed/proj2/400/240", "clips": 6, "duration": "0:38", "updated": "Yesterday"},
    {"id": 3, "name": "Untitled Project", "thumb": "https://picsum.photos/seed/proj3/400/240", "clips": 0, "duration": "0:00", "updated": "3 days ago"},
    {"id": 4, "name": "Desert Chase Sequence", "thumb": "https://picsum.photos/seed/proj4/400/240", "clips": 9, "duration": "1:02", "updated": "5 days ago"},
    {"id": 5, "name": "Brand Sizzle Reel", "thumb": "https://picsum.photos/seed/proj5/400/240", "clips": 15, "duration": "2:10", "updated": "1 week ago"},
]


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects():
    return [ProjectResponse(**p) for p in _projects]
