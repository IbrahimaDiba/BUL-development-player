const state = {
  currentSection: 'section-hero',
  playerInfo: { name: '', age: 22, position: 'SG', height_cm: 196, weight_kg: 90, level: 'semi-pro' },
  playerStats: { gs: 0.5, mp_per_game: 25, pts_per_game: 10, ast_per_game: 3, trb_per_game: 4, orb_per_game: 1, drb_per_game: 3, fg_per_game: 4, fga_per_game: 10, fg_percent: 0.4, x3p_per_game: 1, x3pa_per_game: 3, x3p_percent: 0.33, x2p_per_game: 3, x2pa_per_game: 7, x2p_percent: 0.43, e_fg_percent: 0.45, ft_per_game: 2, fta_per_game: 2.5, ft_percent: 0.75, stl_per_game: 0.8, blk_per_game: 0.3, tov_per_game: 1.5, pf_per_game: 2, pts_per_48_min: 0, ast_per_48_min: 0, trb_per_48_min: 0, true_shooting_percentage: 0 },
  targetPlayerId: null,
  targetPlayerName: null,
  analysisResult: null,
  currentTab: 'profile'
};

const API_BASE = 'http://localhost:8000/api';

// DOM Elements & setup
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
});

function initParticles() {
  const canvas = document.getElementById('particles-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  const particles = [];
  const numParticles = 80;
  
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.3
    });
  }
  
  function draw() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
  
  draw();
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.add('hidden');
    sec.classList.remove('fade-in');
  });
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    window.scrollTo(0, 0);
    state.currentSection = sectionId;
  }
  
  if(sectionId === 'section-reevaluate' && state.analysisResult) {
    // Prefill reeval form
    document.getElementById('reeval-pts').value = state.playerStats.pts_per_game;
    document.getElementById('reeval-ast').value = state.playerStats.ast_per_game;
    document.getElementById('reeval-trb').value = state.playerStats.trb_per_game;
    document.getElementById('reeval-fg').value = (state.playerStats.fg_percent * 100).toFixed(1);
  }
}

function selectPosition(btn, pos) {
  document.querySelectorAll('.position-selector .pos-pill').forEach(p => p.classList.remove('selected'));
  btn.classList.add('selected');
  state.playerInfo.position = pos;
}

function selectLevel(card, levelId) {
  document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const levelMap = {
    'lycee': 'lycee',
    'univ': 'universitaire',
    'semipro': 'semi-pro',
    'pro': 'pro-international',
    'intl': 'pro-international'
  };
  state.playerInfo.level = levelMap[levelId];
}

function collectPlayerInfo() {
  const name = document.getElementById('input-name').value.trim();
  if (!name) {
    showToast('Veuillez entrer votre nom', 'danger');
    return false;
  }
  state.playerInfo.name = name;
  state.playerInfo.age = parseInt(document.getElementById('input-age').value);
  state.playerInfo.height_cm = parseInt(document.getElementById('input-height').value);
  state.playerInfo.weight_kg = parseInt(document.getElementById('input-weight').value);
  return true;
}

