import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.js';

const Dashboard = () => React.createElement('div', { className: 'p-4' }, 
  React.createElement('h1', { className: 'text-2xl font-bold' }, 'Dashboard Placeholder')
);

export default function App() {
  return React.createElement(BrowserRouter, null,
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(MainLayout, null) },
        React.createElement(Route, { index: true, element: React.createElement(Dashboard, null) })
      )
    )
  );
}
