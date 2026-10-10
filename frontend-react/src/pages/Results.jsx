import { useState } from 'react'
import { Radar, Line } from 'react-chartjs-2'
import {
  Chart, RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, CategoryScale, LinearScale
} from 'chart.js'
Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale)

// Labels in French matching backend keys
const DIM_KEYS   = ['Scoring','Playmaking','Rebounding','Defense','Three-Point','Efficiency']
const DIM_FR     = ['Scoring','Création','Rebond','Défense','Tir 3pts','Efficacité']

const getGapExplanation = (category, gap) => {
  if (Math.abs(gap) < 5) return "Niveau très proche ou supérieur à la cible."
  if (Math.abs(gap) > 30) {
    if (category === 'Scoring') return "Écart critique. Vous devez considérablement augmenter votre volume et votre efficacité."
    if (category === 'Defense') return "Déficit majeur. Améliorez drastiquement votre agressivité, contres et interceptions."
    if (category === 'Playmaking') return "Création insuffisante. Travaillez votre vision du jeu et vos passes."
    if (category === 'Three-Point') return "Adresse extérieure trop faible. Ce niveau requiert un tir très fiable."
    if (category === 'Rebounding') return "Manque d'impact physique sous le cercle. Le rebond est une priorité."
    if (category === 'Efficiency') return "Efficacité insuffisante. Optimisez vos choix de tirs."
    return "Une refonte de cette facette est indispensable."
  }
  if (Math.abs(gap) > 15) return "Marge de progression importante. Entraînement spécifique nécessaire."
  return `Déficit léger de ${Math.abs(gap).toFixed(0)} points. Facilement comblable.`
}



