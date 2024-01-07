#!/bin/sh

docker run --rm -v ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx nginx -t
