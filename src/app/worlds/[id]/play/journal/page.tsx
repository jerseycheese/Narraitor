import React from 'react';
import { JournalPage } from '@/components/Journal';

export const metadata = {
  title: 'Journal',
};

interface JournalPageRouteProps {
  params: {
    id: string;
  };
}

export default function JournalPageRoute({ params }: JournalPageRouteProps) {
  return <JournalPage worldId={params.id} />;
}
