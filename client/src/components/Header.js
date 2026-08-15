import React from 'react';

const Header = () => {
  return React.createElement(
    'header',
    { className: 'bg-blue-600 text-white p-4 shadow-md flex justify-between items-center' },
    React.createElement('h1', { className: 'text-xl font-bold' }, 'IR Section Controller'),
    React.createElement('div', { className: 'flex space-x-4' },
      React.createElement('span', null, 'User: Admin')
    )
  );
};

export default Header;
