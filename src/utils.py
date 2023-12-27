"""
Utility functions and constants.
"""
import os

CWD = os.getcwd()

OUTLINE_PATH = os.path.join(
    CWD, "src", "static", "images", "secondary_image_outline.png"
)
FONT_BASE_PATH = os.path.join(CWD, "src", "static", "fonts")

INPUT_IMAGE_PATH = os.path.join(CWD, "src", "static", "images", "endCard_template.jpg")
OUTPUT_IMAGE_PATH = os.path.join(CWD, "src", "static", "images", "endCard.jpg")

CONTENT_PATH = os.path.join(CWD, "content")

PRIMARY_IMAGE_PATH = os.path.join(CONTENT_PATH, "primary")
SECONDARY_IMAGE_PATH = os.path.join(CONTENT_PATH, "secondary")
COMBINED_IMAGE_PATH = os.path.join(CONTENT_PATH, "combined")
SONG_PATH = os.path.join(CONTENT_PATH, "curr_song.wav")

OUTPUT_SLIDESHOW_PATH = os.path.join(CWD, "src", "static", "videos", "slideshow.mp4")
