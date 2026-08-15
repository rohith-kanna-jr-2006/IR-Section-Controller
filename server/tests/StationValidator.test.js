import { describe, it, expect } from 'vitest';
import { StationValidator } from '../src/services/validation/StationValidator.js';

describe('StationValidator', () => {
  it('should normalize station code', () => {
    expect(StationValidator.normalizeStationCode(' mas ')).toBe('MAS');
    expect(StationValidator.normalizeStationCode('Cstm')).toBe('CSTM');
    expect(StationValidator.normalizeStationCode(null)).toBeNull();
  });

  it('should normalize station name for search', () => {
    expect(StationValidator.normalizeStationName('Chennai Central')).toBe('chennai central');
    expect(StationValidator.normalizeStationName(' CHENNAI   CENTRAL ')).toBe('chennai central');
    expect(StationValidator.normalizeStationName('São Paulo')).toBe('sao paulo');
    expect(StationValidator.normalizeStationName('St. Thomas Mount')).toBe('st thomas mount');
    expect(StationValidator.normalizeStationName(null)).toBeNull();
  });
});
