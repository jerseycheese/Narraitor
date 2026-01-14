import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropConfirmationDialog } from './DropConfirmationDialog';
import { InventoryItem } from '@/types/inventory.types';

// Mock SimpleModal
jest.mock('@/components/shared/SimpleModal', () => ({
  SimpleModal: ({ isOpen, title, description, footer, children }: any) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h1>{title}</h1>
        <div>{description}</div>
        <div>{children}</div>
        <footer>{footer}</footer>
      </div>
    ) : null
  )
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, value, onChange, ...props }: any) => (
    <input id={id} value={value} onChange={onChange} {...props} />
  )
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div role="alert" data-variant={variant}>{children}</div>,
  AlertTitle: ({ children }: any) => <strong>{children}</strong>,
  AlertDescription: ({ children }: any) => <span>{children}</span>,
}));

describe('DropConfirmationDialog', () => {
  const mockItem: InventoryItem = {
    id: 'item-1',
    name: 'Health Potion',
    description: 'Heals 50 HP',
    quantity: 5,
    stackable: true,
    categoryId: 'consumables',
    acquisitionHistory: [],
    categorization: {
        categoryId: 'consumables',
        classifiedAt: 0,
        source: 'manual' as const,
    },
    createdAt: 0,
    updatedAt: 0,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    item: mockItem,
    quantity: 1,
    onQuantityChange: jest.fn(),
    quantityError: null,
    storeError: null,
  };

  it('should render dialog when open', () => {
    render(<DropConfirmationDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Drop Item')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to drop/)).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<DropConfirmationDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<DropConfirmationDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onConfirm when Drop is clicked', async () => {
    const user = userEvent.setup();
    render(<DropConfirmationDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Drop'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('should show quantity input for stackable items with quantity > 1', () => {
    render(<DropConfirmationDialog {...defaultProps} />);
    
    expect(screen.getByLabelText('Quantity to drop')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument(); // Input type="number"
    expect(screen.getByText('Available: 5')).toBeInTheDocument();
  });

  it('should NOT show quantity input for non-stackable items', () => {
    const nonStackableItem = { ...mockItem, stackable: false, quantity: 1 };
    render(<DropConfirmationDialog {...defaultProps} item={nonStackableItem} />);
    
    expect(screen.queryByLabelText('Quantity to drop')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('should NOT show quantity input for stackable items with quantity 1', () => {
    const singleItem = { ...mockItem, quantity: 1 };
    render(<DropConfirmationDialog {...defaultProps} item={singleItem} />);
    
    expect(screen.queryByLabelText('Quantity to drop')).not.toBeInTheDocument();
  });

  it('should handle quantity change', async () => {
    const user = userEvent.setup();
    const onQuantityChange = jest.fn();
    
    const Wrapper = () => {
        const [q, setQ] = React.useState(1);
        const handleChange = (val: number) => {
            setQ(val);
            onQuantityChange(val);
        };
        return <DropConfirmationDialog {...defaultProps} quantity={q} onQuantityChange={handleChange} />;
    };
    render(<Wrapper />);
    
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '3');
    
    expect(onQuantityChange).toHaveBeenLastCalledWith(3);
  });

  it('should display quantity error', () => {
    render(<DropConfirmationDialog {...defaultProps} quantityError="Invalid quantity" />);
    
    expect(screen.getByText('Invalid quantity')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should display store error', () => {
    const storeError = { title: 'Error Title', message: 'Error Message' };
    render(<DropConfirmationDialog {...defaultProps} storeError={storeError} />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error Message')).toBeInTheDocument();
  });

  it('should handle null item gracefully', () => {
    render(<DropConfirmationDialog {...defaultProps} item={null} />);
    expect(screen.queryByText('Health Potion')).not.toBeInTheDocument();
  });
});
