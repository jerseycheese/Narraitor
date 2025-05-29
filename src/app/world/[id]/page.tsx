'use client';

import { useParams } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import Link from 'next/link';
import { SectionError } from '@/components/ui/ErrorDisplay';
import { DataField } from '@/components/shared/DataField';

export default function WorldViewPage() {
  const params = useParams();
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
        <div className="mb-6">
          <Link href="/worlds" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <span>←</span> Back to Worlds
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-4">{world.name}</h1>
          {world.theme && (
            <span className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
            </span>
          )}
        </header>

        <div className="flex gap-3 mb-8">
          <Link
            href={`/world/${worldId}/edit`}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            Edit World
          </Link>
          <Link
            href={`/world/${worldId}/play`}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
          >
            Play in World
          </Link>
          <Link
            href="/characters"
            className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
          >
            View Characters
          </Link>
        </div>

        <section className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700 leading-relaxed">{world.description}</p>
        </section>

        <section className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">World Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <DataField 
              label="Created" 
              value={new Date(world.createdAt).toLocaleDateString()} 
              variant="inline"
            />
            <DataField 
              label="Updated" 
              value={new Date(world.updatedAt).toLocaleDateString()} 
              variant="inline"
            />
            <DataField 
              label="Attributes" 
              value={world.attributes?.length || 0} 
              variant="inline"
            />
            <DataField 
              label="Skills" 
              value={world.skills?.length || 0} 
              variant="inline"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
