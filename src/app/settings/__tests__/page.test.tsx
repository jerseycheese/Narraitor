import { render, screen } from '@testing-library/react';
import SettingsPage from '../page';

// Mock the ExportImportControls component
jest.mock('@/components/shared/ExportImportControls', () => {
  return {
    ExportImportControls: function MockExportImportControls() {
      return <div data-testid="export-import-controls">Export/Import Controls</div>;
    }
  };
});

// Mock the PageLayout component
jest.mock('@/components/shared/PageLayout', () => {
  return {
    PageLayout: function MockPageLayout({ 
      title, 
      description, 
      children 
    }: { 
      title: string; 
      description?: string; 
      children: React.ReactNode;
    }) {
      return (
        <main>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {children}
        </main>
      );
    }
  };
});

// Mock the appearance control (it depends on ThemeProvider context)
jest.mock('@/components/Navigation/DarkModeToggle', () => ({
  DarkModeToggle: () => <div data-testid="dark-mode-toggle">Dark Mode Toggle</div>,
}));

describe('SettingsPage', () => {
  test('renders settings page with correct title and description', () => {
    render(<SettingsPage />);
    
    // Test that the page has the correct title
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    
    // Test that the description mentions backup and restore functionality
    expect(screen.getAllByText(/backup.*restore/i).length).toBeGreaterThan(0);
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

  test('renders providers and appearance controls', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('link', { name: /manage providers/i })).toHaveAttribute(
      'href',
      '/settings/providers'
    );
    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
  });
});