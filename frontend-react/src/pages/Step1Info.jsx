const POSITIONS = ['PG','SG','SF','PF','C']
const LEVELS = [
  { id: 'lycee', label: 'AMATEUR', desc: 'Regional / High School', val: 'lycee' },
  { id: 'univ', label: 'COLLEGIATE', desc: 'NCAA / University', val: 'universitaire' },
  { id: 'semipro', label: 'SEMI-PRO', desc: 'Pro B / Local Elite', val: 'semi-pro' },
  { id: 'pro', label: 'PROFESSIONAL', desc: 'Pro A / EuroLeague', val: 'pro-international' },
  { id: 'intl', label: 'ELITE', desc: 'World Class / National', val: 'pro-international' },
]

export default function Step1Info({ info, onChange, onNext, onBack }) {
  const set = (k, v) => onChange(prev => ({ ...prev, [k]: v }))

  const handleNext = () => {
    if (!info.name.trim()) { alert('Entrez votre nom'); return }
    onNext()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            BUL PLAYER DEVELOPMENT
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
        {/* Steps */}
        <div className="steps">
          {['Profile', 'Metrics', 'Target'].map((l, i) => (
            <div key={i} className="step-wrap">
              {i < 2 && <div className={`step-line${i === 0 ? ' done' : ''}`} />}
              <div className={`step-circ${i === 0 ? ' active' : ''}`}>{i + 1}</div>
              <span className={`step-lbl${i === 0 ? ' active' : ''}`}>{l}</span>
            </div>
          ))}
        </div>

        <div className="section-tag">PHASE 01</div>
        <div className="section-title" style={{ marginBottom: 64 }}>INITIALIZE PROFILE.</div>

        {/* Name */}
        <div style={{ marginBottom: 40 }}>
          <label className="f-label">SUBJECT IDENTIFIER</label>
          <input
            className="f-input" placeholder="Enter Full Name"
            value={info.name} onChange={e => set('name', e.target.value)}
            style={{ fontSize: 20, padding: '24px', letterSpacing: '-0.02em' }}
          />
        </div>

        {/* Age + Position */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <label className="f-label" style={{ margin: 0 }}>BIOLOGICAL AGE</label>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {info.age} <span style={{ fontSize: 12, fontFamily: 'Inter', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.1em' }}>YRS</span>
              </span>
            </div>
            <input type="range" className="range-input" min={15} max={40} value={info.age} onChange={e => set('age', +e.target.value)} />
          </div>
          <div>
            <label className="f-label" style={{ marginBottom: 16 }}>PRIMARY ROLE</label>
            <div className="pos-pills">
              {POSITIONS.map(p => (
                <button key={p} className={`pos-pill${info.position === p ? ' active' : ''}`} onClick={() => set('position', p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Height + Weight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <label className="f-label" style={{ margin: 0 }}>HEIGHT</label>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {info.height_cm} <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.1em' }}>CM</span>
              </span>
            </div>
            <input type="range" className="range-input" min={160} max={225} value={info.height_cm} onChange={e => set('height_cm', +e.target.value)} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <label className="f-label" style={{ margin: 0 }}>WEIGHT</label>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {info.weight_kg} <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.1em' }}>KG</span>
              </span>
            </div>
            <input type="range" className="range-input" min={55} max={155} value={info.weight_kg} onChange={e => set('weight_kg', +e.target.value)} />
          </div>
        </div>

        {/* Level */}
        <label className="f-label" style={{ display: 'block', marginBottom: 20 }}>COMPETITION TIER</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', marginBottom: 64, background: 'var(--border)', border: '1px solid var(--border)' }}>
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => set('level', l.val)} style={{
              padding: '24px 20px',
              border: 'none',
              background: info.level === l.val ? 'var(--text)' : 'var(--white)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s', fontFamily: 'Inter',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', letterSpacing: '0.1em', color: info.level === l.val ? 'var(--white)' : 'var(--text)' }}>{l.label}</span>
              <span style={{ fontSize: 11, color: info.level === l.val ? 'var(--dark-4)' : 'var(--muted)', display: 'block', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{l.desc}</span>
            </button>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onBack}>ABORT</button>
          <button className="btn btn-accent btn-lg" onClick={handleNext}>PROCEED TO METRICS</button>
        </div>
      </div>
    </div>
  )
}
