"""
AI endpoints powered by LangChain.
Prompts are loaded from app/prompts/*.md so they can be versioned and tested independently.
"""
import re
import unicodedata
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from .config import settings
from .db import SessionLocal
from .models import Application, Board, Column

try:
    from langchain_ollama import ChatOllama
except Exception:
    ChatOllama = None  # type: ignore

try:
    from langchain_openai import ChatOpenAI
except Exception:
    ChatOpenAI = None  # type: ignore

router = APIRouter(prefix="/ai", tags=["ai"])

_PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_prompt(name: str) -> str:
    return (_PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8")


def get_llm():
    provider = settings.AI_PROVIDER.lower()
    if provider == "ollama":
        if ChatOllama is None:
            raise HTTPException(status_code=500, detail="ChatOllama not available. Check dependencies.")
        return ChatOllama(model=settings.MODEL_NAME, base_url=settings.OLLAMA_BASE_URL, temperature=0.2)
    elif provider == "ollama_cloud":
        if ChatOpenAI is None:
            raise HTTPException(status_code=500, detail="ChatOpenAI not available. Check dependencies.")
        if not settings.OLLAMA_API_KEY:
            raise HTTPException(status_code=500, detail="OLLAMA_API_KEY must be set for ollama_cloud provider")
        return ChatOpenAI(
            model=settings.MODEL_NAME,
            base_url=settings.OLLAMA_CLOUD_BASE_URL,
            api_key=settings.OLLAMA_API_KEY,
            temperature=0.2,
        )
    elif provider == "openai":
        if ChatOpenAI is None:
            raise HTTPException(status_code=500, detail="ChatOpenAI not available. Check dependencies.")
        if not settings.OPENAI_BASE_URL or not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OPENAI_BASE_URL and OPENAI_API_KEY must be set for openai provider")
        return ChatOpenAI(
            model=settings.MODEL_NAME,
            base_url=settings.OPENAI_BASE_URL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.2,
        )
    raise HTTPException(status_code=400, detail=f"Unsupported AI_PROVIDER: {settings.AI_PROVIDER}")


_ZERO_WIDTH = frozenset('​‌‍⁠﻿­')


def _detect_hidden_content(text: str) -> List[str]:
    """Return ATS-risk warnings for a raw job description string."""
    warnings: List[str] = []
    if any(c in text for c in _ZERO_WIDTH):
        warnings.append(
            "Job description contains hidden zero-width characters — possible ATS fingerprinting trap."
        )
    if re.search(r'[ \t]{15,}', text):
        warnings.append("Job description contains unusual whitespace sequences that may hide text.")
    non_printable = sum(
        1 for c in text
        if unicodedata.category(c).startswith('C') and c not in '\n\r\t '
    )
    if non_printable:
        warnings.append(f"Job description contains {non_printable} non-printable character(s).")
    return warnings


# -------- Summarize Board --------

class SummarizeBoardRequest(BaseModel):
    board_id: int
    focus: Optional[str] = None


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
        col_lines = [f"- {c.position}. {c.name}" for c in columns]
        app_lines = [
            f"• [{a.id}] {a.title} @ {a.company or '-'} | status={a.status or '-'} | column_id={a.column_id}"
            for a in apps
        ]
        prompt = _load_prompt("summarize_board").format(
            board=board.name,
            columns="\n".join(col_lines) or "(none)",
            applications="\n".join(app_lines) or "(none)",
            focus=f"\nFocus: {body.focus}" if body.focus else "",
        )
        llm = get_llm()
        msg = llm.invoke(prompt)
        return SummarizeBoardResponse(summary=getattr(msg, "content", str(msg)))
    finally:
        db.close()


# -------- Generate Resume --------

class GenerateResumeRequest(BaseModel):
    application_id: int
    job_description: str
    profile: Optional[str] = None

    @field_validator("job_description")
    @classmethod
    def jd_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("job_description must not be empty")
        if len(v) > 20_000:
            raise ValueError("job_description exceeds 20 000 character limit")
        return v


class GenerateResumeResponse(BaseModel):
    markdown: str
    warnings: List[str] = []


@router.post("/generate-resume", response_model=GenerateResumeResponse)
def generate_resume(body: GenerateResumeRequest):
    ats_warnings = _detect_hidden_content(body.job_description)
    db = SessionLocal()
    try:
        app = db.query(Application).filter(Application.id == body.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        prompt = _load_prompt("generate_resume").format(
            title=app.title,
            company=app.company or "-",
            desc=app.description or "-",
            jd=body.job_description,
            profile=f"\nCandidate profile:\n{body.profile}" if body.profile else "",
        )
        llm = get_llm()
        msg = llm.invoke(prompt)
        return GenerateResumeResponse(
            markdown=getattr(msg, "content", str(msg)),
            warnings=ats_warnings,
        )
    finally:
        db.close()


# -------- Tag Application --------

class TagApplicationRequest(BaseModel):
    application_id: int
    max_tags: int = 5

    @field_validator("max_tags")
    @classmethod
    def max_tags_range(cls, v: int) -> int:
        if not (1 <= v <= 20):
            raise ValueError("max_tags must be between 1 and 20")
        return v


class TagApplicationResponse(BaseModel):
    tags: List[str]


@router.post("/tag-application", response_model=TagApplicationResponse)
def tag_application(body: TagApplicationRequest):
    db = SessionLocal()
    try:
        app = db.query(Application).filter(Application.id == body.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        prompt = _load_prompt("tag_application").format(
            k=body.max_tags,
            title=app.title,
            company=app.company or "-",
            desc=app.description or "-",
        )
        llm = get_llm()
        msg = llm.invoke(prompt)
        text = getattr(msg, "content", str(msg))
        tags = [t.strip() for t in text.replace("\n", " ").split(",") if t.strip()]
        return TagApplicationResponse(tags=tags[: body.max_tags])
    finally:
        db.close()


# -------- Next Steps --------

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
        prompt = _load_prompt("next_steps").format(
            title=app.title,
            company=app.company or "-",
            status=app.status or "-",
            desc=app.description or "-",
        )
        llm = get_llm()
        msg = llm.invoke(prompt)
        text = getattr(msg, "content", str(msg))
        lines = [l.strip(" -•\t") for l in text.splitlines() if l.strip()]
        lines = [l.split(". ", 1)[-1] if l[:2].rstrip(". ").isdigit() else l for l in lines]
        return NextStepsResponse(steps=[l for l in lines if l][:3])
    finally:
        db.close()
