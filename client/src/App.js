import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.js';
import Dashboard from './pages/Dashboard.js';
import Zones from './pages/Zones.js';
import Divisions from './pages/Divisions.js';
import Stations from './pages/Stations.js';
import Sections from './pages/Sections.js';
import Trains from './pages/Trains.js';
import Schedules from './pages/Schedules.js';
import ControllerDashboard from './pages/operations/ControllerDashboard.js';
import ScenarioBuilder from './pages/operations/ScenarioBuilder.js';
import ScenarioReplay from './pages/operations/ScenarioReplay.js';
import ScenarioComparison from './pages/operations/ScenarioComparison.js';
import SimulationControlRoom from './pages/operations/SimulationControlRoom.js';

export default function App() {
  return React.createElement(BrowserRouter, null,
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(MainLayout, null) },
        React.createElement(Route, { index: true, element: React.createElement(Dashboard, null) }),
        React.createElement(Route, { path: 'zones', element: React.createElement(Zones, null) }),
        React.createElement(Route, { path: 'divisions', element: React.createElement(Divisions, null) }),
        React.createElement(Route, { path: 'stations', element: React.createElement(Stations, null) }),
        React.createElement(Route, { path: 'sections', element: React.createElement(Sections, null) }),
        React.createElement(Route, { path: 'trains', element: React.createElement(Trains, null) }),
        React.createElement(Route, { path: 'trains/:trainId/schedules', element: React.createElement(Schedules, null) }),
        React.createElement(Route, { path: 'operations', element: React.createElement(ControllerDashboard, null) }),
        React.createElement(Route, { path: 'operations/scenarios/new', element: React.createElement(ScenarioBuilder, null) }),
        React.createElement(Route, { path: 'operations/scenarios/replay', element: React.createElement(ScenarioReplay, null) }),
        React.createElement(Route, { path: 'operations/scenarios/compare', element: React.createElement(ScenarioComparison, null) }),
        React.createElement(Route, { path: 'operations/scenarios/:scenarioId/chart', element: React.createElement(SimulationControlRoom, null) })
      )
    )
  );
}
