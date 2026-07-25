import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

export default function Loading() {
  return (
    <div className="component-loading-center">
      <LoadingState
        message="Loading..."
        size="lg"
      />
    </div>
  );
}
