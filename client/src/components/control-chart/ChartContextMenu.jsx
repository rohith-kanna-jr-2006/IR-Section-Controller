import React from 'react';

/**
 * ChartContextMenu
 * 
 * Right-click operational context menu for trains, conflicts, and block sections.
 * Enforces simulation-only actions (Hold, Release, What-If, Acknowledge, Resolve).
 */
export default function ChartContextMenu({
  menuState,
  onClose,
  onHoldTrain,
  onReleaseTrain,
  onWhatIfTrain,
  onAcknowledgeConflict,
  onResolveConflict,
  onViewTrainSchedule,
  onViewConflictDetails
}) {
  if (!menuState || !menuState.isOpen) return null;

  const { targetType, targetData, position } = menuState;

  return (
    <div
      className="fixed z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-md py-1.5 w-56 text-xs font-mono text-slate-200"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 240)}px`,
        top: `${Math.min(position.y, window.innerHeight - 260)}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {targetType === 'TRAIN' && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
            Train {targetData.trainId?.trainNumber || targetData.trainNumber || 'Action'}
          </div>

          <button
            onClick={() => {
              onViewTrainSchedule && onViewTrainSchedule(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-cyan-400 flex items-center space-x-2 transition-colors"
          >
            <span>📋</span>
            <span>View Full Timetable</span>
          </button>

          <button
            onClick={() => {
              onWhatIfTrain && onWhatIfTrain(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-emerald-400 flex items-center space-x-2 transition-colors"
          >
            <span>⚡</span>
            <span>Run What-If Scenario</span>
          </button>

          <div className="border-t border-slate-800 my-1" />

          <button
            onClick={() => {
              onHoldTrain && onHoldTrain(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-amber-950/60 hover:text-amber-300 text-amber-400 flex items-center space-x-2 transition-colors"
          >
            <span>🛑</span>
            <span>Hold Train (Sim-Only)</span>
          </button>

          <button
            onClick={() => {
              onReleaseTrain && onReleaseTrain(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-950/60 hover:text-emerald-300 text-emerald-400 flex items-center space-x-2 transition-colors"
          >
            <span>🟢</span>
            <span>Release Train (Sim-Only)</span>
          </button>
        </>
      )}

      {targetType === 'CONFLICT' && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold text-red-400 border-b border-slate-800 uppercase tracking-wider">
            ⚠ Conflict Resolution
          </div>

          <button
            onClick={() => {
              onViewConflictDetails && onViewConflictDetails(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-cyan-400 flex items-center space-x-2 transition-colors"
          >
            <span>🔍</span>
            <span>Inspect Conflict</span>
          </button>

          <button
            onClick={() => {
              onAcknowledgeConflict && onAcknowledgeConflict(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-amber-400 flex items-center space-x-2 transition-colors"
          >
            <span>👁</span>
            <span>Acknowledge Conflict</span>
          </button>

          <button
            onClick={() => {
              onResolveConflict && onResolveConflict(targetData);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-950/60 hover:text-emerald-300 text-emerald-400 flex items-center space-x-2 transition-colors"
          >
            <span>✅</span>
            <span>Mark Resolved</span>
          </button>
        </>
      )}
    </div>
  );
}
