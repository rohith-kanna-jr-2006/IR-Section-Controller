import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Zones', path: '/zones' },
    { name: 'Divisions', path: '/divisions' },
    { name: 'Stations', path: '/stations' },
    { name: 'Trains', path: '/trains' }
  ];

  return React.createElement(
    'aside',
    { className: 'w-64 bg-gray-800 text-white min-h-screen p-4' },
    React.createElement('nav', null,
      React.createElement('ul', { className: 'space-y-2' },
        links.map(link => 
          React.createElement('li', { key: link.path },
            React.createElement(Link, { to: link.path, className: 'block p-2 hover:bg-gray-700 rounded' }, link.name)
          )
        )
      )
    )
  );
};

export default Sidebar;