function collectPlayerStats() {
  const stats = state.playerStats;
  const mp = parseFloat(document.getElementById('stat-mp').value) || 1;
  const pts = parseFloat(document.getElementById('stat-pts').value) || 0;
  
  stats.mp_per_game = mp;
  stats.pts_per_game = pts;
  stats.gs = (parseFloat(document.getElementById('stat-gs').value) || 0) / 100;
  
  stats.fg_per_game = parseFloat(document.getElementById('stat-fg_m').value) || 0;
  stats.fga_per_game = parseFloat(document.getElementById('stat-fg_a').value) || 0;
  stats.x3p_per_game = parseFloat(document.getElementById('stat-x3p_m').value) || 0;
  stats.x3pa_per_game = parseFloat(document.getElementById('stat-x3p_a').value) || 0;
  stats.ft_per_game = parseFloat(document.getElementById('stat-ft_m').value) || 0;
  stats.fta_per_game = parseFloat(document.getElementById('stat-ft_a').value) || 0;
  
  stats.orb_per_game = parseFloat(document.getElementById('stat-orb').value) || 0;
  stats.drb_per_game = parseFloat(document.getElementById('stat-drb').value) || 0;
  stats.trb_per_game = parseFloat(document.getElementById('stat-trb').value) || (stats.orb_per_game + stats.drb_per_game);
  
  stats.ast_per_game = parseFloat(document.getElementById('stat-ast').value) || 0;
  stats.stl_per_game = parseFloat(document.getElementById('stat-stl').value) || 0;
  stats.blk_per_game = parseFloat(document.getElementById('stat-blk').value) || 0;
  stats.tov_per_game = parseFloat(document.getElementById('stat-tov').value) || 0;
  stats.pf_per_game = parseFloat(document.getElementById('stat-pf').value) || 0;
  
  stats.x2p_per_game = Math.max(0, stats.fg_per_game - stats.x3p_per_game);
  stats.x2pa_per_game = Math.max(0, stats.fga_per_game - stats.x3pa_per_game);
  stats.x2p_percent = stats.x2pa_per_game > 0 ? stats.x2p_per_game / stats.x2pa_per_game : 0;
  stats.e_fg_percent = stats.fga_per_game > 0 ? (stats.fg_per_game + 0.5 * stats.x3p_per_game) / stats.fga_per_game : 0;
  stats.fg_percent = stats.fga_per_game > 0 ? stats.fg_per_game / stats.fga_per_game : 0;
  stats.x3p_percent = stats.x3pa_per_game > 0 ? stats.x3p_per_game / stats.x3pa_per_game : 0;
  stats.ft_percent = stats.fta_per_game > 0 ? stats.ft_per_game / stats.fta_per_game : 0.75;
  
  stats.pts_per_48_min = (pts * 48) / mp;
  stats.ast_per_48_min = (stats.ast_per_game * 48) / mp;
  stats.trb_per_48_min = (stats.trb_per_game * 48) / mp;
  
  const tsDenom = 2 * (stats.fga_per_game + 0.44 * stats.fta_per_game);
  stats.true_shooting_percentage = tsDenom > 0 ? pts / tsDenom : 0;
}

function updateLivePreview() {
  collectPlayerStats();
  const s = state.playerStats;
  document.getElementById('prev-pts').textContent = s.pts_per_game.toFixed(1);
  document.getElementById('prev-ast').textContent = s.ast_per_game.toFixed(1);
  document.getElementById('prev-reb').textContent = s.trb_per_game.toFixed(1);
  document.getElementById('prev-fg').textContent = (s.fg_percent * 100).toFixed(1) + '%';
  document.getElementById('prev-ts').textContent = (s.true_shooting_percentage * 100).toFixed(1) + '%';
  
  // also auto-update trb if possible
  const orb = parseFloat(document.getElementById('stat-orb').value) || 0;
  const drb = parseFloat(document.getElementById('stat-drb').value) || 0;
  document.getElementById('stat-trb').value = (orb + drb).toFixed(1);
}

let searchTimeout;
async function searchPlayers(query) {
  clearTimeout(searchTimeout);
  if (!query || query.length < 2) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      const container = document.getElementById('search-results');
      container.innerHTML = '';
      
      if (data.length === 0) {
        container.innerHTML = '<div style="color:var(--silver); padding:10px;">Aucun joueur trouvé</div>';
        return;
      }
      
      data.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-result-card';
        div.style.cursor = 'pointer';
        div.style.padding = '12px';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        div.innerHTML = `
          <div style="font-weight:bold;">${p.name}</div>
          <div style="font-size:12px; color:var(--silver);">${p.position || 'N/A'} · ${p.team || 'N/A'} | PTS: ${p.pts || '-'} AST: ${p.ast || '-'} REB: ${p.reb || '-'}</div>
        `;
        div.onclick = () => selectTarget(p.id, p.name);
        container.appendChild(div);
      });
    } catch (e) {
      console.error(e);
    }
  }, 350);
}

function selectTarget(playerId, playerName) {
  state.targetPlayerId = playerId;
  state.targetPlayerName = playerName;
  
  const infoDiv = document.getElementById('selected-target-info');
  infoDiv.style.display = 'block';
  infoDiv.innerHTML = `<span style="color:var(--success);">✓</span> Cible sélectionnée : <strong>${playerName}</strong>`;
  
  document.getElementById('launch-btn').disabled = false;
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('player-search-input').value = '';
}

