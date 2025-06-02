'use client';

import { useParams } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import Link from 'next/link';
import Image from 'next/image';
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

        {/* Hero Image */}
        {world.image?.url && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <Image 
              src={world.image.url} 
              alt={`${world.name} world`}
              width={800}
              height={400}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-4">{world.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {world.theme && (
              <span className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
              </span>
            )}
            {world.universeReference && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                {world.universeRelationship === 'set_in' ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Set in {world.universeReference}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Inspired by {world.universeReference}
                  </>
                )}
              </span>
            )}
          </div>
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
            href={`/characters?worldId=${worldId}`}
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
