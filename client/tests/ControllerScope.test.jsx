// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ZoneSelector from '../src/components/control-chart/ZoneSelector.jsx';
import DivisionSelector from '../src/components/control-chart/DivisionSelector.jsx';
import SectionSelector from '../src/components/control-chart/SectionSelector.jsx';
import RouteSelector from '../src/components/control-chart/RouteSelector.jsx';
import ServiceDaySelector from '../src/components/control-chart/ServiceDaySelector.jsx';
import ScenarioSelector from '../src/components/control-chart/ScenarioSelector.jsx';
import ScopeBreadcrumb from '../src/components/control-chart/ScopeBreadcrumb.jsx';
import ScopeStatus from '../src/components/control-chart/ScopeStatus.jsx';
import ControllerScopeBar from '../src/components/control-chart/ControllerScopeBar.jsx';
import LeftControlPanel from '../src/components/control-chart/LeftControlPanel.jsx';
import RightControlPanel from '../src/components/control-chart/RightControlPanel.jsx';

describe('Phase 6.2 — Master Chart Controller Scope & Operational Hierarchy', () => {
  const mockZones = [
    { _id: 'SR', code: 'SR', name: 'Southern Railway', headquarters: 'Chennai' },
    { _id: 'SWR', code: 'SWR', name: 'South Western Railway', headquarters: 'Hubballi' }
  ];

  const mockDivisions = [
    { _id: 'MAS', code: 'MAS', name: 'Chennai', zoneCode: 'SR' },
    { _id: 'SA', code: 'SA', name: 'Salem', zoneCode: 'SR' }
  ];

  const mockSections = [
    { _id: 'SEC_MAS_AJJ', sectionCode: 'MAS-AJJ', fromStationCode: 'MAS', toStationCode: 'AJJ', isCandidate: false },
    { _id: 'SEC_AJJ_KPD', sectionCode: 'AJJ-KPD', fromStationCode: 'AJJ', toStationCode: 'KPD', isCandidate: true }
  ];

  const mockRoutes = [
    { id: 'West Line (MAS-JTJ)', routeName: 'West Line (MAS-JTJ)', divisionCode: 'MAS' },
    { id: 'North Line (MAS-GDR)', routeName: 'North Line (MAS-GDR)', divisionCode: 'MAS' }
  ];

  const mockScenarios = [
    { scenarioId: 'SCEN_PEAK_001', name: 'Peak Morning Corridor', status: 'RUNNING' },
    { scenarioId: 'SCEN_FREIGHT_002', name: 'Freight Precedence', status: 'READY' }
  ];

  it('1. Zone selection renders all zones with code and name', () => {
    const handleZoneChange = vi.fn();
    render(
      <ZoneSelector
        zones={mockZones}
        selectedZoneId="SR"
        onChange={handleZoneChange}
      />
    );

    const select = screen.getByLabelText(/Railway Zone Selector/i);
    expect(select).toBeDefined();
    expect(select.value).toBe('SR');

    fireEvent.change(select, { target: { value: 'SWR' } });
    expect(handleZoneChange).toHaveBeenCalledWith('SWR');
  });

  it('2. Division selector filters by Zone and handles unselected zone', () => {
    const handleDivChange = vi.fn();
    const { rerender } = render(
      <DivisionSelector
        divisions={[]}
        selectedDivisionId=""
        selectedZoneId=""
        onChange={handleDivChange}
      />
    );

    expect(screen.getByText(/-- Select Zone First --/i)).toBeDefined();

    rerender(
      <DivisionSelector
        divisions={mockDivisions}
        selectedDivisionId="MAS"
        selectedZoneId="SR"
        onChange={handleDivChange}
      />
    );

    const select = screen.getByLabelText(/Railway Division Selector/i);
    expect(select.value).toBe('MAS');

    fireEvent.change(select, { target: { value: 'SA' } });
    expect(handleDivChange).toHaveBeenCalledWith('SA');
  });

  it('3. Section selector displays candidate reference provenance', () => {
    const handleSecChange = vi.fn();
    render(
      <SectionSelector
        sections={mockSections}
        selectedSectionId="SEC_AJJ_KPD"
        selectedDivisionId="MAS"
        onChange={handleSecChange}
      />
    );

    const select = screen.getByLabelText(/Railway Block Section Selector/i);
    expect(select.value).toBe('SEC_AJJ_KPD');
    expect(screen.getByText(/AJJ-KPD \[SECONDARY REFERENCE\]/i)).toBeDefined();
    expect(screen.getByText(/MAS-AJJ \[VERIFIED\]/i)).toBeDefined();
  });

  it('4. Route selector is distinct from Section and displays corridors', () => {
    const handleRouteChange = vi.fn();
    render(
      <RouteSelector
        routes={mockRoutes}
        selectedRouteId="West Line (MAS-JTJ)"
        selectedDivisionId="MAS"
        onChange={handleRouteChange}
      />
    );

    const select = screen.getByLabelText(/Operational Route Selector/i);
    expect(select.value).toBe('West Line (MAS-JTJ)');
    expect(screen.getByText(/North Line \(MAS-GDR\)/i)).toBeDefined();
  });

  it('5. ServiceDaySelector handles date and day-of-week calculation', () => {
    const handleDateChange = vi.fn();
    render(
      <ServiceDaySelector
        serviceDate="2026-08-30"
        onChange={handleDateChange}
      />
    );

    expect(screen.getByText(/sunday/i)).toBeDefined();

    const input = screen.getByLabelText(/Service Date/i);
    fireEvent.change(input, { target: { value: '2026-09-02' } });
    expect(handleDateChange).toHaveBeenCalledWith('2026-09-02');
  });

  it('6. ScenarioSelector displays status tag', () => {
    const handleScenChange = vi.fn();
    render(
      <ScenarioSelector
        scenarios={mockScenarios}
        selectedScenarioId="SCEN_PEAK_001"
        onChange={handleScenChange}
      />
    );

    const select = screen.getByLabelText(/Simulation Scenario Selector/i);
    expect(select.value).toBe('SCEN_PEAK_001');
    expect(screen.getByText(/Peak Morning Corridor \[RUNNING\]/i)).toBeDefined();
  });

  it('7. ScopeBreadcrumb shows exact hierarchy', () => {
    const { container } = render(
      <ScopeBreadcrumb
        zoneName="SR - SOUTHERN RAILWAY"
        divisionName="MAS - CHENNAI DIVISION"
        sectionOrRouteName="WEST LINE (MAS-JTJ)"
        serviceDate="2026-08-30"
        isLoaded={true}
      />
    );

    expect(container.textContent).toContain('INDIAN RAILWAYS');
    expect(container.textContent).toContain('SR - SOUTHERN RAILWAY');
    expect(container.textContent).toContain('MAS - CHENNAI DIVISION');
    expect(container.textContent).toContain('WEST LINE (MAS-JTJ)');
    expect(container.textContent).toContain('ACTIVE SCOPE');
  });

  it('8. ScopeStatus displays data authority and count metrics', () => {
    render(
      <ScopeStatus
        zoneName="SR"
        divisionName="MAS"
        routeName="West Line (MAS-JTJ)"
        serviceDate="2026-08-30"
        isReferenceData={true}
        totalStations={56}
        totalSections={55}
        activeTrainsCount={18}
      />
    );

    expect(screen.getByText(/SECONDARY REFERENCE DATA/i)).toBeDefined();
    expect(screen.getByText(/56/i)).toBeDefined();
    expect(screen.getByText(/18/i)).toBeDefined();
  });

  it('9. ControllerScopeBar triggers Load Master Chart and Reset Scope', () => {
    const handleLoad = vi.fn();
    const handleResetScope = vi.fn();
    const handleResetView = vi.fn();

    render(
      <ControllerScopeBar
        zones={mockZones}
        divisions={mockDivisions}
        sections={mockSections}
        routes={mockRoutes}
        scenarios={mockScenarios}
        selectedZoneId="SR"
        selectedDivisionId="MAS"
        selectedRouteId="West Line (MAS-JTJ)"
        serviceDate="2026-08-30"
        selectedScenarioId="SCEN_PEAK_001"
        isChartLoaded={false}
        onLoadMasterChart={handleLoad}
        onResetScope={handleResetScope}
        onResetView={handleResetView}
      />
    );

    const loadBtn = screen.getByText(/LOAD MASTER CHART/i);
    fireEvent.click(loadBtn);
    expect(handleLoad).toHaveBeenCalledTimes(1);

    const resetScopeBtn = screen.getByText(/RESET SCOPE/i);
    fireEvent.click(resetScopeBtn);
    expect(handleResetScope).toHaveBeenCalledTimes(1);

    const resetViewBtn = screen.getByText(/RESET VIEW/i);
    fireEvent.click(resetViewBtn);
    expect(handleResetView).toHaveBeenCalledTimes(1);
  });

  it('10. LeftControlPanel separates Control Scope, Train Filters, and Display Toggles', () => {
    render(
      <LeftControlPanel
        isOpen={true}
        selectedZoneId="SR"
        selectedDivisionId="MAS"
        selectedRouteId="West Line (MAS-JTJ)"
        serviceDate="2026-08-30"
        isChartLoaded={true}
        totalTrains={20}
        visibleTrains={15}
        searchTerm=""
        onSearchChange={() => {}}
      />
    );

    expect(screen.getByText(/A\. CONTROL SCOPE/i)).toBeDefined();
    expect(screen.getByText(/B\. TRAIN FILTERS/i)).toBeDefined();
    expect(screen.getByText(/C\. DISPLAY TOGGLES/i)).toBeDefined();
    expect(screen.getByText(/Showing/i)).toBeDefined();
  });

  it('11. RightControlPanel displays Cross-Division traversal info and Conflicts', () => {
    const mockConflict = {
      _id: 'CONF_001',
      type: 'CROSSING CONFLICT',
      severity: 'CRITICAL',
      trainRunIds: ['12601', '12604'],
      estimatedTime: Date.now()
    };

    const mockTrain = {
      _id: 'TR_12601',
      trainNumber: '12601',
      trainName: 'Mangalore Mail',
      stops: [
        { stationCode: 'MAS', arrival: '20:10', departure: '20:15', haltMinutes: 5 },
        { stationCode: 'AJJ', arrival: '21:05', departure: '21:07', haltMinutes: 2 }
      ]
    };

    render(
      <RightControlPanel
        isOpen={true}
        conflicts={[mockConflict]}
        selectedTrain={mockTrain}
        events={[]}
      />
    );

    expect(screen.getByText(/CROSSING CONFLICT/i)).toBeDefined();
    expect(screen.getByText(/12601 × 12604/i)).toBeDefined();
  });

  it('12. Empty states for divisions and sections render cleanly', () => {
    render(
      <DivisionSelector
        divisions={[]}
        selectedDivisionId=""
        selectedZoneId="SWR"
      />
    );

    expect(screen.getByText(/No divisions are available for this zone\./i)).toBeDefined();
  });
});
