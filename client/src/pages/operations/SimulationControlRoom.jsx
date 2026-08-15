/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ControlChart } from '../../components/control-chart/ControlChart';
import { DISTANCE_MODE } from '../../components/control-chart/ChartCoordinateModel';
import { useSimulationSocket } from '../../hooks/useSimulationSocket';

export default function SimulationControlRoom() {
  const { scenarioId } = useParams();
  
  // Real-time state from Socket
  const {
    status: socketStatus,
    simulationTime,
    trainRuns,
    sectionOccupancies,
    conflicts,
    recommendations,
    setTrainRuns,
    setSectionOccupancies,
    setConflicts
  } = useSimulationSocket(scenarioId);

  // Static snapshot state
  const [topologySnapshot, setTopologySnapshot] = useState(null);
  const [timetableSnapshot, setTimetableSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI Controls
  const [distanceMode, setDistanceMode] = useState(DISTANCE_MODE.SCHEMATIC);
  const [whatIfOverlay, setWhatIfOverlay] = useState(null);
  
  // Replay
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayTime, setReplayTime] = useState(Date.now());

  useEffect(() => {
    async function fetchSnapshots() {
      if (!scenarioId) return;
      try {
        setLoading(true);
        // We'll fetch the scenario details to get the snapshots and initial train runs
        const { data } = await axios.get(`/api/operations/scenarios/${scenarioId}`);
        setTopologySnapshot(data.topologySnapshot);
        setTimetableSnapshot(data.timetableSnapshot);
        
        // Load initial train runs if any
        if (data.trainRuns) setTrainRuns(data.trainRuns);
        
        // Fetch initial occupancies and conflicts
        const occRes = await axios.get(`/api/operations/sections?scenarioId=${scenarioId}`);
        if (occRes.data && occRes.data.data) {
          setSectionOccupancies(occRes.data.data);
        }
        
        const conflictRes = await axios.get(`/api/operations/conflicts?scenarioId=${scenarioId}`);
        if (conflictRes.data && conflictRes.data.data) {
          setConflicts(conflictRes.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load scenario data.');
      } finally {
        setLoading(false);
      }
    }
    fetchSnapshots();
  }, [scenarioId, setTrainRuns, setSectionOccupancies, setConflicts]);

  if (loading) {
    return <div className="p-8 text-white">LOADING...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">ERROR: {error}</div>;
  }

  const handleContextMenuAction = async (actionType, data) => {
    try {
      const payload = { sessionId: 'mock-session', actionId: Date.now().toString() };
      let endpoint = '';
      if (actionType === 'HOLD_TRAIN') endpoint = `/api/operations/trains/${data._id || data.id}/hold`;
      if (actionType === 'RELEASE_TRAIN') endpoint = `/api/operations/trains/${data._id || data.id}/release`;
      if (actionType === 'ACKNOWLEDGE_CONFLICT') endpoint = `/api/operations/conflicts/${data._id || data.id}/acknowledge`;
      if (actionType === 'RESOLVE_CONFLICT') endpoint = `/api/operations/conflicts/${data._id || data.id}/resolve`;
      
      if (endpoint) {
        await axios.post(endpoint, payload);
        alert(`Action ${actionType} sent successfully.`);
      }
    } catch (err) {
      alert(`Failed to execute ${actionType}: ` + (err.response?.data?.error || err.message));
    }
  };

  const handleRecommendationClick = async (rec) => {
    try {
      const res = await axios.post(`/api/operations/recommendations/${rec._id || rec.id}/what-if`);
      setWhatIfOverlay({
        trainRun: rec.affectedTrains?.[0], // Simplification
        projectedKpi: res.data.data.projectedKpi,
        recommendation: rec
      });
    } catch (err) {
      alert('What-If evaluation failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header Panel */}
      <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
        <div>
          <h1 className="text-xl font-bold">Simulation Control Chart</h1>
          <div className="text-sm text-gray-400">Scenario: {scenarioId}</div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              socketStatus === 'READY' ? 'bg-green-900 text-green-300' :
              socketStatus === 'STALE' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {socketStatus}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Mode:</span>
            <select
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              value={distanceMode}
              onChange={(e) => setDistanceMode(e.target.value)}
            >
              <option value={DISTANCE_MODE.SCHEMATIC}>Schematic</option>
              <option value={DISTANCE_MODE.PHYSICAL}>Physical Distance</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded border border-gray-700">
            <span className="text-sm text-gray-400">Replay:</span>
            <button 
              className="text-white hover:text-green-400 px-2"
              onClick={async () => {
                try {
                  const url = `/api/scenarios/${scenarioId}/replay/${isReplaying ? 'stop' : 'play'}`;
                  await axios.post(url, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                  setIsReplaying(!isReplaying);
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              {isReplaying ? 'Pause' : 'Play'}
            </button>
            {isReplaying && (
              <input type="range" className="w-24" />
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 overflow-hidden relative">
        {whatIfOverlay && (
          <div className="absolute top-2 right-2 bg-gray-800 border border-gray-600 p-4 rounded shadow-xl z-40 w-64 text-sm">
            <div className="font-bold text-green-400 border-b border-gray-700 pb-2 mb-2">What-If Projection</div>
            <div className="text-gray-300">Throughput Delta: {whatIfOverlay.projectedKpi?.throughputDelta}</div>
            <div className="text-gray-300">Delay Delta: {whatIfOverlay.projectedKpi?.delayDelta}</div>
            <button 
              className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-1 rounded"
              onClick={() => setWhatIfOverlay(null)}
            >
              Close Projection
            </button>
          </div>
        )}
        {(socketStatus === 'STALE' || socketStatus === 'ERROR') && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-red-900 text-white text-center py-1">
            WARNING: Connection {socketStatus}. Displayed state may be stale.
          </div>
        )}
        
        <ControlChart
          topologySnapshot={topologySnapshot}
          timetableSnapshot={timetableSnapshot}
          trainRuns={trainRuns}
          sectionOccupancies={sectionOccupancies}
          conflicts={conflicts}
          recommendations={recommendations}
          simulationTime={isReplaying ? replayTime : simulationTime}
          distanceMode={distanceMode}
          width={window.innerWidth}
          height={window.innerHeight - 80}
          onContextMenuAction={handleContextMenuAction}
          onRecommendationClick={handleRecommendationClick}
          whatIfOverlay={whatIfOverlay}
        />
      </div>
    </div>
  );
}
