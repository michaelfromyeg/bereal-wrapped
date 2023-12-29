"""
Methods to interface with the unofficial BeReal API.
"""
import os
from datetime import datetime
from typing import Any

import requests as r

from .logger import logger
from .utils import BASE_URL, CONTENT_PATH, TIMEOUT, str2datetime


def send_code(phone: str) -> Any | None:
    """
    Send a code to the given phone number.
    """
    if not phone.startswith("+"):
        raise ValueError("Missing country code!")

    # TODO(michaelfromyeg): add regex step to validate phone number!

    logger.info("Entered phone number is %s", phone)
    payload = {"phone": phone}

    logger.info("Sending OTP session request...")
    response = r.post(f"{BASE_URL}/login/send-code", json=payload, timeout=TIMEOUT)

    match response.status_code:
        case 201:
            logger.info("Request successful!")

            response_json = response.json()
            if "data" in response_json and "otpSession" in response_json["data"]:
                return response_json["data"]["otpSession"]
            else:
                logger.warning("No 'otpSession' found in the response!")
                return None
        case _:
            logger.warning("Request failed with status code: %s", response.status_code)
            return None


def verify_code(otp_session: Any, otp_code: str) -> str | None:
    """
    Verify the user's code.
    """
    payload_verify = {"code": otp_code, "otpSession": otp_session}

    response = r.post(f"{BASE_URL}/login/verify", json=payload_verify, timeout=TIMEOUT)

    match response.status_code:
        case 201:
            response_json = response.json()
            if "data" in response_json and "token" in response_json["data"]:
                return str(response_json["data"]["token"])
            else:
                logger.warning("No 'token' found in the response!")
                return None
        case _:
            logger.warning("Request failed with status code: %s", response.status_code)
            return None


def memories(phone: str, year: str, token: str, sdate: datetime, edate: datetime) -> bool:
    """
    Fetch user 'memories' (i.e., the images).

    Skip to this stage if we already acquired reusable token.
    """
    headers = {"token": token}

    primary_path = os.path.join(CONTENT_PATH, phone, year, "primary")
    secondary_path = os.path.join(CONTENT_PATH, phone, year, "secondary")

    if os.path.isdir(primary_path) and os.path.isdir(secondary_path):
        logger.info("Skipping 'memories' stage; already downloaded!")
        return True

    os.makedirs(primary_path, exist_ok=True)
    os.makedirs(secondary_path, exist_ok=True)

    response = r.get(f"{BASE_URL}/friends/mem-feed", headers=headers, timeout=TIMEOUT)
    data_array: list[Any] = []

    if response.status_code == 200:
        response_data = response.json().get("data", {})
        data_array = response_data.get("data", [])
    else:
        logger.warning("Request failed with status code %s", response.status_code)
        return False

    def download_image(date_str: str, url: str, base_path: str) -> None:
        """
        Download an image to the base path folder.
        """
        date = str2datetime(date_str)

        if not url:
            logger.warning("Missing URL")
            return None

        if date < sdate or date > edate:
            logger.debug("Invalid date: %s", date_str)
            return None

        # Extracting the image name from the URL
        image_name = date_str + "_" + url.split("/")[-1]

        with open(os.path.join(base_path, image_name), "wb") as img_file:
            img_response = r.get(url, timeout=10)

            if img_response.status_code == 200:
                img_file.write(img_response.content)
                logger.info("Downloaded %s", image_name)
            else:
                logger.warning(
                    "Failed to download %s with code %d; will continue", image_name, img_response.status_code
                )

    # iterate through the response and download images
    for item in data_array:
        logger.debug("Processing %s", item)

        date_str = item.get("memoryDay", "")

        primary_image_url = item["primary"].get("url", "")
        download_image(date_str, primary_image_url, primary_path)

        secondary_image_url = item["secondary"].get("url", "")
        download_image(date_str, secondary_image_url, secondary_path)

    return True
