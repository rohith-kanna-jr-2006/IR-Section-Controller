import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';

export default function Sections() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sections/candidates');
      setCandidates(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Section Candidates...');
    if (error) return React.createElement(ErrorState, { message: error, onRetry: fetchCandidates });
    if (candidates.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No section candidates found.');

    return React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Route'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'From'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'To'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Division'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Direction'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Distance Status'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Verification'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Authority')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            candidates.map((sec, i) => 
              React.createElement('tr', { key: i },
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold' }, sec.routeName),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-700' }, `${sec.fromStationCode} - ${sec.fromStationName}`),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-700' }, `${sec.toStationCode} - ${sec.toStationName}`),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-500' }, sec.division),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-500' }, sec.direction),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-500' }, 
                    sec.distanceStatus === 'AVAILABLE' ? `${sec.distance} km` : React.createElement('span', { className: 'text-orange-500 font-semibold' }, 'NOT_AVAILABLE')
                ),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm' },
                  React.createElement('span', { className: 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800' }, sec.verificationStatus)
                ),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm' },
                  React.createElement('span', { className: 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800' }, sec.authorityLevel)
                )
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('div', { className: 'mb-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Section Network Candidate Preview'),
      React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Data source: SR Route-Topology secondary dataset.'),
      React.createElement('div', { className: 'mt-2 inline-block px-3 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-md' },
        'SECONDARY REFERENCE / CANDIDATE TOPOLOGY'
      )
    ),
    renderContent()
  );
}
