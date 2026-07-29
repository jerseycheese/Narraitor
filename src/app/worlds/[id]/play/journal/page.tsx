import React from 'react';
import type { Metadata } from 'next';
import { JournalPage } from '@/components/Journal';

export const metadata: Metadata = {
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
