import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToneSettingsForm } from '../ToneSettingsForm';
import { DEFAULT_TONE_SETTINGS, ToneSettings } from '@/types/tone-settings.types';

// Mock the validation utility
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  validateToneSettings: jest.fn(() => ({ valid: true, errors: [] })),
  descriptionsToSelectOptions: jest.fn((descriptions) => 
    Object.entries(descriptions).map(([value, description]) => ({
      value,
      label: value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description
    }))
  ),
  createFormUpdater: jest.fn((state, onChange) => ({
    updateField: (field, value) => onChange({ ...state, [field]: value }),
  })),
  normalizeOptionalString: jest.fn((value) => value.trim() === '' ? undefined : value.trim()),
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
    await user.click(contentRatingSelect);
    
    const pgOption = screen.getByRole('option', { name: /PG-13/i });
    await user.click(pgOption);

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
    await user.click(narrativeStyleSelect);
    
    const dramaticOption = screen.getByRole('option', { name: /dramatic/i });
    await user.click(dramaticOption);

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
    await user.click(languageComplexitySelect);
    
    const advancedOption = screen.getByRole('option', { name: /advanced/i });
    await user.click(advancedOption);

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
    await user.type(customInstructionsTextarea, 'Focus on character development');

    expect(mockOnToneSettingsChange).toHaveBeenLastCalledWith({
      ...DEFAULT_TONE_SETTINGS,
      customInstructions: 'Focus on character development'
    });
  });

  test('shows save button when showSaveButton is true', () => {
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
        onSave={mockOnSave}
        showSaveButton={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Save Tone Settings' })).toBeInTheDocument();
  });

  test('hides save button when showSaveButton is false', () => {
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
        showSaveButton={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Save Tone Settings' })).not.toBeInTheDocument();
  });

  test('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={mockOnToneSettingsChange}
        onSave={mockOnSave}
        showSaveButton={true}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Tone Settings' });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
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

  test('handles undefined custom instructions', () => {
    const toneSettingsWithoutCustom: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'balanced',
      languageComplexity: 'moderate'
    };

    render(
      <ToneSettingsForm
        toneSettings={toneSettingsWithoutCustom}
        onToneSettingsChange={mockOnToneSettingsChange}
      />
    );

    const customInstructionsTextarea = screen.getByLabelText('Custom Instructions (Optional)');
    expect(customInstructionsTextarea).toHaveValue('');
  });

  test('displays validation errors when form is invalid', () => {
    const { validateToneSettings } = require('@/lib/utils');
    validateToneSettings.mockReturnValue({
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

    expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
    expect(screen.getByText('• Content Rating is required')).toBeInTheDocument();
    expect(screen.getByText('• Narrative Style must be valid')).toBeInTheDocument();
  });

  test('disables save button when validation fails', () => {
    const { validateToneSettings } = require('@/lib/utils');
    validateToneSettings.mockReturnValue({
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
});