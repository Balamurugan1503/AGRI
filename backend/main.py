# =================================================================
# IMPORTS
# =================================================================
from fastapi import FastAPI, HTTPException, Depends, status, Request, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import request_validation_exception_handler
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from datetime import datetime
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, Dict, List
import requests
import uuid
from model_utils import predictor
from fertilizer_recommend import FertilizerModelPredictor
import logging
import shutil
import pdfplumber
import docx
from PIL import Image
import pytesseract
 
# =================================================================
# INITIALIZATION
# =================================================================
load_dotenv()
 
app = FastAPI(title="Crop Yield Prediction API", version="1.0.0")
logger = logging.getLogger("uvicorn.error")
 
# CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Crop Yield Prediction API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://agri-m0lqeegc8-balamurugan-gs-projects.vercel.app",
        "https://agri-flame.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Initialize Firebase Admin and Firestore client safely
db = None
try:
    if not firebase_admin._apps:
        bucket_url = os.getenv("FIREBASE_STORAGE_BUCKET") or os.getenv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET") or "your-project-id.appspot.com"
        
        # Support loading service account from environment variable as JSON string
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            service_account_info = json.loads(service_account_json)
            cred = credentials.Certificate(service_account_info)
            print("✅ Firebase using credentials from environment variable")
        else:
            # Check current working directory, then backend directory
            local_path = "firebase-service-account.json"
            backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase-service-account.json")
            if os.path.exists(local_path):
                cred = credentials.Certificate(local_path)
                print(f"✅ Firebase using credentials from local service-account JSON file: {local_path}")
            elif os.path.exists(backend_path):
                cred = credentials.Certificate(backend_path)
                print(f"✅ Firebase using credentials from local service-account JSON file: {backend_path}")
            else:
                cred = None
                print("⚠ No firebase-service-account.json file or FIREBASE_SERVICE_ACCOUNT_JSON env var found")

        if cred:
            firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_url
            })
            print(f"✅ Firebase initialized successfully with Storage Bucket: {bucket_url}")
    
    if firebase_admin._apps:
        db = firestore.client()
except Exception as e:
    print(f"⚠ Firebase initialization failed: {e}")
    print("Please add your firebase-service-account.json file or set FIREBASE_SERVICE_ACCOUNT_JSON env var")
 
security = HTTPBearer()

def verify_db():
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available. Please verify Firebase configuration."
        )
 
# Instantiate fertilizer model predictor globally
fertilizer_predictor = FertilizerModelPredictor()
fertilizer_load_success = fertilizer_predictor.load_model()
 
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error for request {request.url}: {exc.errors()}")
    return await request_validation_exception_handler(request, exc)
 
@app.on_event("startup")
async def startup_event():
    local_path = "firebase-service-account.json"
    backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase-service-account.json")
    has_local_json = os.path.isfile(local_path) or os.path.isfile(backend_path)
    has_env_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") is not None
    if not (has_local_json or has_env_json):
        print("❌ Firebase credentials NOT found (local file and FIREBASE_SERVICE_ACCOUNT_JSON env variable are both missing)!")
    else:
        print("✅ Firebase credentials configured successfully!")
        
    success = predictor.load_model()
    if success:
        crops = predictor.get_available_crops()
        print(f"✅ Available crops: {crops}")
    else:
        print("⚠ ML model not loaded. Predictions will not work.")

    if fertilizer_load_success:
        print("✅ Fertilizer model loaded successfully")
    else:
        print("⚠ Fertilizer model failed to load")

# =================================================================
# PYDANTIC MODELS
# =================================================================
class PredictionRequest(BaseModel):
    farm_id: str
    crop: str
    area: float
    N: float
    P: float
    K: float
    ph: float
    fertilizer: float
    pesticide: float
    rainfall: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    moisture: Optional[float] = None
    sowing_date: Optional[str] = None
    soil_type: Optional[str] = None
    crop_type: Optional[str] = None

class FarmData(BaseModel):
    name: str
    location: Dict[str, float]
    soil_type: str
    area_ha: float

class UserProfile(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role: Optional[str] = "farmer"

class FertilizerRequest(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    moisture: Optional[float] = None
    soil_type: Optional[str] = None
    crop_type: Optional[str] = None
    nitrogen: Optional[float] = None
    phosphorous: Optional[float] = None
    potassium: Optional[float] = None

class CommunityPostCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class CommentCreate(BaseModel):
    content: str

# =================================================================
# HELPER FUNCTIONS
# =================================================================
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_weather_data(lat: float, lon: float) -> Dict[str, float]:
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"temperature": 25.0, "humidity": 60.0, "rainfall": 100.0}
    
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        response = requests.get(url)
        data = response.json()
        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "rainfall": data.get("rain", {}).get("1h", 0) * 24
        }
    except Exception as e:
        print(f"Weather API error: {e}")
        return {"temperature": 25.0, "humidity": 60.0, "rainfall": 100.0}

