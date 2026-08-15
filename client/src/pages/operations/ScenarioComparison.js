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