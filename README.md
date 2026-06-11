# HeadlineHarmonies

HeadlineHarmonies is now a social-sharing AI art app: users turn real news headlines into styled images and share them quickly (with native share, caption copy, and download fallback).

The project originally included NFT minting; the active UI has been migrated to a general Web2 sharing workflow.

## Product Direction (Current)

- Headline-based AI image generation.
- Style-driven prompt customization (multiple art movements/styles).
- Social sharing-first UX in the `Post` section:
  - `Share` button (uses native browser share when possible)
  - `Copy Caption`
  - `Download Image`

## How The App Works (Technical Flow)

1. Page load:
   - The app renders from Next.js Pages Router at `/` and `/:userPublicKey`.
   - `HHMint` is dynamically imported with `ssr: false` so browser-only APIs (Clipboard/Web Share/File) can be used safely.

2. Headline fetch:
   - Frontend calls `GET /api/getNews`.
   - Backend pulls Google News RSS (`news.google.com/rss`), parses XML with `xml2js`, strips source suffixes (e.g., ` - Reuters`), and returns a `headlines` array.

3. User selection:
   - User chooses one headline and one style.
   - Styles are configured in `src/components/buttonData.ts` with associated thumbnail images in `public/images`.

4. Image generation:
   - Frontend posts `{ selectedStyle, selectedHeadline }` to `POST /api/generateImage`.
   - Backend calls OpenAI Images (`gpt-image-2` by default) to generate the image from a randomized style/headline prompt template.
   - Backend then tries a cheap vision-capable caption model to create the caption package from the generated image, headline, style, and image prompt.
   - If no caption API key/model is available or the model output fails validation, backend falls back to the deterministic local caption package.
   - Backend returns:
     - `image` (base64 image data)
     - `imageMimeType`
     - `captionPackage` (`caption`, `hashtags`, `altText`, `suggestedFirstComment`)

5. Client post-prep:
   - Frontend converts base64 image into a `File`.
   - Uses the server caption package when present, with deterministic local caption generation as a browser-side safety fallback.

6. Share action:
   - If `navigator.share` supports files, app opens the native share sheet with image + caption.
   - Otherwise fallback:
     - copy caption to clipboard,
     - download image,
     - open Instagram in a new tab.

7. Important note:
   - The current UI does not mint NFTs and does not require wallet connection.

## Languages and Frameworks Used

### Core languages

- TypeScript (`.ts`, `.tsx`) for app pages, components, and API handlers.
- JavaScript in runtime dependencies and build ecosystem.
- CSS (`src/styles/globals.css`) for global styling.
- HTML rendered through React/Next components.

### Frontend framework and UI

- Next.js `13` (Pages Router)
- React `18`
- Chakra UI (`@chakra-ui/react`) for layout/components/theming
- Font Awesome React bindings for social icons

### Backend/API layer

- Next.js API routes (`src/pages/api/*`) running in Node.js runtime
- `@vercel/node` types for request/response typing
- `axios` for HTTP requests
- `xml2js` for RSS parsing

### AI and external services

- OpenAI Node SDK (`openai`) for image generation
- OpenAI Images API (`gpt-image-2` by default) for image generation
- OpenAI chat/vision model for server-side caption packages, defaulting through the small-model candidate list in `src/lib/visionCaptionPackage.ts`
- Google News RSS feed for headline source data

### Browser APIs used by the share workflow

- Web Share API (`navigator.share`, optional `navigator.canShare`)
- Clipboard API (`navigator.clipboard.writeText`)
- Blob/File APIs (`File`, `Blob`, `URL.createObjectURL`) for image download and share payloads

### Legacy Web3/NFT stack (still in repo)

These packages and route are still present, but not used by the active UI flow:

- Solana/Metaplex/UMI packages
- `src/pages/api/mintHH.ts` (legacy minting endpoint)

## Project Structure

- `src/pages/index.tsx` and `src/pages/[userPublicKey].tsx`
  - App entry pages, both render `HHMint`.
- `src/components/HHMint.tsx`
  - Main UI flow (headline/style/generate/post).
- `src/components/buttonData.ts`
  - Style labels + thumbnail asset paths.
- `src/pages/api/getNews.ts`
  - Google News RSS fetch + parse.
- `src/pages/api/generateImage.ts`
  - OpenAI image generation and server-side caption package generation.
- `src/lib/captionPackage.ts`
  - Deterministic local caption-package fallback.
- `src/lib/visionCaptionPackage.ts`
  - Server-only vision-informed caption-package generation, validation, caching, and deterministic fallback.
- `src/pages/api/mintHH.ts`
  - Legacy NFT minting backend path (not called by current UI).

## Environment Variables

Defined in local `.env`:

- `OPENAI_API_KEY`
  - Used for image generation when `OPENAI_IMAGE_API_KEY` is not set.
  - Also used server-side for the optional vision-informed caption package. If absent, caption generation falls back to deterministic local logic.
- `OPENAI_IMAGE_API_KEY`
  - Optional dedicated key for OpenAI image generation.
- `OPENAI_IMAGE_MODEL`
  - Optional image model override. Defaults to `gpt-image-2`.
- `OPENAI_CAPTION_MODEL`
  - Optional caption model override. If unset, the server tries `gpt-5-nano`, then `gpt-4.1-nano`, then `gpt-4.1-mini`, and falls back deterministically if none succeed.
- `OPENAI_IMAGE_SIZE`
  - Optional image size override. Defaults to `1024x1024`.
- `OPENAI_IMAGE_QUALITY`
  - Optional image quality override. Defaults to `low` to keep preview requests below serverless timeout limits.
- `OPENAI_IMAGE_FORMAT`
  - Optional image format override. Defaults to `jpeg` for lower latency.
- `OPENAI_IMAGE_COMPRESSION`
  - Optional JPEG/WebP compression override. Defaults to `85`.

Legacy/optional for NFT path:

- `SOLANA_RPC_URL`
- `SECRET_KEY`
- `NEXT_PUBLIC_SOLANA_RPC_URL`

## Local Development

```bash
npm install
npm run dev
```

Open: `http://127.0.0.1:3000`

Production build check:

```bash
npm run build
```

## API Endpoints

- `GET /api/getNews`
  - Returns `{ headlines: string[] }`.
- `POST /api/generateImage`
  - Input: `{ selectedStyle, selectedHeadline }`
  - Output: `{ image, imageMimeType, captionPackage }`
- `POST /api/mintHH` (legacy)
  - Legacy NFT minting flow; not part of active UI.
- `GET /api/hello`
  - Simple health/demo endpoint.

## Migration Notes (NFT -> Social Sharing)

- Wallet connect UI was removed from the frontend.
- `Mint` section was replaced by `Post`/`Share`.
- NFT backend code remains in-repo for backward compatibility and potential future reuse.

## Contact

For inquiries or support: [tdevito@icloud.com](mailto:contact@headlineharmonies.com)
