import React from 'react';
import { render, screen } from '@testing-library/react';
import Maps from './components/Maps';
import { useJsApiLoader } from '@react-google-maps/api';

jest.mock('@react-google-maps/api', () => ({
  useJsApiLoader: jest.fn(),          
}));

describe('Maps Component', () => {        
  beforeEach(() => { 
    jest.resetAllMocks();     
  }); 

  test('renders loading messages while maps are loading', () => {    
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null });  

    render(<Maps />);  
    expect(screen.getByText('Loading...')).toBeInTheDocument(); 
  });

  test('renders error message if there is a loadError', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: new Error('Load Error') });

    render(<Maps />);
    expect(screen.getByText('Error loading maps')).toBeInTheDocument();
  });

  test('renders the map when isLoaded is true and there is no loadError', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });

    render(<Maps />);
    expect(screen.getByRole('map')).toBeInTheDocument();  
  });
}); 
