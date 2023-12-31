"""
This is the entrypoint for the BeReal server.

It contains the Flask app routing and the functions to interact with the BeReal API.
"""
from gevent import monkey

monkey.patch_all()

import os
import warnings
from datetime import datetime, timedelta
from typing import Any

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_apscheduler import APScheduler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import URLSafeTimedSerializer

from .bereal import send_code, verify_code
from .celery import bcelery, make_video
from .logger import logger
from .utils import (
    CONTENT_PATH,
    DEFAULT_SONG_PATH,
    EXPORTS_PATH,
    FLASK_ENV,
    GIT_COMMIT_HASH,
    HOST,
    PORT,
    REDIS_HOST,
    REDIS_PORT,
    SECRET_KEY,
    str2mode,
)

warnings.filterwarnings("ignore", category=UserWarning, module="tzlocal")

app = Flask(__name__)
serializer = URLSafeTimedSerializer(SECRET_KEY)

logger.info("Running in %s mode", FLASK_ENV)

logger.info("CONTENT_PATH: %s", CONTENT_PATH)
logger.info("EXPORTS_PATH: %s", EXPORTS_PATH)

if FLASK_ENV == "development":
    logger.info("Enabling CORS for development")
    CORS(app)
else:
    logger.info("Enabling CORS for production")
    CORS(app, resources={r"/*": {"origins": "https://bereal.michaeldemar.co"}}, supports_credentials=True)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f'sqlite:///{os.path.join(basedir, "tokens.db")}'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

app.config["CELERY_BROKER_URL"] = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
bcelery.conf.update(app.config)


class PhoneToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(50), unique=True, nullable=False)
    token = db.Column(db.String(6), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Phone {self.phoe}>"


# Create the table
with app.app_context():
    try:
        db.create_all()
    except Exception as error:
        logger.error("Could not create database: %s", error)


@app.route("/status")
def status() -> Response:
    """
    Return the status of the server.
    """
    return jsonify({"status": "ok", "version": GIT_COMMIT_HASH})


@app.route("/request-otp", methods=["POST"])
def request_otp() -> tuple[Response, int]:
    """
    Request an OTP code for a user.
    """
    data: dict[str, Any] = request.get_json()
    phone = data["phone"]

    otp_session = send_code(f"+{phone}")

    if otp_session is None:
        return jsonify(
            {
                "error": "Bad Request",
                "message": "Invalid phone number; BeReal is likely rate-limiting the service. Make sure not to include anything besides the digits (i.e., not '+' or '-' or spaces).",
            }
        ), 400

    return jsonify({"otpSession": otp_session}), 200


@app.route("/validate-otp", methods=["POST"])
def validate_otp() -> tuple[Response, int]:
    """
    Validate the user's input and render the process page.
    """
    data: dict[str, Any] = request.get_json()
    phone = data["phone"]
    otp_session = data["otp_session"]

    otp_code = data["otp_code"]

    token = verify_code(otp_session, otp_code)

    if token is None:
        return jsonify({"error": "Bad Request", "message": "Invalid verification code"}), 400

    insert_token(phone, token)

    return jsonify({"token": token}), 200


@app.route("/video", methods=["POST"])
def create_video() -> tuple[Response, int]:
    """
    Process a user's input and render the preview page.
    """
    phone = request.form["phone"]
    token = request.form["token"]

    if token != get_token(phone):
        return jsonify({"error": "Bad Request", "message": "Invalid token"}), 400

    year = request.form["year"]

    wav_file = request.files.get("file", None)

    mode_str = request.form.get("mode")
    mode = str2mode(mode_str)

    song_folder = os.path.join(CONTENT_PATH, phone, year)
    os.makedirs(song_folder, exist_ok=True)
    song_path = os.path.join(song_folder, "song.wav")

    if wav_file:
        logger.debug("Downloading music file %s...", wav_file.filename)
        try:
            wav_file.save(song_path)
        except Exception as error:
            logger.warning("Could not save music file, received: %s", error)
    else:
        song_path = DEFAULT_SONG_PATH

    logger.debug("Queueing video task...")
    task = make_video.delay(token, phone, year, song_path, mode)

    return jsonify({"taskId": task.id}), 202


@app.route("/status/<task_id>", methods=["GET"])
def task_status(task_id) -> tuple[Response, int]:
    task = make_video.AsyncResult(task_id)

    try:
        if task.state == "PENDING":
            response = {"status": "PENDING"}
            return jsonify(response), 202

        if task.state == "FAILURE":
            logger.error("Task %s failed: %s", task_id, task.info)

            response = {
                "status": "FAILURE",
                "message": "An error occurred processing your task. Try again later.",
                "error": str(task.info),
            }
            return jsonify(response), 500

        response = {"status": task.status, "result": task.result if task.state == "SUCCESS" else None}
        return jsonify(response), 200
    except Exception as e:
        # Handle cases where task is not registered or result is not JSON serializable
        response = {"status": "ERROR", "message": "An unexpected error occurred in creating the video", "error": str(e)}
        return jsonify(response), 500


@app.route("/video/<filename>", methods=["GET"])
def get_video(filename: str) -> tuple[Response, int]:
    """
    Serve a video file.
    """
    logger.debug("Serving video file %s/%s...", EXPORTS_PATH, filename)
    return send_from_directory(EXPORTS_PATH, filename, mimetype="video/mp4"), 200


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.static_folder, "favicon.ico", mimetype="image/vnd.microsoft.icon")


@app.errorhandler(400)
def bad_request(error) -> tuple[Response, int]:
    logger.error("Got 400 error: %s", error)

    return jsonify(
        {"error": "Bad Request", "message": "The server could not understand the request due to invalid syntax."}
    ), 400


@app.errorhandler(404)
def not_found(error) -> tuple[Response, int]:
    logger.warning("Got 404 for URL %s: %s", request.url, error)

    return jsonify({"error": "Not Found", "message": "This resource does not exist"}), 404


@app.errorhandler(500)
def internal_error(error) -> tuple[Response, int]:
    logger.error("Got 500 error: %s", error)

    return jsonify({"error": "Internal Server Error", "message": "An internal server error occurred"}), 500


def insert_token(phone: str, token: str) -> None:
    """
    Insert a new token into the database.
    """
    PhoneToken.query.filter_by(phone=phone).delete()

    new_token = PhoneToken(phone=phone, token=token)
    db.session.add(new_token)
    db.session.commit()

    return None


def get_token(phone: str) -> str | None:
    """
    Get a token from the database.
    """
    entry = PhoneToken.query.filter_by(phone=phone).first()

    if entry and (datetime.utcnow() - entry.timestamp) < timedelta(hours=24):
        return entry.token

    return None


def delete_expired_tokens() -> None:
    """
    Delete all expired tokens from the database.
    """
    expiration_time = datetime.utcnow() - timedelta(hours=24)
    PhoneToken.query.filter(PhoneToken.timestamp < expiration_time).delete()
    db.session.commit()

    return None


@scheduler.task("interval", id="delete_expired", hours=1, misfire_grace_time=900)
def scheduled_task():
    with app.app_context():
        delete_expired_tokens()


if __name__ == "__main__":
    logger.info("Starting BeReal server on %s:%d...", HOST, PORT)

    app.run(host=HOST, port=PORT, debug=FLASK_ENV == "development")
