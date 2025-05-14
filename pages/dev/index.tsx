import Link from 'next/link';

export default function DevIndexPage() {
  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Development Test Harnesses
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link
          href="/dev/world-list-screen"
          style={{
            display: 'block',
            padding: '16px',
            backgroundColor: '#dbeafe',
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#bfdbfe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dbeafe';
          }}
        >
          World List Screen Test Harness
        </Link>
      </div>
    </div>
  );
}
