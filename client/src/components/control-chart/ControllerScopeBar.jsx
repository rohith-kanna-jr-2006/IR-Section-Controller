import React, { useState, useEffect } from 'react';
import ZoneSelector from './ZoneSelector';
import DivisionSelector from './DivisionSelector';
import SectionSelector from './SectionSelector';
import RouteSelector from './RouteSelector';
import ServiceDaySelector from './ServiceDaySelector';
import ScenarioSelector from './ScenarioSelector';
import ScopeBreadcrumb from './ScopeBreadcrumb';

/**
 * ControllerScopeBar
 * 
 * Top-level control bar displayed above the Master Chart workspace.
 * Enforces the strict Indian Railways operational hierarchy:
 * ZONE → DIVISION → ROUTE / CORRIDOR → SECTION → SERVICE DAY → SCENARIO → LOAD MASTER CHART
 */
export default function ControllerScopeBar({
  zones = [],
  divisions = [],
  sections = [],
  routes = [],
  scenarios = [],
  selectedZoneId = '',
  selectedDivisionId = '',
  selectedRouteId = '',
  selectedSectionId = '',
  serviceDate = '2026-08-30',
  selectedScenarioId = '',
  isChartLoaded = false,
  isLoading = false,
  onZoneChange,
  onDivisionChange,
  onRouteChange,
  onSectionChange,
  onServiceDateChange,
  onScenarioChange,
  onLoadMasterChart,
  onResetScope,
  onResetView
}) {
  const [announcement, setAnnouncement] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Announce selection changes for accessibility
  const handleZoneChange = (zoneId) => {
    const zoneObj = zones.find(z => (z._id || z.id || z.code) === zoneId);
    setAnnouncement(`Zone selected: ${zoneObj ? zoneObj.name : 'All India'}. Division, route and section scope reset.`);
    onZoneChange && onZoneChange(zoneId);
  };

  const handleDivisionChange = (divId) => {
    const divObj = divisions.find(d => (d._id || d.id || d.code) === divId);
    setAnnouncement(`Division selected: ${divObj ? divObj.name : 'All Divisions'}. Route and section scope reset.`);
    onDivisionChange && onDivisionChange(divId);
  };

  const handleRouteChange = (routeId) => {
    const routeObj = routes.find(r => (r.id || r.routeName || r.routeCode) === routeId);
    setAnnouncement(`Route corridor selected: ${routeObj ? routeObj.routeName : 'Default Route'}. Section scope updated.`);
    onRouteChange && onRouteChange(routeId);
  };

  const handleSectionChange = (secId) => {
    const secObj = sections.find(s => (s._id || s.id || s.sectionCode || s.routeName) === secId);
    setAnnouncement(`Section selection updated: ${secObj ? (secObj.sectionCode || secObj.routeName) : 'All Sections'}`);
    onSectionChange && onSectionChange(secId);
  };

  // Find active entity names for the canonical breadcrumb
  const currentZone = zones.find(z => (z._id || z.id || z.code) === selectedZoneId);
  const currentDiv = divisions.find(d => (d._id || d.id || d.code) === selectedDivisionId);
  const currentRoute = routes.find(r => (r.id || r.routeName || r.routeCode) === selectedRouteId);
  const currentSec = sections.find(s => (s._id || s.id || s.sectionCode || s.routeName) === selectedSectionId);
  const currentScen = scenarios.find(s => (s._id || s.id || s.scenarioId) === selectedScenarioId);

  const zoneName = currentZone ? `${currentZone.code} - ${currentZone.name}` : (selectedZoneId ? selectedZoneId : '');
  const divisionName = currentDiv ? `${currentDiv.code} - ${currentDiv.name}` : (selectedDivisionId ? selectedDivisionId : '');
  const routeName = currentRoute?.routeName || selectedRouteId || '';
  const sectionName = currentSec ? (currentSec.sectionCode || currentSec.routeName) : (selectedSectionId && selectedSectionId !== 'ALL_SECTIONS' ? selectedSectionId : '');
  const scenarioName = currentScen ? currentScen.name || currentScen.scenarioId : selectedScenarioId;

  return (
    <div className="bg-slate-900 border-b border-slate-700 shadow-lg text-slate-100 font-mono select-none z-30 transition-all">
      {/* Screen Reader ARIA Live Announcer */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Main Hierarchy Scope Form */}
      <div className="px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700 rounded text-[11px] font-bold tracking-wider">
              CONTROL SCOPE
            </span>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              OPERATIONAL TERRITORY & DISPATCH WORKFLOW
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* View / Scope Action Buttons */}
            <button
              id="reset-view-btn"
              onClick={onResetView}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded text-xs font-semibold flex items-center space-x-1"
              title="Reset Zoom and Pan (keeps scope)"
            >
              <span>🔍</span>
              <span>RESET VIEW</span>
            </button>

            <button
              id="reset-scope-btn"
              onClick={onResetScope}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 rounded text-xs font-semibold flex items-center space-x-1"
              title="Clear Zone/Division/Route/Section selection and unload chart"
            >
              <span>↺</span>
              <span>RESET SCOPE</span>
            </button>

            <button
              id="toggle-scope-bar-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs md:hidden"
              title="Toggle Scope Form"
            >
              {isExpanded ? '▲ Compact' : '▼ Expand'}
            </button>
          </div>
        </div>

        {/* 6-Step Selection Grid: Strict Indian Railways Hierarchy */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-1.5 pb-2.5 items-stretch">
            {/* Step 1: Zone */}
            <ZoneSelector
              zones={zones}
              selectedZoneId={selectedZoneId}
              onChange={handleZoneChange}
              isLoading={isLoading}
            />

            {/* Step 2: Division */}
            <DivisionSelector
              divisions={divisions}
              selectedDivisionId={selectedDivisionId}
              selectedZoneId={selectedZoneId}
              onChange={handleDivisionChange}
              isLoading={isLoading}
            />

            {/* Step 3: Route / Corridor */}
            <RouteSelector
              routes={routes}
              selectedRouteId={selectedRouteId}
              selectedDivisionId={selectedDivisionId}
              onChange={handleRouteChange}
              isLoading={isLoading}
            />

            {/* Step 4: Section */}
            <SectionSelector
              sections={sections}
              selectedSectionId={selectedSectionId}
              selectedDivisionId={selectedDivisionId}
              selectedRouteId={selectedRouteId}
              onChange={handleSectionChange}
              isLoading={isLoading}
            />

            {/* Step 5: Service Day */}
            <ServiceDaySelector
              serviceDate={serviceDate}
              onChange={onServiceDateChange}
            />

            {/* Step 6: Scenario */}
            <ScenarioSelector
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onChange={onScenarioChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Action Bar with Breadcrumb and Big LOAD MASTER CHART trigger */}
        <div className="pt-2 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <ScopeBreadcrumb
            zoneName={zoneName}
            divisionName={divisionName}
            routeName={routeName}
            sectionName={sectionName}
            serviceDate={serviceDate}
            scenarioName={scenarioName}
            isLoaded={isChartLoaded}
          />

          <div className="flex items-center space-x-2">
            <button
              id="load-master-chart-btn"
              onClick={onLoadMasterChart}
              disabled={isLoading || !selectedZoneId}
              className={`px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                !selectedZoneId
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : isChartLoaded
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse shadow-[0_0_14px_rgba(16,185,129,0.5)]'
              }`}
            >
              <span>{isLoading ? '⏳' : isChartLoaded ? '⚡' : '▶'}</span>
              <span>{isLoading ? 'LOADING DATA...' : isChartLoaded ? 'RELOAD MASTER CHART' : 'LOAD MASTER CHART'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
