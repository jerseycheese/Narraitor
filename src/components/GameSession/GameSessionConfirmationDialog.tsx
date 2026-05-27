'use client';

import { ConfirmationDialog } from '@/components/ConfirmationDialog/ConfirmationDialog';

interface GameSessionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'start-new' | 'character-switch' | 'exit';
  characterName?: string;
  currentProgress?: number;
}

const copyConfig: Record<GameSessionConfirmationDialogProps['type'], {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
}> = {
  'start-new': {
    title: 'Start New Session?',
    description:
      'Starting fresh will end your current story session and begin a brand new one. Your progress is saved but you\'ll lose your current place in the narrative.',
    confirmText: 'Start New Session',
    cancelText: 'Keep Current Session',
  },
  'character-switch': {
    title: 'Switch Characters?',
    description:
      'Switching characters ends the current session and starts a new one with the selected hero. Your existing progress is saved so you can return later.',
    confirmText: 'Switch Characters',
    cancelText: 'Stay with Current Character',
  },
  'exit': {
    title: 'Leave the Story?',
    description:
      'Your progress is saved automatically, so you can resume from this exact spot any time. Are you sure you want to step away now?',
    confirmText: 'Leave Story',
    cancelText: 'Keep Playing',
  },
};

export function GameSessionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  characterName,
  currentProgress = 0,
}: GameSessionConfirmationDialogProps) {
  const config = copyConfig[type];
  const variant = type === 'character-switch' ? 'info' : 'warning';

  const descriptionWithContext =
    type === 'start-new'
      ? `${config.description}${currentProgress > 0 ? ` (${currentProgress} story segments so far).` : ''}`
      : `${config.description.replace('hero', characterName || 'selected hero')}${
          currentProgress > 0 ? ` (${currentProgress} story segments so far).` : ''
        }`;

  const confirmText =
    type === 'character-switch' && characterName
      ? `Play as ${characterName}`
      : config.confirmText;

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={config.title}
      message={descriptionWithContext}
      variant={variant}
      confirmText={confirmText}
      cancelText={config.cancelText}
    />
  );
}
