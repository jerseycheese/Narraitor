import React from 'react';

interface WorldCardActionsProps {
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WorldCardActions: React.FC<WorldCardActionsProps> = ({ onPlay, onEdit, onDelete }) => {
  return (
    <div>
      <button onClick={onPlay} data-testid="world-card-actions-play-button">
        Play
      </button>
      <button onClick={onEdit} data-testid="world-card-actions-edit-button">
        Edit
      </button>
      <button onClick={onDelete} data-testid="world-card-actions-delete-button">
        Delete
      </button>
    </div>
  );
};

export default WorldCardActions;