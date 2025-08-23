"""
AI endpoints powered by LangChain + Ollama.
Uses ChatOllama with model and base URL from settings.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .config import settings
from .db import SessionLocal
from .models import Application, Board, Column

# LangChain providers
try:
    from langchain_ollama import ChatOllama  # Ollama provider
except Exception:  # pragma: no cover
    ChatOllama = None  # type: ignore

try:
    from langchain_openai import ChatOpenAI  # OpenAI-compatible provider
except Exception:  # pragma: no cover
    ChatOpenAI = None  # type: ignore

router = APIRouter(prefix="/ai", tags=["ai"])


def get_llm():
    provider = settings.AI_PROVIDER.lower()
    if provider == "ollama":
        if ChatOllama is None:
            raise HTTPException(status_code=500, detail="ChatOllama is not available. Check dependencies.")
        return ChatOllama(model=settings.MODEL_NAME, base_url=settings.OLLAMA_BASE_URL, temperature=0.2)
    elif provider == "openai":
        if ChatOpenAI is None:
            raise HTTPException(status_code=500, detail="ChatOpenAI is not available. Check dependencies.")
        if not settings.OPENAI_BASE_URL or not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OPENAI_BASE_URL and OPENAI_API_KEY must be set for OpenAI provider")
        # ChatOpenAI accepts base_url for compatible providers (e.g., local OpenAI-compatible gateways)
        return ChatOpenAI(model=settings.MODEL_NAME, base_url=settings.OPENAI_BASE_URL, api_key=settings.OPENAI_API_KEY, temperature=0.2)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported AI_PROVIDER: {settings.AI_PROVIDER}")


class SummarizeBoardRequest(BaseModel):
    board_id: int
    focus: Optional[str] = None  # optional extra instruction


class SummarizeBoardResponse(BaseModel):
    summary: str


@router.post("/summarize-board", response_model=SummarizeBoardResponse)
def summarize_board(body: SummarizeBoardRequest):
    db = SessionLocal()
    try:
        board = db.query(Board).filter(Board.id == body.board_id).first()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        columns = db.query(Column).filter(Column.board_id == board.id).order_by(Column.position).all()
        apps = (
            db.query(Application)
            .filter(Application.board_id == board.id)
            .order_by(Application.created_at.desc())
            .all()
        )
        # Build a compact context for the LLM
        col_lines = [f"- {c.position}. {c.name}" for c in columns]
        app_lines = [
            f"• [{a.id}] {a.title} @ {a.company or '-'} | status={a.status or '-'} | column_id={a.column_id}"
            for a in apps
        ]
        focus_text = f"\nFocus: {body.focus}" if body.focus else ""
        prompt = (
            "You are a helpful assistant for a job application Kanban board.\n"
            "Summarize the current pipeline, risks, and immediate priorities succinctly.\n"
            "Board: {board}\nColumns:\n{columns}\nApplications:\n{applications}\n" + focus_text + "\n"
            "Return a short, actionable summary."
        ).format(
            board=board.name,
            columns="\n".join(col_lines) or "(none)",
            applications="\n".join(app_lines) or "(none)",
        )
        llm = get_llm()
        msg = llm.invoke(prompt)
        text = getattr(msg, "content", str(msg))
        return SummarizeBoardResponse(summary=text)
    finally:
        db.close()


class TagApplicationRequest(BaseModel):
    application_id: int
    max_tags: int = 5


class TagApplicationResponse(BaseModel):
    tags: List[str]


@router.post("/tag-application", response_model=TagApplicationResponse)
def tag_application(body: TagApplicationRequest):
    db = SessionLocal()
    try:
        app = db.query(Application).filter(Application.id == body.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        desc = app.description or ""
        prompt = (
            "Extract up to {k} concise tags for the following job application.\n"
            "Title: {title}\nCompany: {company}\nDescription: {desc}\n"
            "Return as a comma-separated list."
        ).format(k=body.max_tags, title=app.title, company=app.company or "-", desc=desc)
        llm = get_llm()
        msg = llm.invoke(prompt)
        text = getattr(msg, "content", str(msg))
        # simple parse of comma-separated tags
        tags = [t.strip() for t in text.replace("\n", " ").split(",") if t.strip()]
        return TagApplicationResponse(tags=tags[: body.max_tags])
    finally:
        db.close()


class NextStepsRequest(BaseModel):
    application_id: int


class NextStepsResponse(BaseModel):
    steps: List[str]


@router.post("/next-steps", response_model=NextStepsResponse)
def next_steps(body: NextStepsRequest):
    db = SessionLocal()
    try:
        app = db.query(Application).filter(Application.id == body.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        prompt = (
            "Given this application, propose 3 concrete next steps.\n"
            "Title: {title}\nCompany: {company}\nStatus: {status}\nDescription: {desc}\n"
            "Return as a numbered list."
        ).format(
            title=app.title,
            company=app.company or "-",
            status=app.status or "-",
            desc=app.description or "-",
        )
        llm = get_llm()
        msg = llm.invoke(prompt)
        text = getattr(msg, "content", str(msg))
        # parse numbered list fallback
        lines = [l.strip(" -•\t") for l in text.splitlines() if l.strip()]
        lines = [l.split(". ", 1)[-1] if l[:2].isdigit() else l for l in lines]
        steps = [l for l in lines if l]
        return NextStepsResponse(steps=steps[:3])
    finally:
        db.close()
