# DeleteConfirmationDialog

A confirmation step for destructive actions. It wraps `ConfirmationDialog` with the `destructive` variant, names the thing being deleted, and puts initial focus on Cancel so the dangerous button isn't the one sitting under the return key.

The aim is to make deletion take a deliberate second action. The dialog says what's about to go, styles the confirm button as destructive, and disables both buttons while the delete is in flight.

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

- **Accessibility**: Built on the Radix dialog primitive, so focus moves into the dialog and stays there while it's open. Both buttons carry an `aria-label` naming the item.
- **Loading State**: Shows "Deleting..." and disables both buttons, so a slow delete can't be fired twice
- **Backdrop Click**: Clicking outside closes the dialog. That isn't suppressed mid-delete - only the buttons are disabled.
- **Escape Key**: Press Escape to bail out quickly
- **Custom Button Text**: You can change the button labels if "Delete" and "Cancel" don't fit your context

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