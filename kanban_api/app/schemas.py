"""
Pydantic schemas for request/response validation.
All comments and docstrings are in English by user request.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# Board
class BoardCreate(BaseModel):
    name: str = Field(..., max_length=255)


class BoardRead(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


# Column
class ColumnCreate(BaseModel):
    name: str
    position: int = 0


class ColumnRead(BaseModel):
    id: int
    board_id: int
    name: str
    position: int

    class Config:
        from_attributes = True


# Application (Kanban card)
class ApplicationCreate(BaseModel):
    title: str
    company: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    column_id: Optional[int] = None


class ApplicationRead(BaseModel):
    id: int
    board_id: int
    column_id: Optional[int]
    title: str
    company: Optional[str]
    description: Optional[str]
    status: Optional[str]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationMove(BaseModel):
    column_id: Optional[int] = None
    # position handling could be added later


# Resume
class ResumeCreate(BaseModel):
    application_id: Optional[int] = None
    job_description: Optional[str] = None
    input_profile: Optional[str] = None
    markdown: Optional[str] = None
    docx_path: Optional[str] = None
    model: Optional[str] = None
    params: Optional[dict] = None


class ResumeRead(BaseModel):
    id: int
    application_id: Optional[int]
    job_description: Optional[str]
    input_profile: Optional[str]
    markdown: Optional[str]
    docx_path: Optional[str]
    model: Optional[str]
    params: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
