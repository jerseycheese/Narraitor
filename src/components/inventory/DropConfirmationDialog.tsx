'use client';

import React from 'react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InventoryItem } from '@/types/inventory.types';

export interface DropConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: InventoryItem | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  quantityError: string | null;
  storeError: { title: string; message: string } | null;
}

export function DropConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  item,
  quantity,
  onQuantityChange,
  quantityError,
  storeError,
}: DropConfirmationDialogProps) {
  if (!item) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Drop Item"
      showCloseButton={false}
      size="lg"
      tone="destructive"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            autoFocus
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            variant="destructive"
          >
            Drop
          </Button>
        </div>
      }
      footerClassName="bg-background"
    >
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Are you sure you want to drop <strong>{item.name}</strong>?
        </p>

        {storeError && (
          <Alert variant="destructive">
            <AlertTitle>{storeError.title}</AlertTitle>
            <AlertDescription>{storeError.message}</AlertDescription>
          </Alert>
        )}

        {item.stackable && item.quantity > 1 && (
          <div className="space-y-2">
            <Label htmlFor="drop-quantity">
              Quantity to drop
            </Label>
            <Input
              id="drop-quantity"
              type="number"
              min={1}
              max={item.quantity}
              value={quantity}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              aria-invalid={!!quantityError}
              aria-describedby={quantityError ? "quantity-error" : undefined}
            />
            <p className="text-xs text-muted-foreground">Available: {item.quantity}</p>
            {quantityError && (
              <p id="quantity-error" className="text-sm text-destructive">
                {quantityError}
              </p>
            )}
          </div>
        )}
      </div>
    </SimpleModal>
  );
}
