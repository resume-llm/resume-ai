FROM python:3.11-slim

WORKDIR /app

# System dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install MLflow and Postgres driver
RUN pip install --no-cache-dir mlflow psycopg2-binary

EXPOSE 5000

CMD ["mlflow", "server", "--host", "0.0.0.0", "--port", "5000", "--backend-store-uri", "postgresql+psycopg2://appuser:apppass@postgres:5432/mlflow", "--artifacts-destination", "/mlflow-artifacts"]
