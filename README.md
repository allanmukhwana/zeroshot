## Inspiration
Every AI creator has felt the same pain: one tab for image generation, another for video, a third for voice synthesis, and a spreadsheet somewhere trying to track which character reference matches which scene. The generative media boom gave us incredible individual models, but it fragmented the creative workflow into a dozen disconnected apps.

We asked: what if a creator never had to leave one workspace? What if characters stayed *visually consistent* across every shot without re-prompting from scratch? What if the storage layer was as reliable and cost-effective as the generation layer was powerful?

That's the gap ZeroShot Video fills — and Backblaze B2's simplicity and affordability for storing massive volumes of generated video, image, and audio assets made it the obvious backbone for a project-based tool that treats every asset as persistent, reusable, and part of a larger creative project.

---

## What it does
ZeroShot Video is a project-based, layer-oriented AI video editor that unifies text, image, video, and audio generation into a single timeline and asset workspace.

- **Elements System** — Create persistent characters (via prompt, photo, or avatar), assign them voices, and summon them into any scene with `@CharacterName` for strict visual consistency across shots.
- **Multi-Modal Generation Modes** — Storyboard Workshop (script-to-storyboard), Text-to-Video, Frames-to-Video (start/end frame interpolation), and Elements-to-Video (drag-and-drop character/object/location composition).
- **Scene Builder** — A non-linear timeline for arranging, trimming, and transitioning clips.
- **Video Extend** — Seamlessly lengthens existing clips while preserving lighting, motion, and continuity.
- **Camera Control Engine** — UI-driven pan/tilt/zoom/rotation instead of prompt guesswork.
- **AI Lasso, Insert & Remove** — Localized inpainting for wardrobe changes, object removal, or object insertion with auto-adjusted shadows and lighting.
- **Tools Panel** — Custom, shareable micro-workflows (type overlays, video resizer, PixelBento shader effects) built from natural language.

