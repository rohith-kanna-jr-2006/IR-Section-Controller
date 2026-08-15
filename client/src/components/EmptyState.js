import React from 'react';

const EmptyState = ({ message }) => {
  return React.createElement(
    'div',
    { className: 'flex justify-center items-center h-full p-8 text-gray-500' },
    React.createElement('p', { className: 'text-lg' }, message || 'No data available.')
  );
};

export default EmptyState;
