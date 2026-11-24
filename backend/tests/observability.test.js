import request from 'supertest';
import app from '../src/app.js';

describe('DevOps Observability Endpoints', () => {
  it('GET /api/health returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/health/deep returns structured dependency and resource telemetry', async () => {
    const res = await request(app).get('/api/health/deep');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body.service).toBe('trackasap-backend');
    expect(res.body.dependencies).toHaveProperty('mongodb');
    expect(res.body.dependencies).toHaveProperty('redis');
    expect(res.body.resources).toHaveProperty('heapUsedMB');
  });

  it('GET /metrics exposes Prometheus text format metrics', async () => {
    await request(app).get('/api/health');
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('trackasap_http_requests_total');
    expect(res.text).toContain('trackasap_http_request_duration_seconds_bucket');
    expect(res.text).toContain('trackasap_db_connected');
    expect(res.text).toContain('trackasap_redis_connected');
    expect(res.text).toContain('trackasap_nodejs_heap_used_bytes');
  });
});
