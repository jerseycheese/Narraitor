import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToneSettingsForm } from '../ToneSettingsForm';
import { DEFAULT_TONE_SETTINGS, ToneSettings } from '@/types/tone-settings.types';
import { titleCase } from '@/lib/utils';

// Mock the validation utility
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  validateToneSettings: jest.fn(() => ({ valid: true, errors: [] })),
  descriptionsToSelectOptions: jest.fn((descriptions) => 
    Object.entries(descriptions).map(([value, description]) => ({
      value,
      label: titleCase(value.replace(/-/g, ' ')),
      description
    }))
  ),
  createFormUpdater: jest.fn((state: Record<string, unknown>, onChange: (updated: Record<string, unknown>) => void) => ({
    updateField: (field: string, value: unknown) => onChange({ ...state, [field]: value }),
  })),
}));

const mockOnToneSettingsChange = jest.fn();
const mockOnSave = jest.fn();

describe('ToneSettingsForm', () => {
  beforeEach(() => {
    mockOnToneSettingsChange.mockClear();
    mockOnSave.mockClear();
  });

  test('renders with default tone settings', () => {
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    expect(screen.getByText('Tone Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Content Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Narrative Style')).toBeInTheDocument();
    expect(screen.getByLabelText('Language Complexity')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom Instructions (Optional)')).toBeInTheDocument();
  });

  test('calls onToneSettingsChange when content rating changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    const contentRatingSelect = screen.getByRole('combobox', { name: /content rating/i });
    await user.selectOptions(contentRatingSelect, 'PG-13');

    expect(mockOnToneSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_TONE_SETTINGS,
      contentRating: 'PG-13'
    });
  });

  test('calls onToneSettingsChange when narrative style changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    const narrativeStyleSelect = screen.getByRole('combobox', { name: /narrative style/i });
    await user.selectOptions(narrativeStyleSelect, 'dramatic');

    expect(mockOnToneSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_TONE_SETTINGS,
      narrativeStyle: 'dramatic'
    });
  });

  test('calls onToneSettingsChange when language complexity changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    const languageComplexitySelect = screen.getByRole('combobox', { name: /language complexity/i });
    await user.selectOptions(languageComplexitySelect, 'advanced');

    expect(mockOnToneSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_TONE_SETTINGS,
      languageComplexity: 'advanced'
    });
  });

  test('calls onToneSettingsChange when custom instructions change', async () => {
    const user = userEvent.setup();
    
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    const customInstructionsTextarea = screen.getByLabelText('Custom Instructions (Optional)');
    await user.type(customInstructionsTextarea, 'X');

    // Verify that onToneSettingsChange was called with updated customInstructions
    expect(mockOnToneSettingsChange).toHaveBeenLastCalledWith({
      ...DEFAULT_TONE_SETTINGS,
      customInstructions: 'X'
    });
  });


  test('displays current tone settings values', () => {
    const customToneSettings: ToneSettings = {
      contentRating: 'R',
      narrativeStyle: 'dramatic',
      languageComplexity: 'literary',
      customInstructions: 'Include complex themes'
    };

    render(
      <ToneSettingsForm
        toneSettings={customToneSettings}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    const customInstructionsTextarea = screen.getByLabelText('Custom Instructions (Optional)');
    expect(customInstructionsTextarea).toHaveValue('Include complex themes');
  });


  test('displays validation errors when form is invalid', async () => {
    const { validateToneSettings } = await import('@/lib/utils');
    (validateToneSettings as jest.Mock).mockReturnValue({
      valid: false,
      errors: ['Content Rating is required', 'Narrative Style must be valid']
    });

    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
        onSave={mockOnSave}
        showSaveButton={true}
      />
    );

    expect(screen.getByText('Content Rating is required')).toBeInTheDocument();
    expect(screen.getByText('Narrative Style must be valid')).toBeInTheDocument();
  });

  test('disables save button when validation fails', async () => {
    const { validateToneSettings } = await import('@/lib/utils');
    (validateToneSettings as jest.Mock).mockReturnValue({
      valid: false,
      errors: ['Content Rating is required']
    });

    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
        onSave={mockOnSave}
        showSaveButton={true}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Tone Settings' });
    expect(saveButton).toBeDisabled();
  });

  test('calls onSave when save button is clicked in valid state', async () => {
    const { validateToneSettings } = await import('@/lib/utils');
    (validateToneSettings as jest.Mock).mockReturnValue({
      valid: true,
      errors: []
    });

    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
        onSave={mockOnSave}
        showSaveButton={true}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Tone Settings' });
    expect(saveButton).not.toBeDisabled();
    
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });
});