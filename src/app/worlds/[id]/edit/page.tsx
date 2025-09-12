import WorldEditor from '@/components/WorldEditor/WorldEditor';
import { PageLayout } from '@/components/shared/PageLayout';

export default function EditWorldPage({ params }: { params: { id: string } }) {
  return (
    <PageLayout title="Edit World">
      <WorldEditor worldId={params.id} />
    </PageLayout>
  );
}
