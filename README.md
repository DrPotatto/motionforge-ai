# MotionForge AI

**Turn your ideas into cinematic motion graphics.** Describe what you imagine. AI plans the scene. A deterministic engine renders it. Export a real video — all in the browser.

## Quick start

```bash
# Option A — open directly
open index.html            # macOS
start index.html           # Windows
xdg-open index.html        # Linux

# Option B — local server (recommended)
npm start
# → http://localhost:8080
```

## Before you ship — edit `config.js`

Open `config.js` at the project root. Fill in:

1. Your **brand name** and contact info
2. Your **site URL** (for canonical links + OG tags)
3. **Checkout URLs** for each plan (see `DEPLOY.md` → Payments)
4. Optional **analytics** script URL

That's the only file you must edit before deploying. Everything else reads from it.

## AI providers (all free tier)

The studio ships with a deterministic local engine (offline, no key). To enable real AI direction with the Baqalati doctrine as the system prompt, open **Settings → AI provider** and paste a free key:

| Provider    | Free tier                        | Key URL                                |
|-------------|----------------------------------|----------------------------------------|
| Groq        | 30 RPM / 14,400 RPD, no card     | https://console.groq.com/keys          |
| Gemini      | 15 RPM / 1,500 RPD, no card      | https://aistudio.google.com/apikey     |
| OpenRouter  | 20 RPM / 200 RPD on free models  | https://openrouter.ai/keys             |

Keys stay in the visitor's browser. No server involved. If a provider fails, the local engine takes over and the UI labels the source honestly.

## What's included

- Landing page with a **live canvas-rendered hero** using the real engine
- Prompt-to-animation dashboard with format/duration/style/scene controls
- Motion editor with three panels, timeline, live inspector, undo/redo, autosave
- **Cinematic renderer** — technical grid background, progressive path drawing, number counters, scan lines, particle systems
- **8 scene templates** — logo reveal, kinetic headline, product showcase, animated stats, feature grid, process steps, CTA, editorial quote
- Real video export via MediaRecorder with progress, playback preview, download
- Project library with duplicate/delete/search
- Brand kit applied across projects
- **Working pricing page** with checkout redirect
- Legal pages (terms, privacy)
- SEO metadata, sitemap, robots

## Browser support

Chrome, Edge, Firefox, Safari 16+. Video export requires `MediaRecorder` + `canvas.captureStream()`.

## Deploy

See **DEPLOY.md** for Cloudflare Pages, Vercel, Netlify, and GitHub Pages steps — all free tiers.

## License

MIT
