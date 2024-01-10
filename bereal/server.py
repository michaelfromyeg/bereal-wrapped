"""
This is the entrypoint for the BeReal server.

It contains the Flask app routing and the functions to interact with the BeReal API.
"""
from gevent import monkey

monkey.patch_all()

import os  # noqa: E402
import secrets  # noqa: E402
import warnings  # noqa: E402
from datetime import datetime, timedelta  # noqa: E402
from typing import Any  # noqa: E402

from flask import Flask, Response, jsonify, request, send_from_directory  # noqa: E402
from flask_apscheduler import APScheduler  # noqa: E402
from flask_cors import CORS  # noqa: E402
from flask_limiter import Limiter  # noqa: E402
from flask_limiter.util import get_remote_address  # noqa: E402
from flask_migrate import Migrate  # noqa: E402
from flask_sqlalchemy import SQLAlchemy  # noqa: E402
from itsdangerous import URLSafeTimedSerializer  # noqa: E402

from .bereal import send_code, verify_code  # noqa: E402
from .celery import bcelery, make_video  # noqa: E402
from .logger import logger  # noqa: E402
from .utils import (  # noqa: E402
    CONTENT_PATH,
    DEFAULT_SONG_PATH,
    DEFAULT_SHORT_SONG_PATH,
    EXPORTS_PATH,
    FLASK_ENV,
    GIT_COMMIT_HASH,
    HOST,
    PORT,
    REDIS_HOST,
    REDIS_PORT,
    SECRET_KEY,
    Mode,
    str2mode,
)

warnings.filterwarnings("ignore", category=UserWarning, module="tzlocal")

app = Flask(__name__)

# start with strict rate limits, and tune later
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri=f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
    storage_options={"socket_connect_timeout": 30},
    strategy="fixed-window",
    default_limits=["500 per day", "200 per hour", "20 per minute", "5 per second"],
)

serializer = URLSafeTimedSerializer(SECRET_KEY)

logger.info("Running in %s mode", FLASK_ENV)

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
migrate = Migrate(app, db)

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

app.config["CELERY_BROKER_URL"] = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
bcelery.conf.update(app.config)


class BerealToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    phone = db.Column(db.String(50), unique=True, nullable=False)
    bereal_token = db.Column(db.String(20), nullable=False)

    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Phone {self.phone}>"


# Create the table
with app.app_context():
    try:
        db.create_all()
    except Exception as error:
        logger.error("Could not create database: %s", error)


@app.route("/status")
@limiter.exempt
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

    # TODO(michaelfromyeg): propogate errors better from underlying API
    otp_session = send_code(f"+{phone}")

    if otp_session is None:
        return jsonify(
            {
                "error": "Too Many Requests",
                "message": "BeReal is rate-limiting your phone number. Please try again later.",
            }
        ), 429

    return jsonify({"otpSession": otp_session}), 200


@app.route("/validate-otp", methods=["POST"])
def validate_otp() -> tuple[Response, int]:
    """
    Validate the user's input and render the process page.
    """
    data: dict[str, Any] = request.get_json()

    otp_session = data["otp_session"]
    otp_code = data["otp_code"]
    phone = data["phone"]

    # TODO(michaelfromyeg): propogate errors better from underlying API
    token = verify_code(otp_session, otp_code)

    if token is None:
        return jsonify({"error": "Bad Request", "message": "Invalid verification code"}), 400

    # generate a custom app token; this we can safely save in our DB
    bereal_token = secrets.token_urlsafe(20)

    insert_bereal_token(phone, bereal_token)

    return jsonify({"bereal_token": bereal_token, "token": token}), 200


