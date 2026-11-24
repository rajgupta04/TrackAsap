import mongoose from 'mongoose';
import redisClient from '../../config/redis.js';
import { queueManager } from '../queues/queueManager.js';

const DURATION_BUCKETS = [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

const state = {
  inFlight: 0,
  requestCounters: new Map(),
  durationBuckets: new Array(DURATION_BUCKETS.length + 1).fill(0),
  durationSum: 0,
  durationCount: 0,
  eventLoopLagSeconds: 0,
};

// Lightweight non-blocking event loop lag sampler
let lastTick = process.hrtime.bigint();
const lagInterval = setInterval(() => {
  const now = process.hrtime.bigint();
  const elapsedMs = Number(now - lastTick) / 1e6;
  const lagMs = Math.max(0, elapsedMs - 1000);
  state.eventLoopLagSeconds = Number((lagMs / 1000).toFixed(6));
  lastTick = now;
}, 1000);
if (typeof lagInterval.unref === 'function') {
  lagInterval.unref();
}

const normalizeRoute = (req) => {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }
  const clean = (req.originalUrl || req.url || '/').split('?')[0];
  return clean
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:num');
};

/**
 * Express middleware capturing Prometheus HTTP request metrics.
 */
export const prometheusMetricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics' || req.path === '/api/metrics') {
    return next();
  }

  const start = process.hrtime.bigint();
  state.inFlight += 1;

  let finished = false;
  const recordFinish = () => {
    if (finished) return;
    finished = true;
    state.inFlight = Math.max(0, state.inFlight - 1);

    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const route = normalizeRoute(req);
    const key = `${req.method}|${route}|${res.statusCode}`;
    state.requestCounters.set(key, (state.requestCounters.get(key) || 0) + 1);

    state.durationSum += durationSec;
    state.durationCount += 1;
    for (let i = 0; i < DURATION_BUCKETS.length; i += 1) {
      if (durationSec <= DURATION_BUCKETS[i]) {
        state.durationBuckets[i] += 1;
      }
    }
    state.durationBuckets[DURATION_BUCKETS.length] += 1;
  };

  res.on('finish', recordFinish);
  res.on('close', recordFinish);
  next();
};

const escapeLabel = (val) => String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/**
 * Formats collected metrics in Prometheus exposition text format (0.0.4).
 */
export const renderPrometheusMetrics = () => {
  const mem = process.memoryUsage();
  const dbConnected = mongoose.connection.readyState === 1 ? 1 : 0;
  const redisConnected = redisClient && redisClient.status === 'ready' ? 1 : 0;
  const activityQ = queueManager?.activityQueue?.length || 0;
  const requestQ = queueManager?.requestLogQueue?.length || 0;

  const lines = [
    '# HELP trackasap_http_requests_total Total HTTP requests handled by TrackAsap API.',
    '# TYPE trackasap_http_requests_total counter',
  ];

  for (const [key, count] of state.requestCounters.entries()) {
    const [method, route, statusCode] = key.split('|');
    lines.push(
      `trackasap_http_requests_total{method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_code="${escapeLabel(statusCode)}"} ${count}`
    );
  }

  lines.push(
    '# HELP trackasap_http_request_duration_seconds HTTP request duration histogram in seconds.',
    '# TYPE trackasap_http_request_duration_seconds histogram'
  );
  for (let i = 0; i < DURATION_BUCKETS.length; i += 1) {
    lines.push(`trackasap_http_request_duration_seconds_bucket{le="${DURATION_BUCKETS[i]}"} ${state.durationBuckets[i]}`);
  }
  lines.push(`trackasap_http_request_duration_seconds_bucket{le="+Inf"} ${state.durationBuckets[DURATION_BUCKETS.length]}`);
  lines.push(`trackasap_http_request_duration_seconds_sum ${state.durationSum.toFixed(6)}`);
  lines.push(`trackasap_http_request_duration_seconds_count ${state.durationCount}`);

  lines.push(
    '# HELP trackasap_http_requests_in_flight Current number of active HTTP requests.',
    '# TYPE trackasap_http_requests_in_flight gauge',
    `trackasap_http_requests_in_flight ${state.inFlight}`,
    '# HELP trackasap_nodejs_event_loop_lag_seconds Event loop delay in seconds.',
    '# TYPE trackasap_nodejs_event_loop_lag_seconds gauge',
    `trackasap_nodejs_event_loop_lag_seconds ${state.eventLoopLagSeconds}`,
    '# HELP trackasap_nodejs_heap_used_bytes Node.js heap used in bytes.',
    '# TYPE trackasap_nodejs_heap_used_bytes gauge',
    `trackasap_nodejs_heap_used_bytes ${mem.heapUsed}`,
    '# HELP trackasap_nodejs_heap_total_bytes Node.js heap total in bytes.',
    '# TYPE trackasap_nodejs_heap_total_bytes gauge',
    `trackasap_nodejs_heap_total_bytes ${mem.heapTotal}`,
    '# HELP trackasap_nodejs_rss_bytes Node.js resident set size in bytes.',
    '# TYPE trackasap_nodejs_rss_bytes gauge',
    `trackasap_nodejs_rss_bytes ${mem.rss}`,
    '# HELP trackasap_process_uptime_seconds Node.js process uptime in seconds.',
    '# TYPE trackasap_process_uptime_seconds gauge',
    `trackasap_process_uptime_seconds ${process.uptime().toFixed(2)}`,
    '# HELP trackasap_db_connected MongoDB connection state (1 = connected, 0 = disconnected).',
    '# TYPE trackasap_db_connected gauge',
    `trackasap_db_connected ${dbConnected}`,
    '# HELP trackasap_redis_connected Redis connection state (1 = ready, 0 = unavailable).',
    '# TYPE trackasap_redis_connected gauge',
    `trackasap_redis_connected ${redisConnected}`,
    '# HELP trackasap_analytics_queue_size In-memory analytics buffer size waiting to flush.',
    '# TYPE trackasap_analytics_queue_size gauge',
    `trackasap_analytics_queue_size{queue="activity"} ${activityQ}`,
    `trackasap_analytics_queue_size{queue="request_log"} ${requestQ}`,
    ''
  );

  return lines.join('\n');
};

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * Deep dependency health check for Nagios, Docker, and load balancers.
 */
export const deepHealthCheck = async (req, res) => {
  const readyState = mongoose.connection.readyState;
  const mongoOk = readyState === 1;

  let redisStatus = 'disabled';
  let redisOk = true;
  if (redisClient) {
    redisStatus = redisClient.status || 'unknown';
    redisOk = redisStatus === 'ready';
    if (redisOk) {
      try {
        await Promise.race([
          redisClient.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('ping timeout')), 1000)),
        ]);
      } catch {
        redisOk = false;
        redisStatus = 'unreachable';
      }
    }
  }

  const mem = process.memoryUsage();
  const status = mongoOk ? (redisOk ? 'ok' : 'degraded') : 'critical';
  const httpCode = mongoOk ? 200 : 503;

  res.status(httpCode).json({
    status,
    service: 'trackasap-backend',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: {
        connected: mongoOk,
        state: MONGO_STATES[readyState] || 'unknown',
      },
      redis: {
        configured: Boolean(redisClient),
        connected: redisOk,
        status: redisStatus,
      },
    },
    queues: {
      activityPending: queueManager?.activityQueue?.length || 0,
      requestLogPending: queueManager?.requestLogQueue?.length || 0,
    },
    resources: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      eventLoopLagMs: Number((state.eventLoopLagSeconds * 1000).toFixed(2)),
    },
  });
};
