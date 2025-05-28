'use client';

import { useParams, useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import Link from 'next/link';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { SectionError } from '@/components/ui/ErrorDisplay';

export default function WorldViewPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const world = worldStore((state) => state.worlds[worldId]);

  if (!world) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <SectionError
            title="World Not Found"
            message="The world you're looking for doesn't exist."
            severity="error"
          />
          <Link href="/worlds" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Worlds
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{world.name}</h1>
          {world.theme && (
            <span className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
            </span>
          )}
        </header>

        <section className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700 leading-relaxed">{world.description}</p>
        </section>

        <section className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">World Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Created:</span>
              <span className="ml-2">{new Date(world.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Updated:</span>
              <span className="ml-2">{new Date(world.updatedAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Attributes:</span>
              <span className="ml-2">{world.attributes?.length || 0}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Skills:</span>
              <span className="ml-2">{world.skills?.length || 0}</span>
            </div>
          </div>
        </section>

        <div className="flex gap-4">
          <Link
            href={`/world/${worldId}/edit`}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit World
          </Link>
          <Link
            href={`/world/${worldId}/play`}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Play in World
          </Link>
          <Link
            href="/characters"
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            View Characters
          </Link>
        </div>
      </div>
    </main>
  );
}
