import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';
import { Link } from 'react-router-dom';

export default function Trains() {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTrains();
  }, [search]);

  const fetchTrains = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trains', { params: { trainNumber: search || undefined } });
      setTrains(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Trains...');
    if (error) return React.createElement(ErrorState, { message: error, onRetry: fetchTrains });
    if (trains.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No trains found.');

    return React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
      React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
        React.createElement('thead', { className: 'bg-gray-50' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Number'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Name'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Zone'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Verification'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Authority'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
          )
        ),
        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
          trains.map(t => 
            React.createElement('tr', { key: t._id },
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap font-medium text-gray-900' }, t.trainNumber),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, t.name),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, t.zoneId ? t.zoneId.code : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}` }, t.verificationStatus || 'NOT VERIFIED')
              ),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.authorityLevel === 'PRIMARY' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}` }, t.authorityLevel || 'SECONDARY')
              ),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, t.status || 'ACTIVE')
              ),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                React.createElement(Link, { to: `/trains/${t._id}/schedules`, className: 'text-blue-600 hover:text-blue-900' }, 'View Schedules')
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('div', { className: 'flex justify-between items-center mb-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Train Master'),
      React.createElement('input', {
        type: 'text', placeholder: 'Search by Number...', value: search, onChange: (e) => setSearch(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
      })
    ),
    renderContent()
  );
}
