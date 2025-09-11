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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="worldName">
          Name
        </Label>
        <Input
          id="worldName"
          type="text"
          placeholder="Enter world name..."
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
          placeholder="Enter world description..."
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
      
      {/* World Type Section */}
      <div className="space-y-2">
        <Label htmlFor="worldType">
          World Type
        </Label>
        <Select
          id="worldType"
          value={world.reference ? (world.relationship === 'set_within' ? 'set_within' : 'inspired_by') : 'original'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'original') {
              onChange({ reference: undefined, relationship: undefined });
            } else if (value === 'set_within') {
              onChange({ relationship: 'set_within', reference: world.reference || '' });
            } else if (value === 'inspired_by') {
              onChange({ relationship: 'inspired_by', reference: world.reference || '' });
            }
          }}
        >
          <option value="original">Original World</option>
          <option value="set_within">Set Within</option>
          <option value="inspired_by">Inspired By</option>
        </Select>
      </div>

      {/* Reference field - only show if not original world */}
      {world.reference !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="worldReference">
            {world.relationship === 'set_within' ? 'Set Within Universe' : 'Inspired By'}
          </Label>
          <Input
            id="worldReference"
            type="text"
            placeholder="e.g., Star Wars, Lord of the Rings, Harry Potter"
            value={world.reference || ''}
            onChange={(e) => onChange({ reference: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

export default WorldBasicInfoForm;