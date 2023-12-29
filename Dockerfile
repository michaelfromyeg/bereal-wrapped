FROM python:3.11

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements/prod.txt

ENV FLASK_APP=bereal.server

EXPOSE 5000
EXPOSE 7890

CMD ["python", "-m", "bereal.server"]
