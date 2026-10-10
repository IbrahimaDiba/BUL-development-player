from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
import data_loader
import ml_service
import os
import math
import json
from dotenv import load_dotenv
import openai

load_dotenv()
try:
    openai_client = openai.OpenAI(
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
except Exception:
    openai_client = None

def sanitize_json(obj):
    """Recursively replace NaN/Inf float values with None for JSON compliance."""
    if isinstance(obj, dict):
        return {k: sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return round(obj, 4)
    elif isinstance(obj, np.floating):
        v = float(obj)
        if math.isnan(v) or math.isinf(v):
            return None
        return round(v, 4)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_json(obj.tolist())
    return obj

app = FastAPI(title="AI Basketball Development System", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class PlayerInfo(BaseModel):
    name: str
    age: int
    position: str  # PG, SG, SF, PF, C
    height_cm: float
    weight_kg: float
    level: str = "semi-pro"  # lycee, universitaire, semi-pro, pro-international

class PlayerStats(BaseModel):
    gs: float = 0.5
    mp_per_game: float = 25.0
    pts_per_game: float = 10.0
    ast_per_game: float = 3.0
    trb_per_game: float = 4.0
    orb_per_game: float = 1.0
    drb_per_game: float = 3.0
    fg_per_game: float = 4.0
    fga_per_game: float = 10.0
    fg_percent: float = 0.40
    x3p_per_game: float = 1.0
    x3pa_per_game: float = 3.0
    x3p_percent: float = 0.33
    x2p_per_game: float = 3.0
    x2pa_per_game: float = 7.0
    x2p_percent: float = 0.43
    e_fg_percent: float = 0.45
    ft_per_game: float = 2.0
    fta_per_game: float = 2.5
    ft_percent: float = 0.75
    stl_per_game: float = 0.8
    blk_per_game: float = 0.3
    tov_per_game: float = 1.5
    pf_per_game: float = 2.0
    pts_per_48_min: float = 0.0  # calculated if 0
    ast_per_48_min: float = 0.0  # calculated if 0
    trb_per_48_min: float = 0.0  # calculated if 0
    true_shooting_percentage: float = 0.0  # calculated if 0

class AnalyzeRequest(BaseModel):
    player_info: PlayerInfo
    stats: PlayerStats
    target_player_id: Optional[str] = None

class ReevaluateRequest(BaseModel):
    player_info: PlayerInfo
    original_stats: PlayerStats
    new_stats: PlayerStats
    target_player_id: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    player_context: dict

@app.on_event("startup")
def startup_event():
    data_loader.initialize()

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "models_loaded": ml_service.models_loaded,
        "data_loaded": data_loader.data_loaded,
        "players_count": len(data_loader.players_df) if data_loader.players_df is not None else 0
    }

@app.get("/api/players/search")
def search_players(q: str = Query(..., min_length=1), limit: int = 10):
    results = data_loader.search_players(q, limit)
    return JSONResponse(content=sanitize_json(results))

@app.get("/api/players/{player_id}/profile")
def get_player_profile(player_id: str):
    profile = data_loader.get_player_profile(player_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Player not found")
    trajectory = data_loader.get_player_trajectory(player_id)
    return {"profile": profile, "trajectory": trajectory}

def calculate_derived_stats(stats: PlayerStats):
    if stats.pts_per_48_min == 0 and stats.mp_per_game > 0:
        stats.pts_per_48_min = stats.pts_per_game * 48 / stats.mp_per_game
    if stats.ast_per_48_min == 0 and stats.mp_per_game > 0:
        stats.ast_per_48_min = stats.ast_per_game * 48 / stats.mp_per_game
    if stats.trb_per_48_min == 0 and stats.mp_per_game > 0:
        stats.trb_per_48_min = stats.trb_per_game * 48 / stats.mp_per_game
        
    if stats.fga_per_game > 0:
        stats.fg_percent = stats.fg_per_game / stats.fga_per_game
    if stats.x3pa_per_game > 0:
        stats.x3p_percent = stats.x3p_per_game / stats.x3pa_per_game
    if stats.fta_per_game > 0:
        stats.ft_percent = stats.ft_per_game / stats.fta_per_game
        
    denom = 2 * (stats.fga_per_game + 0.44 * stats.fta_per_game)
    if stats.true_shooting_percentage == 0 and denom > 0:
        stats.true_shooting_percentage = stats.pts_per_game / denom
    return stats

def apply_level_multiplier(stats: PlayerStats, level: str) -> PlayerStats:
    l = level.lower() if level else ""
    if 'lycee' in l or 'amateur' in l:
        mult = 0.3
    elif 'univ' in l or 'colleg' in l:
        mult = 0.5
    elif 'semi' in l:
        mult = 0.65
    elif 'pro' in l or 'intl' in l or 'elite' in l:
        mult = 0.8
    else:
        mult = 1.0
        
    pct_mult = math.pow(mult, 0.5)
    
    scaled_dict = stats.dict()
    scaled = PlayerStats(**scaled_dict)
    
    # 1. Convert to Per 36 minutes
    mp = scaled.mp_per_game if scaled.mp_per_game > 0 else 1
    if mp < 5: mp = 5
    
    scaled.pts_per_game = (scaled.pts_per_game / mp) * 36
    scaled.ast_per_game = (scaled.ast_per_game / mp) * 36
    scaled.trb_per_game = (scaled.trb_per_game / mp) * 36
    scaled.stl_per_game = (scaled.stl_per_game / mp) * 36
    scaled.blk_per_game = (scaled.blk_per_game / mp) * 36
    scaled.tov_per_game = (scaled.tov_per_game / mp) * 36
    scaled.pf_per_game = (scaled.pf_per_game / mp) * 36
    scaled.orb_per_game = (scaled.orb_per_game / mp) * 36
    scaled.drb_per_game = (scaled.drb_per_game / mp) * 36
    
    # 2. Apply level multiplier
    scaled.pts_per_game *= mult
    scaled.ast_per_game *= mult
    scaled.trb_per_game *= mult
    scaled.stl_per_game *= mult
    scaled.blk_per_game *= mult
    scaled.tov_per_game *= mult
    scaled.pf_per_game *= mult
    
    scaled.fg_percent *= pct_mult
    scaled.x3p_percent *= pct_mult
    scaled.ft_percent *= pct_mult
    
    if hasattr(scaled, 'true_shooting_percentage') and scaled.true_shooting_percentage is not None:
        scaled.true_shooting_percentage *= pct_mult
        
    return scaled

def calc_scores(stats: PlayerStats, pos: str):
    p_pts = data_loader.get_position_percentile(stats.pts_per_game, "pts_per_game", pos)
    p_ts = data_loader.get_position_percentile(stats.true_shooting_percentage, "true_shooting_percentage", pos)
    scoring = (p_pts * 0.7) + (p_ts * 0.3)
    
    playmaking = data_loader.get_position_percentile(stats.ast_per_game, "ast_per_game", pos)
    rebounding = data_loader.get_position_percentile(stats.trb_per_game, "trb_per_game", pos)
    
    p_stl = data_loader.get_position_percentile(stats.stl_per_game, "stl_per_game", pos)
    p_blk = data_loader.get_position_percentile(stats.blk_per_game, "blk_per_game", pos)
    defense = (p_stl + p_blk) / 2
    
    three_point = data_loader.get_position_percentile(stats.x3p_percent, "x3p_percent", pos) if stats.x3pa_per_game > 0 else 0
    efficiency = data_loader.get_position_percentile(stats.fg_percent, "fg_percent", pos)
    
    return {
        "Scoring": max(0, min(100, scoring)),
        "Playmaking": max(0, min(100, playmaking)),
        "Rebounding": max(0, min(100, rebounding)),
        "Defense": max(0, min(100, defense)),
        "Three-Point": max(0, min(100, three_point)),
        "Efficiency": max(0, min(100, efficiency))
    }

def get_level_label(score: float):
    if score <= 20: return "Niveau Lycee / Amateur"
    if score <= 35: return "Niveau Universitaire"
    if score <= 50: return "Niveau D2/D3 Europeen"
    if score <= 65: return "Niveau Pro Europeen"
    if score <= 80: return "Niveau G-League / Pro A"
    return "Niveau NBA"

def _generate_roadmap_static(top_gaps: dict):
    routines = []
    for category, gap_data in top_gaps:
        prio = "Intensité Normale"
        if gap_data['gap'] > 20: prio = "Haute Intensité"
        routines.append({
            "category": category,
            "title": f"Workout Focus: {category}",
            "frequency": "3x par semaine",
            "duration": "45 min",
            "drills": [
                {
                    "name": "Travail Fondamental",
                    "reps": "5 séries de 10",
                    "instructions": f"Concentration maximale sur la mécanique ({prio})."
                },
                {
                    "name": "Situation de Match",
                    "reps": "100 répétitions",
                    "instructions": "Exécution à vitesse réelle avec fatigue."
                }
            ]
        })
    return {
        "focus": "Programme de base pour combler les faiblesses immédiates (Fallback).",
        "routines": routines
    }

def generate_milestones(current_level: str, current_scores: dict, target_scores: dict = None):
    levels = ["Lycée", "Universitaire", "Semi-Pro", "Pro A / G-League", "NBA"]
    milestones = []
    
    start_idx = 0
    cl = current_level.lower()
    if "lycée" in cl: start_idx = 0
    elif "universitaire" in cl: start_idx = 1
    elif "semi" in cl: start_idx = 2
    elif "pro" in cl or "league" in cl: start_idx = 3
    else: start_idx = 0
    
    if start_idx >= 3:
        start_idx = 2 # Ensure at least 2 milestones are generated
        
    steps = len(levels) - 1 - start_idx
    if steps < 1: steps = 1
    
    for i in range(start_idx + 1, len(levels)):
        progress_ratio = (i - start_idx) / steps
        m_scores = {}
        for k in current_scores:
            t = target_scores.get(k, current_scores[k] + 20) if target_scores else min(100, current_scores[k] + 20)
            c = current_scores[k]
            m_scores[k] = round(c + (t - c) * progress_ratio, 1)
        
        m_overall = round(sum(m_scores.values()) / len(m_scores), 1)
        milestones.append({
            "level": levels[i],
            "target_overall_score": m_overall,
            "scores": m_scores
        })
        
    return milestones

def generate_similar_players_explanations(player_info: PlayerInfo, similar_profiles: list):
    if not openai_client or not similar_profiles:
        return {}
        
    try:
        profiles_desc = {p['player']: {"pts": p.get('pts_per_game'), "ast": p.get('ast_per_game'), "trb": p.get('trb_per_game')} for p in similar_profiles}
        
        prompt = f"""
        Agis comme un analyste NBA expert et un scout professionnel.
        Le joueur utilisateur s'appelle {player_info.name}, {player_info.age} ans, joue {player_info.position}.
        L'algorithme a déterminé que ce joueur est statistiquement similaire à ces joueurs NBA :
        {json.dumps(profiles_desc, indent=2)}
        
        Pour CHAQUE joueur NBA, génère une explication détaillée (3 à 4 phrases percutantes). Tu dois analyser *pourquoi* ce profil correspond à l'utilisateur (archétype, rôle sur le terrain, type d'impact offensif/défensif) et donner un conseil précis sur la mentalité ou le mouvement technique (signature move) dont l'utilisateur devrait s'inspirer en regardant les vidéos de ce joueur. Le ton doit être professionnel, très analytique et encourageant.
        Retourne UNIQUEMENT un objet JSON sous cette forme précise :
        {{
            "explanations": {{
                "Nom du Joueur 1": "Explication détaillée...",
                "Nom du Joueur 2": "Explication détaillée..."
            }}
        }}
        """
        
        response = openai_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        return data.get("explanations", {})
    except Exception as e:
        print(f"Failed to generate similar explanations: {e}")
        return {}

def generate_roadmap(gaps: dict, player_info: PlayerInfo, target_name: str = None):
    sorted_gaps = sorted(gaps.items(), key=lambda x: x[1]['gap'], reverse=True)
    top_gaps = [(k, v) for k, v in sorted_gaps if v['gap'] > 5]
    
    if not top_gaps:
        return []
        
    if not openai_client:
        return _generate_roadmap_static(top_gaps)
        
    try:
        gaps_desc = {k: v['gap'] for k, v in top_gaps}
        prompt = f"""
        Agis comme un coach NBA d'élite.
        Le joueur s'appelle {player_info.name}, {player_info.age} ans, joue {player_info.position} au niveau {player_info.level}.
        Son but est d'atteindre le niveau de {'son joueur cible NBA' if not target_name else target_name}.
        Voici ses plus grandes lacunes actuelles (Gaps sur 100):
        {json.dumps(gaps_desc, indent=2)}
        
        Génère un VRAI programme d'entraînement sous forme de routines (workouts) pour combler ces lacunes.
        Retourne UNIQUEMENT un objet JSON strict au format suivant :
        {{
          "training_program": {{
            "focus": "Phrase de motivation résumant l'objectif global du programme.",
            "routines": [
              {{
                "category": "Nom de la catégorie (ex: Scoring / Tir)",
                "title": "Nom accrocheur de la routine (ex: Sniper Catch & Shoot)",
                "frequency": "ex: 3x par semaine",
                "duration": "ex: 45 min",
                "drills": [
                  {{
                    "name": "Nom de l'exercice",
                    "reps": "ex: 5 séries de 10",
                    "instructions": "Point de détail technique sur lequel se concentrer."
                  }}
                ]
              }}
            ]
          }}
        }}
        Sois créatif, ultra-spécifique au poste de {player_info.position}, exigeant comme un coach NBA, et utilise des termes techniques de basket en français.
        """
        
        response = openai_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        return data.get("training_program", _generate_roadmap_static(top_gaps))
    except Exception as e:
        print(f"OpenAI fallback used due to error: {e}")
        return _generate_roadmap_static(top_gaps)

@app.post("/api/analyze")
def analyze_player(req: AnalyzeRequest):
    raw_stats = calculate_derived_stats(req.stats)
    stats = apply_level_multiplier(raw_stats, req.player_info.level)
    
    ml_result = ml_service.predict(stats.dict())
    
    pos = req.player_info.position
    scores = calc_scores(stats, pos)
    
    overall_score = sum(scores.values()) / 6
    level_label = get_level_label(overall_score)
    
    result = {
        "player_info": req.player_info.dict(),
        "ml_analysis": ml_result,
        "scores": scores,
        "overall_score": overall_score,
        "level_label": level_label,
        "similar_players": [],
        "target_comparison": None,
        "training_program": None,
        "milestones": generate_milestones(req.player_info.level, scores, None)
    }
    
    target_scores = None
    if req.target_player_id:
        target_profile = data_loader.get_player_profile(req.target_player_id)
        if target_profile:
            t_stats = PlayerStats(**{k: (v if v is not None else 0.0) for k, v in target_profile.items() if k in PlayerStats.__fields__})
            t_stats = calculate_derived_stats(t_stats)
            target_scores = calc_scores(t_stats, pos)
            
            gaps = {}
            for cat in scores:
                gap = target_scores[cat] - scores[cat]
                gaps[cat] = {"player": scores[cat], "target": target_scores[cat], "gap": gap}
                
            result["target_comparison"] = {
                "target_profile": target_profile,
                "target_scores": target_scores,
                "gaps": gaps
            }
            
            result["training_program"] = generate_roadmap(gaps, req.player_info, target_profile.get("player"))
            result["milestones"] = generate_milestones(req.player_info.level, scores, target_scores)

    # Similar NBA players
    if data_loader.players_df is not None:
        pos_df = data_loader.players_df[data_loader.players_df['pos'] == pos].copy()
        if not pos_df.empty:
            features = ['pts_per_game', 'ast_per_game', 'trb_per_game', 'stl_per_game', 'blk_per_game', 'fg_percent']
            # Fill NaN with 0 for distance calculation
            feat_df = pos_df[features].fillna(0)
            p_vec = np.array([getattr(stats, f) for f in features], dtype=float)
            
            # Normalize by max value per feature to avoid scale bias
            max_vals = feat_df.max().replace(0, 1)
            p_vec_norm = p_vec / max_vals.values
            feat_norm = feat_df / max_vals
            
            dists = np.linalg.norm(feat_norm.values - p_vec_norm, axis=1)
            sorted_indices = np.argsort(dists)[:5]
            top_5_idx = pos_df.index[sorted_indices]
            top_5_dists = dists[sorted_indices]
            
            similar = []
            for i, idx in enumerate(top_5_idx):
                p = pos_df.loc[idx]
                dist = top_5_dists[i]
                # Convert distance to a 0-100 score (lower distance = higher score)
                sim_score = max(0.0, min(100.0, 100.0 * (1.0 - float(dist))))
                
                p_vec_norm_p = feat_norm.loc[idx].values
                def calc_cat_sim(indices):
                    cat_dist = np.linalg.norm(p_vec_norm_p[indices] - p_vec_norm[indices])
                    return max(0.0, min(100.0, 100.0 * (1.0 - float(cat_dist))))
                
                category_match = {
                    "Scoring": calc_cat_sim([0, 5]),
                    "Playmaking": calc_cat_sim([1]),
                    "Défense": calc_cat_sim([2, 3, 4])
                }
                
                pid = str(p.get('player_id', p.get('player', '')))
                profile_dict = {k: (None if (isinstance(v, float) and (math.isnan(v) or math.isinf(v))) else v)
                                for k, v in p.to_dict().items()}
                similar.append({
                    "profile": profile_dict,
                    "trajectory": data_loader.get_player_trajectory(pid),
                    "similarity_score": sim_score,
                    "category_match": category_match
                })
                
            # LLM Explanations for similar players
            try:
                profiles_only = [s["profile"] for s in similar]
                explanations = generate_similar_players_explanations(req.player_info, profiles_only)
                for s in similar:
                    p_name = s["profile"].get("player", "")
                    s["explanation"] = explanations.get(p_name, "Profil similaire identifié par l'IA.")
            except Exception as e:
                print(f"Error fetching similar explanations: {e}")
                for s in similar:
                    s["explanation"] = "Profil similaire identifié par l'IA."
                    
            result["similar_players"] = similar
            
    return JSONResponse(content=sanitize_json(result))

@app.post("/api/reevaluate")
def reevaluate_player(req: ReevaluateRequest):
    orig_raw = calculate_derived_stats(req.original_stats)
    new_raw = calculate_derived_stats(req.new_stats)
    
    orig_stats = apply_level_multiplier(orig_raw, req.player_info.level)
    new_stats = apply_level_multiplier(new_raw, req.player_info.level)
    
    pos = req.player_info.position
    
    orig_scores = calc_scores(orig_stats, pos)
    new_scores = calc_scores(new_stats, pos)
    
    progression = []
    for cat in orig_scores:
        old_val = orig_scores[cat]
        new_val = new_scores[cat]
        improvement = new_val - old_val
        percent = (improvement / old_val * 100) if old_val > 0 else (100 if improvement > 0 else 0)
        trend = "up" if improvement > 0 else ("down" if improvement < 0 else "flat")
        
        progression.append({
            "category": cat,
            "old_value": old_val,
            "new_value": new_val,
            "improvement_percent": percent,
            "trend": trend
        })
        
    analysis_req = AnalyzeRequest(
        player_info=req.player_info,
        stats=req.new_stats,
        target_player_id=req.target_player_id
    )
    analysis_resp = analyze_player(analysis_req)
    analysis_dict = json.loads(analysis_resp.body)
    analysis_dict["progression"] = progression
    
    return JSONResponse(content=analysis_dict)

@app.post("/api/chat")
def chat_with_coach(req: ChatRequest):
    if not openai_client:
        return JSONResponse(content={"reply": "Le Coach Virtuel est indisponible (Clé API manquante)." })
    
    ctx = req.player_context
    system_prompt = f"""
    Tu es un Coach NBA d'élite, expert en développement de joueurs.
    Tu t'adresses directement au joueur : {ctx.get('name', 'Joueur')}, {ctx.get('age', '?')} ans, jouant {ctx.get('position', '?')} au niveau {ctx.get('level', '?')}.
    Son objectif est d'atteindre le niveau NBA de {ctx.get('target', 'sa cible')}.
    Ses principales faiblesses actuelles sont : {ctx.get('gaps', 'Inconnues')}.
    Le programme d'entraînement que tu lui as assigné a pour objectif : "{ctx.get('focus', '')}".
    Réponds de manière concise, directe, technique, et ultra-motivante en français.
    N'utilise pas de JSON, réponds de façon conversationnelle.
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        messages.append({"role": msg.role, "content": msg.content})
        
    try:
        response = openai_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages
        )
        return JSONResponse(content={"reply": response.choices[0].message.content})
    except Exception as e:
        return JSONResponse(content={"reply": f"Erreur de communication avec le coach : {str(e)}"}, status_code=500)

frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
