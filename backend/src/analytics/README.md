# TrackAsap Analytics & Observability System

This module provides a highly scalable, non-blocking telemetry system for TrackAsap. It is explicitly designed to minimize the storage footprint on MongoDB Atlas Free Tier (M0) while retaining high-value business metrics.

## Architecture

The system is decoupled from the main request lifecycle using an internal `EventEmitter` queue. This ensures zero latency overhead on API requests.

- **Models**:
  - `Activity`: Permanent store for high-value events (e.g., `PROBLEM_COMPLETED`).
  - `Session`: Tracking active user sessions.
  - `RequestLog`: Ephemeral performance logging with a **7-day TTL index**.
  - `SecurityLog`: Permanent store for security audits (e.g., failed logins, bans).
  - `AnalyticsDaily`: Aggregated statistics computed via a cron job.
  - `EmailQueue`: Pending emails for background workers.

- **Queue Manager (`queues/queueManager.js`)**:
  - Batches events and flushes them to the DB every 5 seconds.
  - Can be cleanly swapped out for Redis/BullMQ or Kafka in the future without modifying business logic.

- **SDK (`services/eventTracker.js`)**:
  - `AnalyticsTracker.trackEvent()`
  - `AnalyticsTracker.trackSession()`
  - `AnalyticsTracker.trackPerformance()`
  - `AnalyticsTracker.trackSecurity()`

## Privacy & GDPR Compliance

- `User.preferences` controls data collection.
- The `AnalyticsTracker` automatically verifies if a user has opted out of analytics before queueing any data.
- IP addresses and sensitive identifiers are masked or skipped if tracking is disabled.

## Future Migration

When migrating off MongoDB Free Tier:
1. Replace `queueManager.js` in-memory arrays with BullMQ queues.
2. Direct `RequestLog` to a dedicated ClickHouse or Elasticsearch cluster for long-term retention.
3. Move `Session` state into Redis.
