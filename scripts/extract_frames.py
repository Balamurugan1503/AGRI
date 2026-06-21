import os
import subprocess
import argparse
from pathlib import Path

def extract_frames(video_path: str, output_dir: str, fps: int = 24):
    """
    Extracts frames from a video file into a sequence of JPG images.
    Requires FFmpeg to be installed on the system.
    """
    video_file = Path(video_path)
    out_dir = Path(output_dir)

    if not video_file.exists():
        print(f"Error: Video file '{video_path}' not found.")
        return

    # Create output directory if it doesn't exist
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # We output them as frame_0001.jpg, frame_0002.jpg, etc.
    output_pattern = out_dir / "frame_%04d.jpg"
    
    # Optional scale: to keep the web size manageable, we scale to 1920x1080 if needed.
    # FFmpeg command: ffmpeg -i video.mp4 -vf "fps=24,scale=1920:1080:force_original_aspect_ratio=decrease" -q:v 2 frames/frame_%04d.jpg
    
    cmd = [
        "ffmpeg",
        "-i", str(video_file),
        "-vf", f"fps={fps},scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
        "-q:v", "5",  # Quality setting (lower is better, 2-5 is good for web)
        str(output_pattern)
    ]

    print(f"Starting frame extraction at {fps} FPS...")
    print(f"Executing: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
        print(f"✅ Success! Frames extracted to '{out_dir}/'")
        print("Copy the entire folder into your Next.js 'public/frames' directory.")
    except subprocess.CalledProcessError as e:
        print("❌ Error extracting frames. Make sure ffmpeg is installed and added to your system PATH.")
        print(e)
    except FileNotFoundError:
        print("❌ Error: 'ffmpeg' command not found.")
        print("Please install FFmpeg. On Windows, you can use Winget: winget install ffmpeg")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract video frames for web scrollytelling animations.")
    parser.add_argument("video", help="Path to your input paddy growth video (e.g., input.mp4)")
    parser.add_argument("--out", default="../public/frames", help="Output directory (default: ../public/frames)")
    parser.add_argument("--fps", type=int, default=15, help="Frames per second to extract. For scroll animations, 15-24 is usually sufficient.")

    args = parser.parse_args()
    
    extract_frames(args.video, args.out, args.fps)
