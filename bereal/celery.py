"""
Celery stuff.
"""
import os
from celery import Celery

from .bereal import memories
from .images import create_images, cleanup_images
from .videos import build_slideshow
from .utils import Mode, REDIS_HOST, REDIS_PORT, year2dates, CONTENT_PATH, EXPORTS_PATH
from .logger import logger


def make_celery(app_name=__name__, broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0") -> Celery:
    """
    Create a celery instance.
    """
    celery = Celery(app_name, broker=broker, backend=broker)
    return celery


bcelery = make_celery()


@bcelery.task(time_limit=1200)
def make_video(token: str, phone: str, year: str, song_path: str, mode: Mode) -> str:
    """
    Creating a video takes about ~15 min. This is a work-in-progress!
    """
    logger.info("%s", CONTENT_PATH)
    logger.info("%s", EXPORTS_PATH)

    logger.info("%s", os.getcwd())

    logger.info("Starting make_video task; first, downloading images...")

    sdate, edate = year2dates(year)
    result = memories(phone, year, token, sdate, edate)

    if not result:
        raise Exception("Could not generate memories; try again later")

    short_token = token[:10]
    video_file = f"{short_token}-{phone}-{year}.mp4"

    # TODO(michaelfromyeg): implement better error handling, everywhere
    logger.info("Creating images for %s...", video_file)
    image_folder = create_images(phone, year)

    logger.info("Creating video %s from %s...", video_file, image_folder)
    build_slideshow(phone, year, image_folder, song_path, video_file, mode)

    logger.info("Cleaning up images")
    cleanup_images(phone, year)

    logger.info("Returning %s...", video_file)
    return video_file
