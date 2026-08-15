import React from 'react';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return React.createElement('div', { className: 'min-h-screen flex flex-col bg-gray-50' },
    React.createElement('header', { className: 'bg-blue-900 text-white p-4 shadow-md' },
      React.createElement('h1', { className: 'text-xl font-bold' }, 'IR Section Controller')
    ),
    React.createElement('div', { className: 'flex flex-1' },
      React.createElement('aside', { className: 'w-64 bg-white border-r shadow-sm' },
        React.createElement('nav', { className: 'p-4' },
          React.createElement('ul', { className: 'space-y-2' },
            React.createElement('li', null, React.createElement('a', { href: '/', className: 'text-blue-600 hover:underline' }, 'Dashboard')),
            React.createElement('li', null, React.createElement('a', { href: '/zones', className: 'text-blue-600 hover:underline' }, 'Zones')),
            React.createElement('li', null, React.createElement('a', { href: '/divisions', className: 'text-blue-600 hover:underline' }, 'Divisions')),
            React.createElement('li', null, React.createElement('a', { href: '/stations', className: 'text-blue-600 hover:underline' }, 'Stations')),
            React.createElement('li', null, React.createElement('a', { href: '/trains', className: 'text-blue-600 hover:underline' }, 'Trains'))
          )
        )
      ),
      React.createElement('main', { className: 'flex-1 p-6' },
        React.createElement(Outlet, null)
      )
    )
  );
}
