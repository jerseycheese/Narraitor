import React from 'react';
import { JournalPage } from '@/components/Journal';

export const metadata = {
  title: 'Journal',
};

interface JournalPageRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JournalPageRoute({ params }: JournalPageRouteProps) {
  const { id } = await params;
  return <JournalPage worldId={id} />;
}
