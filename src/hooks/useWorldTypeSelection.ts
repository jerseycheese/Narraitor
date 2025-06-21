import { useState, useCallback, useMemo } from 'react';
import { 
  WorldTypeData, 
  validateWorldTypeData, 
  convertToGenerationParams, 
  createInitialWorldTypeData 
} from '@/components/shared/WorldTypeSelector';

export interface UseWorldTypeSelectionOptions {
  initialData?: Partial<WorldTypeData>;
  onChange?: (data: WorldTypeData, isValid: boolean) => void;
}

export interface UseWorldTypeSelectionReturn {
  data: WorldTypeData;
  updateData: (updates: Partial<WorldTypeData>) => void;
  setData: (data: WorldTypeData) => void;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  generationParams: {
    reference?: string;
    relationship?: 'based_on' | 'set_in';
  };
  reset: () => void;
}

/**
 * Custom hook for managing world type selection state and validation
 */
export function useWorldTypeSelection({
  initialData,
  onChange,
}: UseWorldTypeSelectionOptions = {}): UseWorldTypeSelectionReturn {
  const [data, setDataInternal] = useState<WorldTypeData>(() => ({
    ...createInitialWorldTypeData(),
    ...initialData,
  }));

  const validation = useMemo(() => {
    const errors = validateWorldTypeData(data);
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [data]);

  const generationParams = useMemo(() => convertToGenerationParams(data), [data]);

  const setData = useCallback((newData: WorldTypeData) => {
    setDataInternal(newData);
    const errors = validateWorldTypeData(newData);
    onChange?.(newData, errors.length === 0);
  }, [onChange]);

  const updateData = useCallback((updates: Partial<WorldTypeData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
  }, [data, setData]);

  const reset = useCallback(() => {
    const initialWorldTypeData = {
      ...createInitialWorldTypeData(),
      ...initialData,
    };
    setData(initialWorldTypeData);
  }, [initialData, setData]);

  return {
    data,
    updateData,
    setData,
    validation,
    generationParams,
    reset,
  };
}