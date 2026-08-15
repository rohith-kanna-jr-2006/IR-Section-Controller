import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Station } from '../src/models/Station.js';
import { Zone } from '../src/models/Zone.js';
import { Division } from '../src/models/Division.js';

describe('Station Master APIs', () => {
  let zoneId, divId, otherZoneId, otherDivId;
  let adminToken = 'test-token'; // Assuming test setup bypasses full auth or handles it

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/ir-section-controller-test');
    await Station.deleteMany({});
    await Division.deleteMany({});
    await Zone.deleteMany({});

    const z1 = await Zone.create({ code: 'CR', name: 'Central Railway' });
    zoneId = z1._id.toString();
    const d1 = await Division.create({ zoneId, code: 'BB', name: 'Mumbai CR' });
    divId = d1._id.toString();

    const z2 = await Zone.create({ code: 'WR', name: 'Western Railway' });
    otherZoneId = z2._id.toString();
    const d2 = await Division.create({ zoneId: otherZoneId, code: 'BCT', name: 'Mumbai WR' });
    otherDivId = d2._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a valid station', async () => {
    const res = await request(app)
      .post('/api/v1/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stationCode: 'cstm', // lowercase to test normalizer
        name: 'Chhatrapati Shivaji Maharaj Terminus',
        zoneId,
        divisionId: divId,
        location: {
          type: 'Point',
          coordinates: [72.8347, 18.9398]
        },
        status: 'ACTIVE'
      });

    expect(res.status).toBe(201);
    expect(res.body.stationCode).toBe('CSTM');
  });

  it('should reject creation with cross-zone division', async () => {
    const res = await request(app)
      .post('/api/v1/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stationCode: 'TEST',
        name: 'Test Station',
        zoneId,
        divisionId: otherDivId, // Belongs to WR, not CR
        status: 'ACTIVE'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not belong to Zone/);
  });

  it('should prevent overlapping ACTIVE stations with same code', async () => {
    const res = await request(app)
      .post('/api/v1/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stationCode: 'CSTM',
        name: 'Duplicate CSTM',
        zoneId,
        divisionId: divId,
        status: 'ACTIVE'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Temporal overlap/);
  });

  it('should allow historical station with same code', async () => {
    const res = await request(app)
      .post('/api/v1/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stationCode: 'CSTM',
        name: 'Old CSTM',
        zoneId,
        divisionId: divId,
        status: 'HISTORICAL',
        effectiveTo: '2023-12-31'
      });

    expect(res.status).toBe(201);
  });

  it('should list stations with filters', async () => {
    const res = await request(app).get('/api/v1/stations?stationCode=CSTM');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2); // Active + Historical
  });
});
