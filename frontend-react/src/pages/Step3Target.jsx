import { useState, useEffect, useRef } from 'react'
import { searchPlayers } from '../api'

export default function Step3Target({ target, onSelect, onAnalyze, onBack }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if(!query.trim()) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async()=>{
      setLoading(true)
      try { const r = await searchPlayers(query); setResults(r) }
      catch(e) { setResults([]) }
      finally { setLoading(false) }
    }, 350)
  }, [query])

  return (
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',flexDirection:'column'}}>
      <nav className="nav"><div className="nav-inner"><div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>BUL Player Development</div></div></nav>
      <div className="form-container target-step-container" style={{maxWidth:700,margin:'0 auto',padding:'48px 24px',width:'100%'}}>
        {/* Steps */}
        <div className="steps">
          {['Profil','Statistiques','Cible NBA'].map((l,i)=>(
            <div key={i} className="step-wrap">
              {i<2&&<div className={`step-line done`} />}
              <div className={`step-circ${i===2?' active':i<2?' done':''}`}>{i<2?'✓':i+1}</div>
              <span className={`step-lbl${i===2?' active':''}`}>{l}</span>
            </div>
          ))}
        </div>

        <div className="section-tag">Étape 03</div>
        <div className="section-title" style={{marginBottom:8}}>Choisissez votre Cible NBA</div>
        <p style={{color:'#737373',fontSize:15,marginBottom:32}}>Sélectionnez le joueur NBA dont vous voulez atteindre le niveau.</p>

        {/* Search */}
        <div className="search-wrap" style={{marginBottom:16}}>
          <span className="search-icon">⌕</span>
          <input className="search-input" placeholder="Rechercher un joueur (ex: Curry, LeBron...)" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>

        {/* Results */}
        <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:380,overflowY:'auto',marginBottom:24}}>
          {loading && <div style={{textAlign:'center',padding:20,color:'#a3a3a3'}}>Recherche...</div>}
          {results.map(p=>(
            <div key={p.player_id} className={`player-card${target?.player_id===p.player_id?' selected':''}`} onClick={()=>onSelect({player_id:p.player_id,name:p.name})}>
              <div>
                <div className="player-card-name">{p.name}</div>
                <div className="player-card-meta">{p.pos} · {p.team} · {p.season}</div>
              </div>
              <div className="player-card-stats">
                {[{v:p.pts_per_game?.toFixed(1),l:'PTS'},{v:p.ast_per_game?.toFixed(1),l:'AST'},{v:p.trb_per_game?.toFixed(1),l:'REB'}].map(s=>(
                  <div key={s.l}><span className="ps-val">{s.v}</span><span className="ps-lbl" style={{marginLeft:4}}>{s.l}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {target&&<div style={{background:'#FFF3F0',border:'1px solid #FF5722',borderRadius:12,padding:'12px 16px',marginBottom:24,fontSize:14,color:'#FF5722',fontWeight:600}}>✓ Cible : {target.name}</div>}

        <div className="target-actions" style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:24,borderTop:'1px solid var(--g100)'}}>
          <button className="btn btn-ghost" onClick={onBack}>← Retour</button>
          <div className="target-actions-right" style={{display:'flex',gap:12,alignItems:'center'}}>
            <button className="btn btn-ghost btn-sm" onClick={onAnalyze} style={{color:'#a3a3a3',borderColor:'var(--g200)'}}>Analyser sans cible</button>
            <button className="btn btn-accent btn-lg" onClick={onAnalyze} disabled={!target}>→ Lancer l'Analyse</button>
          </div>
        </div>
      </div>
    </div>
  )
}
