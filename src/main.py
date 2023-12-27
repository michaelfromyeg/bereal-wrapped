"""
This is the main file for the BeReal app.

It contains the Flask app routing and the functions to interact with the BeReal API.
"""
import os

from flask import Flask, render_template, request

from .bereal import get_memories, send_code, verify_code
from .combine_images import create_images
from .generate_slideshow import build_slideshow
from .utils import SONG_PATH

app = Flask(__name__, template_folder="templates")


@app.route("/", methods=["GET", "POST"])
def index():
    """
    Get the home page.

    TODO(michaelfromyeg): separate out "true" POST requests from render calls.
    """
    if request.method == "GET":
        return render_template("index.html")

    phone_number = request.form["phone_number"]
    otp_session = send_code(phone_number)

    if otp_session != "n/a":
        return render_template("verify.html", otp_session=otp_session)

    return render_template(
        "index.html",
        message="Invalid phone number. Check formatting and Please try again.",
    )


@app.route("/verify", methods=["GET", "POST"])
def verify():
    """
    Verify the user's input and render the process page.
    """
    if request.method == "GET":
        return render_template("verify.html")

    user_code = request.form["verification_code"]
    otp_session = request.form["otp_session"]
    print("> verify_code otp_session: ", otp_session)
    token_obj = verify_code(otp_session, user_code)

    if token_obj != "n/a":
        return render_template("process.html", tokenObj=token_obj)

    else:
        return render_template("failure.html")


@app.route("/process", methods=["GET", "POST"])
def process():
    """
    Process a user's input and render the preview page.
    """
    if request.method == "GET":
        return render_template("process.html")

    start_date_range = request.form["start_date_range"]
    end_date_range = request.form["end_date_range"]
    wav_file = request.files["wav_file"]
    token_obj = request.form["tokenObj"]
    mode = request.form.get("mode")

    print("> HTML Form Elements: ")
    print("start_date_range ", str(start_date_range))
    print("end_date_range ", str(end_date_range))
    print("wav_file ", str(wav_file))
    print("mode", str(mode))

    print("> downloading music file locally: ")

    try:
        # Save the uploaded WAV file locally
        upload_directory = os.getcwd()
        print("saving file to ", upload_directory)
        if not os.path.exists(upload_directory):
            os.makedirs(upload_directory)

        wav_file.save(SONG_PATH)
    except Exception as e:
        print(f"Error in processing data: {str(e)}")

    print("> downloading images locally")
    result = get_memories(token_obj, start_date_range, end_date_range)

    if result != "n/a":
        # process images and apply effects
        create_images()

        # assemble files and load audio
        build_slideshow(mode)

        return render_template("preview.html")
    else:
        return render_template("failure.html")


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
    # app.run(debug=True)

    # debugging...
    # create_images()
    build_slideshow("classic")
