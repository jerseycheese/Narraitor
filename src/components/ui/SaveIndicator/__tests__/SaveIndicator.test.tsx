/**
 * Tests for SaveIndicator component - TDD Implementation
 */

import { render, screen } from '@testing-library/react';
import { SaveIndicator } from '../SaveIndicator';

describe('SaveIndicator', () => {
  it('should display idle status', () => {
    render(<SaveIndicator status="idle" />);
    
    expect(screen.getByText(/auto-save/i)).toBeInTheDocument();
  });

  it('should display saving status with loading indicator', () => {
    render(<SaveIndicator status="saving" />);
    
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display saved status with timestamp', () => {
    const lastSaveTime = '2023-01-01T12:00:00.000Z';
    render(<SaveIndicator status="saved" lastSaveTime={lastSaveTime} />);
    
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it('should display error status with error message', () => {
    render(<SaveIndicator status="error" errorMessage="Save failed" />);
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/save failed/i)).toBeInTheDocument();
  });

  it('should display total saves count', () => {
    render(<SaveIndicator status="saved" totalSaves={5} />);
    
    expect(screen.getByText(/5 saves/)).toBeInTheDocument();
  });

  it('should allow manual save trigger when provided', () => {
    const mockTriggerSave = jest.fn();
    render(<SaveIndicator status="idle" onManualSave={mockTriggerSave} />);
    
    const saveButton = screen.getByText(/save now/i);
    expect(saveButton).toBeInTheDocument();
    
    saveButton.click();
    expect(mockTriggerSave).toHaveBeenCalledWith('manual');
  });

  it('should disable manual save button when saving', () => {
    const mockTriggerSave = jest.fn();
    render(<SaveIndicator status="saving" onManualSave={mockTriggerSave} />);
    
    const saveButton = screen.getByText(/save now/i);
    expect(saveButton).toBeDisabled();
  });
});