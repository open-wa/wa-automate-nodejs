import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Open WA v5 Documentation</h1>
      <p style={{ marginBottom: '2rem' }}>Comprehensive guides and API reference.</p>
      <Link href="/docs" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go to Documentation
      </Link>
    </main>
  );
}
