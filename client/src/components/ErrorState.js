import React from 'react';

const ErrorState = ({ message }) => {
  return React.createElement(
    'div',
    { className: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4' },
    React.createElement('strong', { className: 'font-bold mr-2' }, 'Error!'),
    React.createElement('span', { className: 'block sm:inline' }, message || 'An unexpected error occurred.')
  );
};

export default ErrorState;
