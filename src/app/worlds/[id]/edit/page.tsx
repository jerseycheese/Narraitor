'use client';

import React, { FC, use } from 'react';
import WorldEditor from '@/components/WorldEditor/WorldEditor';
import { PageLayout } from '@/components/shared/PageLayout';

interface EditWorldPageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditWorldPage: FC<EditWorldPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  
  return (
    <PageLayout title="Edit World">
      <WorldEditor worldId={resolvedParams.id} />
    </PageLayout>
  );
};

export default EditWorldPage;
