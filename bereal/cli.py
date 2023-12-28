"""
A command-line interface for the BeReal generator.
"""
import argparse
import os
import shutil
from typing import Any

from .bereal import memories, send_code, verify_code
from .images import create_images
from .logger import logger
from .utils import SONG_PATH, YEARS, Mode, str2mode, year2dates
from .videos import build_slideshow

STEPS = 5


def validate() -> tuple[str, str] | None:
    """
    Authenticate the user.
    """
    print("Your phone number is required for BeReal authentication; enter it as a 10-digit string.")

    while True:
        phone = input("Enter your phone number: ")
        if len(phone) == 10:
            break

        print("Invalid phone number!")

    otp_session = send_code("+1" + phone)

    if otp_session is None:
        print("Invalid phone number. Please try again.")
        return None

    print("A verification code has been sent to your phone number. Please enter it below.")

    while True:
        user_code = input("Enter your verification code: ")
        token = verify_code(otp_session, user_code)
        if token is not None:
            break

        print("Invalid verification code! Please try again.")

    return phone, token


def options() -> tuple[str, str, Mode]:
    """
    Get the required options.
    """
    print(f"Choose a year for your video. ({YEARS})")

    while True:
        year = input("Enter a year: ")
        if year in YEARS:
            break

        print("Invalid year! Please try again.")

    print("Choose a .wav song for your video. Enter the absolute path.")

    while True:
        song = input("Enter a song: ")
        if os.path.exists(song) and song.endswith(".wav"):
            break

        print("Invalid song! Please try again.")

    try:
        shutil.copy2(song, SONG_PATH)
    except Exception as error:
        logger.warning("Could not copy music file, received: %s", error)

    print("Choose a mode for your video. (classic, modern)")

    while True:
        mode_str = input("Enter a mode: ")
        if mode_str in ["classic", "modern"]:
            break

        print("Invalid mode! Please try again.")

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
            year, song, mode = options()
            sdate, edate = year2dates(year)

            retval["sdate"] = sdate
            retval["edate"] = edate
            retval["song"] = song
            retval["mode"] = mode
        case 2:
            if retval["token"] is None or retval["sdate"] is None or retval["edate"] is None:
                print("Invalid parameters; exiting...")
                return None

            result = memories(retval["token"], retval["sdate"], retval["edate"])
            if not result:
                print("Failed to download memories; exiting...")
                return None
        case 3:
            create_images()
        case 4:
            if retval["mode"] is None:
                print("Invalid parameters; exiting...")
                return None

            build_slideshow(retval["mode"])
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

    args = parser.parse_args()

    cli(args)
