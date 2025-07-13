FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend/app folder to /app in the container
COPY app /app

# Expose the dynamic port provided by Render
EXPOSE $PORT

# Run Uvicorn with shell to interpret $PORT, pointing to app/main.py
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT