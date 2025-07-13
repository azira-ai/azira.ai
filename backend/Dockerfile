FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app

# Expose the port
EXPOSE $PORT

# Run Uvicorn with a shell to interpret $PORT
CMD uvicorn main:app --host 0.0.0.0 --port $PORT