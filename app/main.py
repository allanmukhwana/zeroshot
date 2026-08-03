import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .routers import projects, storyboard, generate, elements, tools, credits

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("zeroshot")

app = FastAPI(
    title="ZeroShot Video API",
    description="GenBlaze-powered AI video generation orchestration layer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(storyboard.router)
app.include_router(generate.router)
app.include_router(elements.router)
app.include_router(tools.router)
app.include_router(credits.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "providers": {
            "gmicloud": settings.has_gmi,
            "gemini": settings.has_gemini,
            "elevenlabs": settings.has_elevenlabs,
            "replicate": settings.has_replicate,
            "b2_storage": settings.has_b2,
        },
    }


_base_dir = Path(__file__).resolve().parent.parent
_static_dir = _base_dir / "css"
if _static_dir.exists():
    app.mount("/css", StaticFiles(directory=str(_static_dir)), name="css")


@app.get("/")
async def serve_index():
    index_path = _base_dir / "index.html"
    if index_path.exists():
        from fastapi.responses import FileResponse
        return FileResponse(str(index_path))
    return {"message": "ZeroShot Video API", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
