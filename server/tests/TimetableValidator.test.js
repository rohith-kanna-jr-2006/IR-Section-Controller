import { describe, it, expect } from 'vitest';
import { TimetableValidator } from '../src/services/timetable/TimetableValidator.js';

describe('TimetableValidator', () => {
  it('should normalize time to absolute minutes', () => {
    expect(TimetableValidator.normalizeTime('00:00')).toBe(0);
    expect(TimetableValidator.normalizeTime('01:30')).toBe(90);
    expect(TimetableValidator.normalizeTime('23:59')).toBe(1439);
    expect(TimetableValidator.normalizeTime('00:00', 1)).toBe(1440);
    expect(TimetableValidator.normalizeTime('01:30', 1)).toBe(1530);
  });

  it('should invalidate missing trainId or frequency', () => {
    const res = TimetableValidator.validateSchedule({}, []);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.message.includes('train'))).toBe(true);
    expect(res.errors.some(e => e.message.includes('frequency'))).toBe(true);
  });

  it('should validate a correct route progression', () => {
    const schedule = { trainId: 'train1', frequency: 'DAILY' };
    const stops = [
      { sequence: 1, stationId: 'A', stationCode: 'STA', departure: '23:00', dayOffset: 0 },
      { sequence: 2, stationId: 'B', stationCode: 'STB', arrival: '23:50', departure: '23:55', dayOffset: 0 },
      { sequence: 3, stationId: 'C', stationCode: 'STC', arrival: '00:30', dayOffset: 1 }
    ];
    
    // Mock station map to bypass warnings
    const map = new Map([
      ['A', { stationCode: 'STA' }],
      ['B', { stationCode: 'STB' }],
      ['C', { stationCode: 'STC' }]
    ]);

    const res = TimetableValidator.validateSchedule(schedule, stops, map);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
  });

  it('should detect backwards time progression', () => {
    const schedule = { trainId: 'train1', frequency: 'DAILY' };
    const stops = [
      { sequence: 1, stationId: 'A', stationCode: 'STA', departure: '10:00', dayOffset: 0 },
      { sequence: 2, stationId: 'B', stationCode: 'STB', arrival: '09:00', departure: '09:05', dayOffset: 0 }
    ];
    const map = new Map([['A', { stationCode: 'STA' }], ['B', { stationCode: 'STB' }]]);

    const res = TimetableValidator.validateSchedule(schedule, stops, map);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.message.includes('before previous'))).toBe(true);
  });

  it('should detect duplicate sequences', () => {
    const schedule = { trainId: 'train1', frequency: 'DAILY' };
    const stops = [
      { sequence: 1, stationId: 'A', stationCode: 'STA', departure: '10:00', dayOffset: 0 },
      { sequence: 1, stationId: 'B', stationCode: 'STB', arrival: '11:00', departure: '11:05', dayOffset: 0 }
    ];
    const map = new Map([['A', { stationCode: 'STA' }], ['B', { stationCode: 'STB' }]]);

    const res = TimetableValidator.validateSchedule(schedule, stops, map);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.message.includes('Duplicate sequence'))).toBe(true);
  });
});
