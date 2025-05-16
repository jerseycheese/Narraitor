import Link from 'next/link';

export default function DevPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-blue-600 text-white p-4 mb-4 rounded shadow">
          <h1 className="text-2xl font-bold">Narraitor Development</h1>
          <p className="text-sm">Test environments for component development</p>
        </header>
        
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Development Test Harnesses</h1>
          <div className="space-y-2">
            <Link href="/dev/world-creation-wizard" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
              World Creation Wizard Test Harness
            </Link>
            <Link href="/dev/test" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
              Test Component Harness
            </Link>
            <Link href="/dev/controls" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
              Controls Test Harness
            </Link>
            <Link href="/dev/mocks" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
              Mocks Test Harness
            </Link>
            <Link href="/dev/template-selector" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
              Template Selector Test Harness
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}