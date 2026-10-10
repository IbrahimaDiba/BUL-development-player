import pandas as pd
import numpy as np
import os
import math
from scipy import stats

DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FALLBACK_DATA_DIR = "/Users/mac/Downloads/NBA datset 1947-present"
NBA_DATA_PATH = os.environ.get("NBA_DATA_PATH", DEFAULT_DATA_DIR if os.path.exists(DEFAULT_DATA_DIR) else FALLBACK_DATA_DIR)
data_loaded = False
players_df = None
history_df = None

def initialize():
    global data_loaded, players_df, history_df
    try:
        ppg_path = os.path.join(NBA_DATA_PATH, "Player Per Game.csv")
        adv_path = os.path.join(NBA_DATA_PATH, "Advanced.csv")
        car_path = os.path.join(NBA_DATA_PATH, "Player Career Info.csv")
        sea_path = os.path.join(NBA_DATA_PATH, "Player Season Info.csv")
        
        if os.path.exists(ppg_path):
            history_df = pd.read_csv(ppg_path)
            
            # Clean up columns if needed
            history_df.columns = [c.lower() for c in history_df.columns]
            
            # Identify player id and name columns
            player_col = 'player' if 'player' in history_df.columns else 'player_id'
            
            if 'season' in history_df.columns and player_col in history_df.columns:
                # 1. Filter out seasons with fewer than 20 games if 'g' column exists
                if 'g' in history_df.columns:
                    # Convert to numeric just in case, coerce errors to NaN, then fill with 0
                    history_df['g'] = pd.to_numeric(history_df['g'], errors='coerce').fillna(0)
                    history_df = history_df[history_df['g'] >= 20].copy()
                
                # 2. Calculate Peak Metric (PTS + AST + TRB)
                for col in ['pts_per_game', 'ast_per_game', 'trb_per_game']:
                    if col in history_df.columns:
                        history_df[col] = pd.to_numeric(history_df[col], errors='coerce').fillna(0)
                
                history_df['peak_metric'] = (
                    history_df.get('pts_per_game', 0) + 
                    history_df.get('ast_per_game', 0) + 
                    history_df.get('trb_per_game', 0)
                )
                
                # 3. Sort by peak_metric ascending so that keep='last' keeps the highest
                history_df = history_df.sort_values(by=['peak_metric'])
                players_df = history_df.drop_duplicates(subset=[player_col], keep='last').copy()
                
                # 4. Standardize to Per 36 minutes
                if 'mp_per_game' in players_df.columns:
                    players_df['mp_per_game'] = pd.to_numeric(players_df['mp_per_game'], errors='coerce').fillna(1)
                    # Prevent extreme outliers (e.g. played 1 minute all season)
                    players_df.loc[players_df['mp_per_game'] < 5, 'mp_per_game'] = 5
                    
                    counting_stats = ['pts_per_game', 'ast_per_game', 'trb_per_game', 'orb_per_game', 'drb_per_game', 'stl_per_game', 'blk_per_game', 'tov_per_game', 'pf_per_game']
                    for stat in counting_stats:
                        if stat in players_df.columns:
                            players_df[stat] = pd.to_numeric(players_df[stat], errors='coerce').fillna(0)
                            players_df[stat] = (players_df[stat] / players_df['mp_per_game']) * 36
            else:
                players_df = history_df.copy()
        else:
            history_df = pd.DataFrame()
            players_df = pd.DataFrame()
            
        data_loaded = True
        print("Data loaded successfully.")
    except Exception as e:
        print(f"Error loading data: {e}")
        data_loaded = False

def search_players(query: str, limit: int = 10):
    if not data_loaded or players_df is None or players_df.empty:
        return []
    
    query = query.lower().strip()
    if not query:
        return []
    matches = players_df[players_df['player'].astype(str).str.lower().str.contains(query, regex=False, na=False)]
    
    results = []
    for _, row in matches.head(limit).iterrows():
        results.append({
            "player_id": str(row.get('player_id', row.get('player', ''))),
            "name": row.get('player', 'Unknown'),
            "pos": row.get('pos', 'Unknown'),
            "team": row.get('tm', 'Unknown'),
            "season": row.get('season', 0),
            "pts_per_game": row.get('pts_per_game', 0.0),
            "ast_per_game": row.get('ast_per_game', 0.0),
            "trb_per_game": row.get('trb_per_game', 0.0),
            "fg_percent": row.get('fg_percent', 0.0),
            "x3p_percent": row.get('x3p_percent', 0.0),
            "ht_in_in": row.get('ht_in_in', 0),
            "wt": row.get('wt', 0)
        })
    return results

def get_player_profile(player_id: str):
    if not data_loaded or players_df is None:
        return None
    matches = players_df[players_df['player'] == player_id]
    if matches.empty and 'player_id' in players_df.columns:
        matches = players_df[players_df['player_id'] == player_id]
    
    if matches.empty:
        return None
    
    return matches.iloc[0].replace({np.nan: None}).to_dict()

def get_player_trajectory(player_id: str):
    if not data_loaded or history_df is None:
        return []
    matches = history_df[history_df['player'] == player_id]
    if matches.empty and 'player_id' in history_df.columns:
        matches = history_df[history_df['player_id'] == player_id]
        
    if 'season' in matches.columns:
        # Group by season to handle mid-season trades (multiple rows per year)
        numeric_cols = ['age', 'pts_per_game', 'ast_per_game', 'trb_per_game', 'fg_percent', 'x3p_percent']
        valid_cols = [c for c in numeric_cols if c in matches.columns]
        if valid_cols:
            matches = matches.groupby('season')[valid_cols].mean().reset_index()
        matches = matches.sort_values(by=['season'], ascending=True)
    
    trajectory = []
    for _, row in matches.iterrows():
        trajectory.append({
            "season": row.get('season', 0),
            "age": row.get('age', 0),
            "pts_per_game": row.get('pts_per_game', 0.0),
            "ast_per_game": row.get('ast_per_game', 0.0),
            "trb_per_game": row.get('trb_per_game', 0.0),
            "fg_percent": row.get('fg_percent', 0.0),
            "x3p_percent": row.get('x3p_percent', 0.0)
        })
    return trajectory

def get_position_percentile(value: float, column: str, position: str):
    if not data_loaded or players_df is None or column not in players_df.columns:
        return 0.0
    pos_data = players_df[players_df['pos'] == position][column].dropna()
    if pos_data.empty:
        return 0.0
    return stats.percentileofscore(pos_data, value)

def get_top_players_for_position(position: str, stat: str, n: int):
    if not data_loaded or players_df is None or stat not in players_df.columns:
        return []
    pos_data = players_df[players_df['pos'] == position]
    top_n = pos_data.nlargest(n, stat)
    return top_n.replace({np.nan: None}).to_dict('records')
