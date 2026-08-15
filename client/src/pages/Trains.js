import React from 'react';

export default function Trains() {
  return React.createElement('div', { className: 'p-4' },
    React.createElement('h1', { className: 'text-2xl font-bold mb-4' }, 'Trains'),
    React.createElement('p', { className: 'text-gray-600' }, 'Manage Trains and Schedules here.')
  );
}
