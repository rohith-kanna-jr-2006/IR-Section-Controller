import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api.js';
import ErrorState from '../../components/ErrorState.js';
import IntelligencePanel from '../../components/IntelligencePanel.js';

export default function ControllerDashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [clock, setClock] = useState(null);
  const [trains, setTrains] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [events, setEvents] = useState([]);
  
  const socketRef = useRef(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  useEffect(() => {
    if (selectedScenario) {
      loadScenarioData(selectedScenario);
      setupSocket(selectedScenario);
    }
    return () => {
      if (socketRef.current && selectedScenario) {
        socketRef.current.emit('leave_scenario', selectedScenario);
        socketRef.current.disconnect();
      }
    };
  }, [selectedScenario]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/simulation/scenarios');
      setScenarios(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedScenario(res.data.data[0]._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioData = async (scenarioId) => {
    try {
      const [tRes, cRes, sRes, eRes] = await Promise.all([
        api.get('/operations/trains', { params: { scenarioId } }),
        api.get('/operations/conflicts', { params: { scenarioId } }),
        api.get('/operations/sections', { params: { scenarioId } }),
        api.get('/operations/events', { params: { scenarioId } })
      ]);
      setTrains(tRes.data.data || []);
      setConflicts(cRes.data.data || []);
      setSections(sRes.data.data || []);
      setEvents(eRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const setupSocket = (scenarioId) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const backendUrl = window.location.origin.replace('3000', '5000');
    const socket = io(backendUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join_scenario', scenarioId);
    });

    socket.on('simulation.clock', (data) => {
      if (data.scenarioId === scenarioId) {
        setClock(new Date(data.time).toLocaleTimeString());
      }
    });
    
    socket.on('conflict.created', (data) => {
      setConflicts(prev => [data, ...prev]);
    });

    socket.on('conflict.updated', (data) => {
      setConflicts(prev => prev.map(c => c._id === data._id ? data : c));
    });

    socket.on('controller.action', (data) => {
      setEvents(prev => [data, ...prev].slice(0, 50));
    });

    socketRef.current = socket;
  };

  const handleStart = async () => {
    await api.post('/simulation/start', { scenarioId: selectedScenario });
  };

  const handlePause = async () => {
    await api.post('/simulation/pause', { scenarioId: selectedScenario });
  };

  const handleStep = async () => {
    await api.post('/simulation/step', { scenarioId: selectedScenario });
  };

  const renderScenarioSelector = () => {
    return React.createElement('div', { className: 'mb-4 flex items-center space-x-4' },
      React.createElement('label', { className: 'font-semibold' }, 'Active Scenario:'),
      React.createElement('select', { 
        className: 'border p-2 rounded',
        value: selectedScenario,
        onChange: (e) => setSelectedScenario(e.target.value)
      }, 
        scenarios.map(s => React.createElement('option', { key: s._id, value: s._id }, s.name || s.scenarioId))
      ),
      React.createElement('div', { className: 'text-lg font-mono bg-black text-green-400 px-4 py-2 rounded' },
        clock || '00:00:00'
      )
    );
  };

  const renderControls = () => {
    return React.createElement('div', { className: 'flex space-x-4 mb-6 p-4 bg-white rounded shadow' },
      React.createElement('button', { onClick: handleStart, className: 'bg-green-600 text-white px-4 py-2 rounded' }, 'Start Sim'),
      React.createElement('button', { onClick: handlePause, className: 'bg-yellow-500 text-white px-4 py-2 rounded' }, 'Pause Sim'),
      React.createElement('button', { onClick: handleStep, className: 'bg-blue-600 text-white px-4 py-2 rounded' }, 'Step (1 Tick)'),
      React.createElement('button', { className: 'bg-red-600 text-white px-4 py-2 rounded ml-auto' }, 'Reset Simulation')
    );
  };

  const renderConflicts = () => {
    return React.createElement('div', { className: 'bg-white p-4 rounded shadow mt-6' },
      React.createElement('h2', { className: 'text-xl font-bold mb-4 text-red-600' }, 'Active Conflicts'),
      conflicts.length === 0 
        ? React.createElement('p', { className: 'text-gray-500' }, 'No active conflicts.')
        : React.createElement('table', { className: 'w-full text-left' },
            React.createElement('thead', { className: 'border-b' },
              React.createElement('tr', null,
                React.createElement('th', { className: 'py-2' }, 'ID'),
                React.createElement('th', { className: 'py-2' }, 'Type'),
                React.createElement('th', { className: 'py-2' }, 'Severity'),
                React.createElement('th', { className: 'py-2' }, 'Status'),
                React.createElement('th', { className: 'py-2' }, 'Action')
              )
            ),
            React.createElement('tbody', null,
              conflicts.map(c => 
                React.createElement('tr', { key: c._id, className: 'border-b' },
                  React.createElement('td', { className: 'py-2 font-mono text-xs' }, c.conflictId),
                  React.createElement('td', { className: 'py-2' }, c.type),
                  React.createElement('td', { className: 'py-2' },
                    React.createElement('span', { className: `px-2 rounded text-white ${c.severity==='CRITICAL'?'bg-red-600':'bg-orange-500'}`}, c.severity)
                  ),
                  React.createElement('td', { className: 'py-2' }, c.status),
                  React.createElement('td', { className: 'py-2' },
                    React.createElement('button', { className: 'text-blue-600 hover:underline' }, 'Acknowledge')
                  )
                )
              )
            )
          )
    );
  };

  if (loading && !scenarios.length) return React.createElement('div', { className: 'p-8' }, 'Loading Controller Environment...');
  if (error) return React.createElement(ErrorState, { message: error });

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('h1', { className: 'text-3xl font-bold mb-6' }, 'Section Controller Workspace'),
    renderScenarioSelector(),
    renderControls(),
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      React.createElement('div', { className: 'bg-white p-4 rounded shadow h-96 overflow-auto' },
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Train Runs'),
        trains.length === 0 ? React.createElement('p', { className: 'text-gray-500' }, 'No active trains') : 
        React.createElement('ul', { className: 'space-y-2' },
          trains.map(t => React.createElement('li', { key: t._id, className: 'p-2 bg-gray-50 rounded border' }, `${t.trainRunId} - Status: ${t.runStatus}`))
        )
      ),
      React.createElement('div', { className: 'bg-white p-4 rounded shadow h-96 overflow-auto' },
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Event Log'),
        events.length === 0 ? React.createElement('p', { className: 'text-gray-500' }, 'No events') :
        React.createElement('ul', { className: 'space-y-2 text-sm font-mono text-gray-700' },
          events.map(e => React.createElement('li', { key: e._id }, `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.eventType}`))
        )
      )
    ),
    renderConflicts(),
    React.createElement(IntelligencePanel, { scenarioId: selectedScenario })
  );
}
