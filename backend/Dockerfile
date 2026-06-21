# Use the official Python slim image for a lightweight container
FROM python:3.10-slim

# Set environment variables to optimize Python execution in container
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set the working directory inside the container
WORKDIR /app

# Install system-level dependencies
# - tesseract-ocr: Required by pytesseract for image-to-text extraction
# - tesseract-ocr-eng: English language pack for Tesseract
# - build-essential: Necessary for compiling any Python dependencies without prebuilt wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements first to leverage Docker cache layers
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Expose the application port
EXPOSE 8000

# Run the FastAPI application using Uvicorn
# We use 'exec' to allow correct signal forwarding (e.g. SIGTERM) to the Uvicorn process
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT
