#!/bin/bash

curl -H "Origin: https://bereal.michaeldemar.co" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: X-Requested-With" \
    https://api.bereal.michaeldemar.co/status

curl -H "Origin: https://bereal.michaeldemar.co" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: X-Requested-With" \
    https://api.bereal.michaeldemar.co/video/myvideo.mp4
