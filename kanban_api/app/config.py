from pydantic import BaseModel
import os

class Settings(BaseModel):
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:8080")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://appuser:apppass@postgres:5432/app_db",
    )
    # AI settings
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")  # ollama | openai
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemma3:1b")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "")  # e.g., https://api.openai.com/v1 or a compatible endpoint
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()
