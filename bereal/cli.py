"""
A command-line interface for the BeReal generator.
"""

import argparse
import os
import shutil
from time import sleep
from typing import Any, Callable

from .bereal import memories, send_code, verify_code
from .images import create_images, cleanup_images
from .logger import logger
from .utils import CONTENT_PATH, YEARS, Mode, str2mode, year2dates
from .videos import build_slideshow

STEPS = 5


def ask(question: str, validate: Callable[[str], bool], error: str, retries: int = 10) -> str:
    """
    Ask a question and validate the input. Return the response.
    """
    retry = 0
    while retry < retries:
        answer = input(question)
        if validate(answer):
            break

        print(error)
        retry += 1

    return answer


def retry_api(
    info: str,
    api: Callable[..., Any],
    args: dict[str, Any],
    error: str,
    n_sleep: int = 10,
    retries: int = 3,
) -> Any | None:
    """
    An API retrier-helper.
    """
    retry = 0
    retval = None

    while retry < retries:
        print(info)
        retval = api(**args)

        if retval is not None:
            break

        print(error)
        retry += 1

        print(f"Retrying in {n_sleep} seconds...")
        sleep(n_sleep)

    return retval  # may still be none!


def validate() -> tuple[str, str] | None:
    """
    Authenticate the user.
    """
    print("Your phone number is required for BeReal authentication.")

    country_code = ask(
        "First, enter your country code (e.g., X or XX): ", lambda x: len(x) in [1, 2], "Invalid country code!"
    )
    phone = ask("Enter your phone number (e.g., XXXXXXXXXX): ", lambda x: len(x) == 10, "Invalid phone number!")

    otp_session = retry_api(
        "Sending a verification code to your phone number...",
        send_code,
        {"phone": "+" + country_code + phone},
        "Hmm... there was an issue sending the code.",
    )
    if otp_session is None:
        print("Failed to send verification code; exiting...")
        return None

    print("A verification code has been sent to your phone number. Please enter it below.")

    user_code = ask("Enter your verification code: ", lambda x: len(x) == 6, "Invalid verification code!")

    token = retry_api(
        "Verifying your authentication token...",
        verify_code,
        {"otp_session": otp_session, "otp_code": user_code},
        "Hmm... there was an issue verifying the code.",
    )
    if token is None:
        print("Failed to verify verification code; exiting...")
        return None

    return f"{country_code}{phone}", token


def options(phone: str) -> tuple[str, str, Mode]:
    """
    Get the required options.
    """
    print(f"Choose a year for your video. ({YEARS})")
    year = ask("Enter a year: ", lambda x: x in YEARS, "Invalid year!")

    print(
        "Choose a .wav song for your video. Enter the absolute path. If you're using the CLI make sure the path exists in the container (i.e., /app/songs/...)."
    )
    song = ask("Enter a song: ", lambda x: os.path.exists(x) and x.endswith(".wav"), "Invalid song!")

    song_folder = os.path.join(CONTENT_PATH, phone, year)
    os.makedirs(song_folder, exist_ok=True)
    song_path = os.path.join(song_folder, "song.wav")

    try:
        shutil.copy2(song, song_path)
    except Exception as error:
        logger.warning("Could not copy music file, received: %s", error)
        logger.info("Continuing with default music file...")

    print("Choose a mode for your video. (classic, modern)")
    mode_str = ask("Enter a mode: ", lambda x: x in ["classic", "modern"], "Invalid mode!")
    mode = str2mode(mode_str)

    return year, song, mode


def step(idx: int, retval: dict[str, Any] | None) -> dict[str, Any] | None:
    """
    Run a step of the CLI.
    """
    if not retval:
        return None

    logger.info("Executing step %d", idx)
    match idx:
        case 0:  # authentication
            user = validate()
            if user is None:
                print("Failed to authenticate; exiting...")
                return None

            print("Authentication successful!")

            phone, token = user
            retval["phone"] = phone
            retval["token"] = token
        case 1:  # options
            year, song, mode = options(retval["phone"])
            sdate, edate = year2dates(year)

            song_folder = os.path.join(CONTENT_PATH, retval["phone"], year)
            os.makedirs(song_folder, exist_ok=True)
            song_path = os.path.join(song_folder, "song.wav")

            retval["year"] = year
            retval["sdate"] = sdate
            retval["edate"] = edate
            retval["song"] = song
            retval["song_path"] = song_path
            retval["mode"] = mode
        case 2:
            if retval["token"] is None or retval["sdate"] is None or retval["edate"] is None:
                print("Invalid parameters; exiting...")
                return None

            result = memories(retval["phone"], retval["year"], retval["token"], retval["sdate"], retval["edate"])
            if not result:
                print("Failed to download memories; exiting...")
                return None
        case 3:
            image_folder = create_images(retval["phone"], retval["year"])

            retval["image_folder"] = image_folder
        case 4:
            if retval["mode"] is None:
                print("Invalid parameters; exiting...")
                return None

            short_token = retval["token"][:10]
            video_file = f"{short_token}-{retval['phone']}-{retval['year']}.mp4"

            build_slideshow(
                phone=retval["phone"],
                year=retval["year"],
                image_folder=retval["image_folder"],
                song_path=retval["song_path"],
                filename=video_file,
                mode=retval["mode"],
            )

            # TODO(michaelfromyeg): delete images in production
            cleanup_images(retval["phone"], retval["year"])
        case _:
            raise ValueError(f"Invalid step: {idx}")

    return retval


def cli(args: argparse.Namespace) -> None:
    """
    The main CLI function.
    """
    print("Welcome to the BeReal CLI!")

    idx = args.step

    retval: dict[str, Any] | None = {
        "phone": args.phone,
        "token": args.token,
        "sdate": None,
        "edate": None,
        "song": args.song,
        "mode": str2mode(args.mode),
        "year": args.year,
        "image_folder": args.image_folder,
        "song_path": args.song_path,
    }

    if retval and args.year:
        sdate, edate = year2dates(args.year)
        retval["sdate"], retval["edate"] = sdate, edate

    while idx < STEPS:
        retval = step(idx, retval)

        if retval is None:
            break

        idx += 1

    return None


if __name__ == "__main__":
    # Setup argparse; take step as a command line argument
    parser = argparse.ArgumentParser(description="BeReal CLI")
    parser.add_argument("--step", type=int, default=0, help="The step to run (indexed from 0)")

    # Add arguments for token, year, song, mode
    parser.add_argument("--phone", type=str, default=None, help="The phone number")
    parser.add_argument("--token", type=str, default=None, help="The authentication token")
    parser.add_argument("--year", type=str, default=None, help="The year to use")
    parser.add_argument("--song", type=str, default=None, help="The song to use")
    parser.add_argument("--mode", type=str, default=None, help="The mode to use")
    parser.add_argument("--image_folder", type=str, default=None, help="The image folder to use")
    parser.add_argument("--song_path", type=str, default=None, help="The song path to use")

    args = parser.parse_args()

    cli(args)
