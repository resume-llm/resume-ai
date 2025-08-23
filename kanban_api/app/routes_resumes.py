"""
Resume routes: create and list resumes, and associate them to applications.
All comments/docstrings in English as requested.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .db import get_db
from . import models
from .schemas import ResumeCreate, ResumeRead

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("", response_model=ResumeRead)
def create_resume(payload: ResumeCreate, db: Session = Depends(get_db)):
    """Create a Resume record and optionally associate it with an application.

    This endpoint is intended to be called by the frontend after the Node backend
    finishes generating a resume (markdown/docx).
    """
    if payload.application_id is not None:
        app = db.get(models.Application, payload.application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

    resume = models.Resume(
        application_id=payload.application_id,
        job_description=payload.job_description,
        input_profile=payload.input_profile,
        markdown=payload.markdown,
        docx_path=payload.docx_path,
        model=payload.model,
        params=payload.params,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/applications/{application_id}", response_model=List[ResumeRead])
def list_resumes_for_application(application_id: int, db: Session = Depends(get_db)):
    """List all resumes associated with a given application (kanban card)."""
    app = db.get(models.Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return (
        db.query(models.Resume)
        .filter(models.Resume.application_id == application_id)
        .order_by(models.Resume.created_at.desc())
        .all()
    )
