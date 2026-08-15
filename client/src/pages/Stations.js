import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  
  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchStations();
    }, 300);
    return () => clearTimeout(delay);
  }, [searchCode, searchName, filterZone, filterDiv, filterStatus]);

  const fetchOptions = async () => {
    try {
      const [zRes, dRes] = await Promise.all([
        api.get('/zones', { params: { limit: 100 } }),
        api.get('/divisions', { params: { limit: 200 } })
      ]);
      setZones(zRes.data.data || []);
      setDivisions(dRes.data.data || []);
    } catch (e) {
      console.error('Error fetching options', e);
    }
  };

  const fetchStations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchCode) params.stationCode = searchCode;
      if (searchName) params.name = searchName;
      if (filterZone) params.zoneId = filterZone;
      if (filterDiv) params.divisionId = filterDiv;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/stations', { params });
      setStations(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDetailsModal = () => {
    if (!selectedStation) return null;
    const st = selectedStation;
    return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full p-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
          React.createElement('h2', { className: 'text-2xl font-bold' }, `Station Details: ${st.stationCode}`),
          React.createElement('button', { onClick: () => setSelectedStation(null), className: 'text-gray-500 hover:text-gray-700 font-bold text-xl' }, '×')
        ),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Code'), React.createElement('p', { className: 'font-medium' }, st.stationCode)),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Official Name'), React.createElement('p', { className: 'font-medium' }, st.officialName || st.name)),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Zone'), React.createElement('p', { className: 'font-medium' }, st.zoneId?.name || st.zoneId?.code || '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Division'), React.createElement('p', { className: 'font-medium' }, st.divisionId?.name || st.divisionId?.code || '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Station Type'), React.createElement('p', { className: 'font-medium' }, st.stationType || '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Status'), React.createElement('p', { className: 'font-medium' }, st.status)),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Effective From'), React.createElement('p', { className: 'font-medium' }, st.effectiveFrom ? new Date(st.effectiveFrom).toLocaleDateString() : '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Effective To'), React.createElement('p', { className: 'font-medium' }, st.effectiveTo ? new Date(st.effectiveTo).toLocaleDateString() : '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Coordinates'), React.createElement('p', { className: 'font-medium' }, st.location?.coordinates ? `[${st.location.coordinates[0]}, ${st.location.coordinates[1]}]` : '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-gray-500' }, 'Source / Data Version'), React.createElement('p', { className: 'font-medium' }, `${st.sourceId || '-'} / ${st.dataVersionId || '-'}`))
        ),
        React.createElement('div', { className: 'mt-6 flex justify-end' },
          React.createElement('button', { onClick: () => setSelectedStation(null), className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700' }, 'Close')
        )
      )
    );
  };

  const renderContent = () => {
    if (loading && stations.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500' }, 'Loading Stations...');
    if (error) return React.createElement(ErrorState, { message: error, onRetry: fetchStations });
    if (stations.length === 0) return React.createElement('div', { className: 'p-8 text-center text-gray-500 bg-white rounded shadow' }, 'No stations found.');

    return React.createElement('div', { className: 'bg-white rounded shadow overflow-hidden' },
      React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
        React.createElement('thead', { className: 'bg-gray-50' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer' }, 'Code'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Name'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Zone'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Division'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
          )
        ),
        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
          stations.map(st => 
            React.createElement('tr', { key: st._id, className: 'hover:bg-gray-50' },
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap font-medium text-gray-900' }, st.stationCode),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, st.name),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, st.zoneId ? st.zoneId.code : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, st.divisionId ? st.divisionId.code : '-'),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('span', { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${st.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, st.status || 'ACTIVE')
              ),
              React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                React.createElement('button', { 
                  onClick: () => setSelectedStation(st),
                  className: 'text-blue-600 hover:text-blue-900'
                }, 'View Details')
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'p-4 md:p-8 max-w-7xl mx-auto' },
    React.createElement('div', { className: 'flex justify-between items-center mb-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Station Master')
    ),
    React.createElement('div', { className: 'bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4' },
      React.createElement('input', {
        type: 'text', placeholder: 'Code (e.g. MAS)', value: searchCode, onChange: (e) => setSearchCode(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm flex-1 min-w-[150px]'
      }),
      React.createElement('input', {
        type: 'text', placeholder: 'Station Name...', value: searchName, onChange: (e) => setSearchName(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm flex-1 min-w-[150px]'
      }),
      React.createElement('select', { 
        value: filterZone, onChange: (e) => { setFilterZone(e.target.value); setFilterDiv(''); },
        className: 'px-4 py-2 border rounded-md shadow-sm flex-1 min-w-[150px]'
      }, 
        React.createElement('option', { value: '' }, 'All Zones'),
        zones.map(z => React.createElement('option', { key: z._id, value: z._id }, z.code))
      ),
      React.createElement('select', { 
        value: filterDiv, onChange: (e) => setFilterDiv(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm flex-1 min-w-[150px]',
        disabled: !filterZone
      }, 
        React.createElement('option', { value: '' }, 'All Divisions'),
        divisions.filter(d => d.zoneId?._id === filterZone || d.zoneId === filterZone).map(d => React.createElement('option', { key: d._id, value: d._id }, d.code))
      ),
      React.createElement('select', { 
        value: filterStatus, onChange: (e) => setFilterStatus(e.target.value),
        className: 'px-4 py-2 border rounded-md shadow-sm flex-1 min-w-[150px]'
      }, 
        React.createElement('option', { value: '' }, 'All Statuses'),
        ['ACTIVE', 'HISTORICAL', 'PROPOSED', 'REORGANIZED'].map(s => React.createElement('option', { key: s, value: s }, s))
      )
    ),
    renderContent(),
    renderDetailsModal()
  );
}
