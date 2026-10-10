import { useState, useEffect } from 'react'

const MSGS = [
  'INITIALIZING NEURAL NETWORK...',
  'MAPPING HISTORICAL DATASETS...',
  'COMPUTING ARCHETYPAL VECTORS...',
  'ENGINEERING ROADMAP...',
]

export default function LoadingPage() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % MSGS.length), 1500)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--white)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 64,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient static noise / glow */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,0,0,0.02), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="loader-ring" style={{ zIndex: 1 }} />

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontFamily: "'Outfit',sans-serif",
          fontSize: 32, fontWeight: 300,
          color: 'var(--text)',
          letterSpacing: '0.1em',
          marginBottom: 16,
        }}>
          SYSTEM PROCESSING
        </div>
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: 'var(--muted)',
          letterSpacing: '0.2em',
          transition: 'all 0.4s ease',
          minHeight: 24,
        }}>
          {MSGS[idx]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, zIndex: 1 }}>
        {MSGS.map((_, i) => (
          <div key={i} style={{
            width: i === idx ? 32 : 8,
            height: 2,
            background: i === idx ? 'var(--text)' : 'var(--dark-4)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        ))}
      </div>
    </div>
  )
}
