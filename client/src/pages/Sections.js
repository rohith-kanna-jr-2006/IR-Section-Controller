import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api.js';
import ErrorState from '../components/ErrorState.js';
import { getAllSRSections, SR_DIVISIONS_MAP } from '../data/srSectionsData.js';

export default function Sections() {
  const [activeDivision, setActiveDivision] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('TOPOLOGY'); // 'TOPOLOGY' or 'CANDIDATES'
  const [candidates, setCandidates] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load SR Sections
  const srSections = useMemo(() => getAllSRSections(), []);

  useEffect(() => {
    fetchDbSections();
    fetchCandidates();
  }, []);

  const fetchDbSections = async () => {
    try {
      const res = await api.get('/sections?limit=100');
      setDbSections(res.data.data || []);
    } catch (err) {
      console.warn('Could not fetch DB sections', err);
    }
  };

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

  // Filter SR Sections
  const filteredSections = useMemo(() => {
    return srSections.filter(sec => {
      const matchesDiv = activeDivision === 'ALL' || sec.divisionCode === activeDivision;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        sec.routeName.toLowerCase().includes(q) ||
        sec.fromStationCode.toLowerCase().includes(q) ||
        sec.fromStationName.toLowerCase().includes(q) ||
        sec.toStationCode.toLowerCase().includes(q) ||
        sec.toStationName.toLowerCase().includes(q) ||
        sec.stations.some(s => s.stationCode.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
      return matchesDiv && matchesQuery;
    });
  }, [srSections, activeDivision, searchQuery]);

  const divisionStats = useMemo(() => {
    const stats = {
      ALL: { count: srSections.length, stations: 0 },
      MAS: { count: 0, stations: 0 },
      SA: { count: 0, stations: 0 },
      PGT: { count: 0, stations: 0 },
      TVC: { count: 0, stations: 0 },
      MDU: { count: 0, stations: 0 },
      TPJ: { count: 0, stations: 0 }
    };
    
    srSections.forEach(s => {
      stats.ALL.stations += s.totalStations;
      if (stats[s.divisionCode]) {
        stats[s.divisionCode].count += 1;
        stats[s.divisionCode].stations += s.totalStations;
      }
    });
    return stats;
  }, [srSections]);

  return (
    <div id="sr-sections-container" className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div id="sr-sections-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Southern Railway Section Network</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Official Topology
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Complete corridor mapping across Chennai, Salem, Palakkad, Thiruvananthapuram, Madurai, and Tiruchirappalli divisions.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            id="btn-tab-topology"
            onClick={() => setActiveTab('TOPOLOGY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'TOPOLOGY'
                ? 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verified SR Corridors ({srSections.length})
          </button>
          <button
            id="btn-tab-candidates"
            onClick={() => setActiveTab('CANDIDATES')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'CANDIDATES'
                ? 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Candidate Ledger ({candidates.length})
          </button>
        </div>
      </div>

      {activeTab === 'TOPOLOGY' ? (
        <div id="topology-view-wrapper" className="space-y-6">
          {/* Division Selector & Filter Tabs */}
          <div id="division-filters" className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                id="filter-div-all"
                onClick={() => setActiveDivision('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeDivision === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Divisions ({divisionStats.ALL.count})
              </button>
              {Object.entries(SR_DIVISIONS_MAP).map(([code, d]) => (
                <button
                  key={code}
                  id={`filter-div-${code.toLowerCase()}`}
                  onClick={() => setActiveDivision(code)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    activeDivision === code
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {d.name} ({code})
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72">
              <input
                id="search-corridors-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search route or station (e.g. MAS, ERS, Karur)..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Corridor Cards Grid & Detail Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Corridors List */}
            <div className="lg:col-span-2 space-y-3">
              {filteredSections.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border border-gray-200 text-gray-500">
                  No sections match the current filters.
                </div>
              ) : (
                filteredSections.map((sec, idx) => {
                  const isSelected = selectedSection?.routeName === sec.routeName;
                  return (
                    <div
                      key={idx}
                      id={`section-card-${idx}`}
                      onClick={() => setSelectedSection(sec)}
                      className={`p-4 bg-white rounded-lg border transition-all cursor-pointer hover:border-blue-400 ${
                        isSelected ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-800">
                              {sec.divisionCode}
                            </span>
                            <h3 className="text-base font-semibold text-gray-900">{sec.routeName}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {sec.divisionName} Division • {sec.totalStations} sequential stations
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 font-medium bg-blue-50 text-blue-700 rounded">
                          {sec.fromStationCode} ➔ {sec.toStationCode}
                        </span>
                      </div>

                      {/* Origin & Terminus Preview */}
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-600 border-t border-gray-100 pt-2">
                        <div>
                          <span className="font-medium text-gray-800">{sec.fromStationCode}</span> ({sec.fromStationName})
                        </div>
                        <span className="text-gray-400">••••••••</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-800">{sec.toStationCode}</span> ({sec.toStationName})
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Station Sequence Inspector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sticky top-6">
                {selectedSection ? (
                  <div id="station-inspector" className="space-y-4">
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-800">
                          {selectedSection.divisionCode} Division
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {selectedSection.totalStations} Stations
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mt-1">
                        {selectedSection.routeName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selectedSection.fromStationName} ({selectedSection.fromStationCode}) to {selectedSection.toStationName} ({selectedSection.toStationCode})
                      </p>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                      {selectedSection.stations.map((stn, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                              {stn.sequence}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900">{stn.stationCode}</span>
                              <span className="text-gray-600 ml-1.5">{stn.name}</span>
                            </div>
                          </div>
                          {stn.distanceKm !== null && (
                            <span className="text-[11px] font-mono text-gray-500">
                              {stn.distanceKm} km
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Select a section corridor on the left to inspect its full station sequence and topology.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Candidates View */
        <div id="candidates-view-wrapper" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-md text-xs">
            <span className="font-bold">Notice:</span> The candidate ledger contains legacy or auxiliary candidate sections for reconciliation reference.
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading Candidate Sections...</div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchCandidates} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidates.map((sec, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{sec.routeName}</td>
                        <td className="px-4 py-2 text-gray-700">{sec.fromStationCode} - {sec.fromStationName}</td>
                        <td className="px-4 py-2 text-gray-700">{sec.toStationCode} - {sec.toStationName}</td>
                        <td className="px-4 py-2 text-gray-500">{sec.division}</td>
                        <td className="px-4 py-2 text-gray-500">{sec.direction}</td>
                        <td className="px-4 py-2 text-gray-500">
                          {sec.distanceStatus === 'AVAILABLE' ? `${sec.distance} km` : <span className="text-amber-600 font-semibold">NOT_AVAILABLE</span>}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                            {sec.verificationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
