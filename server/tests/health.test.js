import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { redisClient } from '../src/config/database.js';
import app from '../src/app.js';

describe('Health Endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/health should return ok even if dependencies are down', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);
    vi.spyOn(redisClient, 'status', 'get').mockReturnValue('end');

    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ir-section-controller');
  });

  it('GET /api/v1/ready should return 503 when dependencies are unavailable', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);
    vi.spyOn(redisClient, 'status', 'get').mockReturnValue('end');

    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'not_ready',
      dependencies: {
        mongodb: 'unavailable',
        redis: 'unavailable'
      }
    });
  });

  it('GET /api/v1/ready should return 200 when dependencies are available', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(redisClient, 'status', 'get').mockReturnValue('ready');

    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ready',
      dependencies: {
        mongodb: 'available',
        redis: 'available'
      }
    });
  });
});
