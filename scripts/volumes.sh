#!/bin/sh

docker run --rm -v bereal-wrapped_content:/data ubuntu chown -R 1000:1000 /data
docker run --rm -v bereal-wrapped_exports:/data ubuntu chown -R 1000:1000 /data
