FROM python:3.11

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements/prod.txt

RUN adduser --disabled-password --gecos '' thekid

RUN chown -R thekid:thekid /app && chmod -R 777 /app

USER thekid

ENV FLASK_APP=bereal.server

EXPOSE 5000

# TODO(michaelfromyeg): remove the port line
CMD ["gunicorn", "-b", ":5000", "-k", "gevent", "-w", "4", "-t", "600", "bereal.server:app"]
