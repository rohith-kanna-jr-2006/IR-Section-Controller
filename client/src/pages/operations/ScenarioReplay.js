import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../../services/api.js';

export default function ScenarioReplay() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [events, setEvents] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get('/simulation/scenarios').then(res => {
      const completed = (res.data.data || []).filter(s => s.status === 'COMPLETED');
      setScenarios(completed);
      if (completed.length) setSelectedScenario(completed[0]._id);
    });
  }, []);

  const handlePlay = () => {
    if (socketRef.current) socketRef.current.disconnect();
    
    const backendUrl = window.location.origin.replace('3000', '5000');
    const socket = io(backendUrl, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      socket.emit('join_scenario', selectedScenario);
    });

    socket.on('replay.event', (data) => {
      setEvents(prev => [...prev, data].slice(-50));
    });

    socketRef.current = socket;
    // Call the theoretical replay start endpoint (to be wired fully in Phase 4.1)
    // api.post('/scenarios/' + selectedScenario + '/replay');
  };

  return React.createElement('div', { className: 'p-8 max-w-4xl mx-auto' },
    React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Historical Replay Engine'),
    React.createElement('div', { className: 'mb-4 flex space-x-4 items-center' },
      React.createElement('select', { 
        className: 'border p-2 rounded',
        value: selectedScenario,
        onChange: (e) => setSelectedScenario(e.target.value)
      }, 
        scenarios.map(s => React.createElement('option', { key: s._id, value: s._id }, s.name || s.scenarioId))
      ),
      React.createElement('button', { onClick: handlePlay, className: 'bg-green-600 text-white px-4 py-2 rounded' }, 'Stream Replay')
    ),
    React.createElement('div', { className: 'bg-black text-green-400 p-4 font-mono h-96 overflow-auto rounded shadow' },
      events.map((e, idx) => React.createElement('div', { key: idx }, `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.eventType} - ${e.trainRunId}`))
    )
  );
}