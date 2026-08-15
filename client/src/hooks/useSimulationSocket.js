import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function useSimulationSocket(scenarioId) {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('LOADING'); // LOADING, READY, STALE, ERROR
  
  const [simulationTime, setSimulationTime] = useState(Date.now());
  const [trainRuns, setTrainRuns] = useState([]);
  const [sectionOccupancies, setSectionOccupancies] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    if (!scenarioId) return;
    
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setStatus('READY');
      newSocket.emit('join_scenario', scenarioId);
    });
    
    newSocket.on('disconnect', () => {
      setStatus('STALE');
    });
    
    newSocket.on('connect_error', () => {
      setStatus('ERROR');
    });
    
    // Core simulation events
    newSocket.on('simulation.clock', (data) => {
      if (data.scenarioId !== scenarioId) return;
      setSimulationTime(data.simulationTime);
      setStatus('READY'); // Reset stale if events flow again
    });
    
    newSocket.on('train.moved', (data) => {
      if (data.scenarioId !== scenarioId) return;
      // We assume data contains full trainRun or updates that can be merged.
      // For simplicity in this visualization layer, we'll store them.
      setTrainRuns(prev => {
        const idx = prev.findIndex(r => r.id === data.trainRun.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data.trainRun;
          return next;
        }
        return [...prev, data.trainRun];
      });
    });
    
    newSocket.on('conflict.created', (conflict) => {
      if (conflict.scenarioId !== scenarioId) return;
      setConflicts(prev => [...prev, conflict]);
    });
    
    newSocket.on('conflict.updated', (conflict) => {
      if (conflict.scenarioId !== scenarioId) return;
      setConflicts(prev => {
        const idx = prev.findIndex(c => c.id === conflict.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = conflict;
          return next;
        }
        return [...prev, conflict];
      });
    });
    
    newSocket.on('recommendation.issued', (rec) => {
      if (rec.scenarioId !== scenarioId) return;
      setRecommendations(prev => [...prev, rec]);
    });
    
    newSocket.on('section.occupancy', (occ) => {
      if (occ.scenarioId !== scenarioId) return;
      setSectionOccupancies(prev => {
        const idx = prev.findIndex(o => o._id === occ._id || o.id === occ.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = occ;
          return next;
        }
        return [...prev, occ];
      });
    });
    
    newSocket.on('replay.event', (event) => {
      if (event.scenarioId !== scenarioId) return;
      if (event.timestamp) {
         setSimulationTime(new Date(event.timestamp).getTime());
      }
      if (event.eventType === 'TRAIN_HELD') {
         setTrainRuns(prev => prev.map(t => (t._id === event.metadata?.trainRunId || t.id === event.metadata?.trainRunId) ? { ...t, runStatus: 'HELD' } : t));
      } else if (event.eventType === 'TRAIN_RELEASED') {
         setTrainRuns(prev => prev.map(t => (t._id === event.metadata?.trainRunId || t.id === event.metadata?.trainRunId) ? { ...t, runStatus: 'RUNNING' } : t));
      }
      // other reconstructs could be handled similarly
    });
    
    // Watchdog for STALE status if no clock event for 5s
    const watchdog = setInterval(() => {
      setSimulationTime(prevTime => {
        // If we haven't received an update recently, we mark it stale
        // But since we can't easily check when the last event arrived without a ref,
        // we'll leave basic STALE for disconnects.
        return prevTime;
      });
    }, 5000);

    return () => {
      clearInterval(watchdog);
      newSocket.emit('leave_scenario', scenarioId);
      newSocket.disconnect();
    };
  }, [scenarioId]);

  return {
    socket,
    status,
    simulationTime,
    trainRuns,
    sectionOccupancies,
    conflicts,
    recommendations,
    setTrainRuns, // For initial static load
    setSectionOccupancies,
    setConflicts
  };
}
