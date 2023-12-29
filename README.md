# BeReal Wrapped

**NOTE:** This is a fork of [BeReel](https://github.com/theOneAndOnlyOne/BeReel); please go give the original creator a star!

(Below is mostly quoted; deployment instructions and edits, TBD, are new.)

Miss the time-lapse recap feature from BeReal? Introducing BeReal Wrapped, a website (or CLI) interface to generate one.

* Fetch memories for a specific year
* Create a time-lapse that syncs with a `.wav` audio

## Usage

Ways to use this project.

### Web

TBD.

### CLI

TBD.

### Docker (CLI)

Run the following command, after launching Docker.

```plaintext
docker pull michaelfromyeg/bereal-wrapped-cli

docker run -it --rm --name bereal-wrapped-cli michaelfromyeg/bereal-wrapped-cli
```

When it asks for a song path, you'll only be able to use `/app/content/song.wav`. I'm working on making it work with your local file system.

## Development

Follow these instructions to get your project up and running.

### Prerequisites

Make sure you have the following installed on your machine.

* [Python](https://python.org/downloads/) 3.11
* [pip](https://pip.pypa.io/en/stable/installation/)

If you are missing either (and are on macOS or Linux), run

```plaintext
brew install python@3.11
```

### Development Setup

First, create a virtual environment.

```plaintext
python3.11 -m venv env

source env/bin/activate
```

Run all required libraries and run the app:

```bash
pip install --upgrade pip
pip install -r requirements/dev.txt

mypy --install-types

make run
```

The Flask app will be available on [http://localhost:5000](http://localhost:5000). Multiple folders will be created to pull image data from your memories.

### Docker Setup

#### Docker Setup, Web

First, run `docker build -f Dockerfile -t bereal-wrapped-server .`.

Then, run it locally with `docker run -p 5000:5000 -it --rm --name bereal-wrapped-server bereal-wrapped-server`.

#### Docker Setup, CLI

First, run `docker build -f Dockerfile.cli -t bereal-wrapped-cli .`.

Then, run it locally with `docker run -it --rm --name bereal-wrapped-cli bereal-wrapped-cli`.

### Project Structure

* `main.py` the main flask app and drives webpage and API requests
* `combine_images.py` processes photos to be used for the slideshow
* `generate_slideshow.py` rendering time-lapse video and audio

### Current Developments

* [ ] Add 'no sound' option
* [ ] Display RealMoji
* [ ] Toggle date label setting
* [ ] Show render progress on webpage
* [ ] Batching algorithm for videos
* [ ] Better phone number support (start with CLI)

## Remarks

This project wouldn't be here without the amazing work by [chemokita13](https://github.com/chemokita13/beReal-api). Please give him a star.

This app is to be run **locally** as to comply with user security laws and privacy. Under no cases does this app store metadata elsewhere.

The app utilizes a third-party API which may not follow the terms and conditions set by BeReal; all videos and images produced from this app are to be considered personal use and should only use accounts owned by the user.

If BeReal has particular issues with this project, do not hesitate to reach out to myself or the downstream fork's creator.

## License

Distributed under the MIT License. See `LICENSE` for more information.
