import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Play, CheckCircle } from 'lucide-react';

interface WorldCardActionsProps {
  worldId?: string;
  isActive?: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMakeActive?: () => void;
}

const WorldCardActions: React.FC<WorldCardActionsProps> = ({ 
  worldId, 
  isActive = false, 
  onPlay, 
  onEdit, 
  onDelete,
  onMakeActive 
}) => {
  const router = useRouter();

  const handleCreateCharacter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (worldId) {
      router.push(`/characters/create`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Primary Actions */}
      <div className="flex gap-2">
        {isActive ? (
          <>
            <Button 
              onClick={handleCreateCharacter}
              variant="default"
              className="flex-1 bg-green-500 hover:bg-green-700 text-white font-medium"
              data-testid="world-card-actions-create-character-button"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create Character
            </Button>
            <Button 
              onClick={onPlay} 
              variant="default"
              className="flex-1 bg-blue-700 hover:bg-blue-900 text-white font-medium"
              data-testid="world-card-actions-play-button"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              Play
            </Button>
          </>
        ) : (
          <Button 
            onClick={onMakeActive}
            variant="default"
            className="w-full bg-green-500 hover:bg-green-700 text-white font-medium"
            data-testid="world-card-actions-make-active-button"
          >
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            Make Active World
          </Button>
        )}
      </div>
      
      {/* Secondary Actions */}
      <div className="flex gap-2 text-sm">
        <Button 
          onClick={onEdit} 
          variant="outline"
          size="sm"
          className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-100"
          data-testid="world-card-actions-edit-button"
        >
          Edit
        </Button>
        <Button 
          onClick={onDelete} 
          variant="outline"
          size="sm"
          className="flex-1 text-red-500 border-red-300 hover:bg-red-200"
          data-testid="world-card-actions-delete-button"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default WorldCardActions;
