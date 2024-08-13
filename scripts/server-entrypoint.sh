#!/bin/bash

if [ "$1" = "web" ]; then
    echo "Running database migrations"
    flask db upgrade

    if [ $? -ne 0 ]; then
        echo "Failed to apply database migrations"
        exit 1
    fi

    echo "Starting the main application"
    exec gunicorn -b :5000 -k gevent -w 4 -t 600 "bereal.server:app"

elif [ "$1" = "celery" ]; then
    echo "Starting Celery worker"
    exec celery -A bereal.celery worker --loglevel=INFO --logfile=celery.log -E

elif [ "$1" = "flower" ]; then
    echo "Starting Celery Flower"
    exec celery -A bereal.celery flower --address=0.0.0.0 --inspect --enable-events --loglevel=DEBUG --logfile=flower.log

else
    echo "Invalid argument. Please use 'web', 'celery', or 'flower'."
    exit 1
fi
