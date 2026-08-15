import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Station } from '../src/models/Station.js';
import { Zone } from '../src/models/Zone.js';
import { Division } from '../src/models/Division.js';
import { Organization } from '../src/models/Organization.js';
import { Source } from '../src/models/Source.js';
import { DataVersion } from '../src/models/DataVersion.js';

vi.mock('../src/middleware/rbac.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    rbac: (...allowedRoles) => (req, res, next) => {
      req.user = { _id: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' };
      next();
    }
  };
});

describe('Station Master APIs', () => {
  let zoneId, divId, otherZoneId, otherDivId, historicalVersionId, currentVersionId;
  let adminToken = 'dummy';
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Station.deleteMany({});
    await Division.deleteMany({});
    await Zone.deleteMany({});
    await Organization.deleteMany({});
    await DataVersion.deleteMany({});
    await Source.deleteMany({});

    const source = await Source.create({ name: 'Test Source', sourceType: 'Zonal' });
    const histVer = await DataVersion.create({ version: 'v1-hist', sourceId: source._id });
    const currVer = await DataVersion.create({ version: 'v2-curr', sourceId: source._id });
    historicalVersionId = histVer._id.toString();
    currentVersionId = currVer._id.toString();

    const org = await Organization.create({ code: 'IR', name: 'Indian Railways' });
    const orgId = org._id.toString();

    const z1 = await Zone.create({ organizationId: orgId, code: 'CR', name: 'Central Railway' });
    zoneId = z1._id.toString();
    const d1 = await Division.create({ zoneId, code: 'BB', name: 'Mumbai CR' });
    divId = d1._id.toString();

    const z2 = await Zone.create({ organizationId: orgId, code: 'WR', name: 'Western Railway' });
    otherZoneId = z2._id.toString();
    const d2 = await Division.create({ zoneId: otherZoneId, code: 'BCT', name: 'Mumbai WR' });
    otherDivId = d2._id.toString();
  }, 120000); // Allow time for mongodb binary download

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
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
    expect(res.body.error).toMatch(/Hierarchy mismatch/);
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
        effectiveTo: '2023-12-31',
        dataVersionId: historicalVersionId,
        location: { coordinates: [72.8354, 18.9398] }
      });

    if (res.status === 500) {
      console.log('HISTORICAL ERROR BODY:', res.body);
    }
    expect(res.status).toBe(201);
  });

  it('should list stations with filters', async () => {
    const res = await request(app).get('/api/v1/stations?stationCode=CSTM');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2); // Active + Historical
  });
});
