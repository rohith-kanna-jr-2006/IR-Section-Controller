import mongoose from 'mongoose';
import { getAllSRStations } from '../../config/srSectionsData.js';
import { Station } from '../../models/Station.js';

export const KNOWN_STATION_ALIASES = {
  'PALAKKARAI': 'TPE',
  'TIRUCHCHIRAPPALLI PALAKKARAI': 'TPE',
  'TIRUCHIRAPPALLI PALAKKARAI': 'TPE',
  'TRICHY PALAKKARAI': 'TPE',
  'TP PALAKKARAI': 'TPE',
  'TRICHY': 'TPJ',
  'TIRUCHCHIRAPPALLI': 'TPJ',
  'TIRUCHIRAPPALLI': 'TPJ',
  'TRICHIRAPPALLI': 'TPJ',
  'TRICHY JN': 'TPJ',
  'TIRUCHIRAPPALLI JN': 'TPJ',
  'TIRUCHCHIRAPPALLI JN': 'TPJ',
  'TRICHY FORT': 'TP',
  'TIRUCHCHIRAPPALLI FORT': 'TP',
  'TIRUCHIRAPPALLI FORT': 'TP',
  'PETTAIVAYATALAI': 'PLI',
  'PETTAIVAYTALAI': 'PLI',
  'CHAVADIPALAIYAM': 'CVD',
  'CHAVADIPALAYAM': 'CVD',
  'MADRAS': 'MAS',
  'CHENNAI': 'MAS',
  'CHENNAI CENTRAL': 'MAS',
  'MGR CHENNAI CENTRAL': 'MAS',
  'CHENNAI EGMORE': 'MS',
  'COIMBATORE': 'CBE',
  'COIMBATORE JN': 'CBE',
  'COIMBATORE MAIN': 'CBE',
  'ERODE': 'ED',
  'ERODE JN': 'ED',
  'SALEM': 'SA',
  'SALEM JN': 'SA',
  'KARUR': 'KRR',
  'KARUR JN': 'KRR',
  'DINDIGUL': 'DG',
  'DINDIGUL JN': 'DG',
  'MADURAI': 'MDU',
  'MADURAI JN': 'MDU',
  'PALAKKAD': 'PGT',
  'PALAKKAD JN': 'PGT',
  'SHORANUR': 'SRR',
  'SHORANUR JN': 'SRR',
  'CALICUT': 'CLT',
  'KOZHIKODE': 'CLT',
  'KANNUR': 'CAN',
  'CANNANORE': 'CAN',
  'THIRUVANANTHAPURAM': 'TVC',
  'TRIVANDRUM': 'TVC',
  'ERNAKULAM': 'ERS',
  'COCHIN': 'ERS',
  'MANGALORE': 'MAQ',
  'MANGALORE CENTRAL': 'MAQ',
  'KATPADI': 'KPD',
  'KATPADI JN': 'KPD',
  'JOLARPETTAI': 'JTJ',
  'JOLARPETTAI JN': 'JTJ',
  'THANJAVUR': 'TJ',
  'THANJAVUR JN': 'TJ',
  'VILLUPURAM': 'VM',
  'VILLUPURAM JN': 'VM',
  'TIRUNELVELI': 'TEN',
  'TIRUNELVELI JN': 'TEN',
  'NAGERCOIL': 'NCJ',
  'NAGERCOIL JN': 'NCJ'
};

export class StationMatcher {
  static defaultInstance = null;

  static async matchStation(rawCode = '', rawName = '') {
    if (!this.defaultInstance) {
      this.defaultInstance = new StationMatcher();
      await this.defaultInstance.init();
    }
    return this.defaultInstance.match(rawCode, rawName);
  }

