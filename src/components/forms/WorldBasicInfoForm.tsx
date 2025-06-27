import React from 'react';
import { World } from '@/types/world.types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { GENRES } from '@/lib/constants/genres';

interface WorldBasicInfoFormProps {
  world: World;
  onChange: (updates: Partial<World>) => void;
}

const WorldBasicInfoForm: React.FC<WorldBasicInfoFormProps> = ({ world, onChange }) => {
  return (
    <section className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="worldName">
            Name
          </Label>
          <Input
            id="worldName"
            type="text"
            value={world.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="worldDescription">
            Description
          </Label>
          <Textarea
            id="worldDescription"
            value={world.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="worldGenre">
            Genre
          </Label>
          <Select
            id="worldGenre"
            value={world.genre}
            onChange={(e) => onChange({ genre: e.target.value })}
          >
            {GENRES.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  );
};

export default WorldBasicInfoForm;
