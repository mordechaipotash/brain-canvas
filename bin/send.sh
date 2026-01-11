#!/bin/bash
# Send content to brain-canvas
# Usage: echo '{"title":"Hi"}' | ./send.sh
#    or: ./send.sh '{"title":"Hi"}'

if [ -n "$1" ]; then
  JSON="$1"
else
  JSON=$(cat)
fi

curl -s -X POST http://localhost:3333/update \
  -H "Content-Type: application/json" \
  -d "$JSON"
