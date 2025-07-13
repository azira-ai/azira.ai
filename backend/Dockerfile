FROM tiangolo/uvicorn-gunicorn-fastapi:python3.10

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app

# Expose the port (Render assigns dynamically via $PORT)
EXPOSE $PORT

# Command to run the app (using Uvicorn or Gunicorn)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]