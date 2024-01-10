"""
Utility functions and constants.
"""
import configparser
import os
import subprocess
from datetime import datetime
from enum import StrEnum

from .logger import logger


# Environment variables
def get_secret(secret_name: str) -> str | None:
    """
    Get a Docker Swarm secret.
    """
    try:
        with open(f"/run/secrets/{secret_name}", "r") as secret_file:
            return secret_file.read().strip()
    except IOError:
        return None


SECRET_KEY = get_secret("secret_key") or "SECRET_KEY"
FLASK_ENV = get_secret("flask_env") or "production"

if SECRET_KEY == "SECRET_KEY":
    raise ValueError("SECRET_KEY environment variable not set or non-unique")

TWILIO_PHONE_NUMBER = get_secret("twilio_phone_number")
TWILIO_AUTH_TOKEN = get_secret("twilio_auth_token")
TWILIO_ACCOUNT_SID = get_secret("twilio_account_sid")

if TWILIO_PHONE_NUMBER is None or TWILIO_AUTH_TOKEN is None or TWILIO_ACCOUNT_SID is None:
    raise ValueError("TWILIO environment variables not set")

# Global constants
BASE_URL = "https://berealapi.fly.dev"

IMAGE_EXTENSIONS: list[str] = [".png", ".jpg", ".jpeg", ".webp"]

YEARS: list[str] = ["2022", "2023"]


class Mode(StrEnum):
    """
    Supported video modes.
    """

    CLASSIC = "classic"
    MODERN = "modern"


def str2mode(s: str | None) -> Mode:
    """
    Convert a string to a Mode object.
    """
    if s is None or s == "":
        return Mode.CLASSIC

    match s:
        case "classic":
            return Mode.CLASSIC
        case "modern":
            return Mode.MODERN
        case _:
            raise ValueError(f"Invalid mode: {s}")


# File system paths, for use globally
# TODO(michaelfromyeg): make song, output variable; make folder paths depend on phone number
CWD = os.getcwd()

STATIC_PATH = os.path.join(CWD, "bereal", "static")

FONT_BASE_PATH = os.path.join(STATIC_PATH, "fonts")

IMAGES_PATH = os.path.join(STATIC_PATH, "images")

SONGS_PATH = os.path.join(STATIC_PATH, "songs")

DEFAULT_SONG_PATH = os.path.join(SONGS_PATH, "seven-nation-army.wav")
DEFAULT_SHORT_SONG_PATH = os.path.join(SONGS_PATH, "midnight-city-short.wav")

ENDCARD_TEMPLATE_IMAGE_PATH = os.path.join(IMAGES_PATH, "endCard_template.jpg")
ENDCARD_IMAGE_PATH = os.path.join(IMAGES_PATH, "endCard.jpg")
OUTLINE_PATH = os.path.join(IMAGES_PATH, "secondary_image_outline.png")

CONTENT_PATH = os.path.join(CWD, "content")
EXPORTS_PATH = os.path.join(CWD, "exports")

os.makedirs(CONTENT_PATH, exist_ok=True)
os.makedirs(EXPORTS_PATH, exist_ok=True)

# Config variables
config = configparser.ConfigParser()

config.read("config.ini")

HOST: str | None = get_secret("host") or "localhost"
PORT: str | None = get_secret("port") or "5000"
PORT = int(PORT) if PORT is not None else None

TRUE_HOST = f"http://{HOST}:{PORT}" if FLASK_ENV == "development" else "https://api.bereal.michaeldemar.co"

REDIS_HOST: str | None = get_secret("redis_host") or "redis"
REDIS_PORT: str | None = get_secret("redis_port") or "6379"
REDIS_PORT = int(REDIS_PORT) if REDIS_PORT is not None else None

TIMEOUT = config.getint("bereal", "timeout", fallback=10)
IMAGE_QUALITY = config.getint("bereal", "image_quality", fallback=50)


# Utility methods
def get_git_commit_hash() -> str:
    try:
        git_path = os.path.join(CWD, ".git")
        if not os.path.isdir(git_path):
            logger.warning("Unable to get git commit hash, expected %s to be available", git_path)
            return "unknown"

        commit_hash = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"]).strip()
        return commit_hash.decode("utf-8")
    except subprocess.CalledProcessError as e:
        logger.warning("Unable to get git commit hash, got CalledProcessError: %s", e)
        return "unknown"
    except Exception as e:
        logger.warning("Unable to get git commit hash, got Exception: %s", e)
        return "unknown"


GIT_COMMIT_HASH = get_git_commit_hash()


def year2dates(year_str: str) -> tuple[datetime, datetime]:
    """
    Convert a year string to two dates.
    """
    year = int(year_str)

    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31)

    return start_date, end_date


def str2datetime(s: str) -> datetime:
    """
    Convert a string to a datetime object.
    """
    return datetime.strptime(s, "%Y-%m-%d")
