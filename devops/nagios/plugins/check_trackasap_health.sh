#!/usr/bin/env bash
# Nagios plugin for TrackAsap /api/health/deep
# Exit codes: 0=OK, 1=WARNING, 2=CRITICAL, 3=UNKNOWN

set -u

HOST="127.0.0.1"
PORT="8080"
TIMEOUT=5
QUEUE_WARN=200

while getopts "H:p:t:w:" opt; do
  case "$opt" in
    H) HOST="$OPTARG" ;;
    p) PORT="$OPTARG" ;;
    t) TIMEOUT="$OPTARG" ;;
    w) QUEUE_WARN="$OPTARG" ;;
    *)
      echo "UNKNOWN - Invalid arguments"
      exit 3
      ;;
  esac
done

URL="http://${HOST}:${PORT}/api/health/deep"
RESPONSE=$(curl -fsS --max-time "$TIMEOUT" "$URL" 2>/dev/null)
CURL_RC=$?

if [ "$CURL_RC" -ne 0 ] || [ -z "$RESPONSE" ]; then
  echo "CRITICAL - TrackAsap deep health endpoint unreachable at ${URL}"
  exit 2
fi

PARSED=$(printf '%s' "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
deps = d.get('dependencies', {})
mongo = deps.get('mongodb', {}).get('connected', False)
redis = deps.get('redis', {}).get('connected', True)
res = d.get('resources', {})
queues = d.get('queues', {})
q_total = int(queues.get('activityPending', 0)) + int(queues.get('requestLogPending', 0))
print(f\"{d.get('status','unknown')}|{int(mongo)}|{int(redis)}|{res.get('heapUsedMB',0)}|{res.get('eventLoopLagMs',0)}|{q_total}\")
" 2>/dev/null)

if [ -z "$PARSED" ]; then
  echo "UNKNOWN - Failed to parse JSON from ${URL}"
  exit 3
fi

IFS='|' read -r STATUS MONGO_OK REDIS_OK HEAP_MB LAG_MS QUEUE_TOTAL <<< "$PARSED"
PERFDATA="| heap_mb=${HEAP_MB}MB lag_ms=${LAG_MS}ms queue_pending=${QUEUE_TOTAL};${QUEUE_WARN}"

if [ "$MONGO_OK" -ne 1 ] || [ "$STATUS" = "critical" ]; then
  echo "CRITICAL - MongoDB disconnected (status=${STATUS})${PERFDATA}"
  exit 2
fi

if [ "$REDIS_OK" -ne 1 ] || [ "$STATUS" = "degraded" ]; then
  echo "WARNING - Redis degraded/unreachable; cache failing open${PERFDATA}"
  exit 1
fi

if [ "$QUEUE_TOTAL" -ge "$QUEUE_WARN" ]; then
  echo "WARNING - Analytics flush backlog high (${QUEUE_TOTAL} pending)${PERFDATA}"
  exit 1
fi

echo "OK - TrackAsap healthy (Mongo=up, Redis=up, Heap=${HEAP_MB}MB, Lag=${LAG_MS}ms)${PERFDATA}"
exit 0
