/**
 * Tests for ExportImportControls component
 * Tests UI for manual save/load functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportImportControls } from '../ExportImportControls';
import * as exportService from '../../../lib/storage/exportService';

jest.mock('../../../lib/storage/exportService');

const mockedDownloadGameState = exportService.downloadGameState as jest.MockedFunction<
  typeof exportService.downloadGameState
>;
const mockedImportFromFile = exportService.importFromFile as jest.MockedFunction<
  typeof exportService.importFromFile
>;

describe('ExportImportControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedDownloadGameState.mockResolvedValue(undefined);
    mockedImportFromFile.mockResolvedValue({
      success: true,
      message: 'Import successful',
    });
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
      mockedDownloadGameState.mockRejectedValue(new Error('Export failed'));

      render(<ExportImportControls />);

      const exportButton = screen.getByRole('button', { name: /export game/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/couldn't export your data/i)).toBeInTheDocument();
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
      mockedImportFromFile.mockResolvedValue({ success: false, error: 'Invalid file' });

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

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText(/export completed/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
