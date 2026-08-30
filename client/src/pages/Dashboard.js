import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({
    zones: 0,
    divisions: 0,
    stations: 0,
    trains: 0,
    scenarios: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const [zRes, dRes, sRes, tRes, scRes] = await Promise.all([
        api.get('/zones', { params: { limit: 1 } }),
        api.get('/divisions', { params: { limit: 1 } }),
        api.get('/stations', { params: { limit: 1 } }),
        api.get('/trains', { params: { limit: 1 } }),
        api.get('/simulation/scenarios')
      ]);

      setStats({
        zones: zRes.data.pagination?.total ?? 18,
        divisions: dRes.data.pagination?.total ?? 73,
        stations: sRes.data.pagination?.total ?? 695,
        trains: tRes.data.pagination?.total ?? 9,
        scenarios: scRes.data.data || []
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'p-6 max-w-7xl mx-auto space-y-6', id: 'dashboard-container' },
    React.createElement('div', { className: 'border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-2xl font-bold text-gray-900', id: 'dashboard-title' }, 'Indian Railways Section Controller'),
        React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, 'Integrated Timetable, Topology, and Real-Time Section Dispatch Environment')
      ),
      React.createElement('div', { className: 'flex items-center space-x-3' },
        React.createElement(Link, {
          to: '/operations',
          id: 'btn-open-workspace',
          className: 'px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md shadow-sm transition'
        }, 'Open Controller Workspace')
      )
    ),

    // KPI Metrics Overview
    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5', id: 'kpi-grid' },
      [
        { label: 'Railway Zones', value: stats.zones, link: '/zones', desc: '18 IR Operational Zones' },
        { label: 'Operating Divisions', value: stats.divisions, link: '/divisions', desc: '73 Division HQ Units' },
        { label: 'Station Master Directory', value: stats.stations, link: '/stations', desc: 'Verified Junctions & Stops' },
        { label: 'Active Trains & Timetables', value: stats.trains, link: '/trains', desc: 'Express & Freight Runs' }
      ].map((item, idx) =>
        React.createElement('div', {
          key: idx,
          id: `metric-card-${idx}`,
          className: 'bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between'
        },
          React.createElement('div', null,
            React.createElement('span', { className: 'text-xs font-semibold uppercase text-gray-500 tracking-wider' }, item.label),
            React.createElement('div', { className: 'text-3xl font-bold text-gray-900 mt-2 font-mono' }, loading ? '...' : item.value),
            React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, item.desc)
          ),
          React.createElement('div', { className: 'mt-4 pt-3 border-t border-gray-100' },
            React.createElement(Link, { to: item.link, className: 'text-xs font-medium text-blue-600 hover:text-blue-800' }, 'Manage records →')
          )
        )
      )
    ),

    // Quick Simulation Scenarios Section
    React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-6 shadow-sm', id: 'scenarios-section' },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-lg font-bold text-gray-900' }, 'Simulation & Replay Scenarios'),
          React.createElement('p', { className: 'text-xs text-gray-500' }, 'Active corridor operational models and stress test scenarios')
        ),
        React.createElement(Link, {
          to: '/operations/scenarios/new',
          id: 'btn-create-scenario',
          className: 'px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition'
        }, '+ New Scenario')
      ),

      stats.scenarios.length === 0
        ? React.createElement('div', { className: 'py-8 text-center text-sm text-gray-500' }, 'No active scenarios loaded.')
        : React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 text-sm' },
              React.createElement('thead', { className: 'bg-gray-50' },
                React.createElement('tr', null,
                  React.createElement('th', { className: 'px-4 py-2.5 text-left font-medium text-gray-600' }, 'Scenario ID'),
                  React.createElement('th', { className: 'px-4 py-2.5 text-left font-medium text-gray-600' }, 'Scenario Name'),
                  React.createElement('th', { className: 'px-4 py-2.5 text-left font-medium text-gray-600' }, 'Type'),
                  React.createElement('th', { className: 'px-4 py-2.5 text-left font-medium text-gray-600' }, 'Status'),
                  React.createElement('th', { className: 'px-4 py-2.5 text-right font-medium text-gray-600' }, 'Actions')
                )
              ),
              React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                stats.scenarios.map(sc =>
                  React.createElement('tr', { key: sc._id, className: 'hover:bg-gray-50' },
                    React.createElement('td', { className: 'px-4 py-3 font-mono font-medium text-gray-900' }, sc.scenarioId),
                    React.createElement('td', { className: 'px-4 py-3 text-gray-700' }, sc.name),
                    React.createElement('td', { className: 'px-4 py-3 text-gray-500 font-mono text-xs' }, sc.sourceType),
                    React.createElement('td', { className: 'px-4 py-3' },
                      React.createElement('span', {
                        className: `px-2 py-0.5 text-xs font-semibold rounded ${
                          sc.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                          sc.status === 'READY' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`
                      }, sc.status)
                    ),
                    React.createElement('td', { className: 'px-4 py-3 text-right space-x-2' },
                      React.createElement(Link, {
                        to: `/operations/scenarios/${sc._id}/chart`,
                        className: 'text-xs text-blue-600 hover:text-blue-800 font-medium'
                      }, 'Time-Distance Chart'),
                      React.createElement(Link, {
                        to: '/operations',
                        className: 'text-xs text-gray-600 hover:text-gray-900 font-medium'
                      }, 'Control Room')
                    )
                  )
                )
              )
            )
          )
    )
  );
}
