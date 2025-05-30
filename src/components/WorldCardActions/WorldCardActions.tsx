import React from 'react';
import { useRouter } from 'next/navigation';

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
            <button 
              onClick={handleCreateCharacter}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              data-testid="world-card-actions-create-character-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Character
            </button>
            <button 
              onClick={onPlay} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              data-testid="world-card-actions-play-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play
            </button>
          </>
        ) : (
          <button 
            onClick={onMakeActive}
            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            data-testid="world-card-actions-make-active-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Make Active World
          </button>
        )}
      </div>
      
      {/* Secondary Actions */}
      <div className="flex gap-2 text-sm">
        <button 
          onClick={onEdit} 
          className="flex-1 px-3 py-1.5 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          data-testid="world-card-actions-edit-button"
        >
          Edit
        </button>
        <button 
          onClick={onDelete} 
          className="flex-1 px-3 py-1.5 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          data-testid="world-card-actions-delete-button"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default WorldCardActions;