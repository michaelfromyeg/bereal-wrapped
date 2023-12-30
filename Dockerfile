FROM python:3.11

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements/prod.txt

ENV FLASK_APP=bereal.server

EXPOSE 5000

CMD ["gunicorn", "-k", "gevent", "-w", "4", "-t", "600", "bereal.server:app"]
