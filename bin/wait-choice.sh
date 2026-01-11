#!/bin/bash
# Wait for user choice from brain-canvas
# Usage: ./wait-choice.sh [timeout_seconds]

TIMEOUT=${1:-60}
INTERVAL=2
ATTEMPTS=$((TIMEOUT / INTERVAL))

for i in $(seq 1 $ATTEMPTS); do
  CHOICE=$(curl -s http://localhost:3333/choice 2>/dev/null)

  if echo "$CHOICE" | grep -q '"id"'; then
    echo "$CHOICE"
    exit 0
  fi

  sleep $INTERVAL
done

echo '{"error":"timeout","message":"No choice received in '$TIMEOUT' seconds"}'
exit 1
