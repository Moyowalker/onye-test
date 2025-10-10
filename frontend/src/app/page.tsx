export default function Home() {
  return (
    <div className="container">
      <main className="main">
        <h1 className="title">Welcome to Your App</h1>
        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>
          FastAPI Backend + Next.js Frontend
        </p>
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#888' }}>
          Start building your application here!
        </p>
      </main>
    </div>
  )
}