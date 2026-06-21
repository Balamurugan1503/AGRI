import joblib
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import os

class CropYieldPredictor:
    def __init__(self, model_path: str = "ml_models"):
        self.model_path = model_path
        self.model = None
        self.label_encoder = None
        self.feature_names = None
        self.crop_mapping = None
        self.is_loaded = False
        
    def load_model(self) -> bool:
        """Load the trained model and associated artifacts"""
        try:
            model_file = os.path.join(self.model_path, "yield_model.pkl")
            encoder_file = os.path.join(self.model_path, "label_encoder.pkl")
            features_file = os.path.join(self.model_path, "feature_names.pkl")
            mapping_file = os.path.join(self.model_path, "crop_mapping.pkl")
            
            if not all(os.path.exists(f) for f in [model_file, encoder_file]):
                print("❌ Model files not found. Please run the setup script first.")
                return False
            
            self.model = joblib.load(model_file)
            self.label_encoder = joblib.load(encoder_file)
            
            # Load optional files
            if os.path.exists(features_file):
                self.feature_names = joblib.load(features_file)
            
            if os.path.exists(mapping_file):
                self.crop_mapping = joblib.load(mapping_file)
            
            self.is_loaded = True
            print("✅ Model loaded successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def get_available_crops(self) -> List[str]:
        """Get list of available crop types"""
        if not self.is_loaded or self.label_encoder is None:
            return []
        return list(self.label_encoder.classes_)
    
    def encode_crop(self, crop_name: str) -> int:
        """Encode crop name to numerical value"""
        if not self.is_loaded or self.label_encoder is None:
            return 0
        
        try:
            return self.label_encoder.transform([crop_name])[0]
        except ValueError:
            # If crop not in training data, return most common (0)
            print(f"⚠️ Unknown crop '{crop_name}', using default encoding")
            return 0
    
    def predict_yield(self, 
                     crop: str,
                     area: float,
                     
                     rainfall: float,
                     fertilizer: float,
                     pesticide: float) -> Dict:
        """
        Predict crop yield based on input features
        
        Args:
            crop: Crop type name
            area: Farm area in hectares
            production: Expected production in metric tons
            rainfall: Annual rainfall in mm
            fertilizer: Fertilizer usage in kg
            pesticide: Pesticide usage in kg
            
        Returns:
            Dictionary with prediction results
        """
        if not self.is_loaded:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        try:
            # Encode crop
            crop_encoded = self.encode_crop(crop)
            
            # Prepare features array
            features = np.array([[
                crop_encoded,
                area,
                
                rainfall,
                fertilizer,
                pesticide
            ]])
            
            # Make prediction
            predicted_yield = self.model.predict(features)[0]
            
            # Calculate confidence interval (simple approach using model uncertainty)
            # For CatBoost, we can use prediction variance if available
            try:
                # Try to get prediction with uncertainty
                pred_with_uncertainty = self.model.predict(features, prediction_type='TotalUncertainty')
                uncertainty = pred_with_uncertainty[0] if len(pred_with_uncertainty) > 0 else predicted_yield * 0.1
            except:
                # Fallback to simple percentage-based uncertainty
                uncertainty = predicted_yield * 0.15
            
            confidence_interval = {
                "lower": max(0, predicted_yield - uncertainty),
                "upper": predicted_yield + uncertainty
            }
            
            # Get feature importance (if available)
            feature_importance = self._get_feature_importance()
            
            return {
                "predicted_yield": float(predicted_yield),
                "confidence_interval": confidence_interval,
                "feature_importance": feature_importance,
                "model_version": "catboost-v1",
                "crop_encoded": crop_encoded,
                "input_features": {
                    "crop": crop,
                    "area": area,
                    
                    "rainfall": rainfall,
                    "fertilizer": fertilizer,
                    "pesticide": pesticide
                }
            }
            
        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")
    
    def _get_feature_importance(self) -> List[Dict[str, float]]:
        """Get feature importance from the model"""
        if not hasattr(self.model, 'feature_importances_'):
            return []
        
        feature_names = self.feature_names or [
            'crop', 'area',  'rainfall', 'fertilizer', 'pesticide'
        ]
        
        importances = self.model.feature_importances_
        
        # Create feature importance list
        importance_list = []
        for name, importance in zip(feature_names, importances):
            importance_list.append({
                "feature": name,
                "importance": float(importance)
            })
        
        # Sort by importance (descending)
        importance_list.sort(key=lambda x: x['importance'], reverse=True)
        
        return importance_list[:5]  # Return top 5 features

# Global predictor instance
predictor = CropYieldPredictor()
