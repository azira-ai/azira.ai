# Use official FastAPI image based on Uvicorn and Gunicorn with Python 3.11
FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11

# Set the working directory inside the container
WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from backend folder into the container
COPY . .


# Expose the port Render will use
EXPOSE $PORT

# Command to run the app using uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