Under the hood, it uses **[GenBlaze](https://github.com/backblaze-labs/genblaze)** to orchestrate GMICloud video models (Seedance/Kling for cinematic clips), Google Gemini Flash (scene reasoning and storyboard generation), and ElevenLabs (voice cloning and narration) — all stitched together in one interface with provenance manifests for every generated asset.

---

## How we built it
We used **GenBlaze** — Backblaze's open-source pipeline SDK for AI-generated media — to architect ZeroShot Video as an orchestration layer rather than a single-model wrapper:

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (index.html)                  │
│   Layer-based timeline UI · Asset grid · Scene Builder    │
│   jQuery + Bootstrap 5 · Custom CSS                       │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│              FastAPI Backend (app/)                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Routers    │  │  Pipelines   │  │ Elements Engine│  │
│  │  (API)      │→ │  (GenBlaze)  │  │ (Consistency)  │  │
│  └─────────────┘  └──────┬───────┘  └────────────────┘  │
│                          │                               │
│          ┌───────────────┼───────────────┐               │
│          ▼               ▼               ▼               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  GMICloud   │ │   Google    │ │ ElevenLabs  │        │
│  │  (Video)    │ │  (Gemini)   │ │   (TTS)     │        │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘        │
│         │               │               │                │
│         └───────────────┼───────────────┘                │
│                         ▼                                │
│              ┌─────────────────────┐                     │
│              │  Backblaze B2 (S3)  │                     │
│              │  Assets + Manifests │                     │
│              └─────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

1. **Frontend** — A layer-based timeline and asset grid UI, inspired by professional NLEs, built with jQuery, Bootstrap 5, and custom CSS. Handles drag-and-drop composition of Elements, frames, and prompts. Communicates with the backend via a thin API client (`js/api.js`).

2. **Backend (FastAPI)** — A Python FastAPI server (`app/main.py`) exposes REST endpoints for all generation modes, element management, storyboard creation, and credit tracking. Routes are organized into routers (`app/routers/`) for projects, generate, storyboard, elements, tools, and credits.

3. **Model Orchestration (GenBlaze Pipelines)** — The `app/pipelines.py` module uses GenBlaze's `Pipeline` / `Step` API to dispatch jobs to the appropriate provider:
   - **Text-to-Video**: `GMICloudVideoProvider` → Seedance/Kling models
   - **Frames-to-Video**: `GMICloudVideoProvider` with start/end frame inputs
   - **Elements-to-Video**: `GMICloudVideoProvider` with element fingerprint injection
   - **Storyboard**: `GoogleChatProvider` → Gemini 2.5 Flash for script-to-scene breakdown
   - **Audio/Narration**: `ElevenLabsTTSProvider` → voice cloning
   - **Image/Inpaint**: `GMICloudImageProvider` → Seedream for scene reasoning and regional edits

4. **Elements & Consistency Engine** — `app/elements.py` manages a reference-embedding system that stores character/object visual fingerprints (prompt-based descriptors). When `@CharacterName` is used, the fingerprint is injected into the generation prompt to enforce visual consistency across shots. Element thumbnails are generated via GenBlaze image pipelines and persisted to B2.

5. **Storage Layer — Backblaze B2** — Every generated asset (images, video clips, cloned voice audio, storyboard exports) is written directly to B2 buckets via GenBlaze's `ObjectStorageSink` with `S3StorageBackend.for_backblaze()`. We use `KeyStrategy.HIERARCHICAL` for run-grouped bucket layouts. Provenance manifests are uploaded alongside assets, providing SHA-256 verification and replay capability.

6. **Credit & Compute System** — A toggle between "Fast" and "Quality" mode that adjusts model routing and credit cost (Quality mode costs 1.5x credits). Credits are tracked server-side via the `/api/credits` endpoints.

7. **Provenance** — Every GenBlaze pipeline run produces a canonical manifest capturing provider, model, prompt, parameters, timestamps, and a canonical hash. Manifests are verified via `Manifest.verify()` and can be embedded into media files using GenBlaze's `Mp4Handler`.

---

## Getting Started

### Prerequisites
- Python 3.11+
- A Backblaze B2 account with a bucket created
- At least one AI provider API key (GMICloud, Google, or ElevenLabs)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zeroshot-video.git
cd zeroshot-video

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys:
#   B2_KEY_ID, B2_APP_KEY, B2_BUCKET — Backblaze B2 storage
#   GMI_API_KEY — GMICloud for video/image generation
#   GEMINI_API_KEY — Google Gemini for storyboard generation
#   ELEVENLABS_API_KEY — ElevenLabs for voice/TTS
```

### Running

```bash
# Start the FastAPI backend
python -m app.main
# or: uvicorn app.main:app --reload --port 8000

# Serve the frontend (in a separate terminal)
# Option 1: Python's built-in server
python -m http.server 3000

# Option 2: Any static file server (e.g., npx serve)
npx serve .
```

Open `http://localhost:3000` in your browser. The frontend automatically connects to the backend at `http://localhost:8000`.

> **Note**: The app works without API keys — all generation endpoints gracefully fall back to mock responses so you can explore the UI. Configure real keys to enable actual AI generation.

### API Documentation

Once the backend is running, interactive API docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Key endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Provider status check |
| `GET` | `/api/projects` | List projects |
| `POST` | `/api/storyboard/generate` | Generate storyboard from script |
| `POST` | `/api/generate/text-to-video` | Text-to-video generation |
| `POST` | `/api/generate/frames-to-video` | Frame interpolation to video |
| `POST` | `/api/generate/elements-to-video` | Elements composition to video |
| `POST` | `/api/generate/extend` | Extend an existing clip |
| `POST` | `/api/generate/inpaint` | Localized inpainting (lasso/insert/remove) |
| `POST` | `/api/generate/camera` | Apply camera movement parameters |
| `GET` | `/api/elements` | List elements (filter by type, search) |
| `POST` | `/api/elements` | Create a new element |
| `GET` | `/api/tools` | List available tools |
| `GET` | `/api/credits` | Get credit balance |
| `POST` | `/api/credits/add` | Add credits |

---

## Project Structure

```
zeroshot-video/
├── index.html              # Main UI (single-page app)
├── css/
│   └── style.css           # All styling (light "3D design tool" theme)
├── js/
│   ├── data.js             # Mock data layer (fallback)
│   ├── api.js              # API client (ZS_API) — backend communication
│   ├── app.js              # App controller — navigation, views, interactivity
│   ├── timeline.js         # Custom timeline editor (draggable/resizable clips)
│   └── lasso.js            # Canvas-based freehand region selection
├── app/                    # Python backend (FastAPI + GenBlaze)
│   ├── __init__.py
│   ├── main.py             # FastAPI app entry point
│   ├── config.py           # Environment configuration
│   ├── storage.py          # B2/GenBlaze storage setup
│   ├── pipelines.py        # GenBlaze pipeline definitions (all generation modes)
│   ├── schemas.py          # Pydantic request/response models
│   ├── elements.py         # Elements & consistency engine
│   └── routers/
│       ├── __init__.py
│       ├── projects.py     # Project listing endpoints
│       ├── storyboard.py   # Storyboard generation endpoint
│       ├── generate.py     # Video/image/audio generation endpoints
│       ├── elements.py     # Element CRUD endpoints
│       ├── tools.py        # Tools listing endpoint
│       └── credits.py      # Credit system endpoints
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── README.md
```

---

## Challenges we ran into
- **Visual drift across shots** — Getting a character to look the "same" across multiple independently-generated clips required building a consistency layer on top of models that weren't natively designed for persistent identity. Our solution: prompt-fingerprint injection via the Elements engine.
- **Cross-model normalization** — GMICloud video, Google Gemini, and ElevenLabs all have different input schemas, latency profiles, and output formats. GenBlaze's unified Pipeline/Step API handled the abstraction, but we still needed adapters for element-specific conditioning.
- **Asset volume & versioning** — Video generation produces huge amounts of iterative data (multiple takes, variations, extends). GenBlaze's `KeyStrategy.HIERARCHICAL` bucket layout organized by `tenant/date/run_id` gave us fast retrieval without duplication.
- **Provenance integrity** — Every asset needs a verifiable provenance trail. GenBlaze's `Manifest.verify()` with SHA-256 hashing ensured tamper-evident storage, but we had to handle URL-only outputs that don't pass verification without byte fetching.
- **Audio-video sync** — Native audio generation from ElevenLabs needed to stay frame-accurate when clips were trimmed, extended, or reordered in the Scene Builder.
- **Graceful degradation** — The app needs to work for demo purposes even without API keys. Every pipeline function falls back to mock responses, and the frontend falls back to `ZS_DATA` when the backend is unreachable.

---

## Accomplishments that we're proud of
- Built a working **Elements consistency system** that lets a single character remain recognizable across completely separate generation calls — solving one of the most requested pain points in AI video today.
- Successfully unified **three distinct foundation models** (GMICloud video, Google Gemini, ElevenLabs speech) behind one coherent creative interface using GenBlaze's Pipeline API, so users never have to think about which model powers which button.
- Achieved reliable **B2-backed asset persistence** with provenance manifests, meaning every project element — no matter how many iterations — is retrievable, versioned, verifiable, and cheap to store at scale.
- Delivered a **timeline-native editing experience** (Scene Builder, Video Extend, Camera Control) that makes AI generation feel like real video editing, not just prompt roulette.
- Shipped precision editing tools (AI Lasso, Insert & Remove) that produce genuinely native-looking localized edits via GenBlaze image pipelines.

---

## What we learned
- **Orchestration is its own discipline.** GenBlaze proved that wrapping multiple best-in-class models is not just API glue — it requires designing a shared creative "language" (Elements, prompts, camera parameters) that translates cleanly into each model's native format.
- **Storage architecture shapes creative UX.** Choosing how assets are organized in B2 directly determined how fast and intuitive the timeline felt. Good storage design is invisible when done right — and a bottleneck when it isn't.
- **Provenance matters.** GenBlaze's manifest system showed us that provenance isn't just compliance — it's a creative tool. Being able to replay a run via `genblaze replay manifest.json` means every iteration is recoverable.
- **Consistency is the hardest unsolved problem in generative video.** Even small improvements to character/object persistence dramatically increase perceived quality and usability.

---

## What's next for ZeroShot Video
- **Expanded Element types** — Location and prop libraries with the same consistency guarantees as characters.
- **Collaborative projects** — Multi-user editing on shared B2-backed projects, with real-time asset syncing.
- **Longer-form narrative tools** — Multi-scene continuity tracking, automatic pacing suggestions, and script-to-full-edit pipelines.
- **Expanded model marketplace** — Letting users plug in additional GenBlaze providers (Runway, Luma, OpenAI Sora) as they emerge, without changing their workflow.
- **Smarter B2 lifecycle management** — Automatic tiering/archiving of older project versions to optimize storage cost as project libraries grow.
- **C2PA integration** — Pair GenBlaze's provenance manifests with C2PA signing for adversarial verification of generated media.
- **Public Tools marketplace** — Letting creators publish and monetize their own natural-language micro-workflows.
