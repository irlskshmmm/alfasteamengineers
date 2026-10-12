#!/usr/bin/env bash
# Prepare a stock clip for the hero background:
#   tools/prepare-hero-video.sh path/to/downloaded-clip.mp4 [start-seconds] [duration-seconds]
# Produces videos/hero-power-plant.mp4 + .webm (1280px wide, no audio, ~1–3 MB each) and a poster frame.
set -euo pipefail
src="$1"; start="${2:-0}"; dur="${3:-15}"
cd "$(dirname "$0")/.."
mkdir -p videos
ffmpeg -y -ss "$start" -t "$dur" -i "$src" -an \
  -vf "scale=1280:-2:flags=lanczos,fps=24" \
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart \
  videos/hero-power-plant.mp4
ffmpeg -y -i videos/hero-power-plant.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -deadline good -cpu-used 4 \
  videos/hero-power-plant.webm
ffmpeg -y -ss 1 -i videos/hero-power-plant.mp4 -frames:v 1 -update 1 -q:v 4 videos/hero-power-plant.jpg
ls -lh videos/
echo "Done. Now run: node tools/build.mjs"
