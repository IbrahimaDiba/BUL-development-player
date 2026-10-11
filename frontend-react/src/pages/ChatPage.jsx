import { useState, useRef, useEffect } from 'react'
import { chatWithCoach } from '../api'

const QUICK_PROMPTS = [
  "Quels sont mes points faibles prioritaires ?",
  "Donne-moi un workout pour améliorer mon scoring",
  "Comment atteindre le niveau NBA ?",
  "Quel joueur dois-je étudier en vidéo ?"
]

export default function ChatPage({ data, playerInfo, onBack }) {
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [chatHistory, isTyping])

  const sendMessage = async (text) => {
    const content = text || chatInput.trim()
    if (!content || isTyping) return
    const newMsg = { role: 'user', content }
    const newHistory = [...chatHistory, newMsg]
    setChatHistory(newHistory)
    setChatInput('')
    setIsTyping(true)

    try {
      const comp = data?.target_comparison || null
      const trainingProgram = data?.training_program || null
      const levelLabel = data?.level_label || ''
      const context = {
        name: playerInfo?.name || 'Joueur',
        age: playerInfo?.age || '?',
        position: playerInfo?.position || '?',
        level: levelLabel,
        target: data?.target?.name || 'Inconnu',
        gaps: comp?.gaps ? Object.entries(comp.gaps).map(([cat, g]) => `${cat} (-${g.gap?.toFixed(0)})`).join(', ') : 'Aucune',
        focus: trainingProgram?.focus || 'Inconnu'
      }
      const chatData = await chatWithCoach({ messages: newHistory, player_context: context })
      setChatHistory([...newHistory, { role: 'assistant', content: chatData.reply }])
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', content: 'Erreur de connexion au coach.' }])
    } finally {
      setIsTyping(false)
    }
  }

  const overall = Math.round(data?.overall_score || 0)
  const levelLabel = data?.level_label || '—'
  const scores = data?.scores || {}

  return (
    <div className="chat-page-root" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'var(--fb)', background: '#0a0a0a' }}>

      {/* ── MOBILE BACKDROP ── */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="mobile-sidebar-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 90 }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <div className={`chat-sidebar ${mobileSidebarOpen ? 'open' : ''}`} style={{ width: 300, flexShrink: 0, background: '#0f0f0f', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header gradient */}
        <div style={{ background: 'linear-gradient(160deg, #1c1c1c 0%, #0f0f0f 100%)', padding: '24px 20px 20px', borderBottom: '1px solid #1f1f1f' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FF5722' }}>BUL Player Development</div>
            <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', background: '#1a1a1a', padding: '3px 8px', borderRadius: 20, border: '1px solid #222' }}>Coach IA</div>
          </div>

          {/* Player identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #FF5722, #ff8a50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff',
              boxShadow: '0 6px 20px rgba(255,87,34,0.3)'
            }}>
              {(playerInfo?.name || 'J')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{playerInfo?.name || 'Joueur'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                <span style={{ background: '#1f1f1f', border: '1px solid #2a2a2a', padding: '2px 9px', borderRadius: 20, color: '#666', fontSize: 11, fontWeight: 700 }}>{playerInfo?.position}</span>
                <span style={{ background: '#1f1f1f', border: '1px solid #2a2a2a', padding: '2px 9px', borderRadius: 20, color: '#666', fontSize: 11, fontWeight: 700 }}>{playerInfo?.age} ans</span>
              </div>
            </div>
          </div>

          {/* Score global */}
          <div style={{ background: 'rgba(255,87,34,0.07)', border: '1px solid rgba(255,87,34,0.18)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 5 }}>Score Global</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#FF5722', lineHeight: 1, fontFamily: "'Outfit',sans-serif" }}>{overall}</span>
                <span style={{ fontSize: 15, color: '#333', fontWeight: 500 }}>/100</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 5 }}>Niveau</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ccc', maxWidth: 110, textAlign: 'right', lineHeight: 1.4 }}>{levelLabel}</div>
            </div>
          </div>
        </div>

        {/* Stat bars */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.16em', color: '#2e2e2e', marginBottom: 18 }}>Profil Statistique</div>
          {[
            { k: 'Scoring',     label: 'Scoring',       color: '#FF5722' },
            { k: 'Playmaking',  label: 'Création de jeu', color: '#3b82f6' },
            { k: 'Defense',     label: 'Défense',        color: '#10b981' },
            { k: 'Three-Point', label: 'Tir 3 pts',      color: '#f59e0b' },
            { k: 'Rebounding',  label: 'Rebonds',        color: '#8b5cf6' },
          ].map(d => {
            const val = Math.round(scores[d.k] || 0)
            const lvl = val >= 75 ? 'Excellent' : val >= 50 ? 'Bon' : val >= 28 ? 'Moyen' : 'À dev.'
            return (
              <div key={d.k} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{d.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 9, color: '#333', fontWeight: 600, background: '#1a1a1a', padding: '1px 7px', borderRadius: 20 }}>{lvl}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: d.color, fontFamily: "'Outfit',sans-serif" }}>{val}</span>
                  </div>
                </div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${d.color}60, ${d.color})`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* AI Context */}
        <div style={{ padding: '20px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.16em', color: '#2e2e2e', marginBottom: 14 }}>Données connues par l'IA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Poste',     value: playerInfo?.position || '—' },
              { label: 'Niveau',    value: playerInfo?.level || '—' },
              { label: 'Cible NBA', value: data?.target?.name || 'Non définie' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 13px', background: '#141414', borderRadius: 9, border: '1px solid #1f1f1f' }}>
                <span style={{ fontSize: 11, color: '#3a3a3a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: '#aaa', fontWeight: 700, maxWidth: 130, textAlign: 'right', lineHeight: 1.3 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back button at bottom */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1a' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent', border: '1px solid #1f1f1f', borderRadius: 10,
            padding: '11px 14px', cursor: 'pointer', color: '#3a3a3a', fontSize: 12,
            fontWeight: 700, width: '100%', transition: 'all 0.2s', letterSpacing: '.04em',
            textTransform: 'uppercase'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a3a3a'; e.currentTarget.style.borderColor = '#1f1f1f' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour aux résultats
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>

        {/* Top bar */}
        <div className="chat-top-bar" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onBack}
              className="chat-back-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#f5f5f5', color: '#0a0a0a', border: '1px solid #e5e5e5',
                borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              ← <span className="chat-back-text">Retour</span>
            </button>
            <button
              className="chat-mobile-btn"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? '✕' : '📊 Profil'}
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.01em' }}>Coach IA</span>
            <span className="chat-sub-label" style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 400 }}>· Intelligence Artificielle</span>
          </div>
          <div className="chat-powered-label" style={{ fontSize: 12, color: '#a3a3a3' }}>
            Propulsé par BUL Player Development
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="chat-messages-container" style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Welcome screen */}
            {chatHistory.length === 0 && (
              <div className="chat-welcome-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: '8vh' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.03em', marginBottom: 8 }}>
                    Bonjour, {playerInfo?.name?.split(' ')[0] || 'Champion'} 👋
                  </div>
                  <div style={{ fontSize: 15, color: '#737373', maxWidth: 440, lineHeight: 1.6 }}>
                    Je suis votre Coach IA personnel. Je connais votre profil, vos stats et vos objectifs. Comment puis-je vous aider à progresser aujourd'hui ?
                  </div>
                </div>

                {/* Quick prompts */}
                <div className="chat-quick-prompts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 560, marginTop: 8 }}>
                  {QUICK_PROMPTS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)} style={{
                      padding: '14px 16px', background: '#fff', border: '1px solid #e5e5e5',
                      borderRadius: 12, cursor: 'pointer', fontSize: 13, color: '#0a0a0a',
                      textAlign: 'left', lineHeight: 1.4, fontFamily: 'var(--fb)',
                      transition: 'all 0.15s ease', fontWeight: 500,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>

                {/* Label */}
                <div style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '.08em', paddingLeft: msg.role === 'user' ? 0 : 4 }}>
                  {msg.role === 'user' ? 'Vous' : 'Coach IA'}
                </div>

                <div className="chat-message-bubble-wrap" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '80%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>

                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 11, color: '#FF5722' }}>AI</span>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FF5722', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 13, color: '#fff' }}>
                        {(playerInfo?.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div style={{
                    padding: msg.role === 'user' ? '12px 18px' : '16px 20px',
                    borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: msg.role === 'user' ? '#0a0a0a' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#0a0a0a',
                    fontSize: 14, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: msg.role === 'assistant' ? '1px solid #f0f0f0' : 'none'
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '.08em', paddingLeft: 4 }}>Coach IA</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 11, color: '#FF5722' }}>AI</span>
                  </div>
                  <div style={{ padding: '14px 20px', background: '#fff', borderRadius: '4px 18px 18px 18px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a3a3a3', animation: `pulse ${1.2 + delay}s ${delay}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ── Input bar ── */}
        <div className="chat-input-area" style={{ padding: '16px 24px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Posez votre question au Coach IA..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              style={{
                width: '100%', padding: '16px 56px 16px 20px',
                border: '1.5px solid #e5e5e5', borderRadius: 14,
                fontFamily: 'var(--fb)', fontSize: 16, color: '#0a0a0a',
                background: '#fff', outline: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => { e.target.style.borderColor = '#0a0a0a'; e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
              onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isTyping || !chatInput.trim()}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 38, height: 38, borderRadius: 10,
                background: chatInput.trim() && !isTyping ? '#0a0a0a' : '#f0f0f0',
                color: chatInput.trim() && !isTyping ? '#fff' : '#a3a3a3',
                border: 'none', cursor: chatInput.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#c4c4c4', marginTop: 10 }}>
            Coach IA peut faire des erreurs — Vérifiez les informations importantes
          </div>
        </div>
      </div>
    </div>
  )
}