  constructor() {
    this.stationCodeMap = new Map();
    this.stationNameMap = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // 1. Load from static SR station reference
    const staticStations = getAllSRStations();
    staticStations.forEach(st => {
      const code = (st.stationCode || '').trim().toUpperCase();
      const name = (st.name || st.officialName || '').trim().toLowerCase();
      if (code) {
        this.stationCodeMap.set(code, {
          stationCode: code,
          name: st.name,
          officialName: st.officialName,
          divisionCode: st.divisionCode,
          source: 'STATIC_REFERENCE'
        });
      }
      if (name) {
        this.stationNameMap.set(name, code);
      }
    });

    // 2. Load from MongoDB Station records if available and connected
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const dbStations = await Station.find({}).lean().maxTimeMS(500);
        dbStations.forEach(st => {
          const code = (st.stationCode || '').trim().toUpperCase();
          const name = (st.name || st.officialName || '').trim().toLowerCase();
          if (code) {
            this.stationCodeMap.set(code, {
              _id: st._id ? st._id.toString() : undefined,
              stationCode: code,
              name: st.name,
              officialName: st.officialName,
              divisionId: st.divisionId,
              source: 'DATABASE'
            });
          }
          if (name) {
            this.stationNameMap.set(name, code);
          }
        });
      }
    } catch {
      // If DB is not connected or in unit test environment, static reference is preserved
    }

    // 3. Register common aliases
    Object.entries(KNOWN_STATION_ALIASES).forEach(([alias, targetCode]) => {
      const normAlias = this.normalizeName(alias);
      if (normAlias && !this.stationNameMap.has(normAlias)) {
        this.stationNameMap.set(normAlias, targetCode);
      }
    });

    this.initialized = true;
  }

  /**
   * Normalizes a string by trimming, removing extra spaces, halt markers, zone tags and abbreviations
   */
  normalizeName(str = '') {
    return str
      .toLowerCase()
      .replace(/[.\-_/(),]/g, ' ')
      .replace(/\b\d+\s*m(?:in)?\b/gi, ' ') // strip halt duration like 1m, 2m, 5min
      .replace(/\b(sr|swr|cr|wr|nr|scr|ser|ecr|secr|nwr|nfr|ner|ncr|ecor|wcr|kr)\b/gi, ' ') // strip railway zone codes
      .replace(/\b(jn|jnc|jct|junction|cantt|cantonment|term|terminus|main)\b/gi, ' ') // normalize common suffixes
      .replace(/tiruchchirappalli/gi, 'tiruchirappalli') // normalize Tamil Nadu Govt vs IR spellings
      .replace(/pettaivayatalai/gi, 'pettaivaytalai')
      .replace(/chavadipalaiyam/gi, 'chavadipalayam')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Matches an extracted station code and name against reference topology
   * @param {string} rawCode - Original extracted station code
   * @param {string} rawName - Original extracted station name
   * @returns {object} Match result with status, codes, names, and issues
   */
  match(rawCode = '', rawName = '') {
    const originalStationCode = rawCode ? rawCode.toString().trim() : '';
    const originalStationName = rawName ? rawName.toString().trim() : '';
    let cleanCode = originalStationCode.toUpperCase();
    const cleanName = this.normalizeName(originalStationName);

    // Resolve code aliases (e.g. PALAKKARAI -> TPE, TRICHY -> TPJ)
    if (KNOWN_STATION_ALIASES[cleanCode]) {
      cleanCode = KNOWN_STATION_ALIASES[cleanCode];
    }

    let matchStatus = 'NEW_UNKNOWN';
    let normalizedStationCode = cleanCode;
    let normalizedStationName = originalStationName;
    let matchedStationId = null;
    let matchedRecord = null;
    const issues = [];

    // Step 1: Match by Station Code
    if (cleanCode && this.stationCodeMap.has(cleanCode)) {
      matchedRecord = this.stationCodeMap.get(cleanCode);
      normalizedStationCode = matchedRecord.stationCode;
      normalizedStationName = matchedRecord.name || matchedRecord.officialName;
      matchedStationId = matchedRecord._id || `stn_${matchedRecord.stationCode}`;

      // Check if provided name conflicts drastically with master name
      if (cleanName) {
        const masterCleanName = this.normalizeName(matchedRecord.name || matchedRecord.officialName);
        const nameTokens = cleanName.split(' ').filter(t => t.length > 2);
        const masterTokens = masterCleanName.split(' ').filter(t => t.length > 2);
        
        const hasTokenOverlap = nameTokens.some(t => masterCleanName.includes(t)) ||
                                masterTokens.some(t => cleanName.includes(t));

        if (masterCleanName && !masterCleanName.includes(cleanName) && !cleanName.includes(masterCleanName) && !hasTokenOverlap) {
          // Name differs completely
          matchStatus = 'CONFLICT';
          issues.push({
            level: 'WARNING',
            code: 'NAME_MISMATCH',
            message: `Station code ${cleanCode} matches master station "${matchedRecord.name}", but extracted name was "${originalStationName}"`
          });
        } else {
          matchStatus = 'MATCHED';
        }
      } else {
        matchStatus = 'MATCHED';
      }
    } 
    // Step 2: Match by Station Name or Alias lookup
    else if (cleanName) {
      let resolvedCode = this.stationNameMap.get(cleanName);
      
      if (!resolvedCode) {
        // Try known aliases
        const aliasKey = Object.keys(KNOWN_STATION_ALIASES).find(k => this.normalizeName(k) === cleanName);
        if (aliasKey) {
          resolvedCode = KNOWN_STATION_ALIASES[aliasKey];
        }
      }

      if (resolvedCode && this.stationCodeMap.has(resolvedCode)) {
        matchedRecord = this.stationCodeMap.get(resolvedCode);
        normalizedStationCode = matchedRecord.stationCode;
        normalizedStationName = matchedRecord.name;
        matchedStationId = matchedRecord._id || `stn_${matchedRecord.stationCode}`;
        matchStatus = 'MATCHED';
        issues.push({
          level: 'INFO',
          code: 'MATCHED_BY_NAME',
          message: `Station matched by name "${originalStationName}" to code ${normalizedStationCode}`
        });
      } else {
        // Partial/fuzzy search through known stations
        for (const [code, st] of this.stationCodeMap.entries()) {
          const mName = this.normalizeName(st.name);
          const mOfficial = this.normalizeName(st.officialName);
          if ((mName && (mName.startsWith(cleanName) || cleanName.startsWith(mName))) ||
              (mOfficial && (mOfficial.startsWith(cleanName) || cleanName.startsWith(mOfficial)))) {
            matchedRecord = st;
            normalizedStationCode = code;
            normalizedStationName = st.name;
            matchedStationId = st._id || `stn_${code}`;
            matchStatus = 'REVIEW_REQUIRED';
            issues.push({
              level: 'WARNING',
              code: 'FUZZY_NAME_MATCH',
              message: `Fuzzy matched station "${originalStationName}" to ${code} (${st.name}) - Verification required`
            });
            break;
          }
        }
      }
    }

    if (!matchedRecord && (!cleanCode || !this.stationCodeMap.has(cleanCode))) {
      matchStatus = 'NEW_UNKNOWN';
      issues.push({
        level: 'ERROR',
        code: 'UNKNOWN_STATION',
        message: `Station code "${cleanCode || originalStationName}" does not exist in Southern Railway master topology`
      });
    }

    const isAuthoritative = matchStatus === 'MATCHED';
    const isSameStationCode = Boolean(
      matchedRecord &&
      cleanCode &&
      matchedRecord.stationCode &&
      cleanCode === matchedRecord.stationCode.toUpperCase()
    );
    
    let stationCodeCheck;
    if (!matchedRecord || matchStatus === 'NEW_UNKNOWN') {
      stationCodeCheck = 'UNKNOWN';
    } else if (isSameStationCode) {
      stationCodeCheck = 'SAME';
    } else if (cleanCode) {
      stationCodeCheck = 'DIFFERENT';
    } else {
      stationCodeCheck = 'INFERRED_FROM_NAME';
    }

    if (matchedRecord && cleanCode && matchedRecord.stationCode && cleanCode !== matchedRecord.stationCode.toUpperCase()) {
      issues.push({
        level: 'WARNING',
        code: 'STATION_CODE_DIFFERENCE',
        message: `Input timetable station code "${cleanCode}" mapped to master station code "${normalizedStationCode}"`
      });
    }

    let confidence = 1.0;
    let confidenceClass = 'HIGH_CONFIDENCE';
    if (matchStatus === 'REVIEW_REQUIRED' || matchStatus === 'CONFLICT') {
      confidence = 0.85;
      confidenceClass = 'MEDIUM_CONFIDENCE';
    } else if (matchStatus === 'NEW_UNKNOWN') {
      confidence = 0.50;
      confidenceClass = 'LOW_CONFIDENCE';
    }

    return {
      originalStationCode,
      originalStationName,
      normalizedStationCode,
      normalizedStationName,
      matchedStationId,
      matchStatus,
      isSameStationCode,
      stationCodeCheck,
      isAuthoritative,
      confidence,
      confidenceClass,
      matchedRecord,
      issues
    };
  }
}
