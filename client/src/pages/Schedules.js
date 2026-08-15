import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';

export default function Schedules() {
  const { trainId } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [train, setTrain] = useState(null);
  
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [stops, setStops] = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [trainId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const [trainRes, schedRes] = await Promise.all([
        api.get(`/trains/${trainId}`),
        api.get('/schedules', { params: { trainId } })
      ]);
      setTrain(trainRes.data);
      setSchedules(schedRes.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStops = async (scheduleId) => {
    try {
      setStopsLoading(true);
      setSelectedSchedule(scheduleId);
      const res = await api.get(`/schedules/${scheduleId}/stops`);
      setStops(res.data.data || []);
    } catch (err) {
      alert('Failed to load stops');
    } finally {
      setStopsLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Schedules...');
    if (error) return React.createElement(ErrorState, { message: error, onRetry: fetchSchedules });
    if (schedules.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No schedules found.');

    return React.createElement('div', { className: 'flex flex-col space-y-6' },
      React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Version/Code'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Frequency'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Verification'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Authority'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            schedules.map(sch => 
              React.createElement('tr', { key: sch._id },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap font-medium text-gray-900' }, sch.scheduleCode || `v${sch.version}`),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, sch.frequency),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sch.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}` }, sch.verificationStatus || 'NOT VERIFIED')
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sch.authorityLevel === 'PRIMARY' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}` }, sch.authorityLevel || 'SECONDARY')
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sch.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, sch.status || 'ACTIVE')
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                  React.createElement('button', { className: 'text-blue-600 hover:text-blue-900', onClick: () => loadStops(sch._id) }, 'View Timetable')
                )
              )
            )
          )
        )
      ),
      selectedSchedule && React.createElement('div', { className: 'bg-white rounded shadow p-4' },
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Timetable Viewer'),
        stopsLoading ? React.createElement('div', { className: 'text-gray-500' }, 'Loading stops...') :
        stops.length === 0 ? React.createElement('div', { className: 'text-gray-500' }, 'No stops defined for this schedule.') :
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 border' },
            React.createElement('thead', { className: 'bg-gray-50' },
              React.createElement('tr', null,
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Seq'),
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Station'),
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Code'),
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Arrival'),
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Departure'),
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Day Offset'),
                React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500' }, 'Halt (m)')
              )
            ),
            React.createElement('tbody', { className: 'divide-y divide-gray-200' },
              stops.map(st => 
                React.createElement('tr', { key: st._id },
                  React.createElement('td', { className: 'px-4 py-2' }, st.sequence),
                  React.createElement('td', { className: 'px-4 py-2 font-medium' }, st.stationId ? st.stationId.name : '-'),
                  React.createElement('td', { className: 'px-4 py-2 text-gray-500' }, st.stationCode),
                  React.createElement('td', { className: 'px-4 py-2 text-gray-700' }, st.arrival || '-'),
                  React.createElement('td', { className: 'px-4 py-2 text-gray-700' }, st.departure || '-'),
                  React.createElement('td', { className: 'px-4 py-2 text-gray-500' }, st.dayOffset),
                  React.createElement('td', { className: 'px-4 py-2 text-gray-500' }, st.haltMinutes)
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
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, train ? `Schedules for ${train.trainNumber} - ${train.name}` : 'Train Schedules')
    ),
    renderContent()
  );
}
