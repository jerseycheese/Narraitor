import React, { use } from 'react';
import WorldEditor from '@/components/WorldEditor/WorldEditor';
import { PageLayout } from '@/components/shared/PageLayout';

export default function EditWorldPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  return (
    <PageLayout title="Edit World">
      <WorldEditor worldId={resolved.id} />
    </PageLayout>
  );
}
