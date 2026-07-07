#!/usr/bin/env python3
"""
Script untuk mengubah semua audio hewan menjadi 3 detik
"""
import os
import subprocess
import sys

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "static", "audio", "animals")
DURATION = 3  # detik

def check_ffmpeg():
    """Check if FFmpeg is installed"""
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

def convert_to_3_seconds(input_file, output_file):
    """
    Convert audio to exactly 3 seconds
    - If longer: trim to 3 seconds
    - If shorter: pad with silence to 3 seconds
    """
    # Command to convert and standardize to 3 seconds
    command = [
        "ffmpeg",
        "-i", input_file,
        "-t", str(DURATION),  # trim to 3 seconds max
        "-acodec", "libmp3lame",
        "-b:a", "192k",
        "-q:a", "4",
        "-y",  # overwrite without asking
        output_file
    ]
    
    try:
        subprocess.run(command, capture_output=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error processing {input_file}: {e}")
        return False

def main():
    print(f"Audio directory: {AUDIO_DIR}")
    
    if not check_ffmpeg():
        print("ERROR: FFmpeg tidak ditemukan!")
        print("Silahkan install FFmpeg:")
        print("  - Windows: choco install ffmpeg")
        print("  - Linux: sudo apt-get install ffmpeg")
        print("  - Mac: brew install ffmpeg")
        sys.exit(1)
    
    if not os.path.exists(AUDIO_DIR):
        print(f"ERROR: Directory {AUDIO_DIR} tidak ditemukan!")
        sys.exit(1)
    
    audio_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith(".mp3")]
    
    if not audio_files:
        print("Tidak ada file MP3 yang ditemukan!")
        sys.exit(1)
    
    print(f"Ditemukan {len(audio_files)} file audio:")
    for f in sorted(audio_files):
        print(f"  - {f}")
    
    print(f"\nMengkonversi semua audio menjadi {DURATION} detik...")
    print("-" * 50)
    
    success_count = 0
    for filename in sorted(audio_files):
        input_path = os.path.join(AUDIO_DIR, filename)
        output_path = os.path.join(AUDIO_DIR, f".{filename}.tmp")
        
        print(f"Processing: {filename}...", end=" ")
        
        if convert_to_3_seconds(input_path, output_path):
            # Replace original file with converted one
            os.replace(output_path, input_path)
            print("✓ Selesai")
            success_count += 1
        else:
            print("✗ Gagal")
            if os.path.exists(output_path):
                os.remove(output_path)
    
    print("-" * 50)
    print(f"Hasil: {success_count}/{len(audio_files)} file berhasil dikonversi")
    
    if success_count == len(audio_files):
        print("✓ Semua audio berhasil dikonversi menjadi 3 detik!")
    else:
        print("⚠ Beberapa file gagal dikonversi")

if __name__ == "__main__":
    main()
