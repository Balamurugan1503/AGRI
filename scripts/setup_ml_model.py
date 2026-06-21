import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from catboost import CatBoostRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
import requests

def download_dataset():
    """Download the crop yield dataset"""
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/crop_yield-qwxPGCFl8hNgWPNSjqMSdFpXRzUmYI.csv"
    
    print("Downloading crop yield dataset...")
    response = requests.get(url)
    
    if response.status_code == 200:
        with open("crop_yield.csv", "wb") as f:
            f.write(response.content)
        print("✅ Dataset downloaded successfully")
        return True
    else:
        print(f"❌ Failed to download dataset: {response.status_code}")
        return False

def train_model():
    """Train the crop yield prediction model"""
    
    # Download dataset if not exists
    if not os.path.exists("crop_yield.csv"):
        if not download_dataset():
            return False
    
    try:
        # Load the dataset
        df = pd.read_csv('crop_yield.csv')
        print("✅ Dataset loaded successfully")
        print(f"Dataset shape: {df.shape}")
        
        # Clean column names
        df.columns = [
            'Crop', 'Crop_Year', 'Season', 'State', 'Area', 'Production',
            'Annual_Rainfall', 'Fertilizer', 'Pesticide', 'Yield'
        ]
        
        print(f"Columns: {list(df.columns)}")
        print(f"Unique crops: {df['Crop'].unique()}")
        
        # Data preprocessing
        print("\n📊 Preprocessing data...")
        
        # Drop rows with missing values
        initial_rows = len(df)
        df.dropna(inplace=True)
        print(f"Dropped {initial_rows - len(df)} rows with missing values")
        
        # Encode categorical features
        le = LabelEncoder()
        df['Crop'] = le.fit_transform(df['Crop'])
        
        # Prepare features and target
        # Using the same features as in the original model
        X = df[['Crop', 'Area',  'Annual_Rainfall', 'Fertilizer', 'Pesticide']]
        y = df['Yield']
        
        print(f"Features shape: {X.shape}")
        print(f"Target shape: {y.shape}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        print("\n🤖 Training CatBoost model...")
        model = CatBoostRegressor(
            random_state=42,
            verbose=100,
            iterations=1000,
            learning_rate=0.1,
            depth=6
        )
        
        model.fit(X_train, y_train)
        print("✅ Model training completed")
        
        # Evaluate model
        print("\n📈 Evaluating model...")
        y_pred = model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        print(f"RMSE: {rmse:.4f}")
        print(f"R² Score: {r2:.4f}")
        
        # Create models directory
        os.makedirs("../backend/ml_models", exist_ok=True)
        
        # Save model and encoder
        joblib.dump(model, "../backend/ml_models/yield_model.pkl")
        joblib.dump(le, "../backend/ml_models/label_encoder.pkl")
        
        # Save feature names for reference
        feature_names = list(X.columns)
        joblib.dump(feature_names, "../backend/ml_models/feature_names.pkl")
        
        # Save crop names mapping
        crop_mapping = dict(zip(le.classes_, le.transform(le.classes_)))
        joblib.dump(crop_mapping, "../backend/ml_models/crop_mapping.pkl")
        
        print("\n✅ Model and artifacts saved successfully!")
        print("Files saved:")
        print("- ../backend/ml_models/yield_model.pkl")
        print("- ../backend/ml_models/label_encoder.pkl")
        print("- ../backend/ml_models/feature_names.pkl")
        print("- ../backend/ml_models/crop_mapping.pkl")
        
        return True
        
    except Exception as e:
        print(f"❌ Error training model: {e}")
        return False

if __name__ == "__main__":
    print("🌾 Crop Yield Prediction Model Setup")
    print("=" * 40)
    
    success = train_model()
    
    if success:
        print("\n🎉 Setup completed successfully!")
        print("You can now run the FastAPI backend with the trained model.")
    else:
        print("\n💥 Setup failed. Please check the errors above.")
