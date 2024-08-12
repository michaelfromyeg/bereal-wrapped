"""
Send messages to the user.

For now, only phone. Eventually, consider e-mail.
"""

from .utils import FLASK_ENV, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
from .logger import logger

from twilio.rest import Client


def sms(phone: str, link: str) -> None:
    """
    Send a link to the user's phone number.
    """
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        if FLASK_ENV == "development":
            logger.info("Skipping SMS in development mode")
            return

        message_body = f"Here is the link to your BeReal Wrapped!\n\n{link}"
        message = client.messages.create(body=message_body, from_=TWILIO_PHONE_NUMBER, to=phone)

        logger.info("Sent message to %s: %s", phone, message.sid)
    except Exception as e:
        logger.error("Failed to send SMS: %s", e)
        pass
