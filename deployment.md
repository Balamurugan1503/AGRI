# 🚀 Deployment Guide: Crop Yield Prediction System

This guide provides step-by-step instructions to deploy the Crop Yield Prediction System to production.

## 🏗️ Architecture Overview

The system is deployed using a modern decoupled architecture:
1. **Frontend**: Next.js App deployed to **Vercel**.
2. **Database & Services**: **Firebase** (Cloud Firestore, Firebase Authentication, Cloud Storage).
3. **Backend**: FastAPI Python API containerized with Docker and deployed to **Render** (or **Railway** / **Google Cloud Run**).

---

## 📋 Table of Contents
1. [Phase 1: Firebase Configuration](#phase-1-firebase-configuration)
2. [Phase 2: FastAPI Backend Deployment](#phase-2-fastapi-backend-deployment)
3. [Phase 3: Next.js Frontend Deployment on Vercel](#phase-3-next-js-frontend-deployment-on-vercel)
4. [Phase 4: Post-Deployment Verification](#phase-4-post-deployment-verification)

---

## Phase 1: Firebase Configuration

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, enter a name (e.g., `crop-yield-prediction`), and click **Continue**.
3. Toggle Google Analytics based on your preference and click **Create project**.

### 2. Enable Authentication
1. In the left sidebar, click **Build** > **Authentication**, then click **Get Started**.
2. Under the **Sign-in method** tab, enable the following providers:
   - **Email/Password**: Enable and click **Save**.
   - **Google**: Enable, select a support email, and click **Save**.

### 3. Create Cloud Firestore Database
1. In the left sidebar, click **Build** > **Firestore Database**, then click **Create database**.
2. Select your database location (choose a region close to your target users/backend) and click **Next**.
3. Choose **Start in production mode** and click **Create**.
4. Once created, navigate to the **Rules** tab and paste the security rules from [firestore.rules](file:///c:/Users/balam/Desktop/TO%20Complete/crop/database/firestore.rules):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         
         match /farms/{farmId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
         
         match /predictions/{predictionId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
   ```
5. Click **Publish**.

### 4. Enable Cloud Storage (Optional / Spark Plan Details)

If you wish to stay strictly on the free **Spark Plan** (without linking a credit card):
- **Skip this step entirely.**
- All core features (Authentication, Firestore Database, Farm Management, predictions, history, and community text posts) will function 100% fine on the Spark plan.
- The only limitation is that users cannot attach images to community forum posts. The backend handles this gracefully and will prompt users to post without an image if they attempt to upload one.

If you want to use image uploads (requires upgrading to the pay-as-you-go **Blaze Plan**):
1. Click the **Upgrade** button in the bottom-left corner of the Firebase Console and link a Google Cloud Billing account. (The Blaze plan still preserves the free limits: 5 GB storage, 1 GB/day download bandwidth).
2. Navigate to **Build** > **Storage** in the left sidebar, then click **Get Started**.
3. Choose **Start in production mode** (or test mode, depending on rules) and click **Next**.
4. Select your storage location and click **Done**.
5. In the **Rules** tab, ensure authorized users can read and write files:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   Click **Publish**.
6. Note your Storage Bucket URL (e.g., `gs://YOUR_PROJECT_ID.appspot.com` or `YOUR_PROJECT_ID.firebasestorage.app`) to set in your backend environment variables.

### 5. Generate Firebase Private Key (Service Account JSON)
The FastAPI backend requires access credentials to interact with Firebase services.
1. Click the gear icon ⚙️ next to **Project Overview** in the left sidebar and select **Project settings**.
2. Navigate to the **Service accounts** tab.
3. Click **Generate new private key** and confirm by clicking **Generate key**.
4. A `.json` file containing the service account credentials will be downloaded. 
5. **⚠️ IMPORTANT Security Warning:** Never commit this file to your git repository. Store it securely or inject its content via environment variables as shown in Phase 2.

---

## Phase 2: FastAPI Backend Deployment

You will deploy the Python backend using the provided containerized config in [Dockerfile](file:///c:/Users/balam/Desktop/TO%20Complete/crop/backend/Dockerfile).

### Option A: Deploy on Render (Recommended)
1. Sign up/Log in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the codebase.
4. Set the following settings:
   - **Name**: `crop-prediction-api`
   - **Environment**: `Docker`
   - **Docker Context**: `backend` (if you are deploying from a monorepo, specify `backend` as the directory where the Dockerfile lives)
   - **Dockerfile Path**: `Dockerfile`
5. Scroll down and click **Advanced**, then add the following **Environment Variables**:
   
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `8000` | Port the backend runs on inside the container |
   | `OPENWEATHER_API_KEY` | `your_openweathermap_api_key` | Optional API key for real-time weather integration |
   | `FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` | Your Firebase Storage Bucket URL |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | *raw_json_string* | (Alternative) Raw JSON string of the service account file |
   
6. **Injecting Firebase Service Account Credentials:**
   You can choose one of the following methods:
   - **Method A (Environment Variable):** Add an environment variable named `FIREBASE_SERVICE_ACCOUNT_JSON` and paste the entire raw JSON string of your Firebase service account file as the value.
   - **Method B (Secret File):** Go to the **Environment** tab of your Render Web Service, click **Add Secret File**, set the filename as `firebase-service-account.json`, and paste the contents of your service account JSON file.
7. Click **Create Web Service**. Render will automatically build the Docker container (installing Tesseract OCR and Python libraries) and deploy it.

### Option B: Deploy on Railway
1. Sign up/Log in to [Railway](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo** and select your repository.
3. Once the service is added, go to **Settings** > **General**:
   - Set **Root Directory** to `/backend`.
4. In the **Variables** tab, add the environment variables:
   - `PORT`: `8000`
   - `OPENWEATHER_API_KEY`: `your_key`
   - `FIREBASE_STORAGE_BUCKET`: `your-bucket-id.appspot.com`
5. To inject the service account JSON safely:
   - In the **Variables** tab, add a variable named `FIREBASE_SERVICE_ACCOUNT_JSON` and paste the entire raw JSON string of your service account.
   - Alternatively, you can still place a local `firebase-service-account.json` file in the build directory, but using the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is the recommended cloud-native approach.
6. Railway will automatically pick up the [Dockerfile](file:///c:/Users/balam/Desktop/TO%20Complete/crop/backend/Dockerfile) in the root of `/backend` and start building it.
7. Once deployed, go to the **Settings** tab and click **Generate Domain** to get your public API URL (e.g., `https://crop-prediction-api.up.railway.app`).

---

## Phase 3: Next.js Frontend Deployment on Vercel

The frontend Next.js application connects to Firebase client-side and communicates with your deployed FastAPI backend.

### 1. Get Firebase Client configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/) > **Project settings** > **General** tab.
2. Under **Your apps**, click the web icon `</>` to register a web app.
3. Enter an app nickname (e.g., `crop-yield-web`) and click **Register app**.
4. Under **SDK setup and configuration**, copy the credentials inside the `firebaseConfig` object:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 2. Deploy on Vercel
1. Sign up/Log in to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** and import your GitHub repository.
3. Configure the Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (or the folder containing `package.json` if structured differently)
4. Open the **Environment Variables** section and add the following keys from your Firebase client config and backend API:

   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | *Your Firebase apiKey* |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | *Your Firebase authDomain* |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | *Your Firebase projectId* |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | *Your Firebase storageBucket* |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | *Your Firebase messagingSenderId* |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | *Your Firebase appId* |
   | `NEXT_PUBLIC_API_URL` | *Your Deployed FastAPI URL from Phase 2 (e.g., `https://crop-prediction-api.onrender.com`)* |

5. Click **Deploy**. Vercel will build the frontend and serve it globally.

---

## Phase 4: Post-Deployment Verification

Once both frontend and backend are successfully deployed:

1. **Verify Backend Health**:
   - Open your browser and navigate to `https://your-backend-url.onrender.com/`.
   - You should receive a JSON response showing the API health and loaded ML models:
     ```json
     {
       "message": "Crop Yield Prediction API",
       "status": "running",
       "model_loaded": true,
       "available_crops": [...]
     }
     ```
2. **Verify Frontend URL**:
   - Navigate to your Vercel deployment URL (e.g., `https://crop-yield-prediction.vercel.app`).
   - Test user registration and login.
   - Add a farm and verify that it is written to Cloud Firestore.
   - Run a yield prediction and verify the result is calculated using the backend ML models.
