import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sections');
      setSections(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Sections...');
    if (error) return React.createElement(ErrorState, { message: error, onRetry: fetchSections });
    if (sections.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No sections found.');

    return React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
      React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
        React.createElement('thead', { className: 'bg-gray-50' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Section'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'From'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'To'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Distance'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
          )
        ),
        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
          sections.map(sec => 
            React.createElement('tr', { key: sec._id },
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap font-medium text-gray-900' }, sec.sectionCode || sec.name || '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, sec.fromStationId ? sec.fromStationId.stationCode : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, sec.toStationId ? sec.toStationId.stationCode : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, sec.distanceKm ? `${sec.distanceKm} km` : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sec.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, sec.status || 'ACTIVE')
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('div', { className: 'mb-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Railway Sections')
    ),
    renderContent()
  );
}
