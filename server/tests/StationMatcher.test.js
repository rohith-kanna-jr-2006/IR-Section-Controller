import { describe, it, expect, beforeAll } from 'vitest';
import { StationMatcher } from '../src/services/import/StationMatcher.js';

describe('StationMatcher - Station Code Check and Input Alignment', () => {
  let matcher;

  beforeAll(async () => {
    matcher = new StationMatcher();
    await matcher.init();
  });

  it('should verify that input station code and master station code are the same', async () => {
    const result = matcher.match('MAS', 'Chennai Central');
    expect(result.isSameStationCode).toBe(true);
    expect(result.stationCodeCheck).toBe('SAME');
    expect(result.normalizedStationCode).toBe('MAS');
    expect(result.originalStationCode).toBe('MAS');
    expect(result.matchStatus).toBe('MATCHED');
  });

  it('should handle case insensitivity when verifying station codes', async () => {
    const result = matcher.match('cbe', 'Coimbatore');
    expect(result.isSameStationCode).toBe(true);
    expect(result.stationCodeCheck).toBe('SAME');
    expect(result.normalizedStationCode).toBe('CBE');
    expect(result.matchStatus).toBe('MATCHED');
  });

  it('should detect when input code is inferred or differs from master station code', async () => {
    const result = matcher.match('', 'Erode Junction');
    expect(result.isSameStationCode).toBe(false);
    expect(result.stationCodeCheck).toBe('INFERRED_FROM_NAME');
    expect(result.normalizedStationCode).toBe('ED');
    expect(result.matchStatus).toBe('MATCHED');
  });

  it('should report unknown station codes', async () => {
    const result = matcher.match('NONEXISTENT_STN', 'Unknown Station');
    expect(result.isSameStationCode).toBe(false);
    expect(result.matchStatus).toBe('NEW_UNKNOWN');
  });

  it('should resolve station aliases such as PALAKKARAI to TPE and match cleanly', async () => {
    const result = matcher.match('PALAKKARAI', '1m SR');
    expect(result.matchStatus).toBe('MATCHED');
    expect(result.normalizedStationCode).toBe('TPE');
    expect(result.normalizedStationName).toContain('Palakkarai');
  });

  it('should match station codes with halt and zone noise tokens without CONFLICT status', async () => {
    const tpj = matcher.match('TPJ', 'Tiruchchirappalli Jn SR');
    expect(tpj.matchStatus).toBe('MATCHED');
    expect(tpj.normalizedStationCode).toBe('TPJ');

    const tp = matcher.match('TP', 'Tiruchchirappalli Fort 2m SR');
    expect(tp.matchStatus).toBe('MATCHED');
    expect(tp.normalizedStationCode).toBe('TP');

    const pli = matcher.match('PLI', 'Pettaivayatalai 1m SR');
    expect(pli.matchStatus).toBe('MATCHED');
    expect(pli.normalizedStationCode).toBe('PLI');

    const krr = matcher.match('KRR', 'Karur Jn 2m SR');
    expect(krr.matchStatus).toBe('MATCHED');
    expect(krr.normalizedStationCode).toBe('KRR');

    const ed = matcher.match('ED', 'Erode Jn SR');
    expect(ed.matchStatus).toBe('MATCHED');
    expect(ed.normalizedStationCode).toBe('ED');
  });
});
