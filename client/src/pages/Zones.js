import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchZones();
  }, [search]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/zones', { params: { code: search || undefined } });
      setZones(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Zones...');
    }
    if (error) {
      return React.createElement(ErrorState, { message: error, onRetry: fetchZones });
    }
    if (zones.length === 0) {
      return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No zones found.');
    }

    return React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
      React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
        React.createElement('thead', { className: 'bg-gray-50' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Code'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Name'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Headquarters'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status')
          )
        ),
        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
          zones.map(zone => 
            React.createElement('tr', { key: zone._id },
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap font-medium text-gray-900' }, zone.code),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, zone.name),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, zone.headquarters || '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${zone.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, zone.status || 'ACTIVE')
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('div', { className: 'flex justify-between items-center mb-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Railway Zones'),
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search by Code...',
        value: search,
        onChange: (e) => setSearch(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
      })
    ),
    renderContent()
  );
}
