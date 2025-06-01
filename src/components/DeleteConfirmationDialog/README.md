# DeleteConfirmationDialog

A reusable confirmation dialog component for delete operations with a clean, accessible interface.

## Usage

```tsx
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteItem();
      setShowDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>Delete</button>
      
      <DeleteConfirmationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        itemName="My Important Item"
        isDeleting={isDeleting}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls dialog visibility |
| `onClose` | `() => void` | Yes | - | Callback when dialog is closed |
| `onConfirm` | `() => void` | Yes | - | Callback when deletion is confirmed |
| `title` | `string` | Yes | - | Dialog title |
| `description` | `string` | Yes | - | Warning message |
| `itemName` | `string` | Yes | - | Name of item being deleted |
| `confirmButtonText` | `string` | No | "Delete" | Custom confirm button text |
| `cancelButtonText` | `string` | No | "Cancel" | Custom cancel button text |
| `isDeleting` | `boolean` | No | `false` | Shows loading state during deletion |

## Features

- **Accessibility**: Fully keyboard navigable with ARIA attributes
- **Loading State**: Shows "Deleting..." and disables buttons during operation
- **Backdrop Click**: Closes dialog when clicking outside
- **Escape Key**: Closes dialog on Escape key press
- **Custom Button Text**: Supports custom button labels

## Storybook Stories

Available stories:
- Default - Basic dialog open state
- Closed - Dialog closed state
- DeletingState - Loading state during deletion
- CustomButtonText - Custom button labels

## Testing

Run tests with:
```bash
npm test -- src/components/DeleteConfirmationDialog/__tests__/DeleteConfirmationDialog.test.tsx
```