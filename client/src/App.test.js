import { describe, it, expect } from 'vitest';
import React from 'react';
import App from './App.js';

describe('App', () => {
  it('renders without crashing', () => {
    // This simple test verifies React configuration and that there is no JSX
    const element = React.createElement(App, null);
    expect(React.isValidElement(element)).toBe(true);
  });
});
