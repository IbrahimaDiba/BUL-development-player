
import joblib
import os
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- Charger les modèles entraînés ---
models_dir = 'trained_models'

try:
    scaler = joblib.load(os.path.join(models_dir, 'scaler.joblib'))
    pca = joblib.load(os.path.join(models_dir, 'pca.joblib'))
    kmeans = joblib.load(os.path.join(models_dir, 'kmeans.joblib'))
    player_features = joblib.load(os.path.join(models_dir, 'player_features.joblib'))
    print("Modèles chargés avec succès.")
except FileNotFoundError:
    print(f"Erreur: Les fichiers modèles n'ont pas été trouvés dans le répertoire '{models_dir}'.")
    print("Assurez-vous d'avoir exécuté la cellule de sauvegarde des modèles.")
    scaler, pca, kmeans, player_features = None, None, None, None

# --- Routes de l'API ---

@app.route('/')
def home():
    return "Bienvenue sur l'API de profilage de joueurs de basketball!"

@app.route('/predict_player_profile', methods=['POST'])
def predict_player_profile():
    if not scaler or not pca or not kmeans or not player_features:
        return jsonify({"error": "Modèles non chargés. Veuillez vérifier la configuration de l'application."}), 500

    try:
        data = request.get_json(force=True)
        player_data = pd.DataFrame([data])

        # Assurer que les colonnes sont dans le bon ordre et qu'il n'y a pas de colonnes supplémentaires
        # Utiliser player_features pour sélectionner et réordonner les colonnes
        player_data_processed = player_data[player_features]

        # 1. Standardiser les données du joueur
        scaled_player_data = scaler.transform(player_data_processed)

        # 2. Appliquer la PCA
        pca_player_data = pca.transform(scaled_player_data)

        # 3. Prédire le cluster
        player_cluster = kmeans.predict(pca_player_data)[0]

        return jsonify({
            "player_name": data.get('player_per_game', 'Inconnu'),
            "predicted_cluster": int(player_cluster),
            "pc1": float(pca_player_data[0][0]),
            "pc2": float(pca_player_data[0][1])
        })

    except KeyError as e:
        return jsonify({"error": f"Données manquantes ou incorrectes. Veuillez fournir toutes les fonctionnalités requises: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Pour exécuter l'application Flask directement depuis ce script
# En production, vous utiliseriez un serveur WSGI comme Gunicorn
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
