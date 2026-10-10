import joblib
import os
import numpy as np
import pandas as pd

MODELS_DIR = "/Users/mac/Downloads/Programme NBA/trained_models"
models_loaded = False
scaler = None
pca = None
kmeans = None
player_features = None

try:
    scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
    pca = joblib.load(os.path.join(MODELS_DIR, "pca.joblib"))
    kmeans = joblib.load(os.path.join(MODELS_DIR, "kmeans.joblib"))
    player_features = joblib.load(os.path.join(MODELS_DIR, "player_features.joblib"))
    models_loaded = True
except Exception as e:
    print(f"Could not load ML models: {e}")

def get_archetype_name(cluster_id: int, centers: np.ndarray, feature_names: list):
    try:
        center = centers[cluster_id]
        
        try:
            # If kmeans trained on pca space
            original_center = scaler.inverse_transform(pca.inverse_transform([center]))[0]
        except:
            try:
                # If kmeans trained on scaled space
                original_center = scaler.inverse_transform([center])[0]
            except:
                # If kmeans trained on original space
                original_center = center
                
        c_stats = dict(zip(feature_names, original_center))
    except:
        c_stats = {}
    
    pts = c_stats.get('pts_per_game', 0)
    ast = c_stats.get('ast_per_game', 0)
    blk = c_stats.get('blk_per_game', 0)
    reb = c_stats.get('trb_per_game', 0)
    x3p = c_stats.get('x3p_per_game', 0)
    
    if pts > 20:
        return "Star Scorer", "Joueur élite capable de créer son propre tir et dominer offensivement"
    if ast > 7:
        return "Meneur Créateur", "Organisateur de jeu exceptionnel, vision de passe et QI basket élevé"
    if blk > 2:
        return "Protecteur de l'Arc", "Défenseur dominant près du panier, présence physique imposante"
    if reb > 10:
        return "Pivot Dominant", "Maître du rebond, présence physique imposante dans la raquette"
    if x3p > 2 and pts > 12:
        return "Tireur 3-Points & Défenseur", "Spécialiste du tir extérieur avec capacités défensives solides"
    if pts > 15:
        return "Ailier Scoreur", "Joueur polyvalent capable de scorer de plusieurs zones"
    
    return "Joueur de Système", "Joueur efficace dans un rôle défini, apporte de la stabilité"

def predict(stats_dict: dict):
    if not models_loaded:
        return None
    try:
        input_data = []
        for feature in player_features:
            input_data.append(stats_dict.get(feature, 0.0))
            
        X = np.array([input_data])
        X_scaled = scaler.transform(X)
        X_pca = pca.transform(X_scaled)
        cluster = int(kmeans.predict(X_pca)[0])
        
        name, desc = get_archetype_name(cluster, kmeans.cluster_centers_, player_features)
        
        return {
            "cluster": cluster,
            "pc1": float(X_pca[0][0]),
            "pc2": float(X_pca[0][1]),
            "archetype": name,
            "archetype_description": desc
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

def get_cluster_pca_coords(players_df: pd.DataFrame):
    if not models_loaded or players_df is None or players_df.empty:
        return []
    
    try:
        X = []
        valid_indices = []
        
        for idx, row in players_df.iterrows():
            # Only process if we have all features
            valid = True
            row_data = []
            for f in player_features:
                val = row.get(f, None)
                if pd.isna(val):
                    valid = False
                    break
                row_data.append(float(val))
                
            if valid:
                X.append(row_data)
                valid_indices.append(idx)
                
        if not X:
            return []
            
        X = np.array(X)
        X_scaled = scaler.transform(X)
        X_pca = pca.transform(X_scaled)
        clusters = kmeans.predict(X_pca)
        
        coords = []
        for i, idx in enumerate(valid_indices):
            row = players_df.loc[idx]
            coords.append({
                "player_id": str(row.get('player_id', row.get('player', ''))),
                "name": str(row.get('player', 'Unknown')),
                "pc1": float(X_pca[i][0]),
                "pc2": float(X_pca[i][1]),
                "cluster": int(clusters[i])
            })
        return coords
    except Exception as e:
        print(f"Error computing PCA coords: {e}")
        return []
