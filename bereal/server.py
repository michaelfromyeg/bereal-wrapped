"""
This is the entrypoint for the BeReal server.

It contains the Flask app routing and the functions to interact with the BeReal API.
"""

from flask import Flask, render_template, request

from .bereal import memories, send_code, verify_code
from .images import create_images
from .logger import logger
from .utils import HOST, PORT, SONG_PATH, str2datetime, str2mode
from .videos import build_slideshow

app = Flask(__name__, template_folder="templates")


@app.route("/", methods=["GET", "POST"])
def index() -> str:
    """
    Get the home page.

    TODO(michaelfromyeg): separate out "true" POST requests from render calls.
    """
    if request.method == "GET":
        return render_template("index.html")

    country_code = request.form["country_code"]
    phone_number = request.form["phone_number"]

    otp_session = send_code(f"+{country_code}{phone_number}")

    if otp_session is None:
        return render_template(
            "index.html",
            message="Invalid phone number. Check formatting and Please try again.",
        )

    return render_template("verify.html", otp_session=otp_session)


@app.route("/verify", methods=["GET", "POST"])
def verify() -> str:
    """
    Verify the user's input and render the process page.
    """
    if request.method == "GET":
        return render_template("verify.html")

    user_code = request.form["verification_code"]
    otp_session = request.form["otp_session"]

    token = verify_code(otp_session, user_code)

    if token is None:
        return render_template("failure.html")

    return render_template("process.html", token=token)


@app.route("/process", methods=["GET", "POST"])
def process() -> str:
    """
    Process a user's input and render the preview page.
    """
    if request.method == "GET":
        return render_template("process.html")

    sdate = str2datetime(request.form["start_date_range"])
    edate = str2datetime(request.form["end_date_range"])
    wav_file = request.files["wav_file"]
    token = request.form["token"]

    mode_str = request.form.get("mode")
    mode = str2mode(mode_str)

    logger.debug("Downloading music file...")

    try:
        wav_file.save(SONG_PATH)
    except Exception as error:
        logger.warning("Could not save music file, received: %s", error)

    logger.debug("Downloading images locally...")
    result = memories(token, sdate, edate)

    if not result:
        return render_template("failure.html")

    # process images and apply effects
    create_images()

    # assemble files and load audio
    build_slideshow(mode)

    return render_template("preview.html")


@app.route("/about")
def about() -> str:
    """
    Render the about page.
    """
    return render_template("about.html")


@app.route("/privacy")
def privacy() -> str:
    """
    Render the privacy warning page.
    """
    return render_template("privacy.html")


@app.route("/contact")
def contact() -> str:
    """
    Render the contact page.
    """
    return render_template("contact.html")


@app.route("/preview")
def preview() -> str:
    """
    Render the video preview page.
    """
    return render_template("preview.html")


@app.route("/failure")
def failure() -> str:
    """
    Render the failure page.
    """
    return render_template("failure.html")


if __name__ == "__main__":
    logger.info("Starting BeReal server on %s:%d...", HOST, PORT)
    app.run(host=HOST or "localhost", port=PORT or 5000, debug=True)
