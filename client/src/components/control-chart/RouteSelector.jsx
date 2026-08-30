import React from 'react';

/**
 * RouteSelector
 * 
 * Distinct from Section: Route represents a major operational corridor
 * (e.g. West Line MAS-JTJ, North Line MAS-GDR, Mainline JTJ-SA-ED-CBE)
 * comprising constituent block sections.
 */
export default function RouteSelector({
  routes = [],
  selectedRouteId = '',
  onChange,
  disabled = false,
  isLoading = false,
  selectedDivisionId = ''
}) {
  const isDivisionChosen = Boolean(selectedDivisionId);

  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor="route-selector" className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
        4. Operational Corridor / Route
      </label>
      <select
        id="route-selector"
        value={selectedRouteId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || !isDivisionChosen || isLoading}
        aria-label="Operational Route Selector"
        className="bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono transition-colors"
      >
        {!isDivisionChosen ? (
          <option value="">-- Select Division First --</option>
        ) : routes.length === 0 ? (
          <option value="">-- Standard Division Route --</option>
        ) : (
          <>
            <option value="">-- Select Route / Corridor --</option>
            {routes.map((route) => {
              const rId = route.id || route.routeName || route.routeCode;
              return (
                <option key={`route-${rId}`} value={rId}>
                  {route.routeName || route.name || route.routeCode}
                </option>
              );
            })}
          </>
        )}
      </select>
    </div>
  );
}
