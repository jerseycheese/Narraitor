'use client';

import React, { FC, use } from 'react';
import WorldEditor from '@/components/WorldEditor/WorldEditor';

interface EditWorldPageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditWorldPage: FC<EditWorldPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit World</h1>
      <WorldEditor worldId={resolvedParams.id} />
    </div>
  );
};

export default EditWorldPage;