import React from 'react';

interface WorldCardActionsProps {
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WorldCardActions: React.FC<WorldCardActionsProps> = ({ onPlay, onEdit, onDelete }) => {
  const baseButtonClass = "px-4 py-3 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const playButtonClass = `${baseButtonClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
  const editButtonClass = `${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  const deleteButtonClass = `${baseButtonClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;

  return (
    <div className="flex gap-2">
      <button 
        onClick={onPlay} 
        className={playButtonClass}
        data-testid="world-card-actions-play-button"
      >
        Play
      </button>
      <button 
        onClick={onEdit} 
        className={editButtonClass}
        data-testid="world-card-actions-edit-button"
      >
        Edit
      </button>
      <button 
        onClick={onDelete} 
        className={deleteButtonClass}
        data-testid="world-card-actions-delete-button"
      >
        Delete
      </button>
    </div>
  );
};

export default WorldCardActions;