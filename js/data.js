// ==========================================================================
// ZeroShot Video — Mock Data Layer
// Simulates the backend/asset library so the UI has realistic content.
// ==========================================================================

const ZS_DATA = {

  projects: [
    { id: 1, name: "Neon Streets — Episode 1", thumb: "https://picsum.photos/seed/proj1/400/240", clips: 12, duration: "1:24", updated: "2 hours ago" },
    { id: 2, name: "Product Launch Teaser", thumb: "https://picsum.photos/seed/proj2/400/240", clips: 6, duration: "0:38", updated: "Yesterday" },
    { id: 3, name: "Untitled Project", thumb: "https://picsum.photos/seed/proj3/400/240", clips: 0, duration: "0:00", updated: "3 days ago" },
    { id: 4, name: "Desert Chase Sequence", thumb: "https://picsum.photos/seed/proj4/400/240", clips: 9, duration: "1:02", updated: "5 days ago" },
    { id: 5, name: "Brand Sizzle Reel", thumb: "https://picsum.photos/seed/proj5/400/240", clips: 15, duration: "2:10", updated: "1 week ago" },
  ],

  storyboardScenes: [
    { id: 1, title: "Scene 1 — Establishing Alley", thumb: "https://picsum.photos/seed/sb1/300/170", cast: ["Ryan"], desc: "Wide establishing shot of the rain-soaked neon alley at night." },
    { id: 2, title: "Scene 2 — Shadow Movement", thumb: "https://picsum.photos/seed/sb2/300/170", cast: ["Ryan"], desc: "A shadow darts between dumpsters; Ryan notices and stops." },
    { id: 3, title: "Scene 3 — Approach", thumb: "https://picsum.photos/seed/sb3/300/170", cast: ["Ryan"], desc: "Ryan draws his coat tighter, breath fogging, moves closer." },
    { id: 4, title: "Scene 4 — Reveal", thumb: "https://picsum.photos/seed/sb4/300/170", cast: ["Ryan", "Mara"], desc: "A figure steps into the neon light — it's Mara, holding a case." },
    { id: 5, title: "Scene 5 — Dialogue", thumb: "https://picsum.photos/seed/sb5/300/170", cast: ["Ryan", "Mara"], desc: "Tense exchange of words between Ryan and Mara." },
  ],

  elements: [
    { id: "el-ryan", name: "Ryan", type: "character", thumb: "https://picsum.photos/seed/ryan/300/300", voice: "Deep, Weary Male (Minimax)", tags: ["protagonist","detective"], backstory: "A burnt-out detective haunted by an unsolved case a decade ago. Wears a long grey coat, guarded and observant." },
    { id: "el-mara", name: "Mara", type: "character", thumb: "https://picsum.photos/seed/mara/300/300", voice: "Sharp, Confident Female (Minimax)", tags: ["informant"], backstory: "A shadowy information broker who always knows more than she lets on." },
    { id: "el-alley", name: "Neon Alley", type: "location", thumb: "https://picsum.photos/seed/alley/300/300", tags: ["night","urban"], backstory: "A cramped alleyway between two towering neon-signed buildings, always slick with rain." },
    { id: "el-case", name: "Metal Briefcase", type: "object", thumb: "https://picsum.photos/seed/case/300/300", tags: ["prop"], backstory: "A locked steel briefcase, central MacGuffin of the story." },
    { id: "el-car", name: "Detective's Sedan", type: "object", thumb: "https://picsum.photos/seed/car/300/300", tags: ["vehicle"], backstory: "A weathered 1970s sedan, Ryan's only constant companion." },
    { id: "el-rooftop", name: "Rooftop Skyline", type: "location", thumb: "https://picsum.photos/seed/roof/300/300", tags: ["day","urban"], backstory: "A sprawling rooftop view overlooking the neon sprawl of the city below." },
    { id: "el-officer", name: "Officer Kade", type: "character", thumb: "https://picsum.photos/seed/kade/300/300", voice: "Gruff, Authoritative Male (Minimax)", tags: ["supporting"], backstory: "A by-the-book beat cop who begrudgingly assists Ryan." },
    { id: "el-diner", name: "24hr Diner", type: "location", thumb: "https://picsum.photos/seed/diner/300/300", tags: ["interior","night"], backstory: "A near-empty diner glowing under flickering fluorescent lights." },
  ],

  tools: [
    { name: "Type Overlays", icon: "bi-fonts", desc: "Position animated typographic text across generated timelines." },
    { name: "Video Resizer", icon: "bi-aspect-ratio", desc: "Rapid aspect ratio reframing for varying distribution formats." },
    { name: "PixelBento", icon: "bi-grid-3x3-gap-fill", desc: "High-end color grading and stylized visual bento layouts." },
    { name: "Shader Effects", icon: "bi-magic", desc: "Glitch effects, lo-fi textures, and stylized post-processing filters." },
    { name: "Auto Subtitle", icon: "bi-chat-square-text", desc: "Community remix: auto-generate synced subtitles from dialogue audio." },
    { name: "Establishing Shot Builder", icon: "bi-easel", desc: "Community remix: one-click wide establishing shots from a location element." },
  ],

  // Timeline seed data: tracks + clips (times in seconds)
  timelineTracks: [
    {
      id: "track-video-1", type: "video", label: "Video 1",
      clips: [
        { id: "c1", name: "Scene_01_Establish", start: 0, duration: 6, thumb: "https://picsum.photos/seed/c1/160/90" },
        { id: "c2", name: "Scene_02_Shadow", start: 6, duration: 5, thumb: "https://picsum.photos/seed/c2/160/90" },
        { id: "c3", name: "Scene_03_Alley", start: 11, duration: 8, thumb: "https://picsum.photos/seed/c3/160/90" },
        { id: "c4", name: "Scene_04_Reveal", start: 19, duration: 5, thumb: "https://picsum.photos/seed/c4/160/90" },
      ]
    },
    {
      id: "track-audio-1", type: "audio", label: "Audio 1",
      clips: [
        { id: "a1", name: "Ambient City Hum", start: 0, duration: 19, thumb: null },
        { id: "a2", name: "Dialogue — Ryan/Mara", start: 19, duration: 5, thumb: null },
      ]
    },
    {
      id: "track-overlay-1", type: "overlay", label: "Overlays",
      clips: [
        { id: "o1", name: "Title Card", start: 0, duration: 3, thumb: null },
      ]
    }
  ]
};
