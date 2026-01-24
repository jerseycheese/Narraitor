import { World } from '@/types/world.types';

type AttributeLike = {
  id?: string;
  attributeId?: string;
  value?: number;
  baseValue?: number;
};

export function calculateCharacterLevel(world: World, attributes: AttributeLike[]): number {
  if (!world?.attributes?.length || attributes.length === 0) {
    return 1;
  }

  const minSum = world.attributes.reduce((sum, attr) => sum + attr.minValue, 0);
  const maxSum = world.attributes.reduce((sum, attr) => sum + attr.maxValue, 0);

  if (maxSum <= minSum) {
    return 1;
  }

  const total = world.attributes.reduce((sum, worldAttr) => {
    const match = attributes.find((attr) =>
      (attr.id ?? attr.attributeId) === worldAttr.id
    );
    const value = typeof match?.value === 'number'
      ? match.value
      : typeof match?.baseValue === 'number'
      ? match.baseValue
      : worldAttr.minValue;
    return sum + value;
  }, 0);

  const normalized = Math.max(0, Math.min(1, (total - minSum) / (maxSum - minSum)));
  return 1 + Math.floor(normalized * 4);
}