@app.route("/video", methods=["POST"])
def create_video() -> tuple[Response, int]:
    """
    Process a user's input and render the preview page.
    """
    phone = request.args.get("phone")
    bereal_token = request.args.get("berealToken")

    if not bereal_token or bereal_token != get_bereal_token(phone):
        return jsonify({"error": "Unauthorized", "message": "Invalid token"}), 401

    token = request.form["token"]
    year = request.form["year"]
    wav_file = request.files.get("file", None)
    mode_str = request.form.get("mode")

    mode = str2mode(mode_str)

    song_folder = os.path.join(CONTENT_PATH, phone, year)
    os.makedirs(song_folder, exist_ok=True)

    song_path = os.path.join(song_folder, "song.wav")

    if wav_file:
        logger.info("Downloading music file %s...", wav_file.filename)
        try:
            wav_file.save(song_path)
        except Exception as error:
            logger.warning("Could not save music file, received: %s", error)
            song_path = DEFAULT_SHORT_SONG_PATH if mode == Mode.CLASSIC else DEFAULT_SONG_PATH
    else:
        logger.info("No music file provided; using default...")
        song_path = DEFAULT_SHORT_SONG_PATH if mode == Mode.CLASSIC else DEFAULT_SONG_PATH

    logger.info("Queueing video task...")

    # TODO(michaelfromyeg): replace token with bereal_token
    task = make_video.delay(token, bereal_token, phone, year, song_path, mode)

    return jsonify({"taskId": task.id}), 202


@app.route("/status/<task_id>", methods=["GET"])
def task_status(task_id) -> tuple[Response, int]:
    """
    Get the task status.
    """
    phone = request.args.get("phone")
    bereal_token = request.args.get("berealToken")

    if not bereal_token or bereal_token != get_bereal_token(phone):
        return jsonify({"error": "Unauthorized", "message": "Invalid token"}), 401

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
@limiter.exempt
def get_video(filename: str) -> tuple[Response, int]:
    """
    Serve a video file.
    """
    phone = request.args.get("phone")
    bereal_token = request.args.get("berealToken")

    if not bereal_token or bereal_token != get_bereal_token(phone):
        return jsonify({"error": "Unauthorized", "message": "Invalid token"}), 401

    logger.debug("Serving video file %s/%s to %s...", EXPORTS_PATH, filename, phone)
    return send_from_directory(EXPORTS_PATH, filename, mimetype="video/mp4", as_attachment=True), 200


@app.route("/robots.txt")
def robots_txt() -> tuple[Response, int]:
    return send_from_directory(app.static_folder, request.path[1:]), 200


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


def insert_bereal_token(phone: str, bereal_token: str) -> None:
    """
    Insert a new token into the database.
    """
    BerealToken.query.filter_by(phone=phone).delete()

    new_token = BerealToken(phone=phone, bereal_token=bereal_token)
    db.session.add(new_token)
    db.session.commit()

    return None


def get_bereal_token(phone: str | None) -> str | None:
    """
    Get a token from the database.
    """
    if phone is None:
        return None

    entry = BerealToken.query.filter_by(phone=phone).first()

    if entry and (datetime.utcnow() - entry.timestamp) < timedelta(hours=24):
        return entry.bereal_token

    return None


def delete_expired_tokens() -> None:
    """
    Delete all expired tokens from the database.
    """
    expiration_time = datetime.utcnow() - timedelta(hours=24)
    BerealToken.query.filter(BerealToken.timestamp < expiration_time).delete()
    db.session.commit()

    return None


def delete_old_videos() -> None:
    """
    Delete videos that are more than a day old.
    """
    time_limit = datetime.now() - timedelta(days=1)

    for filename in os.listdir(EXPORTS_PATH):
        file_path = os.path.join(EXPORTS_PATH, filename)

        if os.path.isfile(file_path):
            file_mod_time = datetime.fromtimestamp(os.path.getmtime(file_path))

            if file_mod_time < time_limit:
                try:
                    os.remove(file_path)
                    logger.info("Deleted video file %s", file_path)
                except Exception as error:
                    logger.warning("Could not delete video file %s: %s", file_path, error)

    return None


@scheduler.task("interval", id="delete_expired_tokens", hours=1, misfire_grace_time=900)
def scheduled_token_task() -> None:
    """
    Schedule the token task.
    """
    with app.app_context():
        delete_expired_tokens()


@scheduler.task("interval", id="delete_old_videos", hours=12, misfire_grace_time=900)
def scheduled_video_task() -> None:
    """
    Schedule the video task.
    """
    with app.app_context():
        delete_old_videos()


if __name__ == "__main__":
    logger.info("Starting BeReal server on %s:%d...", HOST, PORT)

    app.run(host=HOST, port=PORT, debug=FLASK_ENV == "development")
