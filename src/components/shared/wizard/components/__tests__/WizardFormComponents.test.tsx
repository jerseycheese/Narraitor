import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { WizardForm } from '../WizardForm';
import {
  WizardFormField,
  WizardInput,
  WizardTextarea,
  WizardSelect,
  WizardButton,
  WizardFormSection,
} from '../WizardFormComponents';

// Mock form data structure
interface TestFormData {
  name: string;
  description: string;
  theme: string;
}

const mockOptions = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Science Fiction' },
  { value: 'modern', label: 'Modern' },
];

describe('WizardFormComponents', () => {
  describe('WizardForm', () => {
    it('renders form with proper structure', () => {
      const mockData = { name: '', description: '', theme: '' };
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={{}} onUpdate={mockOnUpdate}>
          <div>Form content</div>
        </WizardForm>
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    it('calls onUpdate when form data changes', async () => {
      const user = userEvent.setup();
      const mockData: TestFormData = { name: '', description: '', theme: '' };
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={{}} onUpdate={mockOnUpdate}>
          <WizardFormField name="name" label="Name" required>
            <WizardInput placeholder="Enter name" />
          </WizardFormField>
        </WizardForm>
      );

      const input = screen.getByPlaceholderText('Enter name');
      await user.type(input, 'Test Name');

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('WizardFormField', () => {
    it('renders field with label and required indicator', () => {
      const mockData = { name: '' };
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={{}} onUpdate={mockOnUpdate}>
          <WizardFormField name="name" label="Name" required>
            <WizardInput />
          </WizardFormField>
        </WizardForm>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays description when provided', () => {
      const mockData = { name: '' };
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={{}} onUpdate={mockOnUpdate}>
          <WizardFormField
            name="name"
            label="Name"
            description="Enter your name here"
          >
            <WizardInput />
          </WizardFormField>
        </WizardForm>
      );

      expect(screen.getByText('Enter your name here')).toBeInTheDocument();
    });

    it('renders form field with error handling structure', () => {
      const mockData = { name: '' };
      const mockErrors = { name: 'Name is required' };
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={mockErrors} onUpdate={mockOnUpdate}>
          <WizardFormField name="name" label="Name" required>
            <WizardInput />
          </WizardFormField>
        </WizardForm>
      );

      // Test that the form structure is correct
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('WizardInput', () => {
    it('renders input with proper attributes', () => {
      render(<WizardInput placeholder="Test placeholder" data-testid="test-input" />);

      const input = screen.getByTestId('test-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Test placeholder');
    });

    it('applies error styling when error prop is provided', () => {
      render(<WizardInput error="Test error" data-testid="test-input" />);

      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('border-red-300');
    });
  });

  describe('WizardTextarea', () => {
    it('renders textarea with proper attributes', () => {
      render(
        <WizardTextarea
          placeholder="Test placeholder"
          rows={5}
          data-testid="test-textarea"
        />
      );

      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Test placeholder');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('applies error styling when error prop is provided', () => {
      render(<WizardTextarea error="Test error" data-testid="test-textarea" />);

      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('border-red-300');
    });
  });

  describe('WizardSelect', () => {
    it('renders select with options', () => {
      render(
        <WizardSelect
          options={mockOptions}
          placeholder="Select option"
          data-testid="test-select"
        />
      );

      const select = screen.getByTestId('test-select');
      expect(select).toBeInTheDocument();

      // Check placeholder option
      expect(screen.getByText('Select option')).toBeInTheDocument();

      // Check all options are present
      mockOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });

    it('applies error styling when error prop is provided', () => {
      render(
        <WizardSelect
          options={mockOptions}
          error="Test error"
          data-testid="test-select"
        />
      );

      const select = screen.getByTestId('test-select');
      expect(select).toHaveClass('border-red-300');
    });
  });

  describe('WizardButton', () => {
    it('renders button with correct variant styling', () => {
      render(
        <WizardButton variant="primary" data-testid="test-button">
          Test Button
        </WizardButton>
      );

      const button = screen.getByTestId('test-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
      expect(button).toHaveClass('bg-blue-500');
    });

    it('handles click events', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <WizardButton onClick={mockClick} data-testid="test-button">
          Click Me
        </WizardButton>
      );

      const button = screen.getByTestId('test-button');
      await user.click(button);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled state correctly', () => {
      render(
        <WizardButton disabled data-testid="test-button">
          Disabled Button
        </WizardButton>
      );

      const button = screen.getByTestId('test-button');
      expect(button).toBeDisabled();
    });
  });

  describe('WizardFormSection', () => {
    it('renders section with title and description', () => {
      render(
        <WizardFormSection
          title="Test Section"
          description="Test description"
        >
          <div>Section content</div>
        </WizardFormSection>
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Section content')).toBeInTheDocument();
    });

    it('renders without title and description', () => {
      render(
        <WizardFormSection>
          <div>Section content</div>
        </WizardFormSection>
      );

      expect(screen.getByText('Section content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and associations', () => {
      const mockData = { name: '' };
      const mockErrors = {};
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={mockErrors} onUpdate={mockOnUpdate}>
          <WizardFormField
            name="name"
            label="Name"
            description="Enter your name"
            required
          >
            <WizardInput data-testid="test-input" />
          </WizardFormField>
        </WizardForm>
      );

      const input = screen.getByTestId('test-input');
      
      // Check that input has basic accessibility attributes
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('id');
      expect(input).toHaveAttribute('name', 'name');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockData = { name: '', theme: '' };
      const mockOnUpdate = jest.fn();

      render(
        <WizardForm data={mockData} errors={{}} onUpdate={mockOnUpdate}>
          <WizardFormField name="name" label="Name">
            <WizardInput data-testid="input-1" />
          </WizardFormField>
          <WizardFormField name="theme" label="Theme">
            <WizardSelect
              options={mockOptions}
              data-testid="select-1"
            />
          </WizardFormField>
        </WizardForm>
      );

      const input = screen.getByTestId('input-1');
      const select = screen.getByTestId('select-1');

      // Test tab navigation
      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(select).toHaveFocus();
    });
  });
});