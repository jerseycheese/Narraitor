import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingState
        message="Loading..."
        size="lg"
        theme="light"
        centered={false}
      />
    </div>
  );
}
