"""
This script generates a slideshow from a folder of images and a music file.
"""

import os

import librosa

from moviepy.audio.io.AudioFileClip import AudioFileClip
from moviepy.video.fx import all as vfx
from moviepy.video.io.ImageSequenceClip import ImageSequenceClip

from PIL import Image, ImageDraw, ImageFont

from .logger import logger
from .utils import (
    CONTENT_PATH,
    ENDCARD_TEMPLATE_IMAGE_PATH,
    EXPORTS_PATH,
    FONT_BASE_PATH,
    IMAGE_QUALITY,
    Mode,
)


def create_endcard(phone: str, year: str, n_images: int, font_size: int = 50, offset: int = 110) -> str:
    """
    Dynamically the final end card image, with the centered text "n_images memories and counting...".

    Return the path of the image.
    """
    text = str(n_images) + " memories and counting..."

    img = Image.open(ENDCARD_TEMPLATE_IMAGE_PATH)
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

    encard_image_path = os.path.join(CONTENT_PATH, phone, year, "endcard.png")

    img = img.convert("RGB")
    img.save(encard_image_path, quality=IMAGE_QUALITY)

    return encard_image_path


def create_slideshow3(
    phone: str,
    year: str,
    input_folder: str,
    output_file: str,
    music_file: str | None,
    timestamps: list[float],
    mode: Mode = Mode.CLASSIC,
) -> None:
    """
    Create a video slideshow from a target set of images.
    """
    logger.debug("Creating slideshow for %s, %s", phone, year)

    if not os.path.isdir(input_folder):
        raise ValueError("Input folder does not exist!")

    if music_file is not None and not os.path.isfile(music_file):
        raise ValueError("Music file does not exist!")

    n_images = len(os.listdir(input_folder))
    if n_images == 0:
        raise ValueError("No images found in input folder!")

    if len(timestamps) < n_images:
        additional_needed = n_images - len(timestamps)

        # Repeat the entire timestamps list as many times as needed
        while additional_needed > 0:
            timestamps.extend(timestamps[: min(len(timestamps), additional_needed)])
            additional_needed = n_images - len(timestamps)

    assert len(timestamps) >= n_images

    main_clip = ImageSequenceClip(input_folder, durations=timestamps)

    # TODO(michaelfromyeg): create this file right in the input_folder?
    # intro_clip = ...

    # endcard_image_path = create_endcard(phone=phone, year=year, n_images=n_images)
    # endcard_clip = ImageSequenceClip([endcard_image_path], fps=1 / 3)

    # main_clip = concatenate_videoclips([intro_clip, main_clip, endcard_clip], method="compose")

    if mode == Mode.CLASSIC:
        main_clip = main_clip.fx(vfx.accel_decel, new_duration=30)

    music = AudioFileClip(music_file)

    if music.duration < main_clip.duration:
        logger.warning("Music is shorter than final clip; looping music")

        music = music.fx(vfx.loop, duration=main_clip.duration)
    else:
        logger.info("Music is longer than final clip; clipping appropriately")

        music = music.subclip(0, main_clip.duration)

    main_clip = main_clip.set_audio(music)

    main_clip.write_videofile(output_file, codec="libx264", audio_codec="aac", threads=4, fps=24)

    return None


def convert_to_durations(timestamps: list[float]) -> list[float]:
    """
    Calculate durations between consecutive timestamps.
    """
    durations: list[float] = []

    n = len(timestamps)
    for i in range(1, n):  # [1...n-1]
        duration = timestamps[i] - timestamps[i - 1]
        durations.append(duration)

    return durations


def build_slideshow(
    phone: str, year: str, image_folder: str, song_path: str, filename: str, mode: Mode = Mode.CLASSIC
) -> None:
    """
    Create the actual slideshow.
    """
    audio_file = librosa.load(song_path)
    y, sr = audio_file
    _, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times_raw = librosa.frames_to_time(beat_frames, sr=sr)

    beat_times = convert_to_durations([float(value) for value in beat_times_raw])
    logger.debug("Beat times: %s", beat_times)

    output_file = os.path.join(EXPORTS_PATH, filename)
    logger.info("Creating slideshow at %s", output_file)

    # Always create the slideshow, because song or mode may have changed!
    # (...this next line is sometimes helpful for debugging, though)

    # if os.path.isfile(output_file):
    #     logger.info("Skipping 'build_slideshow' stage; already created!")
    #     return None

    create_slideshow3(
        phone=phone,
        year=year,
        input_folder=image_folder,
        output_file=output_file,
        music_file=song_path,
        timestamps=beat_times,
        mode=mode,
    )
    return None
