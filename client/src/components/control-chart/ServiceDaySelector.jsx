import React from 'react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * ServiceDaySelector
 * 
 * Allows Section Controllers to select the operational Service Date & Day.
 * Adheres to Indian Railways service day boundary rules (overnight train
 * services belong to origin departure service day).
 * Step 05 in the canonical controller hierarchy.
 */
export default function ServiceDaySelector({
  serviceDate = '2026-08-30',
  onChange,
  disabled = false
}) {
  const dateObj = new Date(serviceDate || Date.now());
  const dayName = !isNaN(dateObj.getTime()) ? DAYS_OF_WEEK[dateObj.getUTCDay()] : 'Sunday';
  const dayShort = dayName.slice(0, 3).toUpperCase();

  const handleDateChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col space-y-1.5 p-2 rounded-lg border bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all focus-within:border-cyan-700/60">
      <div className="flex items-center justify-between">
        <label htmlFor="service-date-selector" className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider uppercase cursor-pointer">
          <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-amber-500 text-slate-950">
            05
          </span>
          <span className="text-slate-200">
            Service Day
          </span>
        </label>
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono uppercase">
          {dayName}
        </span>
      </div>

      <div className="relative">
        <input
          id="service-date-selector"
          type="date"
          value={serviceDate}
          onChange={handleDateChange}
          disabled={disabled}
          aria-label="Service Date"
          className="w-full bg-slate-950/90 border border-slate-700/80 text-slate-100 text-xs rounded-md px-2.5 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-50 font-mono transition-all cursor-pointer hover:border-slate-600"
        />
      </div>
    </div>
  );
}

