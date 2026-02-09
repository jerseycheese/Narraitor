import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

export default function Loading() {
  return (
    <div>
      <LoadingState
        message="Loading..."
        size="lg"
        theme="light"
        centered={false}
      />
    </div>
  );
}
