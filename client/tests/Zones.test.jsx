import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import Zones from '../src/pages/Zones.js';
import api from '../src/services/api.js';

vi.mock('../src/services/api.js');

describe('Zones Page', () => {
  it('shows loading state initially', () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } });
    render(<Zones />);
    expect(screen.getByText('Loading Zones...')).toBeInTheDocument();
  });

  it('renders zones data successfully', async () => {
    const mockZones = [
      { _id: '1', code: 'CR', name: 'Central Railway', status: 'ACTIVE' },
      { _id: '2', code: 'WR', name: 'Western Railway', status: 'ACTIVE' }
    ];
    api.get.mockResolvedValueOnce({ data: { data: mockZones } });
    
    render(<Zones />);
    
    await waitFor(() => {
      expect(screen.getByText('Central Railway')).toBeInTheDocument();
      expect(screen.getByText('Western Railway')).toBeInTheDocument();
    });
  });

  it('renders error state on API failure', async () => {
    api.get.mockRejectedValueOnce({ response: { data: { error: 'Failed to fetch' } } });
    
    render(<Zones />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
});
