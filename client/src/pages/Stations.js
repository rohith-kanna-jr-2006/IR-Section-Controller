import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStations();
  }, [search]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stations', { params: { stationCode: search || undefined } });
      setStations(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Stations...');
    if (error) return React.createElement(ErrorState, { message: error, onRetry: fetchStations });
    if (stations.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No stations found.');

    return React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
      React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
        React.createElement('thead', { className: 'bg-gray-50' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Code'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Name'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Zone'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Division'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
          )
        ),
        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
          stations.map(st => 
            React.createElement('tr', { key: st._id },
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap font-medium text-gray-900' }, st.stationCode),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, st.name),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, st.zoneId ? st.zoneId.code : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, st.divisionId ? st.divisionId.code : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${st.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, st.status || 'ACTIVE')
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('div', { className: 'flex justify-between items-center mb-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Railway Stations'),
      React.createElement('input', {
        type: 'text', placeholder: 'Search by Code...', value: search, onChange: (e) => setSearch(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
      })
    ),
    renderContent()
  );
}
