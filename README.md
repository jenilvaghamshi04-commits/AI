# Pixelroom — AI Image Studio

Chat-style image generation studio with multiple image API providers, style presets, responsive layout, dark/light themes, browser-local gallery, and image downloads.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal. Production build: `npm run build`.

## Generate images

Open Settings, select an image provider, enter its API key, and select a model. You can enter keys for multiple providers and switch with the “Create with” selector above the prompt.

| Provider | Image models |
| --- | --- |
| OpenAI | GPT Image 1.5, GPT Image 1 Mini, GPT Image 2 |
| Google Gemini | Gemini 3.1 Flash Image, Nano Banana 2.1, Gemini 2.5 Flash Image |
| Stability AI | Stable Image Core, Stable Image Ultra |
| Together AI | FLUX.1 Schnell, FLUX.2 Pro |

Each provider requires its own API key, credits, and model access. Keys are held separately in browser memory for this tab and are sent through `/api/generate` only to the selected provider. They are never written to source, local storage, or image history. Refreshing clears all keys. A “Key added” indicator confirms entry, not provider validation. Aspect ratios are mapped to each API; actual pixel dimensions can vary by model.

The server uses fixed, allowlisted provider endpoints and models. It has no automatic fallback: a failed request never switches to another provider or incurs charges there.

Creations are saved in this browser's local storage, subject to browser storage limits. Download images to keep copies. Inspiration images are stock photos from Unsplash.

## Hosting

This source uses React, Vinext, and Cloudflare Workers. The existing private demo is https://pixelroom-jenil.jenilvaghamshi04.chatgpt.site . It requires a server runtime for `/api/generate`; GitHub Pages alone cannot run generation. The `.openai/hosting.json` file identifies the existing Sites deployment; do not reuse that identity for a different Site.

## Validation

Production build and TypeScript checks passed. Mocked adapter tests cover all four request/response formats, credentials, aspect ratios, invalid input, provider errors, key redaction, timeouts, and session key isolation. Run them with `node --import tsx --test tests/image-providers.test.ts`. Live provider calls still require real keys; browser visual QA was unavailable in this environment.

## Deploy on Render

Use the included `render.yaml` Blueprint, or create a Node Web Service from this repository.

- Branch: `main`
- Build command: `npm ci --include=dev && npm run build:render`
- Start command: `npm run start:render`
- Health check: `/api/health`
- Node version: `22.16.0`

No API key needs to be stored in Render; each visitor enters their own key in Settings. The Render deployment is public by default. Do not treat the workspace UI as authentication.

The Next.js production build and local startup passed; `/api/health` and the homepage returned HTTP 200, and image generation rejected missing keys.
