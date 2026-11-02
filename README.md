# Pixelroom — AI Image Studio

Chat-style image generation studio with OpenAI API settings, style presets, responsive layout, dark/light themes, browser-local gallery, and image downloads.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal. Production build: `npm run build`.

## Generate images

Open Settings, enter your OpenAI API key, select a model, and save the connection. API billing and model access are required. The key is held in browser memory for the current tab only and forwarded by `/api/generate` to OpenAI; it is not stored in source or image history. Refreshing clears the key.

Creations are saved in this browser's local storage, subject to browser storage limits. Download images to keep copies. Inspiration images are stock photos from Unsplash.

## Hosting

This source uses React, Vinext, and Cloudflare Workers. The existing private demo is https://pixelroom-jenil.jenilvaghamshi04.chatgpt.site . It requires a server runtime for `/api/generate`; GitHub Pages alone cannot run generation. The `.openai/hosting.json` file identifies the existing Sites deployment; do not reuse that identity for a different Site.

## Validation

Production build and TypeScript checks passed. Live generation needs an API key; browser visual QA was unavailable in the build environment.
