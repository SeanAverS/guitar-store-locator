import React from 'react';
import { render, screen } from '@testing-library/react';
import Maps from './Maps';

jest.mock('@react-google-maps/api', () => ({
  useJsApiLoader: jest.fn(() => ({
    isLoaded: false,
    loadError: null,
  })),
}));

test('renders loading message while maps are loading', () => {
  render(<Maps />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