def extract_text_from_pdf(file_path: str) -> str:
    full_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
    return full_text

def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    full_text = [para.text for para in doc.paragraphs]
    return '\n'.join(full_text)

def extract_text_from_image(file_path: str) -> str:
    try:
        return pytesseract.image_to_string(Image.open(file_path))
    except Exception as e:
        logger.error(f"OCR Error (pytesseract): {e}. Make sure Tesseract-OCR is installed on the host system.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR service is not configured on the server. Please ensure Tesseract OCR is installed."
        )

# =================================================================
# API ENDPOINTS
# =================================================================
@app.get("/")
async def root():
    return {
        "message": "Crop Yield Prediction API", 
        "status": "running",
        "model_loaded": predictor.is_loaded,
        "available_crops": predictor.get_available_crops() if predictor.is_loaded else []
    }
@app.get("/test-firestore")
async def test_firestore():
    verify_db()
    try:
        doc_ref = db.collection("test").document("sample")

        doc_ref.set({
            "message": "Firestore connected successfully"
        })

        print("✅ Data written to Firestore")

        return {
            "success": True
        }

    except Exception as e:
        print("❌ ERROR:", e)
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/crops")
@app.get("/crops")
async def get_available_crops():
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML model not available")
    return {"crops": predictor.get_available_crops()}

@app.post("/api/predict")
@app.post("/predict")
async def predict_yield(request: PredictionRequest, user=Depends(get_current_user)):
    verify_db()
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML model not available")
    try:
        user_id = user["uid"]
        request_id = str(uuid.uuid4())
        logger.info(f"Starting prediction for user {user_id} with request id {request_id} and inputs: {request}")
        prediction_ref = db.collection("users").document(user_id).collection("predictions").document(request_id)
        prediction_ref.set({
            "farm_id": request.farm_id,
            "inputs": request.dict(),
            "status": "pending",
            "created_at": datetime.utcnow(),
        })
        rainfall = request.rainfall
        if rainfall is None:
            try:
                farm_ref = db.collection("users").document(user_id).collection("farms").document(request.farm_id)
                farm_doc = farm_ref.get()
                if farm_doc.exists:
                    farm_data = farm_doc.to_dict()
                    weather = get_weather_data(farm_data["location"]["lat"], farm_data["location"]["lon"])
                    rainfall = weather["rainfall"]
                else:
                    rainfall = 100.0
            except Exception as e:
                logger.error(f"Error getting weather data: {e}")
                rainfall = 100.0
        prediction_result = predictor.predict_yield(
            crop=request.crop, area=request.area, rainfall=rainfall,
            fertilizer=request.fertilizer, pesticide=request.pesticide,
        )
        fertilizer_inputs = {
            "temperature": request.temperature, "humidity": request.humidity,
            "moisture": request.moisture, "soil_type": request.soil_type,
            "crop_type": request.crop_type, "nitrogen": request.N,
            "phosphorous": request.P, "potassium": request.K,
        }
        fertilizer_result = None
        if fertilizer_load_success:
            try:
                fertilizer_result = fertilizer_predictor.predict(**fertilizer_inputs)
            except Exception as e:
                logger.error(f"Fertilizer prediction failed: {e}")
        result = {
            "request_id": request_id, "farm_id": request.farm_id,
            "predicted_yield_kg_per_ha": round(prediction_result["predicted_yield"], 2),
            "confidence_interval": {
                "lower": round(prediction_result["confidence_interval"]["lower"], 2),
                "upper": round(prediction_result["confidence_interval"]["upper"], 2)
            },
            "model_version": prediction_result.get("model_version"),
            "feature_importance": prediction_result.get("feature_importance"),
            "weather_data": {
                "rainfall": rainfall, "temperature": request.temperature,
                "humidity": request.humidity, "moisture": request.moisture
            }
        }
        if fertilizer_result is not None:
            result["fertilizer_recommendation"] = fertilizer_result
        prediction_ref.update({
            "outputs": result, "status": "complete",
            "completed_at": datetime.utcnow(),
        })
        logger.info(f"Prediction completed successfully for request id {request_id}")
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        if 'prediction_ref' in locals():
            prediction_ref.update({
                "status": "error", "error": str(e),
                "completed_at": datetime.utcnow(),
            })
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/api/fertilizer")
@app.post("/fertilizer")
async def recommend_fertilizer(request: FertilizerRequest, user=Depends(get_current_user)):
    if not fertilizer_load_success:
        raise HTTPException(status_code=503, detail="Fertilizer model not available")
    try:
        inputs = {
            "temperature": request.temperature, "humidity": request.humidity,
            "moisture": request.moisture, "soil_type": request.soil_type,
            "crop_type": request.crop_type, "nitrogen": request.nitrogen,
            "phosphorous": request.phosphorous, "potassium": request.potassium,
        }
        result = fertilizer_predictor.predict(**inputs)
        return result
    except Exception as e:
        logger.error(f"Fertilizer prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fertilizer prediction failed: {str(e)}")

