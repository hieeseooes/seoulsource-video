# 🎬 SeoulSource Video Engine (Remotion + GitHub Actions)

Cloud-based vertical video generator (9:16) for **SeoulSource** powered by [Remotion](https://remotion.dev) and GitHub Actions.

## 🌟 Highlights
- **100% Cloud Render**: Zero CPU and RAM usage on local machine.
- **Auto-Artifact & Release**: Rendered MP4 is automatically attached to GitHub Releases for direct high-speed download.
- **Dynamic Props**: Pass custom titles, still images, voiceover audio, and Seola captions via `workflow_dispatch`.
- **Format**: 1080 x 1920 (9:16) 30fps vertical video optimized for TikTok, Instagram Reels, YouTube Shorts, and Threads.

## 🚀 Triggering via GitHub CLI
```bash
gh workflow run render.yml -f composition="SeoulSourceReel" -f output_name="kdrama_recap_1"
```

## 🛠️ Testing Locally
```bash
npm install
npm start
```
