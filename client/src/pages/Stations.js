import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';
import { getAllSRStations, SR_DIVISIONS_MAP } from '../data/srSectionsData.js';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterDivisionCode, setFilterDivisionCode] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Client-side fallback SR stations index
  const srStationCatalog = useMemo(() => getAllSRStations(), []);

  useEffect(() => {
    fetchStations();
  }, [searchCode, searchName, filterDivisionCode, filterStatus, page]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 30 };
      if (searchCode) params.stationCode = searchCode.trim();
      if (searchName) params.name = searchName.trim();
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/stations', { params });
      let fetched = res.data.data || [];

      // Filter by division code if selected
      if (filterDivisionCode !== 'ALL') {
        fetched = fetched.filter(st => {
          const divCode = st.divisionId?.code || '';
          return divCode.toUpperCase() === filterDivisionCode.toUpperCase();
        });
      }

      setStations(fetched);
      setTotal(res.data.meta?.total || fetched.length);
      setError(null);
    } catch (err) {
      // If backend error, fallback gracefully to client SR catalog
      console.warn('API error, falling back to local SR station catalog:', err);
      let localList = srStationCatalog;
      if (filterDivisionCode !== 'ALL') {
        localList = localList.filter(s => s.divisionCode === filterDivisionCode);
      }
      if (searchCode) {
        localList = localList.filter(s => s.stationCode.toLowerCase().includes(searchCode.toLowerCase()));
      }
      if (searchName) {
        localList = localList.filter(s => s.name.toLowerCase().includes(searchName.toLowerCase()));
      }
      setStations(localList.slice((page - 1) * 30, page * 30));
      setTotal(localList.length);
    } finally {
      setLoading(false);
    }
  };

  const renderDetailsModal = () => {
    if (!selectedStation) return null;
    const st = selectedStation;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Station Master Node
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {st.stationCode} - {st.officialName || st.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedStation(null)}
              className="text-gray-400 hover:text-gray-700 font-bold text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-medium">Station Code</p>
              <p className="font-semibold text-gray-900">{st.stationCode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Official Name</p>
              <p className="font-semibold text-gray-900">{st.officialName || st.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Division</p>
              <p className="font-semibold text-gray-900">{st.divisionId?.name || st.divisionCode || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Zone</p>
              <p className="font-semibold text-gray-900">{st.zoneId?.code || 'Southern Railway (SR)'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Operational Status</p>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                {st.status || 'ACTIVE'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Verification Status</p>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {st.verificationStatus || 'VERIFIED'}
              </span>
            </div>
          </div>

          {st.routes && st.routes.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 font-medium mb-1.5">Associated SR Corridors:</p>
              <div className="flex flex-wrap gap-1.5">
                {st.routes.map((r, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-medium">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={() => setSelectedStation(null)}
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="sr-stations-container" className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Station Master Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {srStationCatalog.length}+ SR Stations
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Southern Railway comprehensive station database across all six operating divisions.
          </p>
        </div>
      </div>

      {/* Division Badges & Quick Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilterDivisionCode('ALL'); setPage(1); }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            filterDivisionCode === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Divisions ({srStationCatalog.length})
        </button>
        {Object.entries(SR_DIVISIONS_MAP).map(([code, div]) => {
          const count = srStationCatalog.filter(s => s.divisionCode === code).length;
          return (
            <button
              key={code}
              onClick={() => { setFilterDivisionCode(code); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filterDivisionCode === code
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {div.name} ({code}) - {count}
            </button>
          );
        })}
      </div>

      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Code (e.g. MAS, PGT, DG)"
          value={searchCode}
          onChange={(e) => { setSearchCode(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[140px]"
        />
        <input
          type="text"
          placeholder="Station Name (e.g. Arakkonam, Ernakulam)..."
          value={searchName}
          onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="HISTORICAL">HISTORICAL</option>
        </select>
      </div>

      {/* Stations Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading Station Directory...</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStations} />
      ) : stations.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
          No stations match the search query.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Station Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Station Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Division</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stations.map((st, i) => {
                  const divCode = st.divisionId?.code || st.divisionCode || 'SR';
                  return (
                    <tr key={st._id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{st.stationCode}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{st.officialName || st.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-700">
                          {divCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{st.zoneId?.code || 'SR'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          {st.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedStation(st)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {renderDetailsModal()}
    </div>
  );
}
