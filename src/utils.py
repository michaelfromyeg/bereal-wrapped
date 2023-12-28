"""
Utility functions and constants.

Idea for phone numbers as directory base.

import os

def insert_directory(original_path, new_dir, position):
    path_list = original_path.split(os.sep)
    path_list.insert(position, new_dir)
    new_path = os.path.join(*path_list)
    return new_path

original_path = "/a/b/c"
new_dir = "d"
position = 2  # Position after 'a'

new_path = insert_directory(original_path, new_dir, position)
print(new_path)  # Outputs: /a/d/b/c
"""
import configparser
import os
from datetime import datetime

CWD = os.getcwd()

# File system paths, for use globally
# TODO(michaelfromyeg): make song, output variable; make folder paths depend on phone number

STATIC_PATH = os.path.join(CWD, "src", "static")

FONT_BASE_PATH = os.path.join(STATIC_PATH, "fonts")

IMAGES_PATH = os.path.join(STATIC_PATH, "images")
VIDEOS_PATH = os.path.join(STATIC_PATH, "videos")

INPUT_IMAGE_PATH = os.path.join(IMAGES_PATH, "endCard_template.jpg")
OUTPUT_IMAGE_PATH = os.path.join(IMAGES_PATH, "endCard.jpg")
OUTLINE_PATH = os.path.join(IMAGES_PATH, "secondary_image_outline.png")

OUTPUT_SLIDESHOW_PATH = os.path.join(VIDEOS_PATH, "slideshow.mp4")

CONTENT_PATH = os.path.join(CWD, "content")

PRIMARY_IMAGE_PATH = os.path.join(CONTENT_PATH, "primary")
SECONDARY_IMAGE_PATH = os.path.join(CONTENT_PATH, "secondary")
COMBINED_IMAGE_PATH = os.path.join(CONTENT_PATH, "combined")
SONG_PATH = os.path.join(CONTENT_PATH, "curr_song.wav")


# Config variables
config = configparser.ConfigParser()

config.read("config.ini")

HOST = config.get("bereal", "host")
PORT = config.getint("bereal", "port")

TIMEOUT = config.getint("bereal", "timeout")


# Utility methods
def str2datetime(s: str) -> datetime:
    """
    Convert a string to a datetime object.
    """
    return datetime.strptime(s, "%Y-%m-%d")
