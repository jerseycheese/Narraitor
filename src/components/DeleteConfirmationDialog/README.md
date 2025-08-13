# DeleteConfirmationDialog

You know that moment when a user clicks "Delete" and you realize you should probably ask them if they're sure? This component handles that conversation. It's designed to be both user-friendly and hard to dismiss accidentally - because nobody wants to explain to a user why their important data just vanished.

The key thing here is making deletion feel intentional, not accidental. So we use clear language, show what's about to be deleted, and make the dangerous action visually distinct from the safe one.

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

This dialog does all the things you'd expect:

- **Accessibility**: Works perfectly with keyboards and screen readers
- **Loading State**: Shows "Deleting..." and prevents double-clicks during the actual deletion
- **Backdrop Click**: Clicking outside closes it (but only if it's not currently deleting)
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