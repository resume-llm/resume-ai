from pydantic import BaseModel
import os

class Settings(BaseModel):
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:8080")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://appuser:apppass@postgres:5432/app_db",
    )
    # AI provider: ollama | ollama_cloud | openai
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemma3:1b")
    # Local Ollama
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    # Ollama Cloud (OpenAI-compatible, no local Ollama required)
    OLLAMA_API_KEY: str = os.getenv("OLLAMA_API_KEY", "")
    OLLAMA_CLOUD_BASE_URL: str = os.getenv("OLLAMA_CLOUD_BASE_URL", "https://ollama.com/v1")
    # OpenAI-compatible endpoint
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()