async function launchAnalysis() {
  collectPlayerInfo();
  collectPlayerStats();
  
  showSection('section-loading');
  
  // Animation messages
  let msgIdx = 1;
  const msgs = [1, 2, 3, 4];
  const msgInterval = setInterval(() => {
    msgs.forEach(i => document.getElementById(`msg-${i}`).style.display = 'none');
    msgIdx = (msgIdx % 4) + 1;
    document.getElementById(`msg-${msgIdx}`).style.display = 'block';
  }, 1500);
  
  try {
    const payload = {
      player_info: state.playerInfo,
      player_stats: state.playerStats,
      target_player_id: state.targetPlayerId
    };
    
    // In a real app, send fetch. Here we might simulate or just do a real fetch.
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    clearInterval(msgInterval);
    
    if (!res.ok) throw new Error('Analysis failed');
    const data = await res.json();
    state.analysisResult = data;
    
    renderResults(data);
    showSection('section-results');
    
  } catch (err) {
    clearInterval(msgInterval);
    console.error(err);
    showToast("Erreur lors de l'analyse.", 'danger');
    showSection('section-target');
  }
}

function renderResults(data) {
  // Mock data handling in case server returns partial data or structure differs slightly
  const { profile = {}, comparison = {}, roadmap = {}, similar_players = [] } = data;
  
  document.getElementById('result-player-name').textContent = state.playerInfo.name;
  document.getElementById('result-archetype').textContent = profile.archetype || 'Polyvalent';
  document.getElementById('result-score').textContent = profile.overall_score || 0;
  document.getElementById('result-level').textContent = state.playerInfo.level.toUpperCase();
  
  // Dimensions
  const dims = profile.dimensions || {};
  const dimNames = ['Scoring', 'Playmaking', 'Rebounding', 'Defense', 'Three-Point', 'Efficiency'];
  const dimKeys = ['scoring', 'playmaking', 'rebounding', 'defense', 'three_point', 'efficiency'];
  const dimIds = ['dim-scoring', 'dim-playmaking', 'dim-rebounding', 'dim-defense', 'dim-three-point', 'dim-efficiency'];
  
  dimKeys.forEach((key, idx) => {
    const val = dims[key] || 0;
    const el = document.getElementById(dimIds[idx]);
    if(el) {
      el.querySelector('.dim-value').textContent = val;
      el.querySelector('.dim-bar-fill').style.width = `${val}%`;
    }
  });
  
  // Radar
  if (window.charts && window.charts.createRadarChart) {
    const pData = dimKeys.map(k => dims[k] || 0);
    const tData = dimKeys.map(k => comparison.target_dimensions?.[k] || (dims[k]+10 > 100 ? 100 : dims[k]+10));
    window.charts.createRadarChart('radar-chart', pData, tData, dimNames);
  }
  
  document.getElementById('legend-target').textContent = state.targetPlayerName || 'Cible NBA';
  
  // Gap analysis
  const gapContainer = document.getElementById('gap-analysis-container');
  gapContainer.innerHTML = '';
  if (comparison.gaps) {
    comparison.gaps.forEach(gap => {
      const p = Math.max(0, Math.min(100, (gap.player_value / (gap.target_value || 1)) * 100));
      gapContainer.innerHTML += `
        <div class="gap-row">
          <div class="gap-row-header">
            <span class="gap-category">${gap.category}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="gap-values"><span class="gap-player">${gap.player_value.toFixed(1)}</span><span class="gap-arrow"> → </span><span class="gap-target">${gap.target_value.toFixed(1)}</span></span>
              <span class="priority-badge priority-${gap.priority}">${gap.priority}</span>
            </div>
          </div>
          <div class="gap-bar-track"><div class="gap-bar-fill ${gap.priority}" style="width:${p}%"></div></div>
        </div>
      `;
    });
  }
  
  // Similar
  const simContainer = document.getElementById('similar-players-container');
  simContainer.innerHTML = '';
  similar_players.forEach((p, i) => {
    simContainer.innerHTML += `
      <div class="similar-card">
        <div style="flex:1;">
          <div class="similar-name">${p.name}</div>
          <div class="similar-meta">${p.position || '-'} · ${p.team || '-'} · Saison ${p.season || '-'}</div>
          <div class="mini-chart-wrap" style="margin-top:10px;"><canvas id="mini-chart-${i}" height="56"></canvas></div>
          <div class="similar-note" style="margin-top:8px; font-size:12px; color:var(--silver);">${p.development_note || 'Profil similaire identifié par clustering IA'}</div>
        </div>
        <div class="similar-score"><span class="pct">${Math.round(p.similarity || 0)}%</span><span class="lbl">Similarité</span></div>
      </div>
    `;
  });
  
  // draw mini charts
  setTimeout(() => {
    if (window.charts && window.charts.createMiniChart) {
      similar_players.forEach((p, i) => {
        if(p.trajectory) window.charts.createMiniChart(`mini-chart-${i}`, p.trajectory);
      });
    }
  }, 100);
  
  // Roadmap
  const rdContainer = document.getElementById('roadmap-container');
  rdContainer.innerHTML = '';
  if (roadmap.priorities) {
    roadmap.priorities.forEach((r, i) => {
      rdContainer.innerHTML += `
        <div class="priority-item">
          <div class="priority-item-header" onclick="app.toggleRoadmapItem(this)">
            <div class="priority-header-left">
              <div class="priority-rank">${i+1}</div>
              <div>
                <div class="priority-name">${r.category}</div>
                <div class="priority-gap-score">Écart: ${r.gap ? r.gap.toFixed(1) : 0} · <span class="priority-badge priority-${r.priority}">${r.priority}</span></div>
              </div>
            </div>
            <span class="priority-chevron">▼</span>
          </div>
          <div class="priority-body">
            <div class="milestones-row">
              ${(r.milestones || []).map(m => `
                <div class="milestone-card">
                  <div style="font-weight:bold; margin-bottom:4px;">${m.timeframe}</div>
                  <div style="font-size:14px; margin-bottom:8px;">Cible: ${m.target_value}</div>
                  <div style="font-size:12px; color:var(--silver);">${m.focus}</div>
                </div>
              `).join('')}
              ${(!r.milestones || r.milestones.length===0) ? '<div class="milestone-card">Données insuffisantes</div>' : ''}
            </div>
          </div>
        </div>
      `;
    });
  }
  
  document.getElementById('roadmap-feasibility').textContent = roadmap.feasibility_score ? `${roadmap.feasibility_score}/100` : '-';
  document.getElementById('roadmap-time').textContent = roadmap.estimated_time_months ? `${roadmap.estimated_time_months} mois` : '-';
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  document.getElementById(`tab-${tabId}`).classList.add('active');
  document.getElementById(`tab-content-${tabId}`).classList.add('active');
  state.currentTab = tabId;
}

