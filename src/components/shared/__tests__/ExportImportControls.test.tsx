/**
 * Tests for ExportImportControls component
 * Tests UI for manual save/load functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportImportControls } from '../ExportImportControls';
import { ExportService } from '../../../lib/storage/exportService';

// Mock the export service
jest.mock('../../../lib/storage/exportService');

const MockedExportService = ExportService as jest.MockedClass<typeof ExportService>;

describe('ExportImportControls', () => {
  let mockDownloadGameState: jest.Mock;
  let mockImportFromFile: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDownloadGameState = jest.fn().mockResolvedValue(undefined);
    mockImportFromFile = jest.fn().mockResolvedValue({ success: true, message: 'Import successful' });
    
    MockedExportService.mockImplementation(() => ({
      downloadGameState: mockDownloadGameState,
      importFromFile: mockImportFromFile,
      exportGameState: jest.fn(),
      importGameState: jest.fn(),
      getExportSize: jest.fn(),
    }) as ExportService);
  });

  describe('export functionality', () => {
    test('shows progress indicator during export', async () => {
      render(<ExportImportControls />);

      const exportButton = screen.getByRole('button', { name: /export game/i });
      fireEvent.click(exportButton);

      expect(screen.getByText(/exporting/i)).toBeInTheDocument();
    });

    test('shows success message after successful export', async () => {
      render(<ExportImportControls />);

      const exportButton = screen.getByRole('button', { name: /export game/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/export completed/i)).toBeInTheDocument();
      });
    });

    test('shows error message on export failure', async () => {
      mockDownloadGameState.mockRejectedValue(new Error('Export failed'));

      render(<ExportImportControls />);

      const exportButton = screen.getByRole('button', { name: /export game/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('import functionality', () => {
    test('handles file selection', async () => {
      render(<ExportImportControls />);

      const fileInput = screen.getByLabelText(/import game/i);
      const mockFile = new File(['{"test": "data"}'], 'save.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText(/importing/i)).toBeInTheDocument();
      });
    });

    test('shows import success message', async () => {
      render(<ExportImportControls />);

      const fileInput = screen.getByLabelText(/import game/i);
      const mockFile = new File(['{"test": "data"}'], 'save.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText(/import successful/i)).toBeInTheDocument();
      });
    });

    test('shows import error message', async () => {
      mockImportFromFile.mockResolvedValue({ success: false, error: 'Invalid file' });

      render(<ExportImportControls />);

      const fileInput = screen.getByLabelText(/import game/i);
      const mockFile = new File(['invalid'], 'save.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText(/invalid file/i)).toBeInTheDocument();
      });
    });
  });

  describe('user interaction', () => {
    test('disables buttons during operations', async () => {
      render(<ExportImportControls />);

      const exportButton = screen.getByRole('button', { name: /export game/i });
      fireEvent.click(exportButton);

      expect(exportButton).toBeDisabled();
    });

    test('clears messages after timeout', async () => {
      jest.useFakeTimers();

      render(<ExportImportControls />);

      const exportButton = screen.getByRole('button', { name: /export game/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/export completed/i)).toBeInTheDocument();
      });

      // Fast-forward time
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText(/export completed/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});