@app.post("/api/add-farm")
@app.post("/add-farm")
async def add_farm(farm: FarmData, user=Depends(get_current_user)):
    verify_db()
    try:
        user_id = user["uid"]
        farm_id = str(uuid.uuid4())
        farm_data = {
            "farm_id": farm_id, "name": farm.name, "location": farm.location,
            "soil_type": farm.soil_type, "area_ha": farm.area_ha,
            "created_at": datetime.utcnow(),
        }
        db.collection("users").document(user_id).collection("farms").document(farm_id).set(farm_data)
        return {"farm_id": farm_id, "message": "Farm added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add farm: {str(e)}")

@app.get("/api/get-farms")
@app.get("/get-farms")
async def get_farms(user=Depends(get_current_user)):
    verify_db()
    try:
        user_id = user["uid"]
        logger.info(f"Fetching farms for user {user_id}")
        farms_ref = db.collection("users").document(user_id).collection("farms")
        farms = [doc.to_dict() for doc in farms_ref.stream()]
        return {"farms": farms}
    except Exception as e:
        logger.error(f"Failed to get farms: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get farms: {str(e)}")

@app.get("/api/get-predictions")
@app.get("/get-predictions")
async def get_predictions(user=Depends(get_current_user)):
    verify_db()
    try:
        user_id = user["uid"]
        predictions_ref = db.collection("users").document(user_id).collection("predictions")
        predictions = [doc.to_dict() for doc in predictions_ref.order_by("created_at", direction=firestore.Query.DESCENDING).stream()]
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get predictions: {str(e)}")

@app.post("/api/update-profile")
@app.post("/update-profile")
async def update_profile(profile: UserProfile, user=Depends(get_current_user)):
    verify_db()
    try:
        user_id = user["uid"]
        profile_data = {
            "name": profile.name, "email": profile.email, "phone": profile.phone,
            "role": profile.role, "updated_at": datetime.utcnow(),
        }
        db.collection("users").document(user_id).set(profile_data, merge=True)
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.post("/api/extract-text-from-document")
@app.post("/extract-text-from-document")
async def extract_text_from_document(file: UploadFile = File(...)):
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}-{file.filename}")
    allowed_content_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png", "image/jpeg"
    ]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Please upload a PDF, DOCX, PNG, or JPEG file."
        )
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        extracted_text = ""
        if file.content_type == "application/pdf":
            extracted_text = extract_text_from_pdf(temp_file_path)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            extracted_text = extract_text_from_docx(temp_file_path)
        elif file.content_type in ["image/png", "image/jpeg"]:
            extracted_text = extract_text_from_image(temp_file_path)
        if not extracted_text or not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract any text from the document."
            )
        return {"filename": file.filename, "extracted_text": extracted_text}
    except Exception as e:
        logger.error(f"An unexpected error occurred during file processing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred: {e}"
        )
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

# --- COMMUNITY ENDPOINTS ---

@app.post("/api/community/posts", status_code=201)
@app.post("/community/posts", status_code=201)
async def create_community_post(
    user=Depends(get_current_user),
    title: str = Form(...),
    content: str = Form(...),
    tags: str = Form(""),
    location: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None)
):
    verify_db()
    try:
        user_id = user["uid"]
        post_id = str(uuid.uuid4())
        
        # Try to get author's real name from Firestore user profile
        author_name = "Anonymous Farmer"
        try:
            user_doc = db.collection("users").document(user_id).get()
            if user_doc.exists:
                author_name = user_doc.to_dict().get("name", "Anonymous Farmer")
            else:
                user_info = auth.get_user(user_id)
                author_name = user_info.display_name or "Anonymous Farmer"
        except Exception as profile_err:
            logger.error(f"Error fetching author name: {profile_err}")
            try:
                user_info = auth.get_user(user_id)
                author_name = user_info.display_name or "Anonymous Farmer"
            except Exception:
                pass

        image_urls = []
        if files:
            for index, file in enumerate(files):
                if not file.filename:
                    continue
                try:
                    filename = f"posts_images/{user_id}_{post_id}_{index}_{file.filename}"
                    bucket = storage.bucket()
                    blob = bucket.blob(filename)
                    
                    blob.upload_from_file(file.file, content_type=file.content_type)
                    blob.make_public()
                    image_urls.append(blob.public_url)
                except Exception as upload_error:
                    logger.error(f"Image upload failed (likely due to Spark plan billing requirements): {upload_error}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Image upload failed. Cloud Storage might not be enabled on your Firebase Spark Plan. Please try posting without selecting an image."
                    )

        post_ref = db.collection("community_posts").document(post_id)
        new_post = {
            "postId": post_id, "title": title, "content": content,
            "tags": [tag.strip() for tag in tags.split(",")] if tags else [],
            "authorId": user_id, "authorName": author_name,
            "location": location,
            "createdAt": datetime.utcnow(), "updatedAt": datetime.utcnow(),
            "commentCount": 0, 
            "imageUrl": image_urls[0] if image_urls else None,
            "imageUrls": image_urls,
            "likedBy": [],
            "likesCount": 0
        }
        
        post_ref.set(new_post)
        logger.info(f"User {user_id} created post {post_id}")
        return {"message": "Post created successfully", "post": new_post}
        
    except Exception as e:
        logger.error(f"Error creating post for user {user.get('uid')}: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to create post.")

