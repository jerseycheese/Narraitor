/**
 * FactEditor Component
 * Form for creating and editing lore facts
 */

import React, { useState, useEffect } from 'react';
import { useLoreStore } from '../../../state/loreStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoreCategory, LoreFact } from '../../../types/lore.types';
import type { EntityID } from '../../../types/common.types';

interface FactEditorProps {
  worldId: EntityID;
  fact?: LoreFact;
  onSave?: () => void;
  onCancel?: () => void;
}

export const FactEditor: React.FC<FactEditorProps> = ({
  worldId,
  fact,
  onSave,
  onCancel
}) => {
  const [key, setKey] = useState(fact?.key || '');
  const [value, setValue] = useState(fact?.value || '');
  const [category, setCategory] = useState<LoreCategory>(fact?.category || 'characters');
  const [description, setDescription] = useState(fact?.metadata?.description || '');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>(
    fact?.metadata?.importance || 'medium'
  );
  const [tags, setTags] = useState(fact?.metadata?.tags?.join(', ') || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDuplicate, setIsDuplicate] = useState(false);

  const {
    addFact,
    updateFact,
    validateKey,
    validateFactUniqueness
  } = useLoreStore();

  // Check for duplicates when key/value changes
  useEffect(() => {
    if (!key || !value) {
      setIsDuplicate(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!fact) { // Only check for new facts
        const isUnique = validateFactUniqueness(worldId, key, value);
        setIsDuplicate(!isUnique);
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, duplicate: 'Duplicate fact detected' }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.duplicate;
            return newErrors;
          });
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [key, value, worldId, fact, validateFactUniqueness]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!key.trim()) {
      newErrors.key = 'Fact key is required';
    } else if (!validateKey(key)) {
      newErrors.key = 'Key must be alphanumeric with underscores, starting with a letter';
    }

    if (!value.trim()) {
      newErrors.value = 'Fact value is required';
    }

    if (!category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (isDuplicate && !fact) return; // Don't allow duplicates for new facts

    const metadata = {
      description: description || undefined,
      importance,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
    };

    if (fact) {
      // Update existing fact
      updateFact(fact.id, {
        key,
        value,
        category,
        metadata
      });
    } else {
      // Create new fact
      addFact(key, value, category, 'manual', worldId, undefined, metadata);
    }

    // Reset form if creating new
    if (!fact) {
      setKey('');
      setValue('');
      setDescription('');
      setTags('');
      setImportance('medium');
    }

    onSave?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fact-key">Fact Key</Label>
        <Input
          id="fact-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g., hero_name"
          className={errors.key ? 'border-red-500' : ''}
        />
        {errors.key && (
          <p className="text-sm text-red-500 mt-1">{errors.key}</p>
        )}
      </div>

      <div>
        <Label htmlFor="fact-value">Fact Value</Label>
        <Textarea
          id="fact-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., Lyra Starweaver"
          rows={2}
          className={errors.value ? 'border-red-500' : ''}
        />
        {errors.value && (
          <p className="text-sm text-red-500 mt-1">{errors.value}</p>
        )}
      </div>

      <div>
        <Label htmlFor="fact-category">Category</Label>
        <Select 
          id="fact-category"
          value={category} 
          onChange={(e) => setCategory(e.target.value as LoreCategory)}
        >
          <option value="characters">Characters</option>
          <option value="locations">Locations</option>
          <option value="events">Events</option>
          <option value="rules">Rules</option>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category}</p>
        )}
      </div>

      <div>
        <Label htmlFor="fact-description">Description (Optional)</Label>
        <Textarea
          id="fact-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional context or details..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="fact-importance">Importance</Label>
        <Select 
          id="fact-importance"
          value={importance} 
          onChange={(e) => setImportance(e.target.value as 'low' | 'medium' | 'high')}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="fact-tags">Tags (Optional, comma-separated)</Label>
        <Input
          id="fact-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., main character, protagonist, hero"
        />
      </div>

      {isDuplicate && !fact && (
        <Alert className="border-yellow-500">
          <AlertDescription>
            Duplicate fact detected. This fact already exists for this world.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isDuplicate && !fact}>
          {fact ? 'Save Changes' : 'Add Fact'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};