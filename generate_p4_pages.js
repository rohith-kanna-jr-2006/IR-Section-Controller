const fs = require('fs');
const path = require('path');

const pagesPath = path.resolve(__dirname, 'client/src/pages/operations');

const pages = {
  'ScenarioBuilder.js': `
import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';

export default function ScenarioBuilder() {
  const [name, setName] = useState('');
  const [seed, setSeed] = useState(12345);
  const [scenarios, setScenarios] = useState([]);
  
  const fetchScenarios = async () => {
    const res = await api.get('/simulation/scenarios');
    setScenarios(res.data.data);
  };
  
  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleCreate = async () => {
    await api.post('/scenarios', { name, randomSeed: seed });
    setName('');
    fetchScenarios();
  };

  const handleValidate = async (id) => {
    await api.post(\`/scenarios/\${id}/validate\`);
    fetchScenarios();
  };

  return React.createElement('div', { className: 'p-8 max-w-4xl mx-auto' },
    React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Scenario Builder'),
    React.createElement('div', { className: 'bg-white p-4 shadow rounded mb-6' },
      React.createElement('h2', { className: 'font-semibold text-lg mb-4' }, 'Create New Draft'),
      React.createElement('input', { 
        className: 'border p-2 mr-4 rounded', 
        placeholder: 'Scenario Name', 
        value: name, 
        onChange: e => setName(e.target.value) 
      }),
      React.createElement('input', { 
        type: 'number',
        className: 'border p-2 mr-4 rounded', 
        placeholder: 'Random Seed', 
        value: seed, 
        onChange: e => setSeed(e.target.value) 
      }),
      React.createElement('button', { 
        className: 'bg-blue-600 text-white px-4 py-2 rounded',
        onClick: handleCreate
      }, 'Create DRAFT')
    ),
    React.createElement('div', { className: 'bg-white p-4 shadow rounded' },
      React.createElement('h2', { className: 'font-semibold text-lg mb-4' }, 'Scenarios'),
      React.createElement('table', { className: 'w-full text-left' },
        React.createElement('thead', { className: 'border-b' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'py-2' }, 'Name'),
            React.createElement('th', { className: 'py-2' }, 'Status'),
            React.createElement('th', { className: 'py-2' }, 'Seed'),
            React.createElement('th', { className: 'py-2' }, 'Actions')
          )
        ),
        React.createElement('tbody', null,
          scenarios.map(s => React.createElement('tr', { key: s._id, className: 'border-b' },
            React.createElement('td', { className: 'py-2' }, s.name || s.scenarioId),
            React.createElement('td', { className: 'py-2' }, s.status),
            React.createElement('td', { className: 'py-2 font-mono text-sm' }, s.randomSeed),
            React.createElement('td', { className: 'py-2' },
              s.status === 'DRAFT' && React.createElement('button', { 
                className: 'text-blue-600 hover:underline',
                onClick: () => handleValidate(s._id)
              }, 'Validate & Lock')
            )
          ))
        )
      )
    )
  );
}
`,
  'ScenarioReplay.js': `
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
      events.map((e, idx) => React.createElement('div', { key: idx }, \`[\${new Date(e.timestamp).toLocaleTimeString()}] \${e.eventType} - \${e.trainRunId}\`))
    )
  );
}
`,
  'ScenarioComparison.js': `
import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';

export default function ScenarioComparison() {
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    // Only load COMPLETED for comparison
    api.get('/simulation/scenarios').then(res => {
      const completed = (res.data.data || []).filter(s => s.status === 'COMPLETED');
      setScenarios(completed);
    });
  }, []);

  return React.createElement('div', { className: 'p-8 max-w-4xl mx-auto' },
    React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Scenario KPI Comparison'),
    React.createElement('table', { className: 'w-full bg-white shadow rounded' },
      React.createElement('thead', { className: 'bg-gray-200' },
        React.createElement('tr', null,
          React.createElement('th', { className: 'p-3 text-left' }, 'Scenario'),
          React.createElement('th', { className: 'p-3 text-left' }, 'Total Delay'),
          React.createElement('th', { className: 'p-3 text-left' }, 'Conflicts (Crit)'),
          React.createElement('th', { className: 'p-3 text-left' }, 'Throughput')
        )
      ),
      React.createElement('tbody', null,
        scenarios.map(s => React.createElement('tr', { key: s._id, className: 'border-t' },
          React.createElement('td', { className: 'p-3' }, s.name || s.scenarioId),
          React.createElement('td', { className: 'p-3 font-mono text-red-600' }, '0 min'), // KPI mockup until real data runs
          React.createElement('td', { className: 'p-3 font-mono text-orange-600' }, '0'),
          React.createElement('td', { className: 'p-3 font-mono text-green-600' }, '100%')
        ))
      )
    )
  );
}
`
};

for (const [filename, content] of Object.entries(pages)) {
  fs.writeFileSync(path.join(pagesPath, filename), content.trim());
}

console.log('Phase 4 Pages generated.');