@app.get("/api/community/posts")
@app.get("/community/posts")
async def get_all_community_posts():
    verify_db()
    try:
        posts_ref = db.collection("community_posts").order_by("createdAt", direction=firestore.Query.DESCENDING)
        posts = [doc.to_dict() for doc in posts_ref.stream()]
        return {"posts": posts}
    except Exception as e:
        logger.error(f"Error retrieving all posts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve posts.")

@app.get("/api/community/posts/{post_id}")
@app.get("/community/posts/{post_id}")
async def get_post_and_comments(post_id: str):
    verify_db()
    try:
        post_ref = db.collection("community_posts").document(post_id)
        post_doc = post_ref.get()
        if not post_doc.exists:
            raise HTTPException(status_code=404, detail="Post not found")
        post_data = post_doc.to_dict()
        comments_ref = post_ref.collection("comments").order_by("createdAt", direction=firestore.Query.ASCENDING)
        comments = [doc.to_dict() for doc in comments_ref.stream()]
        return {"post": post_data, "comments": comments}
    except Exception as e:
        logger.error(f"Error retrieving post {post_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve post details.")

@app.post("/api/community/posts/{post_id}/comments", status_code=201)
@app.post("/community/posts/{post_id}/comments", status_code=201)
async def add_comment_to_post(post_id: str, comment_data: CommentCreate, user=Depends(get_current_user)):
    verify_db()
    try:
        user_id = user["uid"]
        user_info = auth.get_user(user_id)
        post_ref = db.collection("community_posts").document(post_id)
        
        # Get real name from Firestore profile or fallback to display_name
        author_name = "Anonymous Farmer"
        try:
            user_doc = db.collection("users").document(user_id).get()
            if user_doc.exists:
                author_name = user_doc.to_dict().get("name", "Anonymous Farmer")
            else:
                author_name = user_info.display_name or "Anonymous Farmer"
        except Exception:
            author_name = user_info.display_name or "Anonymous Farmer"
            
        @firestore.transactional
        def update_in_transaction(transaction, post_ref):
            comment_id = str(uuid.uuid4())
            comment_ref = post_ref.collection("comments").document(comment_id)
            transaction.set(comment_ref, {
                "commentId": comment_id, "content": comment_data.content,
                "authorId": user_id, "authorName": author_name,
                "createdAt": datetime.utcnow(),
            })
            transaction.update(post_ref, {"commentCount": firestore.Increment(1)})

        transaction = db.transaction()
        update_in_transaction(transaction, post_ref)
        logger.info(f"User {user_id} added comment to post {post_id}")
        return {"message": "Comment added successfully"}
    except Exception as e:
        logger.error(f"Error adding comment to post {post_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to add comment.")

@app.post("/api/community/posts/{post_id}/like")
@app.post("/community/posts/{post_id}/like")
async def toggle_like_post(post_id: str, user=Depends(get_current_user)):
    verify_db()
    try:
        user_id = user["uid"]
        post_ref = db.collection("community_posts").document(post_id)
        
        @firestore.transactional
        def update_like_in_transaction(transaction, post_ref):
            post_snapshot = post_ref.get(transaction=transaction)
            if not post_snapshot.exists:
                raise HTTPException(status_code=404, detail="Post not found")
            post_data = post_snapshot.to_dict()
            
            liked_by = post_data.get("likedBy", [])
            if user_id in liked_by:
                liked_by.remove(user_id)
                liked = False
            else:
                liked_by.append(user_id)
                liked = True
                
            transaction.update(post_ref, {
                "likedBy": liked_by,
                "likesCount": len(liked_by)
            })
            return liked, len(liked_by)

        transaction = db.transaction()
        liked, likes_count = update_like_in_transaction(transaction, post_ref)
        return {"liked": liked, "likesCount": likes_count}
    except Exception as e:
        logger.error(f"Error toggling like for post {post_id}: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to toggle like.")

# =================================================================
# MAIN EXECUTION
# =================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)