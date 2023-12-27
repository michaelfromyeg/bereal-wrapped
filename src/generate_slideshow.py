"""
This script generates a slideshow from a folder of images and a music file.
"""
import os

import librosa
from moviepy.editor import AudioFileClip, ImageSequenceClip, concatenate_videoclips, vfx
from PIL import Image, ImageDraw, ImageFont

from .utils import (
    COMBINED_IMAGE_PATH,
    FONT_BASE_PATH,
    INPUT_IMAGE_PATH,
    OUTPUT_IMAGE_PATH,
    OUTPUT_SLIDESHOW_PATH,
    SONG_PATH,
)


def create_endcard(num_memories, font_size=50, offset=110):
    text = str(num_memories) + " memories and counting..."

    img = Image.open(INPUT_IMAGE_PATH)
    width, height = img.size

    draw = ImageDraw.Draw(img)

    # choose a font; the file is assumed to exist under static/
    font_path = os.path.join(FONT_BASE_PATH, "Inter-SemiBold.ttf")
    font = ImageFont.truetype(font_path, font_size)

    # Get the bounding box of the text
    text_bbox = draw.textbbox((0, 0), text, font=font)

    # Calculate the position to center the text
    x = (width - text_bbox[2]) // 2
    y = (height - text_bbox[3]) // 2 + offset

    draw.text((x, y), text, font=font, fill="white")

    img.save(OUTPUT_IMAGE_PATH)

    return OUTPUT_IMAGE_PATH


def create_slideshow(input_folder, output_file, music_file, timestamps, mode="classic"):
    image_files = sorted(
        [
            f
            for f in os.listdir(input_folder)
            if f.endswith((".png", ".jpg", ".jpeg", "webp"))
        ]
    )

    clips = []

    print("image file count: " + str(len(image_files)))
    print("beat count: " + str(len(timestamps)))

    # Check if timestamps has fewer values than imagefiles
    img_file_count = len(image_files)
    beat_count = len(timestamps)

    if len(timestamps) < len(image_files):
        # Adjust the length of timestamps by repeating its elements
        timestamps += timestamps[: len(image_files) - len(timestamps)]

    print("image file count: " + str(len(image_files)))
    print("beat count: " + str(len(timestamps)))

    for image_file, timestamp in zip(image_files, timestamps):
        image_path = os.path.join(input_folder, image_file)
        clip = ImageSequenceClip([image_path], fps=1 / timestamp)
        clips.append(clip)
        print("appended clip: ", image_path)

    endcard_img_path = create_endcard(len(image_files))
    endcard_clip = ImageSequenceClip([endcard_img_path], fps=1 / 3)
    clips.append(endcard_clip)

    final_clip = concatenate_videoclips(clips, method="compose")

    if mode == "classic":
        print("clipping video to classic mode")
        final_clip = final_clip.fx(vfx.accel_decel, new_duration=30)

    music = AudioFileClip(music_file)
    # Pad the audio with silence if it's shorter than the final clip
    if music.duration < final_clip.duration:
        print("music is shorter than final clip, will be padded with silence")
        # silence_duration = final_clip.duration - music.duration
        # silence = AudioSegment.silent(duration=silence_duration * 1000)  # Duration in milliseconds
        # music += silence  # Concatenate silence and audio
    else:
        print("music is longer than final clip, clipping")
        music = music.subclip(0, final_clip.duration)

    music = music.audio_fadeout(3)

    # print("Video Duration = ", final_clip.duration)
    # print("Music Duration = ", music_processed.duration)

    final_clip = final_clip.set_audio(music)

    final_clip.write_videofile(
        output_file, codec="libx264", audio_codec="aac", threads=6, fps=24
    )


def convert_to_durations(timestamps):
    """
    Calculate durations between consecutive timestamps
    """
    durations = []

    for i in range(1, len(timestamps)):
        duration = timestamps[i] - timestamps[i - 1]
        durations.append(duration)

    return durations


def build_slideshow(mode="classic"):
    """
    Create the actual slideshow.
    """
    audio_file = librosa.load(SONG_PATH)
    y, sr = audio_file
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times_raw = librosa.frames_to_time(beat_frames, sr=sr)
    beat_times = [float(value) for value in beat_times_raw]
    beat_times = convert_to_durations(beat_times)
    print(beat_times)

    create_slideshow(
        COMBINED_IMAGE_PATH, OUTPUT_SLIDESHOW_PATH, SONG_PATH, beat_times, mode
    )
