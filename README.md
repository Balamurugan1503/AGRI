# 🌾 AgriForecast - AI Powered Smart Agriculture Platform

FRONTEND:https://agri-m0lqeegc8-balamurugan-gs-projects.vercel.app


BACKEND:https://agri-qdqi.onrender.com

AgriForecast is a modern AI-powered agriculture platform designed to empower farmers with intelligent crop management and data-driven decision making. The platform combines Machine Learning, weather and soil analytics, farm management, and community collaboration to improve agricultural productivity and sustainability.

---

## 🚀 Features

### 🌱 Crop Yield Prediction

Predict crop yield using Machine Learning models based on:

* Nitrogen (N)
* Phosphorus (P)
* Potassium (K)
* Temperature
* Humidity
* pH Level
* Rainfall

---

### 🧪 Fertilizer Recommendation System

Get intelligent fertilizer recommendations using:

* Soil nutrient values
* Crop type
* Environmental conditions
* Trained ML models

---

### 🚜 Farm Management

Manage agricultural lands efficiently by:

* Adding multiple farms
* Storing farm location using latitude and longitude
* Recording soil type
* Managing farm area and details

---

### 📊 Dashboard & Analytics

Visualize:

* Crop predictions
* Farm statistics
* Historical prediction records
* Community updates

---

### 👥 Community Forum

Farmers can:

* Share experiences
* Ask agricultural questions
* Post updates
* Interact with other users

---

## 🏗️ Architecture

```text
Frontend (Next.js + React)
        │
        ▼
FastAPI Backend
        │
 ┌──────┴──────┐
 │             │
 ▼             ▼
ML Models   Firebase Firestore
```

---

## 🛠️ Tech Stack

### Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS
* Radix UI
* Framer Motion
* Firebase Authentication

### Backend

* FastAPI
* Python
* Uvicorn
* Firebase Admin SDK

### Machine Learning

* Scikit-Learn
* Pandas
* NumPy

### Database

* Firebase Firestore

---

## 📁 Project Structure

```bash
AGRI
│
├── FRONTEND
│   ├── app
│   ├── components
│   ├── contexts
│   ├── hooks
│   ├── lib
│   ├── public
│   ├── styles
│   ├── package.json
│   └── next.config.mjs
│
├── BACKEND
│   ├── main.py
│   ├── requirements.txt
│   ├── ml_models
│   ├── crop_yield.csv
│   ├── fertilizer_dataset.csv
│   └── model_utils.py
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Balamurugan1503/AGRI.git

cd AGRI
```

---

## Frontend Setup

```bash
cd FRONTEND

npm install

npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

## Backend Setup

Create virtual environment:

```bash
python -m venv venv
```

Activate:

**Windows**

```bash
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn main:app --reload
```

Backend runs on:

```bash
http://localhost:8000
```

---

## 🔐 Environment Variables

### Frontend

Create `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

### Backend

Create `.env`

```env
FIREBASE_SERVICE_ACCOUNT_JSON=
```

---

## 🌐 Deployment

| Service  | Platform           |
| -------- | ------------------ |
| Frontend | Vercel             |
| Backend  | Render             |
| Database | Firebase Firestore |

---

## 📌 API Endpoints

### Farm Management

```http
GET  /api/get-farms
POST /api/add-farm
```

### Crop Prediction

```http
GET  /api/get-predictions
POST /api/predict
```

### Community

```http
GET  /api/community/posts
POST /api/community/posts
```

---

## 🔮 Future Enhancements

* Weather API Integration
* Satellite Image Analysis
* Crop Disease Detection
* Smart Irrigation System
* Multilingual Support
* Mobile Application

---

## 👨‍💻 Author

**Balamurugan G**

Computer Science Engineering Student
AI • Machine Learning • Full Stack Development

---

### ⭐ If you find this project useful, please consider giving it a star on GitHub.
