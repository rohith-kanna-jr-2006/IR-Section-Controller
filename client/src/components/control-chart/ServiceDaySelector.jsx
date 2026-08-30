import React from 'react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * ServiceDaySelector
 * 
 * Allows Section Controllers to select the operational Service Date & Day.
 * Adheres to Indian Railways service day boundary rules (overnight train
 * services belong to origin departure service day).
 */
export default function ServiceDaySelector({
  serviceDate = '2026-08-30',
  onChange,
  disabled = false
}) {
  const dateObj = new Date(serviceDate || Date.now());
  const dayName = !isNaN(dateObj.getTime()) ? DAYS_OF_WEEK[dateObj.getUTCDay()] : 'Sunday';

  const handleDateChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor="service-date-selector" className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
        <span>5. Service Day</span>
        <span className="text-amber-400 font-semibold lowercase">({dayName})</span>
      </label>
      <div className="flex items-center space-x-1.5">
        <input
          id="service-date-selector"
          type="date"
          value={serviceDate}
          onChange={handleDateChange}
          disabled={disabled}
          aria-label="Service Date"
          className="bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono flex-1"
        />
      </div>
    </div>
  );
}
