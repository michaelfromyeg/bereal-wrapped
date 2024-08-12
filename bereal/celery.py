"""
Celery stuff.
"""

import gc
from celery import Celery

from .bereal import memories
from .images import create_images, cleanup_images
from .videos import build_slideshow
from .utils import Mode, REDIS_HOST, REDIS_PORT, TRUE_HOST, year2dates
from .send import sms
from .logger import logger


def make_celery(app_name=__name__, broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0") -> Celery:
    """
    Create a celery instance.
    """
    celery = Celery(app_name, broker=broker, backend=broker)
    return celery


bcelery = make_celery()


@bcelery.task(time_limit=1200)
def make_video(token: str, bereal_token: str, phone: str, year: str, song_path: str, mode: Mode) -> str:
    """
    Creating a video takes about ~15 min. This is a work-in-progress!

    TODO(michaelfromyeg): handle errors more gracefully; better logging.
    """
    logger.info("Starting make_video task; first, downloading images...")

    sdate, edate = year2dates(year)
    result = memories(phone, year, token, sdate, edate)

    if not result:
        raise Exception("Could not generate memories; try again later")

    short_bereal_token = bereal_token[:10]
    video_file = f"{short_bereal_token}-{phone}-{year}.mp4"

    logger.info("Creating images for %s...", video_file)
    try:
        image_folder = create_images(phone, year)
    except Exception as e:
        logger.error("Failed to create images: %s", e)
        gc.collect()
        raise e

    logger.info("Creating video %s from %s...", video_file, image_folder)
    try:
        build_slideshow(phone, year, image_folder, song_path, video_file, mode)
    except Exception as e:
        logger.error("Failed to build slideshow: %s", e)
        gc.collect()
        raise e

    video_url = f"{TRUE_HOST}/video/{video_file}?phone={phone}&berealToken={bereal_token}"
    sms(f"+{phone}", video_url)

    logger.info("Cleaning up images")
    try:
        cleanup_images(phone, year)
    except Exception as e:
        logger.error("Failed to clean up images: %s", e)
        pass

    logger.info("Returning %s...", video_file)
    return video_file
