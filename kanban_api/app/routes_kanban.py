"""
Kanban CRUD routes for Boards, Columns, and Applications (cards).
Minimal implementation for development; errors are simplified.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .db import get_db
from . import models
from .schemas import (
    BoardCreate,
    BoardRead,
    ColumnCreate,
    ColumnRead,
    ApplicationCreate,
    ApplicationRead,
    ApplicationMove,
)

router = APIRouter(prefix="/kanban", tags=["kanban"])


# Boards
@router.post("/boards", response_model=BoardRead)
def create_board(payload: BoardCreate, db: Session = Depends(get_db)):
    board = models.Board(name=payload.name)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/boards", response_model=List[BoardRead])
def list_boards(db: Session = Depends(get_db)):
    return db.query(models.Board).order_by(models.Board.id).all()


# Columns
@router.post("/boards/{board_id}/columns", response_model=ColumnRead)
def create_column(board_id: int, payload: ColumnCreate, db: Session = Depends(get_db)):
    board = db.get(models.Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    col = models.Column(board_id=board_id, name=payload.name, position=payload.position)
    db.add(col)
    db.commit()
    db.refresh(col)
    return col


@router.get("/boards/{board_id}/columns", response_model=List[ColumnRead])
def list_columns(board_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Column)
        .filter(models.Column.board_id == board_id)
        .order_by(models.Column.position)
        .all()
    )


# Applications (Kanban cards)
@router.post("/boards/{board_id}/applications", response_model=ApplicationRead)
def create_application(board_id: int, payload: ApplicationCreate, db: Session = Depends(get_db)):
    board = db.get(models.Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    app = models.Application(
        board_id=board_id,
        column_id=payload.column_id,
        title=payload.title,
        company=payload.company,
        description=payload.description,
        status=payload.status,
        tags=payload.tags,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/boards/{board_id}/applications", response_model=List[ApplicationRead])
def list_applications(board_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Application)
        .filter(models.Application.board_id == board_id)
        .order_by(models.Application.created_at.desc())
        .all()
    )


@router.put("/applications/{application_id}", response_model=ApplicationRead)
def update_application(application_id: int, payload: ApplicationCreate, db: Session = Depends(get_db)):
    app = db.get(models.Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.title = payload.title
    app.company = payload.company
    app.description = payload.description
    app.status = payload.status
    app.tags = payload.tags
    app.column_id = payload.column_id
    db.commit()
    db.refresh(app)
    return app


@router.post("/applications/{application_id}/move", response_model=ApplicationRead)
def move_application(application_id: int, payload: ApplicationMove, db: Session = Depends(get_db)):
    app = db.get(models.Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.column_id = payload.column_id
    db.commit()
    db.refresh(app)
    return app


@router.delete("/applications/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    app = db.get(models.Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"ok": True}
