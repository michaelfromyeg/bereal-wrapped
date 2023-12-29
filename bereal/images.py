"""
Combine two images together, with the secondary image in the top-left corner of the primary image.
"""
import multiprocessing
import os
from multiprocessing import Pool

from PIL import Image, ImageChops, ImageDraw, ImageFont

from .logger import logger
from .utils import COMBINED_IMAGE_PATH, FONT_BASE_PATH, OUTLINE_PATH, PRIMARY_IMAGE_PATH, SECONDARY_IMAGE_PATH


def process_image(
    primary_filename: str,
    primary_folder: str,
    secondary_folder: str,
    output_folder: str,
) -> None:
    """
    Combine the primary image with the secondary image, and save the result in the output folder.
    """
    font_size = 50
    offset = 50
    text_opacity = 150

    # Extract prefix from primary filename
    primary_prefix = primary_filename.split("_")[0]

    # Check if there's a corresponding file in the secondary folder with the same prefix
    secondary_files = [file for file in os.listdir(secondary_folder) if file.startswith(primary_prefix)]

    if not secondary_files:
        return None

    # Use the first matching file in the secondary folder
    secondary_filename = secondary_files[0]

    primary_path = os.path.join(primary_folder, primary_filename)
    secondary_path = os.path.join(secondary_folder, secondary_filename)

    # Load primary and secondary images
    primary_image = Image.open(primary_path)
    secondary_image = Image.open(secondary_path)
    source = Image.open(os.path.join(os.getcwd(), OUTLINE_PATH))

    primary_image = primary_image.convert("RGBA")
    secondary_image = secondary_image.convert("RGBA")
    source = source.convert("RGBA")

    # Create border around secondary image
    secondary_image = ImageChops.multiply(source, secondary_image)

    # Resize secondary image to fraction the size of the primary image
    width, height = primary_image.size
    new_size = (width // 3, height // 3)
    secondary_image = secondary_image.resize(new_size)

    # Overlay secondary image on top-left corner of primary image
    primary_image.paste(secondary_image, (10, 10), secondary_image)

    width, height = primary_image.size
    draw = ImageDraw.Draw(primary_image)

    # font file is assumed to exist under static/
    font_path = os.path.join(FONT_BASE_PATH, "Inter-Bold.ttf")
    font = ImageFont.truetype(font_path, font_size)

    text_bbox = draw.textbbox((0, 0), primary_prefix, font=font)

    # Calculate the position to center the text
    x = (width - text_bbox[2]) // 2
    y = (height - text_bbox[3]) - offset

    # Calculate the size of the rectangle to fill the text_bbox
    rect_width = text_bbox[2] + 20  # Add some padding
    rect_height = text_bbox[3] + 20  # Add some padding

    # Draw a semi-transparent filled rectangle as the background
    draw.rectangle(
        ((x - 30, y - 15), (x + rect_width + 10, y + rect_height + 10)),
        fill=(0, 0, 0, text_opacity),
    )

    # Draw the text on the image
    draw.text((x, y), primary_prefix, font=font, fill="white")
    # Save the modified image

    # Save the result in the output folder
    output_path = os.path.join(output_folder, f"combined_{primary_filename}")
    primary_image.save(output_path)

    logger.debug("Combined image saved at %s", output_path)


def create_images(
    primary_folder: str = PRIMARY_IMAGE_PATH,
    secondary_folder: str = SECONDARY_IMAGE_PATH,
    output_folder: str = COMBINED_IMAGE_PATH,
) -> None:
    """
    Put secondary images on top of primary images.
    """
    os.makedirs(output_folder, exist_ok=True)

    # Get a list of primary filenames
    primary_filenames = os.listdir(primary_folder)

    # Use multiprocessing to process images in parallel
    processes = max(1, multiprocessing.cpu_count() - 2)
    with Pool(processes=processes) as pool:
        pool.starmap(
            process_image,
            [
                (primary_filename, primary_folder, secondary_folder, output_folder)
                for primary_filename in primary_filenames
            ],
        )
