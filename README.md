# Heba AI Video Hub

Arabic-first static website for organizing and exposing Heba Ahmed's YouTube videos about AI tools and tutorials.

## Channel

- YouTube: https://www.youtube.com/channel/UCMvdDpKRU_-ZmSz9F1lKOVA
- Channel ID: `UCMvdDpKRU_-ZmSz9F1lKOVA`

## Local Commands

```bash
node scripts/import-youtube.mjs
node scripts/build.mjs
node scripts/verify-dist.mjs
node scripts/serve.mjs
```

## Required Secret

Add this repository secret before running the import workflow:

```text
YOUTUBE_API_KEY
```

Do not commit `.env.local` or any API key to the repository.
