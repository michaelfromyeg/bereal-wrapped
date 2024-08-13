"""
Combine two images together, with the secondary image in the top-left corner of the primary image.
"""

import os
import shutil

from PIL import Image, ImageChops, ImageDraw, ImageFont

from .logger import logger
from .utils import CONTENT_PATH, FONT_BASE_PATH, OUTLINE_PATH, IMAGE_QUALITY


def process_image(
    primary_filename: str,
    primary_folder: str,
    secondary_folder: str,
    output_folder: str,
    display_date: bool = False,
) -> None:
    """
    Combine the primary image with the secondary image, and save the result in the output folder.
    """
    font_size = 50
    offset = 50
    text_opacity = 150

    primary_prefix = primary_filename.split("_")[0]
    secondary_files = [file for file in os.listdir(secondary_folder) if file.startswith(primary_prefix)]

    if not secondary_files:
        return None

    secondary_filename = secondary_files[0]

    primary_path = os.path.join(primary_folder, primary_filename)
    secondary_path = os.path.join(secondary_folder, secondary_filename)

    primary_image = Image.open(primary_path)
    secondary_image = Image.open(secondary_path)
    outline_image = Image.open(OUTLINE_PATH)

    # TODO(michaelfromyeg): hack to fix alpha bug; remove after properly addressed
    primary_image = primary_image.convert("RGBA")
    secondary_image = secondary_image.convert("RGBA")
    outline_image = outline_image.convert("RGBA")

    secondary_image = ImageChops.multiply(outline_image, secondary_image)

    width, height = primary_image.size
    new_size = (width // 3, height // 3)
    secondary_image = secondary_image.resize(new_size)

    primary_image.paste(secondary_image, (10, 10), secondary_image)

    width, height = primary_image.size
    draw = ImageDraw.Draw(primary_image)

    if display_date:
        font_path = os.path.join(FONT_BASE_PATH, "Inter-Bold.ttf")
        font = ImageFont.truetype(font_path, font_size)

        text_bbox = draw.textbbox((0, 0), primary_prefix, font=font)

        x = (width - text_bbox[2]) // 2
        y = (height - text_bbox[3]) - offset

        rect_width = text_bbox[2] + 20
        rect_height = text_bbox[3] + 20

        draw.text((x, y), primary_prefix, font=font, fill="white")
        draw.rectangle(
            ((x - 30, y - 15), (x + rect_width + 10, y + rect_height + 10)),
            fill=(0, 0, 0, text_opacity),
        )

    output_path = os.path.join(output_folder, f"combined_{primary_filename}")

    # TODO(michaelfromyeg): this is a hack; I had some issues with the alpha channel showing up occasionally
    primary_image = primary_image.convert("RGB")
    primary_image.save(output_path, quality=IMAGE_QUALITY)

    logger.debug("Combined image saved at %s", output_path)

    return None


def create_images(
    phone: str,
    year: str,
    display_date: bool,
) -> str:
    """
    Put secondary images on top of primary images.
    """
    primary_folder = os.path.join(CONTENT_PATH, phone, year, "primary")
    secondary_folder = os.path.join(CONTENT_PATH, phone, year, "secondary")
    output_folder = os.path.join(CONTENT_PATH, phone, year, "combined")

    os.makedirs(primary_folder, exist_ok=True)
    os.makedirs(secondary_folder, exist_ok=True)

    if os.path.isdir(output_folder):
        logger.info("Skipping 'create_images' stage; already created!")
        return output_folder

    os.makedirs(output_folder, exist_ok=True)

    # Get a list of primary filenames
    primary_filenames = os.listdir(primary_folder)

    # NOTE(michaelfromyeg): because we're using celery, the below code is unusable
    # specifically, "AssertionError: daemonic processes are not allowed to have children"

    for primary_filename in primary_filenames:
        process_image(primary_filename, primary_folder, secondary_folder, output_folder, display_date)

    # Use multiprocessing to process images in parallel
    # processes = max(1, multiprocessing.cpu_count() - 2)
    # with Pool(processes=processes) as pool:
    #     pool.starmap(
    #         process_image,
    #         [
    #             (primary_filename, primary_folder, secondary_folder, output_folder)
    #             for primary_filename in primary_filenames
    #         ],
    #     )

    return output_folder


def cleanup_images(phone: str, year: str) -> None:
    """
    Delete all the images in the primary and secondary folders.
    """
    path = os.path.join(CONTENT_PATH, phone, year)

    try:
        shutil.rmtree(path)
        logger.info("Successfully removed %s", path)
    except FileNotFoundError:
        logger.info("The directory %s does not exist", path)
    except PermissionError:
        logger.error("Permission denied while attempting to remove %s", path)
    except Exception as e:
        logger.error("An error occurred: %s", e)

    return None
