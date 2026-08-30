import React from 'react';

/**
 * LeftControlPanel
 * 
 * Strict operational sidebar for:
 * 1. TRAIN FILTERS (Which trains are visible inside the loaded operational territory)
 * 2. DISPLAY TOGGLES (Visual layers and overlays)
 * 3. CHART CONTROLS (Coordinate mode, grid, labels, time window)
 * 
 * Scope selection belongs exclusively to the top-level ControllerScopeBar.
 */
export default function LeftControlPanel({
  isOpen,
  onToggle,
  // Train Filter properties
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'ALL',
  onCategoryChange,
  selectedDirection = 'ALL',
  onDirectionChange,
  delayedOnly = false,
  onDelayedOnlyChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  // Display toggles
  distanceMode = 'SCHEMATIC_TOPOLOGY',
  onDistanceModeChange,
  showLabels = true,
  onToggleLabels,
  showScheduled = true,
  onToggleScheduled,
  showActual = true,
  onToggleActual,
  showOccupancies = true,
  onToggleOccupancies,
  showConflicts = true,
  onToggleConflicts,
  showRecommendations = true,
  onToggleRecommendations,
  showGrid = true,
  onToggleGrid,
  totalTrains = 0,
  visibleTrains = 0
}) {
  return (
    <aside
      aria-label="Controller Sidebar"
      className={`h-full bg-slate-900 border-r border-slate-700 flex flex-col text-xs font-mono text-slate-200 transition-all duration-200 z-30 ${
        isOpen ? 'w-72' : 'w-10'
      }`}
    >
      {/* Header / Toggle Button */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        {isOpen && (
          <div>
            <div className="font-bold text-cyan-400 text-xs tracking-wider">SECTION CONTROLLER</div>
            <div className="text-[10px] text-slate-400">
              Showing <span className="text-emerald-400 font-bold">{visibleTrains}</span> of <span className="text-slate-300 font-bold">{totalTrains}</span> trains
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded ml-auto"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 space-y-4 flex-1 overflow-y-auto divide-y divide-slate-800/80">
          
          {/* SECTION 1: TRAIN FILTERS (Visibility within territory) */}
          <div className="space-y-3 pt-1 first:pt-0">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
              <span>🔍</span>
              <span>TRAIN FILTERS</span>
            </div>

            {/* Train Search */}
            <div>
              <label htmlFor="filter-train-search" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Train Number / Name
              </label>
              <input
                id="filter-train-search"
                type="text"
                placeholder="Search (e.g. 12601, Vande...)"
                value={searchTerm}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="filter-service-cat" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Service Category
              </label>
              <select
                id="filter-service-cat"
                value={selectedCategory}
                onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="ALL">All Categories</option>
                <option value="VANDE_BHARAT">Vande Bharat Express</option>
                <option value="SUPERFAST">Superfast / Shatabdi</option>
                <option value="EXPRESS">Mail / Express</option>
                <option value="PASSENGER">Suburban / Passenger</option>
                <option value="FREIGHT">Freight / Goods</option>
              </select>
            </div>

            {/* Direction Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Direction
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded border border-slate-700">
                {['ALL', 'DOWN', 'UP'].map((dir) => (
                  <button
                    key={`dir-${dir}`}
                    onClick={() => onDirectionChange && onDirectionChange(dir)}
                    className={`py-1 rounded text-[10px] font-bold transition-colors ${
                      selectedDirection === dir
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            {onStatusFilterChange && (
              <div>
                <label htmlFor="filter-status" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Run Status
                </label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="RUNNING">Running / On-Time</option>
                  <option value="DELAYED">Delayed Only</option>
                  <option value="SCHEDULED">Scheduled (Not Started)</option>
                </select>
              </div>
            )}

            {/* Delayed Only Checkbox */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={delayedOnly}
                  onChange={(e) => onDelayedOnlyChange && onDelayedOnlyChange(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Delayed Trains Only (&gt;0m)</span>
              </label>
            </div>
          </div>

          {/* SECTION 2: DISPLAY TOGGLES */}
          <div className="space-y-3 pt-3">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
              <span>👁</span>
              <span>DISPLAY LAYERS</span>
            </div>

            {/* Visual Layers Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showScheduled}
                  onChange={(e) => onToggleScheduled && onToggleScheduled(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Scheduled Paths</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showActual}
                  onChange={(e) => onToggleActual && onToggleActual(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Real-Time / Actual Paths</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOccupancies}
                  onChange={(e) => onToggleOccupancies && onToggleOccupancies(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Section Occupancies</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConflicts}
                  onChange={(e) => onToggleConflicts && onToggleConflicts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Conflict Beacons</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRecommendations}
                  onChange={(e) => onToggleRecommendations && onToggleRecommendations(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">AI Recommendations</span>
              </label>
            </div>
          </div>

          {/* SECTION 3: CHART CONTROLS */}
          <div className="space-y-3 pt-3">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
              <span>📐</span>
              <span>CHART CONTROLS</span>
            </div>

            {/* Distance Mode Toggle */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Coordinate Layout Mode
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded border border-slate-700">
                <button
                  onClick={() => onDistanceModeChange && onDistanceModeChange('SCHEMATIC_TOPOLOGY')}
                  className={`py-1 rounded text-[10px] font-bold transition-colors ${
                    distanceMode === 'SCHEMATIC_TOPOLOGY' || distanceMode === 'SCHEMATIC'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SCHEMATIC
                </button>
                <button
                  onClick={() => onDistanceModeChange && onDistanceModeChange('PHYSICAL_DISTANCE')}
                  className={`py-1 rounded text-[10px] font-bold transition-colors ${
                    distanceMode === 'PHYSICAL_DISTANCE' || distanceMode === 'PHYSICAL'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PHYSICAL (KM)
                </button>
              </div>
            </div>

            {/* Labels and Grid */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => onToggleLabels && onToggleLabels(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Train Labels & Numbers</span>
              </label>

              {onToggleGrid && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => onToggleGrid(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 text-xs">Time-Distance Grid</span>
                </label>
              )}
            </div>
          </div>

        </div>
      )}
    </aside>
  );
}