function toggleRoadmapItem(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  if(body && body.classList.contains('priority-body')) {
    body.classList.toggle('open');
  }
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function submitReevaluation() {
  const pts = parseFloat(document.getElementById('reeval-pts').value) || 0;
  const ast = parseFloat(document.getElementById('reeval-ast').value) || 0;
  const trb = parseFloat(document.getElementById('reeval-trb').value) || 0;
  const fg = parseFloat(document.getElementById('reeval-fg').value) || 0;
  
  try {
    const payload = {
      original_stats: state.playerStats,
      new_stats: {
        pts_per_game: pts,
        ast_per_game: ast,
        trb_per_game: trb,
        fg_percent: fg / 100
      }
    };
    
    // Simulate API or fetch
    // const res = await fetch(`${API_BASE}/reevaluate`, { ... });
    
    const disp = document.getElementById('progression-display');
    disp.style.display = 'grid';
    disp.innerHTML = `
      <div class="progression-card glass-panel" style="padding:16px; text-align:center;">
        <div>PTS</div>
        <div style="font-size:20px; font-weight:bold;">${state.playerStats.pts_per_game} → ${pts}</div>
        <div style="color:${pts >= state.playerStats.pts_per_game ? 'var(--success)' : 'var(--danger)'}">
          ${pts >= state.playerStats.pts_per_game ? '↑' : '↓'} ${Math.abs(pts - state.playerStats.pts_per_game).toFixed(1)}
        </div>
      </div>
      <div class="progression-card glass-panel" style="padding:16px; text-align:center;">
        <div>AST</div>
        <div style="font-size:20px; font-weight:bold;">${state.playerStats.ast_per_game} → ${ast}</div>
        <div style="color:${ast >= state.playerStats.ast_per_game ? 'var(--success)' : 'var(--danger)'}">
          ${ast >= state.playerStats.ast_per_game ? '↑' : '↓'} ${Math.abs(ast - state.playerStats.ast_per_game).toFixed(1)}
        </div>
      </div>
    `;
    
    showToast("Statistiques mises à jour avec succès", "success");
    
    // Update local state loosely to keep it consistent
    state.playerStats.pts_per_game = pts;
    state.playerStats.ast_per_game = ast;
    state.playerStats.trb_per_game = trb;
    state.playerStats.fg_percent = fg / 100;
    
  } catch (err) {
    showToast("Erreur lors de la réévaluation", "danger");
  }
}

// Export API
window.app = {
  showSection,
  switchTab,
  toggleRoadmapItem,
  searchPlayers,
  selectTarget,
  launchAnalysis,
  submitReevaluation,
  selectPosition,
  selectLevel,
  collectPlayerInfo,
  updateLivePreview
};
