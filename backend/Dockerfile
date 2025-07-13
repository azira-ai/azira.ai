FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder and navigate into app/
COPY . .
WORKDIR /app/app

EXPOSE $PORT

CMD uvicorn main:app --host 0.0.0.0 --port $PORT