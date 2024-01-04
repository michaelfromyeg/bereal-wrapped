#!/bin/sh

# Apply database migrations
echo "Running database migrations"
flask db upgrade

# Check for success of migrations
if [ $? -ne 0 ]; then
    echo "Failed to apply database migrations"
    exit 1
fi

# Start the main process (gunicorn in your case)
echo "Starting the main application"
exec gunicorn -b :5000 -k gevent -w 4 -t 600 "bereal.server:app"
