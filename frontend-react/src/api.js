const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = RAW_URL.replace(/\/+$/, '') + (RAW_URL.endsWith('/api') ? '' : '/api');

export async function searchPlayers(query) {
  const res = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Recherche échouée');
  return res.json();
}

export async function analyzePlayer(data) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Analyse échouée');
  return res.json();
}

export async function reevaluatePlayer(data) {
  const res = await fetch(`${API_BASE}/reevaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Réévaluation échouée');
  return res.json();
}

export async function chatWithCoach(data) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Chat échoué');
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export function calculateDerivedStats(s) {
  const out = { ...s };
  const mp = out.mp_per_game || 1;
  out.x2p_per_game   = Math.max(0, (out.fg_per_game || 0) - (out.x3p_per_game || 0));
  out.x2pa_per_game  = Math.max(0, (out.fga_per_game || 0) - (out.x3pa_per_game || 0));
  out.x2p_percent    = out.x2pa_per_game > 0 ? out.x2p_per_game / out.x2pa_per_game : 0;
  out.e_fg_percent   = out.fga_per_game > 0 ? ((out.fg_per_game || 0) + 0.5 * (out.x3p_per_game || 0)) / out.fga_per_game : 0;
  out.fg_percent     = out.fga_per_game > 0 ? (out.fg_per_game || 0) / out.fga_per_game : 0;
  out.x3p_percent    = out.x3pa_per_game > 0 ? (out.x3p_per_game || 0) / out.x3pa_per_game : 0;
  out.ft_percent     = out.fta_per_game > 0 ? (out.ft_per_game || 0) / out.fta_per_game : 0.75;
  out.pts_per_48_min = ((out.pts_per_game || 0) * 48) / mp;
  out.ast_per_48_min = ((out.ast_per_game || 0) * 48) / mp;
  out.trb_per_48_min = ((out.trb_per_game || 0) * 48) / mp;
  const tsDenom = 2 * ((out.fga_per_game || 0) + 0.44 * (out.fta_per_game || 0));
  out.true_shooting_percentage = tsDenom > 0 ? (out.pts_per_game || 0) / tsDenom : 0;
  return out;
}
