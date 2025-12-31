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

// Mock the Card components
jest.mock('@/components/ui/card', () => {
  return {
    Card: function MockCard({ children }: { children: React.ReactNode }) {
      return <div data-testid="card">{children}</div>;
    },
    CardHeader: function MockCardHeader({ children }: { children: React.ReactNode }) {
      return <div data-testid="card-header">{children}</div>;
    },
    CardTitle: function MockCardTitle({ children }: { children: React.ReactNode }) {
      return <h3>{children}</h3>;
    },
    CardDescription: function MockCardDescription({ children }: { children: React.ReactNode }) {
      return <p>{children}</p>;
    },
    CardContent: function MockCardContent({ children }: { children: React.ReactNode }) {
      return <div data-testid="card-content">{children}</div>;
    }
  };
});

describe('SettingsPage', () => {
  test('renders settings page with correct title and description', () => {
    render(<SettingsPage />);
    
    // Test that the page has the correct title
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    
    // Test that the description mentions backup and restore functionality
    expect(screen.getAllByText(/backup.*restore/i).length).toBeGreaterThan(0);
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