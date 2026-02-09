'use client';

import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';

interface GameSessionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'start-new' | 'character-switch';
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
  const tone = type === 'character-switch' ? 'info' : 'warning';

  const descriptionWithContext =
    type === 'start-new'
      ? `${config.description}${currentProgress > 0 ? ` (${currentProgress} story segments so far).` : ''}`
      : `${config.description.replace('hero', characterName || 'selected hero')}${
          currentProgress > 0 ? ` (${currentProgress} story segments so far).` : ''
        }`;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      description={descriptionWithContext}
      tone={tone}
      size="md"
      showCloseButton={false}
      footer={
        <div >
          <Button onClick={onClose} variant="" >
            {config.cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={tone === 'warning' ? 'warning' : 'info'}
            
          >
            {type === 'character-switch' && characterName
              ? `Play as${characterName}`
              : config.confirmText}
          </Button>
        </div>
      }
      footerClassName=""
    />
  );
}
