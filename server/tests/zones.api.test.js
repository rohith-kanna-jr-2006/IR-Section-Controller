import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import zoneRoutes from '../src/routes/zones.js';
import { rbac, ROLES } from '../src/middleware/rbac.js';

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
  if (req.headers['x-role']) {
    req.user = { role: req.headers['x-role'], _id: '123' };
  }
  next();
});

app.use('/api/v1/zones', zoneRoutes);

describe('Zones API RBAC', () => {
  it('should block unauthorized POST requests', async () => {
    const res = await request(app)
      .post('/api/v1/zones')
      .set('x-role', 'VIEWER')
      .send({ code: 'CR', name: 'Central Railway' });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Insufficient permissions');
  });

  // Note: Testing actual save requires MongoDB mock or connection, 
  // so we're primarily testing the router boundaries here for brevity.
});
