"""
This is the entrypoint for the BeReal server.

It contains the Flask app routing and the functions to interact with the BeReal API.
"""
import os
from datetime import datetime, timedelta
from typing import Any

from flask import Flask, Response, abort, jsonify, request, send_from_directory
from flask_apscheduler import APScheduler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import SignatureExpired, URLSafeTimedSerializer

from .bereal import memories, send_code, verify_code
from .images import cleanup_images, create_images
from .logger import logger
from .utils import (
    CONTENT_PATH,
    DEFAULT_SONG_PATH,
    EXPORTS_PATH,
    FLASK_ENV,
    GIT_COMMIT_HASH,
    HOST,
    PORT,
    SECRET_KEY,
    str2mode,
    year2dates,
)
from .videos import build_slideshow

app = Flask(__name__)
serializer = URLSafeTimedSerializer(SECRET_KEY)

if FLASK_ENV == "development":
    CORS(app)
else:
    CORS(app, resources={r"/*": {"origins": "https://michaeldemar.co"}})

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tokens.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()


class PhoneToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(50), unique=True, nullable=False)
    token = db.Column(db.String(6), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Phone {self.phoe}>"


# Create the table
with app.app_context():
    db.create_all()


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
        return jsonify({"error": "Invalid phone number"}), 400

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
        return jsonify({"error": "Invalid verification code"}), 400

    insert_token(phone, token)

    return jsonify({"token": token}), 200


@app.route("/video", methods=["POST"])
def create_video() -> tuple[Response, int]:
    """
    Process a user's input and render the preview page.
    """
    phone = request.form["phone"]
    token = request.form["token"]
    short_token = token[:10]

    if token != get_token(phone):
        return jsonify({"error": "Invalid token"}), 400

    year = request.form["year"]
    sdate, edate = year2dates(year)

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

    logger.debug("Downloading images locally...")
    result = memories(phone, year, token, sdate, edate)

    if not result:
        return jsonify({"error": "Could not generate images; try again later"}), 500

    video_file = f"{short_token}-{phone}-{year}.mp4"

    image_folder = create_images(phone, year)
    build_slideshow(image_folder, song_path, video_file, mode)
    cleanup_images(phone, year)

    return jsonify({"videoUrl": video_file}), 200


@app.route("/video/<filename>", methods=["GET"])
def get_video(filename: str) -> tuple[Response, int]:
    """
    Serve a video file.
    """
    try:
        return send_from_directory(EXPORTS_PATH, filename, mimetype="video/mp4"), 200
    except SignatureExpired:
        # TODO(michaelfromyeg): implement this
        abort(403)


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
    OS_HOST: str | None = os.environ.get("HOST")
    OS_PORT: str | None = os.environ.get("PORT")

    host = OS_HOST or HOST or "localhost"
    port = OS_PORT or PORT or 5000
    port = int(port)

    logger.info("Starting BeReal server on %s:%d...", host, port)

    app.run(host=host, port=port, debug=FLASK_ENV == "development")
