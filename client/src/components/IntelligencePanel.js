import React, { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function IntelligencePanel({ scenarioId }) {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (scenarioId) {
      api.get(`/intelligence/recommendations?scenarioId=${scenarioId}`)
         .then(res => setRecommendations(res.data.data));
    }
  }, [scenarioId]);

  const handleApprove = async (id) => {
    await api.post(`/intelligence/recommendations/${id}/approve`);
    // refresh
  };

  return React.createElement('div', { className: 'bg-white p-4 shadow rounded' },
    React.createElement('h2', { className: 'font-semibold text-lg mb-4' }, 'Intelligence & Recommendations'),
    recommendations.map(r => React.createElement('div', { key: r._id, className: 'border p-3 mb-2' },
      React.createElement('div', { className: 'font-bold' }, r.type),
      React.createElement('div', { className: 'text-sm text-gray-600' }, `Score: ${r.recommendationScore} | Confidence: ${r.predictionConfidence}%`),
      React.createElement('div', { className: 'text-sm' }, r.status),
      r.status === 'PROPOSED' && React.createElement('button', {
        className: 'bg-green-600 text-white px-2 py-1 rounded mt-2 text-sm',
        onClick: () => handleApprove(r._id)
      }, 'Approve Action')
    ))
  );
}