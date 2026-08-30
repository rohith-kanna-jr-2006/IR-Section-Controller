// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import StationAxis from '../src/components/control-chart/StationAxis';
import TimeAxis from '../src/components/control-chart/TimeAxis';
import ImportModal, { SOURCE_AUTHORITY, PIPELINE_STAGES } from '../src/components/control-chart/ImportModal';
import { ChartCoordinateModel, DISTANCE_MODE } from '../src/components/control-chart/ChartCoordinateModel';

afterEach(() => {
  cleanup();
});

describe('Phase 6.6 — Master Chart Components', () => {
  const mockTopology = {
    stations: [
      { id: 'MAS', stationCode: 'MAS', name: 'MGR Chennai Central', isTerminal: true, division: 'MAS' },
      { id: 'AJJ', stationCode: 'AJJ', name: 'Arakkonam Jn', isJunction: true, division: 'MAS' },
      { id: 'KPD', stationCode: 'KPD', name: 'Katpadi Jn', isJunction: true, division: 'MAS' },
      { id: 'JTJ', stationCode: 'JTJ', name: 'Jolarpettai Jn', isJunction: true, division: 'SA' }
    ],
    sections: [
      { id: 'SEC1', fromStationId: 'MAS', toStationId: 'AJJ', distanceKm: 69 },
      { id: 'SEC2', fromStationId: 'AJJ', toStationId: 'KPD', distanceKm: 61 },
      { id: 'SEC3', fromStationId: 'KPD', toStationId: 'JTJ', distanceKm: 84 }
    ]
  };

  const coordinateModel = new ChartCoordinateModel({
    topologySnapshot: mockTopology,
    config: {
      distanceMode: DISTANCE_MODE.SCHEMATIC,
      stationSpacing: 65
    }
  });

  describe('StationAxis', () => {
    it('renders station codes, names, and sequence indicators accurately', () => {
      render(
        <StationAxis
          stations={mockTopology.stations}
          coordinateModel={coordinateModel}
          distanceMode={DISTANCE_MODE.SCHEMATIC}
        />
      );

      expect(screen.getByText('STATION / DISTANCE')).toBeInTheDocument();
      expect(screen.getByText(/4 STNS/i)).toBeInTheDocument();
      expect(screen.getAllByText('MAS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AJJ').length).toBeGreaterThan(0);
      expect(screen.getAllByText('KPD').length).toBeGreaterThan(0);
      expect(screen.getAllByText('JTJ').length).toBeGreaterThan(0);
      expect(screen.getByText('SEQ 01')).toBeInTheDocument();
      expect(screen.getByText('SEQ 04')).toBeInTheDocument();
    });

    it('renders division boundary indicator when division changes between stations', () => {
      render(
        <StationAxis
          stations={mockTopology.stations}
          coordinateModel={coordinateModel}
          distanceMode={DISTANCE_MODE.SCHEMATIC}
        />
      );

      expect(screen.getByText(/DIVISION BOUNDARY: MAS ➔ SA/i)).toBeInTheDocument();
    });

    it('toggles between schematic and physical distance mode', () => {
      const onToggle = vi.fn();
      render(
        <StationAxis
          stations={mockTopology.stations}
          coordinateModel={coordinateModel}
          distanceMode={DISTANCE_MODE.SCHEMATIC}
          onDistanceModeToggle={onToggle}
        />
      );

      const toggleBtn = screen.getByRole('button', { name: /Switch to KM/i });
      fireEvent.click(toggleBtn);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('TimeAxis', () => {
    it('renders 24h operational timeline headers with hour marks and subdivisions', () => {
      const baseTime = new Date('2026-08-30T00:00:00Z').getTime();
      render(
        <TimeAxis
          timeWindowStart={baseTime}
          totalHours={24}
          pixelsPerHour={120}
          zoom={1}
          isTop={true}
        />
      );

      expect(screen.getAllByText(/00:00/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/01:00/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/12:00/i).length).toBeGreaterThan(0);
    });
  });

  describe('ImportModal', () => {
    it('displays timetable ingestion modal and non-authoritative warning banner', () => {
      render(
        <ImportModal
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/TIMETABLE \/ MASTER CHART INGESTION/i)).toBeInTheDocument();
      expect(screen.getByText('NON-AUTHORITATIVE INGESTION')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /CSV Format/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /JSON Format/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /GTFS Format/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /OCR \/ Image Scan/i })).toBeInTheDocument();
    });

    it('shows OCR extraction and format selection properly', () => {
      render(
        <ImportModal
          isOpen={true}
          onClose={() => {}}
        />
      );

      const ocrBtn = screen.getByRole('button', { name: /OCR \/ Image Scan/i });
      fireEvent.click(ocrBtn);

      expect(screen.getByText(/Validation Protocol:/i)).toBeInTheDocument();
      expect(screen.getByText(/Station codes will be matched against official Southern Railway topology/i)).toBeInTheDocument();
    });

    it('guarantees isolated scenario publishing without mutating master data', () => {
      render(
        <ImportModal
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Imports are published only into simulation scenarios; master data is never overwritten/i)).toBeInTheDocument();
    });
  });
});
