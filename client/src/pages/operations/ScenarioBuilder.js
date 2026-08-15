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
    await api.post(`/scenarios/${id}/validate`);
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