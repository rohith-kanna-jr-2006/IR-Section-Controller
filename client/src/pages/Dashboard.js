import React from 'react';

export default function Dashboard() {
  return React.createElement('div', { className: 'p-4' },
    React.createElement('h1', { className: 'text-2xl font-bold mb-4' }, 'Dashboard'),
    React.createElement('p', { className: 'text-gray-600' }, 'Overview of the IR Section Controller system.')
  );
}
