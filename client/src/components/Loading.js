import React from 'react';

const Loading = () => {
  return React.createElement(
    'div',
    { className: 'flex justify-center items-center h-full p-8' },
    React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' })
  );
};

export default Loading;
