import { useEffect, useState } from 'react'
import { checkHealth } from '../api'

const STATS = [
  { val: '33,000+', lbl: 'PROFILES', sub: '1947 — 2026' },
  { val: '70B', lbl: 'PARAMETERS', sub: 'LLAMA 3.3 INTELLIGENCE' },
  { val: '100%', lbl: 'CUSTOM', sub: 'TAILORED ROADMAP' },
]

export default function Hero({ onStart }) {
  const [health, setHealth] = useState(null)
  useEffect(() => { checkHealth().then(setHealth).catch(() => {}) }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--white)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Minimalist ambient noise or subtle gradient ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'radial-gradient(circle at 10% 10%, rgba(0,0,0,0.03), transparent 50%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Nav ── */}
      <nav className="hero-nav" style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        padding: '0 48px', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 500, fontSize: 24, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text)' }}>
          BUL PLAYER DEVELOPMENT
        </div>
        {health && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <div style={{ width: 6, height: 6, background: 'var(--text)', animation: 'pulse 2s infinite' }} />
            {health.players_count?.toLocaleString()} PLAYERS — {health.models_loaded ? 'SYSTEM ONLINE' : 'BOOTING'}
          </div>
        )}
      </nav>

      {/* ── Hero body ── */}
      <div className="hero-body" style={{
        flex: 1, display: 'flex', alignItems: 'center',
        maxWidth: 1400, margin: '0 auto',
        padding: '80px 48px', width: '100%',
        gap: 120, zIndex: 1,
      }}>

        {/* LEFT */}
        <div style={{ flex: 1 }} className="anim-0">
          <div className="badge badge-accent" style={{ marginBottom: 40, padding: '8px 16px', letterSpacing: '0.2em' }}>
            INTELLIGENCE ARTIFICIELLE
          </div>
          <h1 style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 'clamp(64px, 10vw, 130px)',
            fontWeight: 300, lineHeight: 0.9,
            letterSpacing: '-0.06em',
            color: 'var(--text)',
            marginBottom: 40,
            textTransform: 'uppercase'
          }}>
            TRANSCEND<br />
            <span style={{ fontWeight: 600 }}>LIMITS.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 300, color: 'var(--muted)', maxWidth: 520, marginBottom: 56 }}>
            The ultimate standard in basketball analytics. Compare your metrics against NBA legends and let the neural network engineer your path to the elite level.
          </p>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onStart} className="btn btn-accent btn-lg" style={{ fontSize: 15, padding: '24px 64px' }}>
              INITIALIZE ANALYSIS
            </button>
          </div>
        </div>

        {/* RIGHT STATS */}
        <div className="hero-stats anim-1" style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 360, borderLeft: '1px solid var(--border)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '40px 48px',
              borderBottom: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              animation: `fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s both`,
            }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 56, fontWeight: 300, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.05em' }}>
                {s.val}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{s.lbl}</div>
              <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--gray-light)', marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 48px',
        display: 'flex', gap: 64, alignItems: 'center',
        color: 'var(--muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
        zIndex: 1,
      }}>
        {['KMeans Architecture', 'Historical Data Mapping', 'LLM Conversational Engine', 'Dynamic Milestones'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--text)' }}>/</span> {f}
          </div>
        ))}
      </div>
    </div>
  )
}
