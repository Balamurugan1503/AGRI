import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from catboost import CatBoostRegressor
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# Load the dataset
try:
    df = pd.read_csv('crop_yield.csv')
    print("File loaded successfully.")
except FileNotFoundError:
    print("File not found. Please ensure the file 'crop_yield.csv' is in the same directory.")
    exit()

# --- Clean Column Names ---
# Standardize column names for easier access
df.columns = [
    'Crop', 'Crop_Year', 'Season', 'State', 'Area', 'Production',
    'Annual_Rainfall', 'Fertilizer', 'Pesticide', 'Yield'
]

# --- Data Preprocessing ---

# Drop rows with any missing values to ensure data quality
df.dropna(inplace=True)

# Encode the categorical 'Crop' feature into numerical values
le = LabelEncoder()
df['Crop'] = le.fit_transform(df['Crop'])

# Define features (X) and target (y)
# Drop the target 'Yield' and other non-feature columns
X = df.drop(['Yield', 'Production','Crop_Year', 'State', 'Season'], axis=1)
y = df['Yield']

# Split data into training and testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)


# --- Model Training ---

# Initialize and train the CatBoost Regressor model
print("\n--- Training CatBoost Model ---")
cat_reg = CatBoostRegressor(random_state=42, verbose=0) # verbose=0 to suppress training output
cat_reg.fit(X_train, y_train)
print("CatBoost model training completed.")

# --- Model Evaluation ---

# Make predictions and evaluate the CatBoost model
print("\n--- CatBoost Model Evaluation ---")
preds_cat = cat_reg.predict(X_test)
rmse_cat = np.sqrt(mean_squared_error(y_test, preds_cat))
r2_cat = r2_score(y_test, preds_cat)
print(f"Root Mean Squared Error (RMSE): {rmse_cat}")
print(f"R-squared (R2) score: {r2_cat}")      

import joblib
import os

# Create folder for saving model if it doesn't exist
os.makedirs("ml_models", exist_ok=True)

# Define or load your trained CatBoost model before saving
# Example: Load an existing model (replace with your actual model loading/training code)
# from catboost import CatBoostRegressor
# cat_reg = CatBoostRegressor()
# cat_reg.load_model("path_to_trained_model.cbm")

# Save trained CatBoost model
joblib.dump(cat_reg, "ml_models/yield_model.pkl")

# Save the LabelEncoder
joblib.dump(le, "ml_models/label_encoder.pkl")

print("\n✅ Model and encoder saved successfully in 'ml_models/' directory.")
