export default function Step2Stats({ stats, onChange, onNext, onBack }) {
  const upd = (k, v) => onChange(prev => ({...prev, [k]: v}))

  return (
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',flexDirection:'column'}}>
      <nav className="nav"><div className="nav-inner"><div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>BUL Player Development</div></div></nav>
      <div style={{maxWidth:680,margin:'0 auto',padding:'48px 24px',width:'100%'}}>
        {/* Steps */}
        <div className="steps">
          {['Profil','Statistiques','Cible NBA'].map((l,i)=>(
            <div key={i} className="step-wrap">
              {i<2&&<div className="step-line done" />}
              <div className={`step-circ${i===1?' active':i<1?' done':''}`}>{i<1?'✓':i+1}</div>
              <span className={`step-lbl${i===1?' active':''}`}>{l}</span>
            </div>
          ))}
        </div>

        <div className="section-tag">Étape 02</div>
        <div className="section-title" style={{marginBottom:16}}>Vos Statistiques</div>
        <p style={{color:'#737373',fontSize:15,marginBottom:32}}>Indiquez vos statistiques moyennes par match.</p>

        {/* PARTICIPATION */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>PARTICIPATION</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:28}}>
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
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:16}}>
          <div>
            <label className="f-label">PTS / Match</label>
            <input type="number" className="f-input" step={0.1} min={0} value={stats.pts_per_game} onChange={e=>upd('pts_per_game',+e.target.value)} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="f-label">FG Réussis</label><input type="number" className="f-input" step={0.1} min={0} value={stats.fg_per_game} onChange={e=>upd('fg_per_game',+e.target.value)} /></div>
            <div><label className="f-label">FG Tentés</label><input type="number" className="f-input" step={0.1} min={0} value={stats.fga_per_game} onChange={e=>upd('fga_per_game',+e.target.value)} /></div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:28}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="f-label">3P Réussis</label><input type="number" className="f-input" step={0.1} min={0} value={stats.x3p_per_game} onChange={e=>upd('x3p_per_game',+e.target.value)} /></div>
            <div><label className="f-label">3P Tentés</label><input type="number" className="f-input" step={0.1} min={0} value={stats.x3pa_per_game} onChange={e=>upd('x3pa_per_game',+e.target.value)} /></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="f-label">LF Réussis</label><input type="number" className="f-input" step={0.1} min={0} value={stats.ft_per_game} onChange={e=>upd('ft_per_game',+e.target.value)} /></div>
            <div><label className="f-label">LF Tentés</label><input type="number" className="f-input" step={0.1} min={0} value={stats.fta_per_game} onChange={e=>upd('fta_per_game',+e.target.value)} /></div>
          </div>
        </div>

        {/* REBONDS */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>REBONDS</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:28}}>
          <div><label className="f-label">Offensifs</label><input type="number" className="f-input" step={0.1} min={0} value={stats.orb_per_game} onChange={e=>upd('orb_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Défensifs</label><input type="number" className="f-input" step={0.1} min={0} value={stats.drb_per_game} onChange={e=>upd('drb_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Total (Auto)</label><input type="number" className="f-input" value={(stats.orb_per_game+stats.drb_per_game).toFixed(1)} disabled style={{background:'var(--g50)',borderColor:'var(--g100)',color:'var(--g500)'}} /></div>
        </div>

        {/* JEU */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>CRÉATION & DÉFENSE</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:28}}>
          <div><label className="f-label">Passes (AST)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.ast_per_game} onChange={e=>upd('ast_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Interceptions (STL)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.stl_per_game} onChange={e=>upd('stl_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Contres (BLK)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.blk_per_game} onChange={e=>upd('blk_per_game',+e.target.value)} /></div>
        </div>

        {/* DISCIPLINE */}
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#FF5722',borderBottom:'1px solid var(--g100)',paddingBottom:8,marginBottom:16}}>DISCIPLINE</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:32}}>
          <div><label className="f-label">Balles Perdues (TOV)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.tov_per_game} onChange={e=>upd('tov_per_game',+e.target.value)} /></div>
          <div><label className="f-label">Fautes (PF)</label><input type="number" className="f-input" step={0.1} min={0} value={stats.pf_per_game} onChange={e=>upd('pf_per_game',+e.target.value)} /></div>
        </div>

        {/* LIVE PREVIEW */}
        <div className="live-bar">
          {[{lbl:'PTS',v:stats.pts_per_game?.toFixed(1)},{lbl:'AST',v:stats.ast_per_game?.toFixed(1)},{lbl:'REB',v:(stats.orb_per_game+stats.drb_per_game)?.toFixed(1)},
            {lbl:'FG%',v:stats.fga_per_game>0?(stats.fg_per_game/stats.fga_per_game*100).toFixed(0)+'%':'—'},
            {lbl:'TS%',v:(()=>{const d=2*(stats.fga_per_game+.44*stats.fta_per_game);return d>0?(stats.pts_per_game/d*100).toFixed(0)+'%':'—'})()}
          ].map(s=>(
            <div key={s.lbl} className="live-stat"><div className="lv">{s.v}</div><div className="ll">{s.lbl}</div></div>
          ))}
        </div>

        {/* Nav */}
        <div style={{display:'flex',justifyContent:'space-between',paddingTop:24,borderTop:'1px solid var(--g100)',marginTop:32}}>
          <button className="btn btn-ghost" onClick={onBack}>← Retour</button>
          <button className="btn btn-accent btn-lg" onClick={onNext}>Choisir ma Cible NBA →</button>
        </div>
      </div>
    </div>
  )
}
