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

# Set environment variables required by Render
ENV MODULE_NAME=app.main
ENV VARIABLE_NAME=app
ENV PORT=8000

# Expose the port Render will use
EXPOSE 8000

# Command to run the app using uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
