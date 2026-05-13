"""
Resume routes: create and list resumes, and associate them to applications.
All comments/docstrings in English as requested.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette.responses import FileResponse
import tempfile
import subprocess
import os

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


@router.get("/{resume_id}/export")
def export_resume(resume_id: int, format: Optional[str] = Query("pdf", pattern="^(pdf|docx)$"), db: Session = Depends(get_db)):
    """Export a resume to PDF or DOCX via Pandoc and return the file.

    Requires Pandoc to be available in the container PATH.
    """
    resume = db.get(models.Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.markdown:
        raise HTTPException(status_code=400, detail="Resume has no markdown content to export")

    with tempfile.TemporaryDirectory() as tmpdir:
        md_path = os.path.join(tmpdir, "resume.md")
        out_ext = ".pdf" if format == "pdf" else ".docx"
        out_path = os.path.join(tmpdir, f"resume-{resume_id}{out_ext}")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(resume.markdown)

        try:
            # Basic pandoc call; extend with templates or metadata as needed
            subprocess.run([
                "pandoc", md_path, "-o", out_path
            ], check=True)
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="Pandoc is not installed in the backend container")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Pandoc failed: {e}")

        media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"resume-{resume_id}{out_ext}"
        return FileResponse(out_path, media_type=media_type, filename=filename)


@router.get("/applications/{application_id}/export")
def export_latest_for_application(application_id: int, format: Optional[str] = Query("pdf", pattern="^(pdf|docx)$"), db: Session = Depends(get_db)):
    """Export the latest resume for an application."""
    app = db.get(models.Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.application_id == application_id)
        .order_by(models.Resume.created_at.desc())
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="No resumes found for this application")
    return export_resume(resume.id, format, db)