export default function Results({ data, playerInfo, target, onReeval, onRestart, onGoToChat }) {
  const [tab, setTab] = useState('profile')
  const [openRM, setOpenRM] = useState(0)

  // Dead chat state removed

  if (!data) return <div style={{padding:40,textAlign:'center'}}>Aucun résultat disponible.</div>

  // ── Map backend JSON fields ──────────────────────────────────────────
  // /api/analyze returns:
  //   ml_analysis: { cluster, pc1, pc2, archetype, archetype_description }
  //   scores: { Scoring, Playmaking, Rebounding, Defense, Three-Point, Efficiency }
  //   overall_score, level_label
  //   target_comparison: { target_scores, gaps } | null
  //   similar_players: [{ profile:{player,pos,team,season,pts_per_game,...}, trajectory:[] }]
  //   roadmap: [{ category, gap, priority, exercises:{3_months,6_months,1_year} }]
  const ml         = data.ml_analysis || {}
  const scores     = data.scores || {}
  const comp       = data.target_comparison || null
  const similar    = data.similar_players || []
  const trainingProgram = data.training_program || null
  const milestones = data.milestones || []
  const overall    = Math.round(data.overall_score || 0)
  const levelLabel = data.level_label || ''

  // Player radar values
  const playerVals = DIM_KEYS.map(k => scores[k] || 0)

  // Target radar values (from target_comparison.target_scores)
  let targetVals = null
  let targetOverall = 0
  if (comp && comp.target_scores) {
    targetVals = DIM_KEYS.map(k => comp.target_scores[k] || 0)
    targetOverall = Math.round(targetVals.reduce((a,b)=>a+b,0) / 6)
  }

  // Gap analysis list (from target_comparison.gaps dict)
  const gapList = comp && comp.gaps
    ? Object.entries(comp.gaps).map(([cat, g]) => ({
        category: cat,
        player_value: g.player || 0,
        target_value: g.target || 0,
        gap: g.gap || 0,
        priority: Math.abs(g.gap) > 30 ? 'CRITIQUE' : Math.abs(g.gap) > 15 ? 'HAUTE' : Math.abs(g.gap) > 5 ? 'MOYENNE' : 'FAIBLE'
      }))
    : []

  // Radar chart config
  const radarData = {
    labels: DIM_FR,
    datasets: [
      {
        label: playerInfo.name || 'Votre profil',
        data: playerVals,
        backgroundColor: 'rgba(255,87,34,.12)',
        borderColor: '#FF5722', borderWidth: 2,
        pointBackgroundColor: '#FF5722', pointRadius: 4,
      },
      ...(targetVals ? [{
        label: target?.name || 'Cible NBA',
        data: targetVals,
        backgroundColor: 'rgba(10,10,10,.05)',
        borderColor: '#0a0a0a', borderWidth: 1.5,
        pointBackgroundColor: '#0a0a0a', pointRadius: 3,
        borderDash: [4, 4],
      }] : [])
    ]
  }
  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { display: false },
        grid: { color: '#f0f0f0' },
        angleLines: { color: '#ebebeb' },
        pointLabels: { font: { family: "'Inter'", size: 12, weight: '500' }, color: '#404040' }
      }
    },
    plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter'", size: 13 }, padding: 20, usePointStyle: true } } },
    elements: { line: { tension: 0.1 } }
  }

  const priorityBadge = (p) =>
    p === 'CRITIQUE' ? 'badge-danger' : p === 'HAUTE' ? 'badge-warning' : p === 'FAIBLE' ? 'badge-success' : 'badge-gray'



  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            BUL Player Development
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onReeval}>↺ Réévaluer</button>
            <button className="btn btn-ghost btn-sm" onClick={onRestart}>Nouvelle analyse</button>
            <button className="btn btn-accent btn-sm" onClick={onGoToChat} style={{ marginLeft: 16 }}>— Coach IA</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* ── HEADER ── */}
        <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.03em' }}>
              {playerInfo.name || 'Joueur'}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ml.archetype && <span className="badge badge-accent" style={{ fontSize: 12 }}>{ml.archetype}</span>}
              <span className="badge badge-gray">{playerInfo.position} · {playerInfo.age} ans</span>
              {target && <span className="badge badge-gray">Cible : {target.name}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="score-circle">
              <div className="score-num">{overall}</div>
              <div className="score-sub">/ 100</div>
            </div>
            <span className="badge badge-black" style={{ fontSize: 10, textAlign: 'center', maxWidth: 130, whiteSpace: 'normal', lineHeight: 1.3 }}>
              {levelLabel}
            </span>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--gray-light)', marginBottom: 16, padding: '0 16px', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>Note Scientifique :</span> Toutes les statistiques ont été standardisées sur 36 minutes jouées (Per 36) et ajustées à l'intensité NBA pour garantir une comparaison mathématiquement équitable, quel que soit le temps de jeu réel.
        </div>
        <div className="tabs">
          {[{ id: 'profile', lbl: 'Profil' }, { id: 'comparison', lbl: 'Comparaison NBA' }, { id: 'similar', lbl: 'Joueurs Similaires' }, { id: 'roadmap', lbl: 'Programme IA' }].map(t => (
            <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.lbl}</button>
          ))}
        </div>

        {/* ── TAB: PROFIL ── */}
        {tab === 'profile' && (
          <div className="fade-in">
            <div className="dim-grid" style={{ marginBottom: 24 }}>
              {DIM_KEYS.map((k, i) => (
                <div key={k} className="dim-card">
                  <div className="dim-lbl">{DIM_FR[i]}</div>
                  <div className="dim-val">{Math.round(scores[k] || 0)}</div>
                  <div className="dim-bar">
                    <div className="dim-fill" style={{ width: `${scores[k] || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {ml.archetype && (
              <div className="card" style={{ padding: '24px 28px', display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "'Outfit',sans-serif", color: '#0a0a0a' }}>ML</div>
                <div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{ml.archetype}</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{ml.archetype_description}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-light)', marginTop: 8 }}>
                    Cluster {ml.cluster} · PC1 = {ml.pc1?.toFixed(2)} · PC2 = {ml.pc2?.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: COMPARAISON ── */}
        {tab === 'comparison' && (
          <div className="fade-in">
            {!comp ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, fontWeight: 300, fontFamily: "'Outfit',sans-serif", marginBottom: 12, color: '#0a0a0a' }}>◎</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-soft)' }}>Aucune cible NBA sélectionnée</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Relancez l'analyse avec un joueur NBA comme cible.</div>
              </div>
            ) : (
              <>
                {/* ── VS Banner ── */}
                <div className="card" style={{ marginBottom: 24, background: '#0a0a0a', color: '#fff', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Left: Player */}
                    <div style={{ flex: 1, padding: '28px 32px' }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: '#737373', marginBottom: 8 }}>Votre Profil</div>
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>{playerInfo.name || 'Joueur'}</div>
                      <div style={{ fontSize: 12, color: '#737373', marginBottom: 16 }}>{playerInfo.position} · {playerInfo.age} ans · {playerInfo.level}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 56, fontWeight: 900, color: '#FF5722', lineHeight: 1 }}>{overall}</span>
                        <span style={{ fontSize: 16, color: '#737373', fontWeight: 400 }}>/100</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 6 }}>{levelLabel}</div>
                    </div>

                    {/* Center VS */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, fontStyle: 'italic', color: '#525252', letterSpacing: '.2em' }}>VS</div>
                      <div style={{ width: 1, height: 40, background: '#1f1f1f', margin: '12px 0' }} />
                      <div style={{ fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '.1em' }}>NBA</div>
                    </div>

                    {/* Right: Target */}
                    <div style={{ flex: 1, padding: '28px 32px', textAlign: 'right' }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: '#737373', marginBottom: 8 }}>Cible NBA</div>
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>{target?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#737373', marginBottom: 16 }}>
                        {comp.target_profile?.pos || '—'} · Saison {comp.target_profile?.season ? Math.round(comp.target_profile.season) : '—'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{targetOverall}</span>
                        <span style={{ fontSize: 16, color: '#737373', fontWeight: 400 }}>/100</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 6 }}>Niveau NBA</div>
                    </div>
                  </div>

                  {/* Stats side-by-side table */}
                  <div style={{ borderTop: '1px solid #1f1f1f' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', borderBottom: '1px solid #1f1f1f' }}>
                      {['PTS','AST','REB','STL','BLK','FG%','3P%','FT%'].map(h => (
                        <div key={h} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</div>
                      ))}
                    </div>
                    {/* Target stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', borderBottom: '1px solid #1f1f1f' }}>
                      {[
                        { v: comp.target_profile?.pts_per_game },
                        { v: comp.target_profile?.ast_per_game },
                        { v: comp.target_profile?.trb_per_game },
                        { v: comp.target_profile?.stl_per_game },
                        { v: comp.target_profile?.blk_per_game },
                        { v: comp.target_profile?.fg_percent, isPct: true },
                        { v: comp.target_profile?.x3p_percent, isPct: true },
                        { v: comp.target_profile?.ft_percent, isPct: true },
                      ].map((st, i) => (
                        <div key={i} style={{ padding: '10px 4px', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>
                          {st.v != null ? (st.isPct ? (st.v * 100).toFixed(1) + '%' : Number(st.v).toFixed(1)) : '—'}
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '6px 12px', fontSize: 10, color: '#525252', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      {target?.name} · Saison {comp.target_profile?.season ? Math.round(comp.target_profile.season) : '—'}
                    </div>
                  </div>
                </div>

                {/* ── Radar chart ── */}
                <div className="card" style={{ padding: 32, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a3a3a3', marginBottom: 20 }}>
                    Comparaison Radar — 6 Dimensions
                  </div>
                  <div style={{ height: 340 }}>
                    <Radar data={radarData} options={radarOpts} />
                  </div>
                </div>

                {/* ── Gap analysis ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a3a3a3', marginBottom: 4 }}>
                    Analyse Détaillée des Écarts
                  </div>
                  {gapList.map(g => {
                    const isPositive = g.gap <= 0;
                    const barPct = Math.min(100, (g.player_value / Math.max(g.target_value, 1)) * 100);
                    const gapAbs = Math.abs(g.gap).toFixed(0);
                    return (
                      <div key={g.category} className="card" style={{ padding: '20px 24px', borderLeft: `4px solid ${isPositive ? '#10b981' : g.priority === 'CRITIQUE' ? '#ef4444' : g.priority === 'HAUTE' ? '#f59e0b' : '#3b82f6'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                          {/* Category name + badge */}
                          <div style={{ minWidth: 130, flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{g.category}</div>
                            {!isPositive && <span className={`badge ${priorityBadge(g.priority)}`} style={{ fontSize: 10 }}>PRIORITÉ {g.priority}</span>}
                            {isPositive && <span className="badge badge-success" style={{ fontSize: 10 }}>ACQUIS ✓</span>}
                          </div>

                          {/* You score */}
                          <div style={{ textAlign: 'center', minWidth: 52 }}>
                            <div style={{ fontSize: 10, color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 2 }}>Vous</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: isPositive ? '#10b981' : 'var(--text)' }}>{Math.round(g.player_value)}</div>
                          </div>

                          {/* Progress bar + delta */}
                          <div style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ position: 'relative', height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barPct}%`, background: isPositive ? '#10b981' : '#0a0a0a', borderRadius: 4 }} />
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444' }}>
                              {isPositive ? `+${gapAbs} points d'avance` : `−${gapAbs} points à combler`}
                            </div>
                          </div>

                          {/* Target score */}
                          <div style={{ textAlign: 'center', minWidth: 52 }}>
                            <div style={{ fontSize: 10, color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 2 }}>Cible</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>{Math.round(g.target_value)}</div>
                          </div>

                          {/* Explanation */}
                          <div style={{ minWidth: 220, flex: 1, fontSize: 13, color: '#737373', lineHeight: 1.5, paddingLeft: 20, borderLeft: '1px solid var(--border)' }}>
                            {getGapExplanation(g.category, g.gap)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── AI Verdict ── */}
                {gapList.length > 0 && (() => {
                  const critiques = gapList.filter(g => g.priority === 'CRITIQUE' && g.gap > 0);
                  const acquis = gapList.filter(g => g.gap <= 0);
                  const biggestGap = gapList.reduce((max, g) => g.gap > max.gap ? g : max, gapList[0]);
                  return (
                    <div className="card" style={{ padding: '24px 28px', background: '#0a0a0a', border: 'none' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#FF5722', marginBottom: 12 }}>Verdict de l'IA</div>
                      <div style={{ fontSize: 15, color: '#e5e5e5', lineHeight: 1.7, marginBottom: acquis.length > 0 ? 16 : 0 }}>
                        Pour atteindre le niveau de <strong style={{ color: '#fff' }}>{target?.name || 'votre cible'}</strong>, votre défi principal est la dimension <strong style={{ color: '#FF5722' }}>{biggestGap.category}</strong> avec un déficit de <strong style={{ color: '#FF5722' }}>{biggestGap.gap.toFixed(0)} points</strong>.
                        {critiques.length > 1 && <> Les axes <strong style={{ color: '#fff' }}>{critiques.map(c => c.category).join(', ')}</strong> sont également critiques et devront être travaillés en priorité.</>}
                      </div>
                      {acquis.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#737373', marginRight: 4 }}>Points forts déjà acquis :</span>
                          {acquis.map(a => (
                            <span key={a.category} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{a.category}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── TAB: JOUEURS SIMILAIRES ── */}
        {tab === 'similar' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24, background: '#0a0a0a', color: 'var(--white)', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 300, fontFamily: "'Outfit',sans-serif", color: '#fff' }}>∼</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Vos Jumeaux Statistiques</div>
                <div style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.5 }}>
                  Le réseau de neurones a scanné des milliers de saisons NBA pour trouver les joueurs qui ont <strong>le même style et impact que vous</strong> aujourd'hui. Regarder leurs matchs est la meilleure façon de comprendre votre rôle potentiel.
                </div>
              </div>
            </div>

            {similar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#a3a3a3' }}>Aucun joueur similaire trouvé.</div>
            ) : similar.map((s, i) => {
              const p = s.profile || {}
              const traj = s.trajectory || []
              const peakSeason = traj.length > 0 ? traj.reduce((max, t) => (t.pts_per_game || 0) > (max.pts_per_game || 0) ? t : max, traj[0]) : null
              const miniData = {
                labels: traj.map(t => t.season ? String(Math.round(t.season)) : ''),
                datasets: [{ data: traj.map(t => t.pts_per_game || 0), borderColor: '#FF5722', borderWidth: 2, pointRadius: 2, fill: false, tension: 0.3 }]
              }
              const miniOpts = {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true, titleFont: { size: 10 }, bodyFont: { size: 12 }, padding: 8, displayColors: false } },
                scales: { 
                  x: { display: true, grid: { display: false }, ticks: { font: { size: 9 }, color: '#a3a3a3', maxRotation: 45, minRotation: 45 } }, 
                  y: { display: false } 
                }
              }
              const simScore = s.similarity_score != null ? Math.round(s.similarity_score) : 0;
              
              // Stat comparison rows: player stat vs NBA player stat
              const statRows = [
                { label: 'Points', yourVal: scores['Scoring'] != null ? (scores['Scoring']).toFixed(0) : '—', nbaVal: p.pts_per_game != null ? Number(p.pts_per_game).toFixed(1) : '—', unit: '' },
                { label: 'Passes', yourVal: scores['Playmaking'] != null ? (scores['Playmaking']).toFixed(0) : '—', nbaVal: p.ast_per_game != null ? Number(p.ast_per_game).toFixed(1) : '—', unit: '' },
                { label: 'Rebonds', yourVal: scores['Rebounding'] != null ? (scores['Rebounding']).toFixed(0) : '—', nbaVal: p.trb_per_game != null ? Number(p.trb_per_game).toFixed(1) : '—', unit: '' },
                { label: 'FG%', yourVal: '—', nbaVal: p.fg_percent != null ? (p.fg_percent * 100).toFixed(1) + '%' : '—', unit: '' },
              ]

              return (
                <div key={i} className="card" style={{ overflow: 'hidden', borderLeft: `6px solid ${i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#a3a3a3'}` }}>
                  
                  {/* ── Header ── */}
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: i === 0 ? 'rgba(16,185,129,0.03)' : '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* Rank badge */}
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: i < 2 ? '#fff' : '#737373', flexShrink: 0 }}>
                        #{i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{p.player || 'Joueur'}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                          <span style={{ color: '#FF5722', fontWeight: 600 }}>{p.team || '—'}</span>
                          {' · '}{p.pos || '—'}
                          {' · Saison NBA '}<strong>{p.season ? Math.round(p.season) : '—'}</strong>
                          {peakSeason && traj.length > 1 && <span style={{ marginLeft: 8, color: '#10b981', fontWeight: 600 }}>· Pic : {Number(peakSeason.pts_per_game).toFixed(1)} pts ({Math.round(peakSeason.season)})</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Match IA</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{simScore}%</div>
                      {i === 0 && <span className="badge badge-success" style={{ fontSize: 10 }}>PLUS PROCHE</span>}
                    </div>
                  </div>

                  {/* ── Body ── */}
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>

                    {/* Left: Category match gauges */}
                    {s.category_match && (
                      <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', minWidth: 160, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a3a3a3', marginBottom: 4 }}>Similitude par axe</div>
                        {[
                          { key: 'Scoring', label: 'Scoring', color: '#FF5722' },
                          { key: 'Playmaking', label: 'Création', color: '#3b82f6' },
                          { key: 'Défense', label: 'Défense', color: '#10b981' }
                        ].map(cat => {
                          const val = Math.round(s.category_match[cat.key] || 0);
                          return (
                            <div key={cat.key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 3 }}>
                                <span>{cat.label}</span>
                                <span style={{ color: cat.color, fontWeight: 800 }}>{val}%</span>
                              </div>
                              <div style={{ width: '100%', height: 5, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${val}%`, height: '100%', background: cat.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Center: Stats table + explanation */}
                    <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 220 }}>
                      
                      {/* Stats comparison table */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a3a3a3', marginBottom: 10 }}>Statistiques NBA (saison {p.season ? Math.round(p.season) : '—'})</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {[
                            { label: 'PTS', val: p.pts_per_game },
                            { label: 'AST', val: p.ast_per_game },
                            { label: 'REB', val: p.trb_per_game },
                            { label: 'STL', val: p.stl_per_game },
                            { label: 'BLK', val: p.blk_per_game },
                            { label: 'FG%', val: p.fg_percent, isPct: true },
                            { label: '3P%', val: p.x3p_percent, isPct: true },
                            { label: 'MIN', val: p.mp_per_game },
                          ].map(st => (
                            <div key={st.label} style={{ background: '#f8f8f8', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                              <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{st.label}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>
                                {st.val != null ? (st.isPct ? (st.val * 100).toFixed(1) + '%' : Number(st.val).toFixed(1)) : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div style={{ padding: '12px 16px', background: 'rgba(255, 87, 34, 0.05)', borderRadius: 8, border: '1px solid rgba(255, 87, 34, 0.12)', fontSize: 13, color: '#404040', lineHeight: 1.6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#FF5722', marginBottom: 6 }}>Pourquoi ce joueur ?</div>
                        {s.explanation || "Profil similaire identifié par l'IA."}
                      </div>
                    </div>

                    {/* Right: Career evolution chart */}
                    {traj.length > 1 && (
                      <div style={{ width: 200, padding: '20px 16px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, textAlign: 'center' }}>
                          Évolution PTS / Saison
                        </div>
                        <div style={{ height: 110 }}>
                          <Line data={miniData} options={miniOpts} />
                        </div>
                        <div style={{ fontSize: 10, color: '#a3a3a3', textAlign: 'center', marginTop: 8 }}>
                          {traj.length} saison{traj.length > 1 ? 's' : ''} · {Math.round(traj[0]?.season || 0)}–{Math.round(traj[traj.length - 1]?.season || 0)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB: ROADMAP ── */}
        {tab === 'roadmap' && (
          <div className="fade-in">
            {/* Milestones Timeline */}
            {milestones.length > 0 && (
              <div className="card" style={{ padding: '32px 24px', marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#a3a3a3', marginBottom: 24 }}>
                  Paliers de Progression
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, left: 24, right: 24, height: 2, background: '#f0f0f0', zIndex: 0 }} />
                  {[{level: 'Niveau Actuel', target_overall_score: overall}, ...milestones].map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: i===0 ? '#FF5722' : '#fff', border: `3px solid ${i===0?'#FF5722':'#e5e5e5'}`, marginBottom: 12, color: i===0?'#fff':'#a3a3a3', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 11, fontWeight: 'bold' }}>
                        {i===0 ? '✓' : i}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: i===0 ? '#0a0a0a' : '#737373', textAlign: 'center' }}>{m.level}</div>
                      <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 4 }}>Score: {Math.round(m.target_overall_score)}/100</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Program Details */}
            {!trainingProgram || !trainingProgram.routines || trainingProgram.routines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#a3a3a3' }}>
                Programme non disponible — sélectionnez une cible NBA lors de l'analyse.
              </div>
            ) : (
              <div className="training-program-container">
                {trainingProgram.focus && (
                  <div style={{ marginBottom: 32, padding: '24px', background: '#0a0a0a', color: '#fff', borderRadius: 16 }}>
                    <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a3a3a3', marginBottom: 8 }}>Objectif Principal</div>
                    <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>"{trainingProgram.focus}"</div>
                  </div>
                )}
                
                <div style={{ display: 'grid', gap: 24 }}>
                  {trainingProgram.routines.map((routine, i) => (
                    <div key={i} className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FF5722', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{routine.category}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a' }}>{routine.title}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>◷ {routine.duration}</span>
                          <span className="badge badge-black" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>↺ {routine.frequency}</span>
                        </div>
                      </div>
                      <div style={{ padding: '0' }}>
                        {routine.drills && routine.drills.map((drill, j) => (
                          <div key={j} style={{ padding: '20px 24px', borderBottom: j < routine.drills.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e5e5e5', flexShrink: 0, marginTop: 4 }}></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>{drill.name}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#525252', background: '#f5f5f5', padding: '4px 10px', borderRadius: 6 }}>{drill.reps}</div>
                              </div>
                              <div style={{ fontSize: 14, color: '#737373', lineHeight: 1.5 }}>
                                {drill.instructions}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onReeval}>↺ Réévaluer mes statistiques</button>
          <button className="btn btn-accent" onClick={onRestart}>Nouvelle analyse</button>
        </div>
      </div>
    </div>
  )
}
