import React from 'react';
import { World } from '@/types/world.types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { THEMES, getThemeLabel } from '@/lib/constants/themes';

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
          <Label htmlFor="worldTheme">
            Theme
          </Label>
          <select
            id="worldTheme"
            value={world.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {THEMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};

export default WorldBasicInfoForm;
