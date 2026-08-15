import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header.js';
import Sidebar from '../components/Sidebar.js';

export default function MainLayout() {
  return React.createElement(
    'div',
    { className: 'flex h-screen bg-gray-100' },
    React.createElement(Sidebar, null),
    React.createElement(
      'div',
      { className: 'flex-1 flex flex-col overflow-hidden' },
      React.createElement(Header, null),
      React.createElement(
        'main',
        { className: 'flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6' },
        React.createElement(Outlet, null)
      )
    )
  );
}
