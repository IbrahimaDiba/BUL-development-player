import { useState } from 'react'

export default function Reevaluation({ current, onSubmit, onBack }) {
  const [stats, setStats] = useState(current)
  const upd = (k, v) => setStats(prev => ({...prev, [k]: v}))

  return (
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',flexDirection:'column'}}>
      <nav className="nav"><div className="nav-inner"><div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>BUL Player Development</div></div></nav>
      <div className="form-container reeval-container" style={{maxWidth:680,margin:'0 auto',padding:'48px 24px',width:'100%'}}>

        <div className="section-title" style={{marginBottom:16}}>Réévaluation</div>
        <p style={{color:'#737373',fontSize:15,marginBottom:32}}>Entrez vos nouvelles statistiques pour mesurer votre progression.</p>

        {/* PARTICIPATION */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>PARTICIPATION</div>
        <div className="stat-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:28}}>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <label className="f-label">Minutes</label>
              <span style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:700}}>{stats.mp_per_game}</span>
            </div>
            <input type="range" className="range-input" min={0} max={48} value={stats.mp_per_game} onChange={e=>upd('mp_per_game',+e.target.value)} />
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <label className="f-label">% Titulaire</label>
              <span style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:700}}>{Math.round(stats.gs*100)}%</span>
            </div>
            <input type="range" className="range-input" min={0} max={1} step={0.05} value={stats.gs} onChange={e=>upd('gs',+e.target.value)} />
          </div>
        </div>

        {/* SCORING */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>SCORING</div>
        <div className="stat-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:16}}>
          <div>
            <label className="f-label">PTS / Match</label>
            <input type="number" className="f-input" step={0.1} min={0} value={stats.pts_per_game} onChange={e=>upd('pts_per_game',+e.target.value)} />
          </div>
          <div className="stat-subgrid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="f-label">FG Réussis</label><input type="number" className="f-input" step={0.1} min={0} value={stats.fg_per_game} onChange={e=>upd('fg_per_game',+e.target.value)} /></div>
            <div><label className="f-label">FG Tentés</label><input type="number" className="f-input" step={0.1} min={0} value={stats.fga_per_game} onChange={e=>upd('fga_per_game',+e.target.value)} /></div>
          </div>
        </div>
        <div className="stat-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:28}}>
          <div className="stat-subgrid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="f-label">3P Réussis</label><input type="number" className="f-input" step={0.1} min={0} value={stats.x3p_per_game} onChange={e=>upd('x3p_per_game',+e.target.value)} /></div>
            <div><label className="f-label">3P Tentés</label><input type="number" className="f-input" step={0.1} min={0} value={stats.x3pa_per_game} onChange={e=>upd('x3pa_per_game',+e.target.value)} /></div>
          </div>
          <div className="stat-subgrid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="f-label">LF Réussis</label><input type="number" className="f-input" step={0.1} min={0} value={stats.ft_per_game} onChange={e=>upd('ft_per_game',+e.target.value)} /></div>
            <div><label className="f-label">LF Tentés</label><input type="number" className="f-input" step={0.1} min={0} value={stats.fta_per_game} onChange={e=>upd('fta_per_game',+e.target.value)} /></div>
          </div>
        </div>

        {/* REBONDS */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>REBONDS</div>
        <div className="stat-grid-3" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:28}}>
          <div><label className="f-label">Offensifs</label><input type="number" className="f-input" step={0.1} min={0} value={stats.orb_per_game} onChange={e=>upd('orb_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Défensifs</label><input type="number" className="f-input" step={0.1} min={0} value={stats.drb_per_game} onChange={e=>upd('drb_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Total (Auto)</label><input type="number" className="f-input" value={(stats.orb_per_game+stats.drb_per_game).toFixed(1)} disabled style={{background:'var(--g50)',borderColor:'var(--g100)',color:'var(--g500)'}} /></div>
        </div>

        {/* JEU */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>CRÉATION & DÉFENSE</div>
        <div className="stat-grid-3" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:28}}>
          <div><label className="f-label">Passes (AST)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.ast_per_game} onChange={e=>upd('ast_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Interceptions (STL)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.stl_per_game} onChange={e=>upd('stl_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Contres (BLK)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.blk_per_game} onChange={e=>upd('blk_per_game',+e.target.value)} /></div>
        </div>

        {/* Nav */}
        <div className="form-actions reeval-actions" style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:24,borderTop:'1px solid var(--g100)',marginTop:32}}>
          <button className="btn btn-ghost" onClick={onBack}>← Annuler</button>
          <button className="btn btn-accent btn-lg" onClick={()=>onSubmit(stats)}>Calculer ma Progression</button>
        </div>
      </div>
    </div>
  )
}
