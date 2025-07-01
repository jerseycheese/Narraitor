import { render, screen } from '@testing-library/react';
import SettingsPage from '../page';

// Mock the ExportImportControls component
jest.mock('@/components/shared/ExportImportControls', () => {
  return function MockExportImportControls() {
    return <div data-testid="export-import-controls">Export/Import Controls</div>;
  };
});

describe('SettingsPage', () => {
  test('renders settings page with correct title and description', () => {
    render(<SettingsPage />);
    
    // Test that the page has the correct title
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    
    // Test that the description mentions backup and restore functionality
    expect(screen.getByText(/backup.*restore/i)).toBeInTheDocument();
  });

  test('includes ExportImportControls component', () => {
    render(<SettingsPage />);
    
    // Test that the ExportImportControls component is rendered
    expect(screen.getByTestId('export-import-controls')).toBeInTheDocument();
  });

  test('uses PageLayout component structure', () => {
    render(<SettingsPage />);
    
    // Test that the page uses the main element (from PageLayout)
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Test that the content is properly structured
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  test('includes data management section', () => {
    render(<SettingsPage />);
    
    // Test that there's a clear data management section
    expect(screen.getByText(/data management/i)).toBeInTheDocument();
  });
});