"""
This script generates a slideshow from a folder of images and a music file.
"""
import os

import librosa
from moviepy.editor import AudioFileClip, ImageSequenceClip, concatenate_videoclips, vfx
from PIL import Image, ImageDraw, ImageFont

from .logger import logger
from .utils import (
    COMBINED_IMAGE_PATH,
    ENDCARD_IMAGE_PATH,
    ENDCARD_TEMPLATE_IMAGE_PATH,
    FONT_BASE_PATH,
    IMAGE_EXTENSIONS,
    OUTPUT_SLIDESHOW_PATH,
    SONG_PATH,
    Mode,
)


def create_endcard(n_images: int, font_size: int = 50, offset: int = 110) -> str:
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

    img.save(ENDCARD_IMAGE_PATH)

    return ENDCARD_IMAGE_PATH


def create_slideshow(
    input_folder: str,
    output_file: str,
    music_file: str | None,
    timestamps: list[float],
    mode: Mode = Mode.CLASSIC,
) -> None:
    """
    Create a video slideshow from a target set of images.
    """
    if not os.path.isdir(input_folder):
        raise ValueError("Input folder does not exist!")

    if music_file is not None and not os.path.isfile(music_file):
        raise ValueError("Music file does not exist!")

    image_paths = sorted(
        [
            os.path.join(input_folder, filename)
            for filename in os.listdir(input_folder)
            if any([filename.endswith(extension) for extension in IMAGE_EXTENSIONS])
        ]
    )
    n_images, n_timestamps = len(image_paths), len(timestamps)

    logger.info("Processing %d images...", n_images)
    logger.info("With %d timestamps...", n_timestamps)

    if n_timestamps < n_images:
        logger.info("Padding timestamps with last timestamps...")
        timestamps += timestamps[: len(image_paths) - len(timestamps)]

    # Create a clip for each image, with length determined by the timestamp
    clips: list[ImageSequenceClip] = []
    for image_path, timestamp in zip(image_paths, timestamps):
        clip = ImageSequenceClip([image_path], fps=1 / timestamp)
        clips.append(clip)

        logger.debug("Appended clip %s", image_path)

    # Append the end card
    endcard_image_path = create_endcard(n_images=n_images)
    endcard_clip = ImageSequenceClip([endcard_image_path], fps=1 / 3)
    clips.append(endcard_clip)

    final_clip = concatenate_videoclips(clips, method="compose")

    # Optionally, trim to 30 seconds ("classic BeReal")
    if mode == Mode.CLASSIC:
        logger.info("Selected classic mode; clipping video to 30 seconds accordingly")
        final_clip = final_clip.fx(
            vfx.accel_decel,
            new_duration=30,  # pylint: disable=no-member
        )

    # Optionally, add music
    if music_file is not None:
        music = AudioFileClip(music_file)
        if music.duration < final_clip.duration:
            # TODO(michaelfromyeg): implement silence padding! (or maybe repeat clip...)
            raise NotImplementedError("Music is shorter than final clip, not supported")

            # silence_duration = final_clip.duration - music.duration
            # silence = AudioSegment.silent(duration=silence_duration * 1000)  # Duration in milliseconds
            # music += silence  # Concatenate silence and audio
        else:
            logger.info("Music is longer than final clip; clipping appropriately")
            music = music.subclip(0, final_clip.duration)

        music = music.audio_fadeout(3)  # pylint: disable=no-member

        final_clip = final_clip.set_audio(music)

    final_clip.write_videofile(output_file, codec="libx264", audio_codec="aac", threads=6, fps=24)


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


def build_slideshow(mode: Mode = Mode.CLASSIC):
    """
    Create the actual slideshow.
    """
    audio_file = librosa.load(SONG_PATH)
    y, sr = audio_file
    _, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times_raw = librosa.frames_to_time(beat_frames, sr=sr)

    beat_times = convert_to_durations([float(value) for value in beat_times_raw])
    logger.debug("Beat times: %s", beat_times)

    create_slideshow(
        input_folder=COMBINED_IMAGE_PATH,
        output_file=OUTPUT_SLIDESHOW_PATH,
        music_file=SONG_PATH,
        timestamps=beat_times,
        mode=mode,
    )
