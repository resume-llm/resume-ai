from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .models import Base, Board, Column
from .db import engine, SessionLocal
from .routes_kanban import router as kanban_router
from .routes_resumes import router as resumes_router
from .routes_ai import router as ai_router
import time
from sqlalchemy.exc import OperationalError

app = FastAPI(title="Kanban API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Create tables automatically in development.
    In production, prefer Alembic migrations.
    """
    # Wait for Postgres to be ready (simple retry loop)
    retries = 10
    for attempt in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            # Development seed: ensure one board with three default columns exists
            db = SessionLocal()
            try:
                has_board = db.query(Board).first()
                if not has_board:
                    board = Board(name="Default Board")
                    db.add(board)
                    db.flush()
                    cols = [
                        Column(board_id=board.id, name="To Do", position=0),
                        Column(board_id=board.id, name="Doing", position=1),
                        Column(board_id=board.id, name="Done", position=2),
                    ]
                    db.add_all(cols)
                    db.commit()
            finally:
                db.close()
            break
        except OperationalError:
            time.sleep(2)
            continue

app.include_router(kanban_router)
app.include_router(resumes_router)
app.include_router(ai_router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": settings.MODEL_NAME,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "db": settings.DATABASE_URL.split("@")[-1],
    }
