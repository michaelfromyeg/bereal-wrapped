FROM python:3.11

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements/prod.txt

ENV FLASK_APP=bereal.main

EXPOSE 5000

CMD ["python", "-m", "bereal.main"]
