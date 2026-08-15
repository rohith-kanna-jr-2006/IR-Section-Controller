import React from 'react';

export default function Zones() {
  return React.createElement('div', { className: 'p-4' },
    React.createElement('h1', { className: 'text-2xl font-bold mb-4' }, 'Zones'),
    React.createElement('p', { className: 'text-gray-600' }, 'Manage Railway Zones here.')
  );
}
