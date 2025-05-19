'use client';

import { FC } from 'react';
import WorldEditor from '@/components/WorldEditor/WorldEditor';

interface EditWorldPageProps {
  params: {
    id: string;
  };
}

const EditWorldPage: FC<EditWorldPageProps> = ({ params }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit World</h1>
      <WorldEditor worldId={params.id} />
    </div>
  );
};

export default EditWorldPage;