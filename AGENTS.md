# Project Memory

This project is for building an Arabic-first static website for Heba Ahmed's AI YouTube channel.

## Core Context

- YouTube channel: https://www.youtube.com/channel/UCMvdDpKRU_-ZmSz9F1lKOVA
- YouTube channel ID: `UCMvdDpKRU_-ZmSz9F1lKOVA`
- GitHub account: https://github.com/hebaaabdelgayed
- Planned repository: `hebaaabdelgayed/ai-video-hub`
- Default hosting: GitHub Pages

## Goal

Build a static website that increases discovery and reach for the YouTube videos through Google/Search SEO, organizes 200+ existing videos, and creates a future path for AdSense eligibility.

Important expectation: the website can help discovery, brand authority, Google search visibility, and embedded watch sessions, but it does not directly guarantee higher YouTube Search rankings.

## Audience And Language

- Arabic-first audience.
- Use RTL layout by default.
- Include English AI terms naturally where Arabic-speaking viewers commonly search for or recognize them.

## Planned Site Model

- Channel hub homepage.
- Playlist/category pages.
- Topic/tag pages.
- One SEO page per video.
- Lightweight launch pages should include video embed, thumbnail, Arabic summary, keywords, playlist/topic links, related videos, FAQ, and structured SEO metadata.
- Richer original Arabic article pages should be added later for top-performing videos and high-value AI topics to improve AdSense eligibility and Google SEO strength.

## Automation Plan

- Use the YouTube Data API to import channel metadata, playlists, uploads, video titles, descriptions, thumbnails, publish dates, durations, and public tags when available.
- Use GitHub Actions for scheduled updates and deployment.
- Use GitHub Models to draft Arabic SEO metadata for new video pages.
- Auto-publish new YouTube uploads to the website after the scheduled workflow succeeds.
- Keep a rule-based SEO fallback so imports still work if AI generation is unavailable.

## Monetization Notes

- Embedded YouTube ads can benefit the video owner if the YouTube channel is monetized and ads are enabled.
- Separate website AdSense monetization requires Google approval.
- AdSense approval is more likely if the site has original, useful Arabic content, clear navigation, privacy/about/contact pages, and is not only thin embed pages.

## Current Implementation State

- `git` and `npm` were not available in PowerShell during implementation.
- A dependency-free Node static site scaffold exists because Node is available but npm is not.
- Local `data/videos.json` has been imported from YouTube Data API and contains 209 videos, 33 playlists, and 7 inferred topics.
- The GitHub repo initially uses a placeholder `data/videos.json`; run the import workflow after adding `YOUTUBE_API_KEY` as a repository secret to populate the real data.
- The local API key is stored only in `.env.local`, which is ignored by `.gitignore`.
- Generated static output is written to `dist/` and is ignored by Git.
- Available scripts:
  - `node scripts/import-youtube.mjs`
  - `node scripts/build.mjs`
  - `node scripts/check.mjs`
  - `node scripts/verify-dist.mjs`
  - `node scripts/serve.mjs`
- GitHub Actions workflows exist for scheduled video import and GitHub Pages deployment.
- This file is project memory for future Codex chats; it does not replace a public `README.md`.

## Safety

- Do not commit API keys, tokens, analytics exports with private data, or other secrets.
- Store deployment and API credentials in GitHub repository secrets.
