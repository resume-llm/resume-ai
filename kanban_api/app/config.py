from pydantic import BaseModel
import os

class Settings(BaseModel):
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:8080")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://appuser:apppass@postgres:5432/app_db",
    )
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemma3")

settings = Settings()
