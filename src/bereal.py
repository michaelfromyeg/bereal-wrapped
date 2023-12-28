"""
Methods to interface with the unofficial BeReal API.
"""
import os
from datetime import datetime
from typing import Any

import requests as r

from .logger import logger
from .utils import PRIMARY_IMAGE_PATH, SECONDARY_IMAGE_PATH, str2datetime

BASE_URL = "https://berealapi.fly.dev"


def send_code(phone: str) -> str:
    """
    Send a code to the given phone number.

    Phone number can be the ten-digit number, or '+1' and then the number.

    e.g., 1234567890 or +11234567890

    TODO(michaelfromyeg): accept other country codes.
    """
    if not phone.startswith("+1"):
        phone = f"+1{phone}"

    if len(phone) != 12:
        raise ValueError("Phone number must be 11 digits long.")

    logger.info("Entered phone number is %s", phone)
    payload = {"phone": phone}

    logger.info("Sending OTP session request...")
    response = r.post(f"{BASE_URL}/login/send-code", json=payload, timeout=10)

    otp_session = "n/a"

    match response.status_code:
        case 201:
            logger.info("Request successful!")

            response_json = response.json()
            if "data" in response_json and "otpSession" in response_json["data"]:
                otp_session = response_json["data"]["otpSession"]
                logger.debug("OTP Session: %s", otp_session)
            else:
                logger.warning("No 'otpSession' found in the response!")
        case _:
            logger.warning("Request failed with status code: %s", response.status_code)

    return otp_session


def verify_code(otp_session: Any, otp_code: str) -> str:
    """
    Verify the user's code.
    """
    payload_verify = {"code": otp_code, "otpSession": otp_session}

    response = r.post(f"{BASE_URL}/login/verify", json=payload_verify, timeout=10)
    token_obj = "n/a"

    match response.status_code:
        case 201:
            response_json = response.json()
            if "data" in response_json and "token" in response_json["data"]:
                token_obj = response_json["data"]["token"]
                logger.debug("Token: %s", token_obj)
            else:
                logger.warning("No 'tokenObj' found in the response!")
        case _:
            logger.warning("Request failed with status code: %s", response.status_code)
            raise ValueError("Request failed; your OTP code may be invalid!")

    return token_obj


def get_memories(token_obj: str, start_date_range: str, end_date_range: str) -> str:
    """
    Fetch user memories. Skip to this stage if we already acquired reusable token.
    """
    headers = {"token": token_obj}

    os.makedirs(PRIMARY_IMAGE_PATH, exist_ok=True)
    os.makedirs(SECONDARY_IMAGE_PATH, exist_ok=True)

    response = r.get(f"{BASE_URL}/friends/mem-feed", headers=headers, timeout=10)
    data_array = []

    if response.status_code == 200:
        response_data = response.json().get("data", {})
        data_array = response_data.get("data", [])
    else:
        logger.warning("Request failed with status code %s", response.status_code)
        raise ValueError("Request failed; your token may be invalid!")

    start_date_str = str(start_date_range)
    end_date_str = str(end_date_range)

    start_date_object = str2datetime(start_date_str)
    end_date_object = str2datetime(end_date_str)

    # iterate through the response and download images
    for item in data_array:
        primary_image_url = item["primary"].get("url", "")
        secondary_image_url = item["secondary"].get("url", "")

        date = item["memoryDay"]
        date_object = datetime.strptime(date, "%Y-%m-%d")

        if primary_image_url and start_date_object <= date_object <= end_date_object:
            # Extracting the image name from the URL
            image_name = date + "_" + primary_image_url.split("/")[-1]

            image_path = os.path.join(PRIMARY_IMAGE_PATH, image_name)
            with open(image_path, "wb") as img_file:
                img_response = r.get(primary_image_url, timeout=10)

                if img_response.status_code == 200:
                    img_file.write(img_response.content)
                    logger.info("Downloaded %s", image_path)
                else:
                    logger.warning("Failed to download %s", image_name)

        if secondary_image_url and start_date_object <= date_object <= end_date_object:
            # Extracting the image name from the URL
            image_name = date + "_" + secondary_image_url.split("/")[-1]

            image_path = os.path.join(SECONDARY_IMAGE_PATH, image_name)
            with open(image_path, "wb") as img_file:
                img_response = r.get(secondary_image_url, timeout=10)

                if img_response.status_code == 200:
                    img_file.write(img_response.content)
                    logger.info("Downloaded %s", image_path)
                else:
                    logger.warning("Failed to download %s", image_name)

    return "complete"
