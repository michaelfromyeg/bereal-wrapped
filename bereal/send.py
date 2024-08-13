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

        message_body = f"Here is the link to your BeReal Wrapped!\n\n{link}"
        if FLASK_ENV == "development":
            logger.debug("Skipping SMS in development mode; would send %s", message_body)
        else:
            message = client.messages.create(body=message_body, from_=TWILIO_PHONE_NUMBER, to=phone)
            logger.info("Sent message %s to %s", message.sid, phone)
    except Exception as e:
        logger.error("Failed to send SMS: %s", e)
        pass
