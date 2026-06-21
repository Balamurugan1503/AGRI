import joblib
import pandas as pd
import os

class FertilizerModelPredictor:
    def __init__(self, model_path: str = "ml_models"):
        self.model_path = model_path
        self.model = None
        self.model_columns = None

    def load_model(self):
        try:
            self.model = joblib.load(os.path.join(self.model_path, "fertilizer_model.pkl"))
            self.model_columns = joblib.load(os.path.join(self.model_path, "model_columns.pkl"))
            print("✅ Fertilizer model loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Error loading fertilizer model: {e}")
            return False

    def predict(self, temperature=None, humidity=None, moisture=None, soil_type=None, crop_type=None,
                nitrogen=None, phosphorous=None, potassium=None):
        if self.model is None or self.model_columns is None:
            raise Exception("Model not loaded")

        # Create input dataframe with same columns as training
        input_dict = {
            "Temperature": [temperature if temperature is not None else 0],
            "Humidity": [humidity if humidity is not None else 0],
            "Moisture": [moisture if moisture is not None else 0],
            "Nitrogen": [nitrogen if nitrogen is not None else 0],
            "Phosphorous": [phosphorous if phosphorous is not None else 0],
            "Potassium": [potassium if potassium is not None else 0],
        }

        df = pd.DataFrame(input_dict)

        # Handle one-hot encoding for soil_type and crop_type columns present in model_columns
        for col in self.model_columns:
            if col.startswith("Soil_Type_"):
                df[col] = 1 if soil_type and col == f"Soil_Type_{soil_type}" else 0
            elif col.startswith("Crop_Type_"):
                df[col] = 1 if crop_type and col == f"Crop_Type_{crop_type}" else 0
            else:
                # Add any missing columns with default 0
                if col not in df.columns:
                    df[col] = 0

        # Reorder columns to match training
        df = df[self.model_columns]

        prediction = self.model.predict(df)[0]

        return {"recommended_fertilizer": prediction}

